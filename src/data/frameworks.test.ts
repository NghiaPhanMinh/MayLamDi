import { describe, expect, it } from "vitest";

import { BUILT_IN_FRAMEWORKS } from "./frameworks";

describe("built-in framework templates", () => {
  it("contains the seven required versioned templates", () => {
    expect(BUILT_IN_FRAMEWORKS).toHaveLength(7);
    expect(BUILT_IN_FRAMEWORKS.map((framework) => framework.shortName)).toEqual(
      [
        "Design & Creative",
        "Marketing & Communications",
        "Business & Entrepreneurship",
        "Architecture & Spatial Design",
        "Film, Animation & Media",
        "Software & IT",
        "Academic Research",
      ],
    );
    expect(
      new Set(BUILT_IN_FRAMEWORKS.map((framework) => framework.id)).size,
    ).toBe(7);
    expect(
      BUILT_IN_FRAMEWORKS.every(
        (framework) => framework.isBuiltIn && framework.version === 1,
      ),
    ).toBe(true);
  });

  it("gives every phase complete reusable planning metadata", () => {
    for (const framework of BUILT_IN_FRAMEWORKS) {
      const phaseIds = framework.phases.map(
        (frameworkPhase) => frameworkPhase.id,
      );

      expect(new Set(phaseIds).size).toBe(phaseIds.length);
      expect(framework.description.length).toBeGreaterThan(20);
      expect(framework.disciplines.length).toBeGreaterThanOrEqual(3);

      framework.phases.forEach((frameworkPhase, index) => {
        expect(frameworkPhase.description.length).toBeGreaterThan(20);
        expect(frameworkPhase.suggestedDeliverables.length).toBeGreaterThan(0);
        expect(frameworkPhase.suggestedSkills.length).toBeGreaterThan(0);

        for (const dependencyId of frameworkPhase.defaultDependencies) {
          expect(phaseIds.indexOf(dependencyId)).toBeGreaterThanOrEqual(0);
          expect(phaseIds.indexOf(dependencyId)).toBeLessThan(index);
        }
      });

      expect(
        framework.phases.some(
          (frameworkPhase) => frameworkPhase.reviewCheckpoint,
        ),
      ).toBe(true);
    }
  });

  it("represents nonlinear and dependency-aware behaviour as data", () => {
    const design = BUILT_IN_FRAMEWORKS.find(
      (framework) => framework.id === "design-nonlinear",
    );
    const architecture = BUILT_IN_FRAMEWORKS.find(
      (framework) => framework.id === "architecture-spatial",
    );
    const software = BUILT_IN_FRAMEWORKS.find(
      (framework) => framework.id === "software-agile",
    );

    expect(
      design?.phases.filter((frameworkPhase) => frameworkPhase.canOverlap)
        .length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      architecture?.phases.some(
        (frameworkPhase) => frameworkPhase.name === "Review and Revision",
      ),
    ).toBe(true);
    expect(software?.description).toMatch(/sprints/i);
    expect(
      software?.phases.find(
        (frameworkPhase) => frameworkPhase.id === "software-development",
      )?.defaultDependencies,
    ).toEqual(["backlog-planning", "ux-technical-design"]);
  });
});
