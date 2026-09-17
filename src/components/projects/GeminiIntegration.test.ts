import { describe, expect, it } from "vitest";
import { planningPrompts } from "../../../convex/ai";
import { validateAiPlan, validatePlanAgainstBrief } from "../../../convex/lib/aiPlanValidation";

const mockContext = {
  project: {
    projectId: "proj_123",
    title: "Ứng dụng Quản lý Đội nhóm",
    description: "Xây dựng ứng dụng Gamified Team Project Tracker",
    frameworkName: "Scrum",
    startDate: "2026-09-01",
    deadline: "2026-10-31"
  },
  phases: [
    { phaseId: "phase_1", title: "Khảo sát & Lập kế hoạch", description: "Khảo sát yêu cầu", canOverlap: false, reviewCheckpoint: true },
    { phaseId: "phase_2", title: "Thiết kế & Lập trình", description: "Phát triển tính năng", canOverlap: true, reviewCheckpoint: false },
    { phaseId: "phase_3", title: "Kiểm thử & Bàn giao", description: "Test & Release", canOverlap: false, reviewCheckpoint: true }
  ],
  members: [
    { profileId: "member_1", displayName: "Nguyễn Khánh Đoan", skills: ["Design", "UI/UX"], availability: "Full-time", currentWorkload: "medium" as const, preferences: "Frontend" }
  ],
  existingTasks: []
};

const brief = "Phát triển hệ thống web app theo dõi tiến độ dự án có tính năng gamification, bảng xếp hạng và AI assistant tạo kế hoạch.";

describe("Gemini Planner End-to-End Logic", () => {
  it("builds valid prompts and handles single-member reviewer sanitization cleanly", () => {
    const { systemPrompt, userPrompt } = planningPrompts(brief, mockContext);
    expect(systemPrompt).toContain("MayLamDi's Senior Project Architect");
    expect(userPrompt).toContain("Scrum");

    const rawAiOutput = {
      recommendedFramework: "Scrum Framework",
      frameworkReason: "Scrum supports iterative production and sprints.",
      milestones: [
        {
          tempId: "ms-1",
          title: "Thiết kế UI Prototype",
          description: "Hoàn thiện bản mẫu giao diện người dùng",
          phaseId: "phase_1",
          dueDate: "2026-09-15"
        }
      ],
      tasks: [
        {
          tempId: "task-1",
          title: "Design leaderboard interface",
          description: "Construct screen layout for leaderboard and scores",
          phaseId: "phase_1",
          milestoneTempId: "ms-1",
          primaryOwnerProfileId: "member_1",
          collaboratorProfileIds: [],
          requiredSkills: ["Design"],
          estimatedEffortHours: 6,
          difficulty: 3,
          weight: 2,
          required: true,
          startDate: "2026-09-02",
          dueDate: "2026-09-10",
          dependencyTempIds: [],
          requiresReview: true,
          reviewerProfileId: "member_1",
          allocationExplanation: "Assigned based on UI skills",
          longTaskBreakdown: ""
        },
        {
          tempId: "task-2",
          title: "Implement gamification scoring",
          description: "Build scoring algorithm and badge rewards",
          phaseId: "phase_2",
          milestoneTempId: "ms-1",
          primaryOwnerProfileId: "member_1",
          collaboratorProfileIds: [],
          requiredSkills: ["Design"],
          estimatedEffortHours: 8,
          difficulty: 3,
          weight: 2,
          required: true,
          startDate: "2026-09-11",
          dueDate: "2026-09-20",
          dependencyTempIds: ["task-1"],
          requiresReview: true,
          reviewerProfileId: "member_1",
          allocationExplanation: "Assigned based on UI skills",
          longTaskBreakdown: ""
        },
        {
          tempId: "task-3",
          title: "Verify user testing flows",
          description: "Execute end-to-end plan generation tests and verification",
          phaseId: "phase_3",
          milestoneTempId: "ms-1",
          primaryOwnerProfileId: "member_1",
          collaboratorProfileIds: [],
          requiredSkills: ["Design"],
          estimatedEffortHours: 4,
          difficulty: 2,
          weight: 1,
          required: true,
          startDate: "2026-09-21",
          dueDate: "2026-09-30",
          dependencyTempIds: ["task-2"],
          requiresReview: true,
          reviewerProfileId: "member_1",
          allocationExplanation: "Assigned based on UI skills",
          longTaskBreakdown: ""
        }
      ],
      risks: ["Khối lượng công việc frontend lớn."],
      assumptions: ["Thành viên hoàn thành đúng hạn."]
    };

    const validated = validateAiPlan(rawAiOutput, mockContext);
    expect(validated.tasks[0].primaryOwnerProfileId).toBe("member_1");
    expect(validated.tasks[0].reviewerProfileId).toBeNull();

    const report = validatePlanAgainstBrief(validated, brief, mockContext);
    expect(report.valid).toBe(true);
  });
});
