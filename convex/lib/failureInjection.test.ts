import { describe, expect, it } from "vitest";
import { runFreeModelFallback, AiRouteFailure } from "./openRouterFallback";
import { generateSmartFallbackPlan } from "./smartFallbackPlanner";
import { validateAiPlan, validatePlanAgainstBrief } from "./aiPlanValidation";

const mockContext = {
  project: { projectId: "p1", title: "Game App", startDate: "2026-09-15", deadline: "2026-10-30", frameworkName: "Agile" },
  phases: [
    { phaseId: "phase_1", title: "Discovery & Concept" },
    { phaseId: "phase_2", title: "Core Execution" },
    { phaseId: "phase_3", title: "Testing & Release" },
  ],
  members: [
    { profileId: "m1", displayName: "Designer" },
    { profileId: "m2", displayName: "Developer" },
  ],
};

const brief = "Create a 2D narrative game about dealing with loneliness and everyday stress. Features 3 endings, exploration, dialogue choices, and light puzzle solving.";

const validLlmPlanJson = JSON.stringify({
  recommendedFramework: "Agile Process",
  frameworkReason: "Iterative game development sprints",
  milestones: [
    { tempId: "m1", title: "Concept Milestone", description: "Design complete", phaseId: "phase_1", dueDate: "2026-09-30" },
  ],
  tasks: [
    {
      tempId: "t1",
      title: "Design Game Concept & Story Arc",
      description: "Draft 3 dialogue endings and character interaction choices.",
      phaseId: "phase_1",
      milestoneTempId: "m1",
      primaryOwnerProfileId: "m1",
      collaboratorProfileIds: [],
      requiredSkills: ["Game Design"],
      estimatedEffortHours: 8,
      difficulty: 3,
      weight: 4,
      required: true,
      startDate: "2026-09-15",
      dueDate: "2026-09-25",
      dependencyTempIds: [],
      requiresReview: true,
      reviewerProfileId: "m2",
      allocationExplanation: "Assigned based on design skills.",
      longTaskBreakdown: "",
    },
    {
      tempId: "t2",
      title: "Develop Exploration Systems & Logic",
      description: "Code keyboard player movement and interactive scene transitions.",
      phaseId: "phase_2",
      milestoneTempId: "m1",
      primaryOwnerProfileId: "m2",
      collaboratorProfileIds: [],
      requiredSkills: ["Programming"],
      estimatedEffortHours: 12,
      difficulty: 4,
      weight: 5,
      required: true,
      startDate: "2026-09-20",
      dueDate: "2026-10-10",
      dependencyTempIds: ["t1"],
      requiresReview: true,
      reviewerProfileId: "m1",
      allocationExplanation: "Assigned to developer.",
      longTaskBreakdown: "",
    },
    {
      tempId: "t3",
      title: "Run Playtesting & Usability Audit",
      description: "Test browser controls and verify narrative ending branches.",
      phaseId: "phase_3",
      milestoneTempId: "m1",
      primaryOwnerProfileId: "m1",
      collaboratorProfileIds: [],
      requiredSkills: ["QA"],
      estimatedEffortHours: 6,
      difficulty: 2,
      weight: 3,
      required: true,
      startDate: "2026-10-10",
      dueDate: "2026-10-25",
      dependencyTempIds: ["t2"],
      requiresReview: true,
      reviewerProfileId: "m2",
      allocationExplanation: "Final verification.",
      longTaskBreakdown: "",
    },
  ],
  risks: ["Scope creep"],
  assumptions: ["Team members available"],
});

