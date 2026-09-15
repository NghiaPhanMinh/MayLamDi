import type { ValidatedAiPlan } from "./aiPlanValidation";

type PlanningContext = {
  project: { projectId: string; title: string; startDate: string; deadline: string; frameworkName: string };
  phases: Array<{ phaseId: string; title: string }>;
  members: Array<{ profileId: string; displayName: string; skills?: string[] }>;
};

export type GeneratedAiPlan = ValidatedAiPlan & {
  generatedAt: number;
  source: "llm" | "fallback";
  generationId?: string;
  fallbackReason?: string;
  apiAttempted: boolean;
  apiErrorCategory?: string | null;
  modelUsed?: string;
};

function formatIsoDate(daysFromNow: number): string {
  const target = new Date();
  target.setDate(target.getDate() + daysFromNow);
  return target.toISOString().slice(0, 10);
}

export function generateSmartFallbackPlan(
  context: PlanningContext,
  brief: string,
  generationId?: string,
  fallbackReason: string = "FALLBACK_TRIGGERED"
): ValidatedAiPlan {
  const phases = context.phases.length > 0
    ? context.phases
    : [
        { phaseId: "phase_discovery", title: "Discovery & Requirements" },
        { phaseId: "phase_definition", title: "Architecture & Definition" },
        { phaseId: "phase_execution", title: "Design & Construction" },
        { phaseId: "phase_verification", title: "Testing & Quality Verification" },
        { phaseId: "phase_delivery", title: "Deployment & Documentation" },
      ];

  const members = context.members.length > 0
    ? context.members
    : [{ profileId: "member_1", displayName: "Team Member" }];

  const seed = generationId ? Array.from(generationId).reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;

  const milestones = phases.slice(0, Math.min(6, phases.length)).map((phase, index) => ({
    tempId: `milestone_${index + 1}`,
    title: `Milestone ${index + 1}: ${phase.title}`,
    description: `Target deliverables completion check for ${phase.title}.`,
    phaseId: phase.phaseId,
    dueDate: context.project.deadline || formatIsoDate((index + 1) * 7),
  }));

  const usedTitles = new Set<string>();

  // Create conservative, domain-neutral fallback tasks mapped cleanly to each process phase
  const tasks = phases.map((phase, index) => {
    const title = `Coordinate ${phase.title} Workstream`;
    const desc = `Organize essential tasks, verify required outputs, and fulfill deliverables for ${phase.title}.`;
    const skills = ["Project Execution", "Team Coordination"];

    const assignedOwner = members[index % members.length];
    const assignedReviewer = members.length > 1 ? members[(index + 1) % members.length] : null;

    const startDate = context.project.startDate || formatIsoDate(0);
    const calculatedDueDate = formatIsoDate((index + 1) * 6);
    const dueDate = context.project.deadline && calculatedDueDate > context.project.deadline
      ? context.project.deadline
      : calculatedDueDate;

    return {
      tempId: `task_${index + 1}_${seed}`,
      title,
      description: desc,
      phaseId: phase.phaseId,
      milestoneTempId: milestones[index % milestones.length]?.tempId ?? null,
      primaryOwnerProfileId: assignedOwner.profileId,
      collaboratorProfileIds: [],
      requiredSkills: skills,
      estimatedEffortHours: 6 + (index * 2),
      difficulty: 3,
      weight: 4,
      required: true,
      startDate,
      dueDate,
      dependencyTempIds: index > 0 ? [`task_${index}_${seed}`] : [],
      requiresReview: true,
      reviewerProfileId: assignedReviewer ? assignedReviewer.profileId : null,
      allocationExplanation: `Assigned to ${assignedOwner.displayName} based on process phase workflow.`,
      longTaskBreakdown: "",
    };
  });

  return {
    recommendedFramework: `${context.project.frameworkName || "Agile Process Framework"} (Fallback Mode)`,
    frameworkReason: `Coherent process plan generated via Fallback Planner (Reason: ${fallbackReason}).`,
    milestones,
    tasks,
    risks: [
      "Scope alignment: Ensure task details are refined during sprint planning.",
      "Timeline tracking: Monitor phase progress to prevent downstream bottlenecks.",
    ],
    assumptions: [
      "Team members have access to necessary development tools.",
      "Process phase checkpoints will be reviewed prior to final submission.",
    ],
  };
}
