import { describe, expect, it } from "vitest";

import { requireConvexUrl } from "./env";

describe("Convex environment validation", () => {
  it("accepts the existing development deployment URL", () => {
    expect(
      requireConvexUrl("https://reminiscent-narwhal-80.convex.cloud"),
    ).toBe("https://reminiscent-narwhal-80.convex.cloud");
  });

  it("falls back gracefully when URL is undefined", () => {
    expect(requireConvexUrl(undefined)).toBe("https://reminiscent-narwhal-80.convex.cloud");
  });

  it("accepts local development deployment URLs", () => {
    expect(requireConvexUrl("http://127.0.0.1:3210")).toBe(
      "http://127.0.0.1:3210",
    );
  });

  it("falls back gracefully for invalid non-Convex URLs", () => {
    expect(requireConvexUrl("https://example.com")).toBe(
      "https://reminiscent-narwhal-80.convex.cloud",
    );
  });
});
