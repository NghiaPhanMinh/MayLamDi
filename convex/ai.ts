import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  validateAiPlan,
  validatePlanAgainstBrief,
  type ValidatedAiPlan,
} from "./lib/aiPlanValidation";
import {
  AiRouteFailure,
  buildFreeModelChain,
  FreeAiRoutesExhausted,
  runFreeModelFallback,
  type AiResponseMode,
} from "./lib/openRouterFallback";
import { generateSmartFallbackPlan, type GeneratedAiPlan } from "./lib/smartFallbackPlanner";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function environmentValue(name: string) {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return runtime.process?.env?.[name];
}

const planSchema = {
  name: "maylamdi_project_plan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "recommendedFramework",
      "frameworkReason",
      "milestones",
      "tasks",
      "risks",
      "assumptions",
    ],
    properties: {
      recommendedFramework: { type: "string" },
      frameworkReason: { type: "string" },
      milestones: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["tempId", "title", "description", "phaseId", "dueDate"],
          properties: {
            tempId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            phaseId: { type: "string" },
            dueDate: { type: "string" },
          },
        },
      },
      tasks: {
        type: "array",
        minItems: 1,
        maxItems: 15,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "tempId",
            "title",
            "description",
            "phaseId",
            "milestoneTempId",
            "primaryOwnerProfileId",
            "collaboratorProfileIds",
            "requiredSkills",
            "estimatedEffortHours",
            "difficulty",
            "weight",
            "required",
            "startDate",
            "dueDate",
            "dependencyTempIds",
            "requiresReview",
            "reviewerProfileId",
            "allocationExplanation",
            "longTaskBreakdown",
          ],
          properties: {
            tempId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            phaseId: { type: "string" },
            milestoneTempId: { type: ["string", "null"] },
            primaryOwnerProfileId: { type: "string" },
            collaboratorProfileIds: { type: "array", items: { type: "string" } },
            requiredSkills: { type: "array", items: { type: "string" } },
            estimatedEffortHours: { type: "number" },
            difficulty: { type: "integer" },
            weight: { type: "number" },
            required: { type: "boolean" },
            startDate: { type: "string" },
            dueDate: { type: "string" },
            dependencyTempIds: { type: "array", items: { type: "string" } },
            requiresReview: { type: "boolean" },
            reviewerProfileId: { type: ["string", "null"] },
            allocationExplanation: { type: "string" },
            longTaskBreakdown: { type: "string" },
          },
        },
      },
      risks: { type: "array", maxItems: 10, items: { type: "string" } },
      assumptions: { type: "array", maxItems: 10, items: { type: "string" } },
    },
  },
};

type OpenRouterError = { code?: number | string; message?: string };

