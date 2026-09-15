import { describe, expect, it } from "vitest";
import { generateSmartFallbackPlan } from "./smartFallbackPlanner";
import { extractFactsFromBrief, validatePlanAgainstBrief } from "./aiPlanValidation";

describe("smartFallbackPlanner — Framework-Aware Phase-Based Fallback Engine", () => {
  const mockContext = {
    project: { projectId: "proj_1", title: "Prototype Project", description: "Team project", frameworkName: "Design Thinking", startDate: "2026-08-01", deadline: "2026-08-30" },
    phases: [
      { phaseId: "phase_empathise", title: "Empathise & Discovery" },
      { phaseId: "phase_define", title: "Define & Architecture" },
      { phaseId: "phase_prototype", title: "Prototype & Build" },
      { phaseId: "phase_test", title: "Test & Deliver" },
    ],
    members: [{ profileId: "mem_1", displayName: "Anh" }, { profileId: "mem_2", displayName: "Minh" }],
  };

  it("generates framework-aligned phase tasks across all project phases", () => {
    const gameBrief = `Create a small 2D narrative adventure game for university students about dealing with loneliness and everyday stress. The player controls a university student who explores a surreal version of their campus after staying late at night. The environment changes based on choices. Developed by 5 members over 6 weeks.`;

    const plan = generateSmartFallbackPlan(mockContext, gameBrief, "gen_test_001", "NO_API_KEY");
    const report = validatePlanAgainstBrief(plan, gameBrief, mockContext);

    console.log("\n--- SMART FALLBACK TEST: FRAMEWORK PHASE TASKS ---");
    console.log("TASKS:", plan.tasks.map((t) => ({ title: t.title, phaseId: t.phaseId, owner: t.primaryOwnerProfileId })));
    console.log("VALIDATION REPORT:", report);

    // 1. Task count dynamically maps to framework phases (4 phases -> 4 tasks)
    expect(plan.tasks.length).toBe(4);

    // 2. Task titles MUST be concise (<= 12 words) and active
    for (const task of plan.tasks) {
      expect(task.title.split(" ").length).toBeLessThanOrEqual(12);
      expect(task.title).toMatch(/^[A-Z][a-z]+/);
      expect(task.title).not.toContain("Coordinate");
      expect(task.description).not.toContain("Execute core technical deliverables for");
    }

    // 3. ZERO raw brief paragraph copy-pasting
    const combinedTitles = plan.tasks.map((t) => t.title).join(" ");
    expect(combinedTitles).not.toContain("Create a small 2D narrative adventure game");

    // 4. Tasks distributed across team members
    const owners = new Set(plan.tasks.map((t) => t.primaryOwnerProfileId));
    expect(owners.has("mem_1")).toBe(true);
    expect(owners.has("mem_2")).toBe(true);

    // 5. Validation Engine MUST pass 100%
    expect(report.valid).toBe(true);
  });

  it("extracts facts accurately for context awareness", () => {
    const brief = "Plan a 5-week university art exhibition featuring 12 artworks for 150 visitors.";
    const facts = extractFactsFromBrief(brief);

    expect(facts.duration?.value).toBe(5);
    expect(facts.artworksOrProducts?.count).toBe(12);
    expect(facts.visitorsOrAudience?.count).toBe(150);
  });

  it("generates safe, bounded tasks matching 5 custom framework phases", () => {
    const multiPhaseContext = {
      ...mockContext,
      phases: [
        { phaseId: "p1", title: "Scope & Framing" },
        { phaseId: "p2", title: "Concept Design" },
        { phaseId: "p3", title: "Technical Construction" },
        { phaseId: "p4", title: "Quality Audit" },
        { phaseId: "p5", title: "Final Deployment" },
      ],
    };

    const brief = "Build a web application in 5 weeks.";
    const plan = generateSmartFallbackPlan(multiPhaseContext, brief);

    expect(plan.tasks.length).toBe(5);
    expect(plan.tasks[0].phaseId).toBe("p1");
    expect(plan.tasks[4].phaseId).toBe("p5");
    expect(validatePlanAgainstBrief(plan, brief, multiPhaseContext).valid).toBe(true);
  });
});