describe("FAILURE-INJECTION ARCHITECTURE VERIFICATION", () => {

  it("TEST A — NORMAL: Primary model succeeds, backup is NEVER called", async () => {
    const models = ["meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-lite-001"];
    const calls: string[] = [];

    const result = await runFreeModelFallback({
      models,
      sleep: async () => undefined,
      attempt: async (req) => {
        calls.push(req.model);
        return { content: validLlmPlanJson, modelUsed: req.model };
      },
      validate: (content) => validateAiPlan(JSON.parse(content), mockContext),
    });

    console.log("\n--- TEST A: NORMAL PATH ---");
    console.log("MODELS CALLED:", calls);
    console.log("RESULT SOURCE MODEL:", result.modelUsed);

    expect(calls).toEqual(["meta-llama/llama-3.3-70b-instruct:free"]);
    expect(calls.includes("google/gemini-2.0-flash-lite-001")).toBe(false);
    expect(result.modelUsed).toBe("meta-llama/llama-3.3-70b-instruct:free");
    expect(result.value.tasks.length).toBe(3);
  });

  it("TEST B — PRIMARY FAILURE: Primary model fails, switches to backup model, fallback NOT used", async () => {
    const models = ["meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-lite-001"];
    const calls: string[] = [];

    const result = await runFreeModelFallback({
      models,
      sleep: async () => undefined,
      attempt: async (req) => {
        calls.push(req.model);
        if (req.model === models[0]) {
          throw new AiRouteFailure("capacity", "Primary model 503 Overloaded");
        }
        return { content: validLlmPlanJson, modelUsed: req.model };
      },
      validate: (content) => validateAiPlan(JSON.parse(content), mockContext),
    });

    console.log("\n--- TEST B: PRIMARY FAILURE -> BACKUP SUCCESS ---");
    console.log("MODELS CALLED:", calls);
    console.log("RESULT SOURCE MODEL:", result.modelUsed);

    expect(calls).toEqual([
      "meta-llama/llama-3.3-70b-instruct:free",
      "meta-llama/llama-3.3-70b-instruct:free", // Retry 1 on primary
      "google/gemini-2.0-flash-lite-001",       // Backup called!
    ]);
    expect(result.modelUsed).toBe("google/gemini-2.0-flash-lite-001");
    expect(result.value.tasks.length).toBe(3);
  });

  it("TEST C — PRIMARY INVALID OUTPUT: Primary returns malformed output, backup returns valid plan", async () => {
    const models = ["meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-lite-001"];
    const calls: string[] = [];

    const result = await runFreeModelFallback({
      models,
      sleep: async () => undefined,
      attempt: async (req) => {
        calls.push(req.model);
        if (req.model === models[0]) {
          return { content: "INVALID_MALFORMED_GARBAGE_TEXT", modelUsed: req.model };
        }
        return { content: validLlmPlanJson, modelUsed: req.model };
      },
      validate: (content) => validateAiPlan(JSON.parse(content), mockContext),
    });

    console.log("\n--- TEST C: PRIMARY INVALID OUTPUT -> BACKUP SUCCESS ---");
    console.log("MODELS CALLED:", calls);
    console.log("RESULT MODEL:", result.modelUsed);

    // Malformed primary output was discarded and backup succeeded
    expect(calls.includes("google/gemini-2.0-flash-lite-001")).toBe(true);
    expect(result.modelUsed).toBe("google/gemini-2.0-flash-lite-001");
    expect(result.value.tasks[0].title).toBe("Design Game Concept & Story Arc");
  });

  it("TEST D — BOTH AI MODELS FAIL: Primary + Backup fail, safe fallback planner executes", async () => {
    const models = ["meta-llama/llama-3.3-70b-instruct:free", "google/gemini-2.0-flash-lite-001"];
    let apiAttempted = false;

    let finalPlan;
    let source = "llm";
    let fallbackReason;

    try {
      apiAttempted = true;
      await runFreeModelFallback({
        models,
        sleep: async () => undefined,
        attempt: async () => {
          throw new AiRouteFailure("capacity", "503 All Free AI Providers Busy");
        },
        validate: (content) => validateAiPlan(JSON.parse(content), mockContext),
      });
    } catch (err) {
      source = "fallback";
      fallbackReason = err instanceof Error ? err.message : String(err);
      finalPlan = generateSmartFallbackPlan(mockContext, brief, "gen_test_d", fallbackReason);
    }

    console.log("\n--- TEST D: BOTH MODELS FAIL -> SAFE FALLBACK ---");
    console.log("SOURCE:", source);
    console.log("FALLBACK REASON:", fallbackReason);
    console.log("FALLBACK TASKS:", finalPlan?.tasks.map((t) => t.title));

    expect(source).toBe("fallback");
    expect(apiAttempted).toBe(true);
    expect(finalPlan).toBeDefined();

    // Verify fallback does NOT copy raw brief sentences as titles
    for (const t of finalPlan!.tasks) {
      expect(t.title.split(" ").length).toBeLessThanOrEqual(12);
      expect(t.title).not.toContain("Create a 2D narrative game about dealing with loneliness");
    }

    const report = validatePlanAgainstBrief(finalPlan!, brief, mockContext);
    expect(report.valid).toBe(true);
  });
});
