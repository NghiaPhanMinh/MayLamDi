import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  repairAndEnrichPlan,
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
import { extractDeliverablesFromBrief, generateSmartFallbackPlan } from "./lib/smartFallbackPlanner";

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

type GeneratedAiPlan = ValidatedAiPlan & {
  generatedAt: number;
  source?: "ai" | "smart_template";
};

function planningPrompts(brief: string, context: AiPlanningContext) {
  const frameworkPhasesText = context.phases
    .map((p, idx) => `Phase ${idx + 1} (ID: "${p.phaseId}"): Title: "${p.title}" - Description: "${p.description}"`)
    .join("\n");

  const systemPrompt = [
    "You are MayLamDi's Senior Domain-Driven Project Architect.",
    "GOAL: Convert the raw project brief into an actionable, professional, domain-aware project plan strictly tailored to the user's selected Project Specialization.",
    "AUTHORITATIVE USER BRIEF RULE: The current user-provided brief is authoritative. Treat any stored project title or description as metadata only and NEVER let them override, contaminate, or conflict with the current brief. All generated tasks MUST strictly reflect the requirements, scope, domain, deliverables, and team specified in the current user brief.",
    "4-STEP DOMAIN-DRIVEN BRIEF ANALYSIS PIPELINE:",
    "BƯỚC 1 (Domain & Goal Identification): Read the user's selected specialization in context.project.frameworkName (e.g. Software & Web/App Engineering, UI/UX Design & Product Strategy, Data Science & AI Engineering, Event Management, Academic Research, Architecture, etc.). Extract exact semantic facts (core objective, target audience, listed deliverables, domain constraints).",
    "BƯỚC 2 (Deliverables VS Rubric Separation): Explicitly isolate concrete deliverables (HTML/CSS code, live URL, Figma prototype, dataset, event layout, research paper, 3D render) from grading rubrics or evaluation criteria (originality, feasibility, technical depth, resourcefulness, aesthetics, clear communication). NEVER create tasks out of grading rubric terms or abstract adjectives.",
    "BƯỚC 3 (Workstream Decomposition): Group deliverables into a logical step-by-step sequence aligned with the micro-phases supplied in context.phases for the selected specialization. Upstream dependencies (ideation/architecture -> design/schema -> implementation -> hosting/deployment -> docs) MUST be strictly respected.",
    "BƯỚC 4 (Professional Domain Task Generation): Generate tasks with industry-standard domain terminology. Every task title MUST start with an active verb (e.g. 'Model database schema...', 'Draft narrative screenplay...', 'Deploy live hosting...'). Task descriptions MUST be detailed, outcome-driven, and reference specific brief deliverables.",
    "DYNAMIC TASK COUNT SCALING: Determine task count dynamically from project scope, complexity, and timeline. Simple briefs get 3–5 tasks; complex multi-week briefs get 6–15 tasks.",
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
        temperature: 0.7,
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
      console.info(`${genTag}No AI API key connected on platform. Utilizing Smart Fallback Planner.`);
      const fallbackPlan = generateSmartFallbackPlan(context, brief, args.generationId);
      return { ...fallbackPlan, source: "smart_template", generatedAt: Date.now() };
    }

    try {
      const { systemPrompt, userPrompt } = planningPrompts(brief, context);
      console.info(`${genTag}Prompts constructed. User prompt length: ${userPrompt.length}`);
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
        console.info(`${genTag}Requesting plan from models:`, models);
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
            const enrichedPlan = repairAndEnrichPlan(plan, brief, context);
            const report = validatePlanAgainstBrief(enrichedPlan, brief, context);
            if (!report.valid) {
              console.warn(`${genTag}AI generated plan had semantic validation warnings:`, report.errors);
            }
            return enrichedPlan;
          },
        });
        console.info(`${genTag}AI planning succeeded`, JSON.stringify({ model: result.modelUsed }));
        await ctx.runMutation(internal.aiUsage.finishPlatformGeneration, {
          usageId,
          model: result.modelUsed,
          success: true,
        });
        return {
          ...result.value,
          source: "ai",
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
      console.warn(`${genTag}AI generation encountered error, serving Smart Fallback Plan:`, error);
      const fallbackPlan = generateSmartFallbackPlan(context, brief, args.generationId);
      return {
        ...fallbackPlan,
        source: "smart_template",
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
      const rawValue = validateAiPlan(parseJsonResponse(response.content), context);
      const value = repairAndEnrichPlan(rawValue, brief, context);
      await ctx.runMutation(internal.aiUsage.record, {
        projectId: args.projectId,
        profileId: access.profileId,
        source: "byok",
        operation: "project_plan",
        model: response.modelUsed,
        success: true,
      });
      console.info(`${genTag}Session BYOK AI request succeeded using model: ${response.modelUsed}`);
      return { ...value, source: "ai", generatedAt: Date.now() };
    } catch (error) {
      console.warn(`${genTag}Session BYOK AI request failed, smoothly serving Smart Fallback Plan:`, error);
      const fallbackPlan = generateSmartFallbackPlan(context, brief, args.generationId);
      return {
        ...fallbackPlan,
        source: "smart_template",
        generatedAt: Date.now(),
      };
    }
  },
});
