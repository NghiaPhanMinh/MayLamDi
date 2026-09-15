export const DEFAULT_PRIMARY_FREE_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
export const DEFAULT_FIRST_FREE_FALLBACK = "cohere/north-mini-code:free";
export const DEFAULT_ADDITIONAL_FREE_FALLBACKS = [
  "nex-agi/nex-n2.5-pro:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "openrouter/free",
] as const;

export type AiResponseMode = "structured" | "json_only";
export type AiRouteFailureKind =
  | "rate_limit"
  | "capacity"
  | "timeout"
  | "empty"
  | "unsupported"
  | "invalid"
  | "key_rejected"
  | "setup";

export class AiRouteFailure extends Error {
  constructor(
    readonly kind: AiRouteFailureKind,
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "AiRouteFailure";
  }
}

export class FreeAiRoutesExhausted extends Error {
  constructor(readonly failures: Array<{ model: string; kind: AiRouteFailureKind }>) {
    super("Free AI providers are currently busy. Please try again later or continue with manual planning.");
    this.name = "FreeAiRoutesExhausted";
  }
}

export function isFreeOpenRouterModel(model: string) {
  return model === "openrouter/free" || model.endsWith(":free");
}

function configuredFreeModel(value: string | undefined, fallback: string) {
  const model = value?.trim();
  return model && isFreeOpenRouterModel(model) ? model : fallback;
}

export function buildFreeModelChain(input: {
  primary?: string;
  firstFallback?: string;
  additionalFallbacks?: string;
}) {
  const configuredAdditional = input.additionalFallbacks
    ?.split(",")
    .map((model) => model.trim())
    .filter(isFreeOpenRouterModel);
  const models = [
    configuredFreeModel(input.primary, DEFAULT_PRIMARY_FREE_MODEL),
    configuredFreeModel(input.firstFallback, DEFAULT_FIRST_FREE_FALLBACK),
    ...(configuredAdditional?.length
      ? configuredAdditional
      : DEFAULT_ADDITIONAL_FREE_FALLBACKS),
  ];

  return [...new Set(models)];
}

type AttemptResult = { content: string; modelUsed: string };

export async function runFreeModelFallback<T>(input: {
  models: string[];
  attempt: (request: {
    model: string;
    mode: AiResponseMode;
    retry: number;
  }) => Promise<AttemptResult>;
  validate: (content: string) => T;
  sleep?: (milliseconds: number) => Promise<void>;
  baseBackoffMs?: number;
  maximumBackoffMs?: number;
}): Promise<{ value: T; modelUsed: string }> {
  const sleep = input.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const baseBackoffMs = input.baseBackoffMs ?? 400;
  const maximumBackoffMs = input.maximumBackoffMs ?? 2_000;
  const failures: Array<{ model: string; kind: AiRouteFailureKind }> = [];
  let mode: AiResponseMode = "structured";
  let retrySequence = 0;

  for (const model of input.models) {
    for (let retry = 0; retry <= 1; retry += 1) {
      try {
        const response = await input.attempt({ model, mode, retry });
        if (!response.content.trim()) {
          throw new AiRouteFailure("empty", "AI_EMPTY_RESPONSE");
        }
        return {
          value: input.validate(response.content),
          modelUsed: response.modelUsed,
        };
      } catch (error) {
        const failure = error instanceof AiRouteFailure
          ? error
          : new AiRouteFailure("invalid", error instanceof Error ? error.message : "AI_INVALID_PLAN");
        failures.push({ model, kind: failure.kind });

        if (failure.kind === "key_rejected" || failure.kind === "setup") {
          throw failure;
        }

        if (failure.kind === "empty" || failure.kind === "unsupported" || failure.kind === "invalid") {
          mode = "json_only";
          break;
        }

        const canRetrySameModel = retry === 0
          && (failure.kind === "rate_limit" || failure.kind === "capacity" || failure.kind === "timeout");
        if (!canRetrySameModel) break;

        const exponentialDelay = Math.min(
          maximumBackoffMs,
          baseBackoffMs * (2 ** retrySequence),
        );
        retrySequence += 1;
        await sleep(Math.max(exponentialDelay, failure.retryAfterMs ?? 0));
      }
    }
  }

  throw new FreeAiRoutesExhausted(failures);
}
