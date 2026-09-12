import { describe, expect, it } from "vitest";

import { validateAiPlan, type ValidatedAiPlan } from "./aiPlanValidation";

const context = {
  project: { startDate: "2026-08-01", deadline: "2026-12-15" },
  phases: [{ phaseId: "phase-1" }, { phaseId: "phase-2" }],
  members: [{ profileId: "member-1" }, { profileId: "member-2" }],
};

function validPlan(): ValidatedAiPlan {
  return {
    recommendedFramework: "Nonlinear Design Process",
    frameworkReason: "The current framework supports iterative production.",
    milestones: [
      {
        tempId: "milestone-1",
        title: "Research ready",
        description: "Review the evidence base.",
        phaseId: "phase-1",
        dueDate: "2026-09-01",
      },
    ],
    tasks: [
      {
        tempId: "task-1",
        title: "Interview participants",
        description: "Run and synthesise five interviews.",
        phaseId: "phase-1",
        milestoneTempId: "milestone-1",
        primaryOwnerProfileId: "member-1",
        collaboratorProfileIds: ["member-2"],
        requiredSkills: ["Interviewing"],
        estimatedEffortHours: 8,
        difficulty: 3,
        weight: 2,
        required: true,
        startDate: "2026-08-05",
        dueDate: "2026-08-20",
        dependencyTempIds: [],
        requiresReview: true,
        reviewerProfileId: "member-2",
        allocationExplanation: "The member selected interviewing as a skill.",
        longTaskBreakdown: "",
      },
    ],
    risks: ["Participant recruitment may take longer than expected."],
    assumptions: ["The team can recruit five participants."],
  };
}

describe("AI plan validation", () => {
  it("accepts a bounded plan using known phases and members", () => {
    const result = validateAiPlan(validPlan(), context);
    expect(result.tasks[0]).toMatchObject({
      primaryOwnerProfileId: "member-1",
      reviewerProfileId: "member-2",
    });
  });

  it("rejects unknown owners and self-review", () => {
    const unknownOwner = validPlan();
    unknownOwner.tasks[0].primaryOwnerProfileId = "outsider";
    expect(() => validateAiPlan(unknownOwner, context)).toThrow(/unknown task owner/i);

    const selfReview = validPlan();
    selfReview.tasks[0].reviewerProfileId = "member-1";
    expect(() => validateAiPlan(selfReview, context)).toThrow(/owner as reviewer/i);
  });

  it("rejects dates outside the project and reversed dates", () => {
    const outside = validPlan();
    outside.tasks[0].dueDate = "2027-01-01";
    expect(() => validateAiPlan(outside, context)).toThrow(/outside the project/i);

    const reversed = validPlan();
    reversed.tasks[0].startDate = "2026-09-01";
    reversed.tasks[0].dueDate = "2026-08-20";
    expect(() => validateAiPlan(reversed, context)).toThrow(/dates are reversed/i);
  });

  it("rejects circular task dependencies", () => {
    const plan = validPlan();
    plan.tasks.push({
      ...plan.tasks[0],
      tempId: "task-2",
      title: "Second task",
      dependencyTempIds: ["task-1"],
      reviewerProfileId: null,
      requiresReview: false,
    });
    plan.tasks[0].dependencyTempIds = ["task-2"];

    expect(() => validateAiPlan(plan, context)).toThrow(/circular dependency/i);
  });

  it("rejects excessive output and invalid numeric ranges", () => {
    const tooMany = validPlan();
    tooMany.tasks = Array.from({ length: 16 }, (_, index) => ({
      ...tooMany.tasks[0],
      tempId: `task-${index}`,
    }));
    expect(() => validateAiPlan(tooMany, context)).toThrow(/1–15/i);

    const invalidDifficulty = validPlan();
    invalidDifficulty.tasks[0].difficulty = 9;
    expect(() => validateAiPlan(invalidDifficulty, context)).toThrow(/outside the allowed range/i);
  });

  it("sanitizes generic task titles into actionable outcome-oriented task titles", () => {
    const plan = validPlan();
    plan.tasks[0].title = "Do research";
    const validated = validateAiPlan(plan, context);
    expect(validated.tasks[0].title).toBe("Conduct target research analysis and synthesize core findings");
  });
});
