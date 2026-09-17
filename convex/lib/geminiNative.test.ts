import { describe, expect, it } from "vitest";
import {
  buildGeminiModelChain,
  parseGeminiJsonResponse,
  GEMINI_NATIVE_MODELS,
} from "./geminiNative";

describe("geminiNative Module Tests", () => {
  it("defines supported native models", () => {
    expect(GEMINI_NATIVE_MODELS).toContain("gemini-3.5-flash-lite");
    expect(GEMINI_NATIVE_MODELS).toContain("gemini-flash-lite-latest");
  });

  it("parses valid JSON response", () => {
    const raw = '{"tasks":[{"title":"Build prototype"}]}';
    const parsed = parseGeminiJsonResponse(raw) as { tasks: Array<{ title: string }> };
    expect(parsed.tasks[0].title).toBe("Build prototype");
  });

  it("parses markdown fenced JSON", () => {
    const raw = '```json\n{"tasks":[{"title":"Design concept"}]}\n```';
    const parsed = parseGeminiJsonResponse(raw) as { tasks: Array<{ title: string }> };
    expect(parsed.tasks[0].title).toBe("Design concept");
  });

  it("strips think tags before parsing", () => {
    const raw = '<thought>Some thoughts</thought>\n{"tasks":[{"title":"User testing"}]}';
    const parsed = parseGeminiJsonResponse(raw) as { tasks: Array<{ title: string }> };
    expect(parsed.tasks[0].title).toBe("User testing");
  });

  it("builds model chain with optional override", () => {
    const chain = buildGeminiModelChain("gemini-3.6-flash");
    expect(chain[0]).toBe("gemini-3.6-flash");
    expect(chain).toContain("gemini-3.5-flash-lite");
  });

  it("builds default model chain when no override given", () => {
    const chain = buildGeminiModelChain();
    expect(chain[0]).toBe("gemini-3.5-flash-lite");
  });
});
