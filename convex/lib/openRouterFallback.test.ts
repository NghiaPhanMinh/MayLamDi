import { describe, expect, it } from "vitest";

import {
  AiRouteFailure,
  buildFreeModelChain,
  DEFAULT_ADDITIONAL_FREE_FALLBACKS,
  DEFAULT_FIRST_FREE_FALLBACK,
  DEFAULT_PRIMARY_FREE_MODEL,
  FreeAiRoutesExhausted,
  runFreeModelFallback,
} from "./openRouterFallback";

describe("buildFreeModelChain", () => {
  it("keeps the environment-controlled primary and first fallback before configured free routes", () => {
    expect(buildFreeModelChain({
      primary: "custom/primary:free",
      firstFallback: "custom/first-fallback:free",
      additionalFallbacks: "custom/third:free, openrouter/free, paid/model",
    })).toEqual([
      "custom/primary:free",
      "custom/first-fallback:free",
      "custom/third:free",
      "openrouter/free",
    ]);
  });

  it("uses the full free default chain and rejects paid overrides", () => {
    expect(buildFreeModelChain({
      primary: "google/gemini-2.5-flash-lite",
      firstFallback: "paid/fallback",
    })).toEqual([
      DEFAULT_PRIMARY_FREE_MODEL,
      DEFAULT_FIRST_FREE_FALLBACK,
      ...DEFAULT_ADDITIONAL_FREE_FALLBACKS,
    ]);
  });
});

describe("runFreeModelFallback", () => {
  it("walks the complete chain, retries transient failures once, then switches to JSON-only mode", async () => {
    const models = [
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "openrouter/free",
    ];
    const calls: Array<{ model: string; mode: string; retry: number }> = [];
    const sleeps: number[] = [];

    const result = await runFreeModelFallback({
      models,
      baseBackoffMs: 100,
      sleep: async (milliseconds) => { sleeps.push(milliseconds); },
      attempt: async (request) => {
        calls.push(request);
        if (request.model === models[0] && request.retry === 0) {
          throw new AiRouteFailure("rate_limit", "busy", 2_500);
        }
        if (request.model === models[0]) {
          throw new AiRouteFailure("capacity", "still busy");
        }
        if (request.model === models[1]) {
          throw new AiRouteFailure("empty", "empty structured response");
        }
        if (request.model === models[2]) {
          return { content: "not json", modelUsed: request.model };
        }
        return { content: '{"ok":true}', modelUsed: "routed/free-model:free" };
      },
      validate: (content) => JSON.parse(content) as { ok: boolean },
    });

    expect(result).toEqual({ value: { ok: true }, modelUsed: "routed/free-model:free" });
    expect(sleeps).toEqual([2_500]);
    expect(calls).toEqual([
      { model: models[0], mode: "structured", retry: 0 },
      { model: models[0], mode: "structured", retry: 1 },
      { model: models[1], mode: "structured", retry: 0 },
      { model: models[2], mode: "json_only", retry: 0 },
      { model: models[3], mode: "json_only", retry: 0 },
    ]);
  });

  it("uses the tested provider-diverse production defaults in order", () => {
    expect(buildFreeModelChain({})).toEqual([
      "nvidia/nemotron-3-super-120b-a12b:free",
      "cohere/north-mini-code:free",
      "nex-agi/nex-n2.5-pro:free",
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      "openrouter/free",
    ]);
  });

  it("handles Primary succeeds -> returns primary output", async () => {
    const result = await runFreeModelFallback({
      models: ["primary:free", "backup:free"],
      attempt: async ({ model }) => ({ content: '{"plan":"primary"}', modelUsed: model }),
      validate: (content) => JSON.parse(content),
    });
    expect(result).toEqual({ value: { plan: "primary" }, modelUsed: "primary:free" });
  });

  it("handles Primary fails -> backup succeeds", async () => {
    const result = await runFreeModelFallback({
      models: ["primary:free", "backup:free"],
      attempt: async ({ model }) => {
        if (model === "primary:free") throw new AiRouteFailure("capacity", "busy");
        return { content: '{"plan":"backup"}', modelUsed: model };
      },
      validate: (content) => JSON.parse(content),
    });
    expect(result).toEqual({ value: { plan: "backup" }, modelUsed: "backup:free" });
  });

  it("handles Primary returns malformed output -> backup succeeds", async () => {
    const result = await runFreeModelFallback({
      models: ["primary:free", "backup:free"],
      attempt: async ({ model }) => {
        if (model === "primary:free") return { content: "INVALID_JSON_NOT_AN_OBJECT", modelUsed: model };
        return { content: '{"plan":"backup_valid"}', modelUsed: model };
      },
      validate: (content) => JSON.parse(content),
    });
    expect(result).toEqual({ value: { plan: "backup_valid" }, modelUsed: "backup:free" });
  });

  it("uses exponential backoff and never retries a model more than once", async () => {
    const sleeps: number[] = [];
    const attempts = new Map<string, number>();

    await expect(runFreeModelFallback({
      models: ["one:free", "two:free"],
      baseBackoffMs: 200,
      sleep: async (milliseconds) => { sleeps.push(milliseconds); },
      attempt: async ({ model }) => {
        attempts.set(model, (attempts.get(model) ?? 0) + 1);
        throw new AiRouteFailure("timeout", "timeout");
      },
      validate: () => true,
    })).rejects.toBeInstanceOf(FreeAiRoutesExhausted);

    expect(sleeps).toEqual([200, 400]);
    expect([...attempts.entries()]).toEqual([["one:free", 2], ["two:free", 2]]);
  });

  it("moves unsupported strict output to the next model without repeating the failed request", async () => {
    const calls: Array<{ model: string; mode: string; retry: number }> = [];

    const result = await runFreeModelFallback({
      models: ["structured:free", "json:free"],
      sleep: async () => undefined,
      attempt: async (request) => {
        calls.push(request);
        if (request.model === "structured:free") {
          throw new AiRouteFailure("unsupported", "response_format unsupported");
        }
        return { content: '{"safe":true}', modelUsed: request.model };
      },
      validate: (content) => JSON.parse(content) as { safe: boolean },
    });

    expect(result.value).toEqual({ safe: true });
    expect(calls).toEqual([
      { model: "structured:free", mode: "structured", retry: 0 },
      { model: "json:free", mode: "json_only", retry: 0 },
    ]);
  });

  it("returns the required manual-planning message after every free route fails", async () => {
    const promise = runFreeModelFallback({
      models: ["one:free", "openrouter/free"],
      sleep: async () => undefined,
      attempt: async () => { throw new AiRouteFailure("capacity", "busy"); },
      validate: () => true,
    });

    await expect(promise).rejects.toThrow(
      "Free AI providers are currently busy. Please try again later or continue with manual planning.",
    );
  });
});