type OpenRouterResponse = {
  model?: string;
  error?: OpenRouterError;
  choices?: Array<{
    error?: OpenRouterError;
    finish_reason?: string;
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

function logProviderFailure(input: {
  model: string;
  status: number;
  error?: OpenRouterError;
}) {
  const message = input.error?.message
    ?.replace(/sk-or-v1-[A-Za-z0-9_-]+/g, "[redacted]")
    .slice(0, 500);

  console.error(
    "OpenRouter request failed",
    JSON.stringify({
      model: input.model,
      status: input.status,
      code: input.error?.code,
      message,
    }),
  );
}

type AiPlanningContext = {
  project: {
    projectId: string;
    title: string;
    description: string;
    frameworkName: string;
    startDate: string;
    deadline: string;
  };
  phases: Array<{
    phaseId: string;
    title: string;
    description: string;
    canOverlap: boolean;
    reviewCheckpoint: boolean;
  }>;
  members: Array<{
    profileId: string;
    displayName: string;
    skills: string[];
    availability: string;
    currentWorkload: "low" | "medium" | "high";
    preferences: string;
    weeklyCapacity?: number;
  }>;
  existingTasks: Array<{
    title: string;
    phaseId: string;
    ownerProfileId: string;
    status: "todo" | "in_progress" | "blocked" | "review" | "completed" | "submitted" | "changes_requested" | "verified" | "awaiting_creator";
    dueDate: string;
  }>;
};

export function planningPrompts(brief: string, context: AiPlanningContext) {
  const frameworkPhasesText = context.phases
    .map((p, idx) => `Phase ${idx + 1} (ID: "${p.phaseId}"): Title: "${p.title}" - Description: "${p.description}"`)
    .join("\n");

  const systemPrompt = [
    "You are MayLamDi's Senior General-Purpose Project Architect.",
    "CORE PHILOSOPHY: Do NOT turn project briefs into a superficial checklist of deliverables. A deliverable (e.g. 'Live Web App' or 'Research Paper') is an end outcome, NOT a task title. Reason deeply about the actual labor, technical design, engineering, or creative construction required to achieve that goal.",
    "AUTHORITATIVE USER BRIEF RULE: The provided brief is authoritative. Analyze the project goal, scope, constraints, and team roles from the brief text. Generalize cleanly to any brief, familiar or novel.",
    "REASONING PIPELINE (PROJECT GOAL -> REQUIRED WORK -> RELATIONSHIPS -> LOGICAL WORKSTREAMS -> ACTIONABLE TASKS):",
    "1. PROJECT GOAL: Identify the core objective and target outcome of the project.",
    "2. REQUIRED WORK: Determine the actual labor steps (research, architecture/design, execution, testing, deployment, documentation) required to build the target. NEVER copy grading rubric criteria (originality, feasibility, technical depth) as tasks.",
    "3. RELATIONSHIPS BETWEEN WORK: Identify logical prerequisites and dependency sequencing. Upstream foundational tasks (e.g. data schema or wireframes) must precede downstream execution (e.g. API endpoints or interactive components).",
    "4. LOGICAL WORKSTREAMS & PROCESS STRUCTURE: Treat context.phases as general process guidance over time, NOT predefined task templates. Adapt phases dynamically to map the project's real workstreams.",
    "5. ACTIONABLE TASKS & UNIQUE DESCRIPTIONS: Write outcome-driven task titles starting with active verbs. Every task description MUST be specific, detailed, and non-repetitive, detailing the exact work performed, technical/creative inputs, and verification criteria. NEVER output template filler like 'Complete X according to requirements'.",
    "DYNAMIC TASK COUNT SCALING: Simple briefs scale to 3–5 tasks; complex multi-week briefs scale to 6–15 tasks based on work complexity.",
    "Use ONLY supplied phase IDs and member profile IDs. Return VALID structured JSON matching the schema.",
  ].join(" ");

  const userPrompt = JSON.stringify({
    request: "Analyze current user brief and generate a context-aware, outcome-oriented project plan.",
    authoritativeUserBrief: brief,
    projectMetadata: {
      frameworkName: context.project.frameworkName,
      startDate: context.project.startDate,
      deadline: context.project.deadline,
    },
    frameworkPhases: frameworkPhasesText,
    phases: context.phases,
    members: context.members,
    existingTasks: context.existingTasks,
    limits: { milestones: 6, tasks: 15 },
  });
  return { systemPrompt, userPrompt };
}

function cleanBrief(value: string) {
  const brief = value.trim();
  if (brief.length < 20) {
    throw new ConvexError(
      "Please enter a project brief answering what you are making, who it is for, and what needs to be delivered (at least 20 characters).",
    );
  }
  if (brief.length > 8000) {
    throw new ConvexError(
      "Keep the AI project brief to 8,000 characters or fewer for optimal AI generation.",
    );
  }
  return brief;
}

function parseJsonResponse(content: string): unknown {
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

  throw new Error("AI_INVALID_JSON");
}

async function requestPlan(input: {
  apiKey: string;
  model: string;
  mode: AiResponseMode;
  systemPrompt: string;
  userPrompt: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://maylamdi.vercel.app",
        "X-Title": "MayLamDi AI Planning",
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          {
            role: "system",
            content: input.mode === "structured"
              ? input.systemPrompt
              : `${input.systemPrompt} Return exactly one JSON object with no Markdown or commentary. The JSON must match this schema: ${JSON.stringify(planSchema.schema)}`,
          },
          { role: "user", content: input.userPrompt },
        ],
        ...(input.mode === "structured"
          ? { response_format: { type: "json_schema", json_schema: planSchema } }
          : {}),
        temperature: 0.1,
        max_tokens: 1_800,
        max_completion_tokens: 1_800,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as OpenRouterResponse;
    const choice = body.choices?.[0];
    const providerError = body.error ?? choice?.error;
    const providerErrorCode = Number(providerError?.code);
    const effectiveStatus = response.ok && Number.isFinite(providerErrorCode)
      ? providerErrorCode
      : response.status;

    if (!response.ok || providerError) {
      logProviderFailure({ model: input.model, status: effectiveStatus, error: providerError });
      const retryAfter = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
      const retryAfterDate = retryAfter && !Number.isFinite(retryAfterSeconds)
        ? Date.parse(retryAfter)
        : Number.NaN;
      const retryAfterMs = Number.isFinite(retryAfterSeconds)
        ? Math.max(0, retryAfterSeconds * 1_000)
        : Number.isFinite(retryAfterDate)
          ? Math.max(0, retryAfterDate - Date.now())
          : undefined;
      const providerMessage = providerError?.message?.toLowerCase() ?? "";

      if (effectiveStatus === 401 || effectiveStatus === 403) {
        throw new AiRouteFailure("key_rejected", "AI_KEY_REJECTED");
      }
      if (effectiveStatus === 408) {
        throw new AiRouteFailure("timeout", "AI_TIMEOUT", retryAfterMs);
      }
      if (effectiveStatus === 429) {
        throw new AiRouteFailure("rate_limit", "AI_RATE_LIMIT", retryAfterMs);
      }
      if (
        effectiveStatus === 400
        && (providerMessage.includes("response_format")
          || providerMessage.includes("structured")
          || providerMessage.includes("json_schema")
          || providerMessage.includes("unsupported"))
      ) {
        throw new AiRouteFailure("unsupported", "AI_STRUCTURED_OUTPUT_UNSUPPORTED");
      }
      if ([402, 404, 409, 425, 500, 502, 503, 504, 529].includes(effectiveStatus)) {
        throw new AiRouteFailure("capacity", "AI_PROVIDER_CAPACITY", retryAfterMs);
      }
      throw new AiRouteFailure("capacity", "AI_PROVIDER_UNAVAILABLE", retryAfterMs);
    }

    const rawContent = choice?.message?.content;
    const content = typeof rawContent === "string"
      ? rawContent
      : rawContent
        ?.filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("");
    if (!content?.trim()) throw new AiRouteFailure("empty", "AI_EMPTY_RESPONSE");

    return { content, modelUsed: body.model ?? input.model };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiRouteFailure("timeout", "AI_TIMEOUT");
    }
    if (error instanceof AiRouteFailure) throw error;
    if (error instanceof TypeError) {
      throw new AiRouteFailure("capacity", "AI_PROVIDER_UNAVAILABLE");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const generateProjectPlan = action({
  args: {
    projectId: v.id("projects"),
    brief: v.string(),
    generationId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<GeneratedAiPlan> => {
    const genTag = args.generationId ? `[${args.generationId}] ` : "";
    console.info(`${genTag}generateProjectPlan received brief (${args.brief.length} chars): "${args.brief.slice(0, 80)}..."`);
    const access = await ctx.runQuery(internal.aiUsage.getProjectAccess, { projectId: args.projectId });
    const brief = cleanBrief(args.brief);
    const context: AiPlanningContext = await ctx.runQuery(internal.aiContext.getProjectPlanningContext, {
      projectId: args.projectId,
    });

    const tierKey = environmentValue(`OPENROUTER_API_KEY_${access.tier.toUpperCase()}`);
    const apiKey = tierKey ?? environmentValue("OPENROUTER_API_KEY") ?? environmentValue("GEMINI_API_KEY");
    if (!apiKey) {
      console.info(`${genTag}[AI OBSERVABILITY] Source=fallback | Reason=NO_API_KEY | API Attempted=false`);
      const fallbackPlan = generateSmartFallbackPlan(context, brief, args.generationId, "NO_API_KEY");
      return {
        ...fallbackPlan,
        source: "fallback",
        generationId: args.generationId,
        fallbackReason: "NO_API_KEY",
        apiAttempted: false,
        apiErrorCategory: null,
        generatedAt: Date.now(),
      };
    }

    try {
      const { systemPrompt, userPrompt } = planningPrompts(brief, context);
      console.info(`${genTag}[AI OBSERVABILITY] Prompts constructed. User prompt length: ${userPrompt.length}`);
      const configuredTierModel = access.tier === "free"
        ? environmentValue("OPENROUTER_MODEL_FREE")
        : environmentValue(`OPENROUTER_MODEL_${access.tier.toUpperCase()}`);
      const freeModels = buildFreeModelChain({
        primary: configuredTierModel ?? environmentValue("OPENROUTER_MODEL"),
        firstFallback: environmentValue("OPENROUTER_FALLBACK_MODEL"),
        additionalFallbacks: environmentValue("OPENROUTER_FREE_FALLBACK_MODELS"),
      });
      const models = access.tier !== "free" && configuredTierModel
        ? [configuredTierModel, ...freeModels.filter((model) => model !== configuredTierModel)]
        : freeModels;

      const generationLimit = access.entitlement.platformPlanGenerationsPerProject;
      const usageId = await ctx.runMutation(internal.aiUsage.reservePlatformGeneration, {
        projectId: args.projectId,
        profileId: access.profileId,
        limit: generationLimit ?? undefined,
      });

      try {
        console.info(`${genTag}[AI OBSERVABILITY] Requesting plan from models:`, models);
        const result = await runFreeModelFallback({
          models,
          attempt: ({ model, mode }) => requestPlan({
            apiKey,
            model,
            mode,
            systemPrompt,
            userPrompt,
          }),
          validate: (content) => {
            const plan = validateAiPlan(parseJsonResponse(content), context);
            const report = validatePlanAgainstBrief(plan, brief, context);
            if (!report.valid) {
              console.warn(`${genTag}[AI OBSERVABILITY] LLM plan had validation warnings:`, report.errors);
            }
            return plan;
          },
        });
        console.info(`${genTag}[AI OBSERVABILITY] Source=llm | ModelUsed=${result.modelUsed} | API Attempted=true`);
        await ctx.runMutation(internal.aiUsage.finishPlatformGeneration, {
          usageId,
          model: result.modelUsed,
          success: true,
        });
        return {
          ...result.value,
          source: "llm",
          generationId: args.generationId,
          apiAttempted: true,
          apiErrorCategory: null,
          modelUsed: result.modelUsed,
          generatedAt: Date.now(),
        };
      } catch (innerError) {
        await ctx.runMutation(internal.aiUsage.finishPlatformGeneration, {
          usageId,
          model: "failed",
          success: false,
        });
        throw innerError;
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.warn(`${genTag}[AI OBSERVABILITY] Source=fallback | Reason=${errMessage} | API Attempted=true`);
      const fallbackPlan = generateSmartFallbackPlan(context, brief, args.generationId, errMessage);
      return {
        ...fallbackPlan,
        source: "fallback",
        generationId: args.generationId,
        fallbackReason: errMessage,
        apiAttempted: true,
        apiErrorCategory: error instanceof Error ? error.name : "UNKNOWN_ERROR",
        generatedAt: Date.now(),
      };
    }
  },
});

export const generateProjectPlanWithKey = action({
  args: {
    projectId: v.id("projects"),
    brief: v.string(),
    apiKey: v.string(),
    model: v.string(),
    generationId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<GeneratedAiPlan> => {
    const genTag = args.generationId ? `[${args.generationId}] ` : "";
    console.info(`${genTag}generateProjectPlanWithKey received brief (${args.brief.length} chars): "${args.brief.slice(0, 80)}..."`);
    const apiKey = args.apiKey.trim();
    const model = args.model.trim();
    if (apiKey.length < 20 || apiKey.length > 500) throw new ConvexError("The session OpenRouter key does not look valid.");
    if (model.length < 3 || model.length > 160 || /\s/.test(model)) throw new ConvexError("Enter a valid OpenRouter model ID.");
    const brief = cleanBrief(args.brief);
    const access = await ctx.runQuery(internal.aiUsage.getProjectAccess, { projectId: args.projectId });
    const context: AiPlanningContext = await ctx.runQuery(internal.aiContext.getProjectPlanningContext, { projectId: args.projectId });
    const { systemPrompt, userPrompt } = planningPrompts(brief, context);
    try {
      let response;
      try {
        response = await requestPlan({ apiKey, model, mode: "structured", systemPrompt, userPrompt });
      } catch (error) {
        if (!(error instanceof AiRouteFailure) || !["empty", "unsupported", "invalid"].includes(error.kind)) throw error;
        response = await requestPlan({ apiKey, model, mode: "json_only", systemPrompt, userPrompt });
      }
      const value = validateAiPlan(parseJsonResponse(response.content), context);
      await ctx.runMutation(internal.aiUsage.record, {
        projectId: args.projectId,
        profileId: access.profileId,
        source: "byok",
        operation: "project_plan",
        model: response.modelUsed,
        success: true,
      });
      console.info(`${genTag}[AI OBSERVABILITY] Session BYOK AI request succeeded using model: ${response.modelUsed}`);
      return {
        ...value,
        source: "llm",
        generationId: args.generationId,
        apiAttempted: true,
        apiErrorCategory: null,
        modelUsed: response.modelUsed,
        generatedAt: Date.now(),
      };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      console.warn(`${genTag}[AI OBSERVABILITY] Session BYOK AI request failed: ${errMessage}`);
      const fallbackPlan = generateSmartFallbackPlan(context, brief, args.generationId, errMessage);
      return {
        ...fallbackPlan,
        source: "fallback",
        generationId: args.generationId,
        fallbackReason: errMessage,
        apiAttempted: true,
        apiErrorCategory: error instanceof Error ? error.name : "UNKNOWN_ERROR",
        generatedAt: Date.now(),
      };
    }
  },
});
