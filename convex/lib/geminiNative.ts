import {
  validateAiPlan,
  validatePlanAgainstBrief,
  type PlanningContext,
  type ValidatedAiPlan,
} from "./aiPlanValidation";

export const GEMINI_NATIVE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
] as const;

export type GeminiNativeModel = (typeof GEMINI_NATIVE_MODELS)[number];

export type GeminiErrorKind =
  | "auth"
  | "invalid_model"
  | "permission"
  | "rate_limit"
  | "capacity"
  | "invalid_json"
  | "validation"
  | "timeout"
  | "unknown";

export class GeminiNativeError extends Error {
  constructor(
    readonly kind: GeminiErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GeminiNativeError";
  }
}

export function buildGeminiModelChain(overrideModel?: string): string[] {
  if (overrideModel && overrideModel.trim()) {
    const custom = overrideModel.trim();
    return [custom, ...GEMINI_NATIVE_MODELS.filter((m) => m !== custom)];
  }
  return [...GEMINI_NATIVE_MODELS];
}

export function parseGeminiJsonResponse(content: string): unknown {
  const sanitized = content.replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, "").trim();
  const candidates = [sanitized];
  const fenced = sanitized.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1];
  if (fenced) candidates.push(fenced.trim());
  const objectStart = sanitized.indexOf("{");
  const objectEnd = sanitized.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(sanitized.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of [...new Set(candidates)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const repaired = candidate
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
        return JSON.parse(repaired);
      } catch {
        // Try next candidate
      }
    }
  }

  throw new GeminiNativeError("invalid_json", "AI_INVALID_JSON");
}

export async function requestGeminiNative(input: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<{ content: string; modelUsed: string }> {
  const timeoutMs = input.timeoutMs ?? 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent`;

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: `${input.systemPrompt}\n\nCRITICAL: You MUST strictly conform to this JSON schema with no extraneous text:\n${JSON.stringify(input.schema)}`,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: input.userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: { code?: number; message?: string; status?: string };
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    if (!response.ok || body.error) {
      const errCode = body.error?.code ?? response.status;
      const errMsg = body.error?.message ?? `HTTP ${response.status}`;
      if (errCode === 401) {
        throw new GeminiNativeError("auth", errMsg, errCode);
      }
      if (errCode === 403) {
        throw new GeminiNativeError("permission", errMsg, errCode);
      }
      if (errCode === 404) {
        throw new GeminiNativeError("invalid_model", errMsg, errCode);
      }
      if (errCode === 429) {
        throw new GeminiNativeError("rate_limit", errMsg, errCode);
      }
      if ([500, 502, 503, 504].includes(errCode)) {
        throw new GeminiNativeError("capacity", errMsg, errCode);
      }
      throw new GeminiNativeError("unknown", errMsg, errCode);
    }

    const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText?.trim()) {
      throw new GeminiNativeError("invalid_json", "GEMINI_EMPTY_RESPONSE");
    }

    return { content: rawText, modelUsed: input.model };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new GeminiNativeError("timeout", `Gemini request timed out after ${timeoutMs}ms`);
    }
    if (error instanceof GeminiNativeError) throw error;
    throw new GeminiNativeError("unknown", error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

export async function runGeminiNativeFallback<T>(input: {
  apiKey: string;
  models?: readonly string[];
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  validate: (content: string) => T;
}): Promise<{ value: T; modelUsed: string }> {
  const models = input.models ?? GEMINI_NATIVE_MODELS;
  const errors: Error[] = [];

  for (const model of models) {
    try {
      console.info(`[AI INFRA] Primary Attempt: Gemini | Model=${model}`);
      const result = await requestGeminiNative({
        apiKey: input.apiKey,
        model,
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        schema: input.schema,
      });

      const validated = input.validate(result.content);
      console.info(`[AI INFRA] Gemini SUCCESS | Model=${result.modelUsed} | Response Length=${result.content.length} | Validated`);
      return { value: validated, modelUsed: result.modelUsed };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      errors.push(err);
      const kind = error instanceof GeminiNativeError ? error.kind : "unknown";
      const status = error instanceof GeminiNativeError ? error.status : undefined;
      console.warn(`[AI INFRA] Gemini Model FAILED | Model=${model} | Kind=${kind} | Status=${status ?? "N/A"} | Error=${err.message}`);

      if (error instanceof GeminiNativeError && (error.kind === "auth" || error.kind === "permission")) {
        throw error; // Immediate failover to backup provider if key authentication/permission fails
      }
      // Continue to next model in Gemini chain
    }
  }

  throw new Error(`All Gemini models exhausted: ${errors.map((e) => e.message).join(" | ")}`);
}
