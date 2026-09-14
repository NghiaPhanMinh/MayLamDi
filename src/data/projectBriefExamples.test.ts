import { describe, expect, it } from "vitest";

import { BUILT_IN_FRAMEWORKS } from "./frameworks";
import {
  GENERIC_PROJECT_BRIEF_EXAMPLE,
  getProjectBriefExample,
  PROJECT_BRIEF_EXAMPLES,
} from "./projectBriefExamples";

describe("project brief examples", () => {
  it("covers every current built-in framework with a distinct detailed example", () => {
    const frameworkIds = BUILT_IN_FRAMEWORKS.map((framework) => framework.id);

    expect(Object.keys(PROJECT_BRIEF_EXAMPLES).sort()).toEqual([...frameworkIds].sort());
    expect(new Set(Object.values(PROJECT_BRIEF_EXAMPLES)).size).toBe(frameworkIds.length);

    for (const frameworkId of frameworkIds) {
      const example = getProjectBriefExample(frameworkId);
      expect(example.length).toBeGreaterThan(1000);
      expect(example.length).toBeLessThanOrEqual(8000);
      expect(example).toMatch(/DELIVERABLES:/);
      expect(example).toMatch(/SUCCESS CRITERIA:/);
      expect(example).toMatch(/DEPENDENCIES AND PLANNING:/);
      expect(example).toContain("\n");
    }
  });

  it("uses the generic example for simple, custom, or missing framework IDs", () => {
    expect(getProjectBriefExample("none")).toBe(GENERIC_PROJECT_BRIEF_EXAMPLE);
    expect(getProjectBriefExample("custom")).toBe(GENERIC_PROJECT_BRIEF_EXAMPLE);
    expect(getProjectBriefExample()).toBe(GENERIC_PROJECT_BRIEF_EXAMPLE);
  });
});
