import { describe, expect, it } from "vitest";

import { BUILT_IN_FRAMEWORKS } from "./frameworks";

describe("built-in project specialization templates", () => {
  it("contains the ten required versioned domain specializations", () => {
    expect(BUILT_IN_FRAMEWORKS).toHaveLength(10);
    expect(BUILT_IN_FRAMEWORKS.map((framework) => framework.shortName)).toEqual([
      "Software & Web/App",
      "UI/UX & Product",
      "Game Dev & 3D",
      "Data Science & AI",
      "Creative & Video",
      "Architecture & Interior",
      "Event & Exhibition",
      "Marketing & Growth",
      "E-Commerce & Retail",
      "Academic Research",
    ]);
    expect(new Set(BUILT_IN_FRAMEWORKS.map((framework) => framework.id)).size).toBe(10);
    expect(
      BUILT_IN_FRAMEWORKS.every(
        (framework) => framework.isBuiltIn && framework.version === 1,
      ),
    ).toBe(true);
  });

  it("gives every specialization phase complete planning metadata", () => {
    for (const framework of BUILT_IN_FRAMEWORKS) {
      const phaseIds = framework.phases.map(
        (frameworkPhase) => frameworkPhase.id,
      );

      expect(new Set(phaseIds).size).toBe(phaseIds.length);
      expect(framework.description.length).toBeGreaterThan(20);
      expect(framework.disciplines.length).toBeGreaterThanOrEqual(3);

      framework.phases.forEach((frameworkPhase, index) => {
        expect(frameworkPhase.description.length).toBeGreaterThan(15);
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

  it("verifies specialization domain IDs", () => {
    const software = BUILT_IN_FRAMEWORKS.find(
      (framework) => framework.id === "software-web-app",
    );
    const design = BUILT_IN_FRAMEWORKS.find(
      (framework) => framework.id === "ui-ux-product-strategy",
    );

    expect(software?.name).toBe("Software & Web/App Engineering");
    expect(design?.name).toBe("UI/UX Design & Product Strategy");
    expect(software?.phases).toHaveLength(7);
  });
});
