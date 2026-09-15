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

  // Create a concise, conservative safety baseline (3 bounded project lifecycle tasks)
  const fallbackTaskTemplates = [
    {
      title: "Establish Project Requirements & Work Breakdown",
      desc: "Review initial project brief requirements, align team deliverables, and define baseline milestones.",
      skills: ["Planning", "Coordination"],
      phaseIndex: 0,
      effort: 8,
    },
    {
      title: "Execute Primary Project Construction & Integration",
      desc: "Produce core project assets, integrate required components, and assemble main deliverables.",
      skills: ["Execution", "Production"],
      phaseIndex: Math.min(phases.length - 1, Math.max(1, Math.floor(phases.length / 2))),
      effort: 16,
    },
    {
      title: "Conduct Quality Verification & Final Delivery",
      desc: "Perform comprehensive testing and review on final deliverables before project sign-off.",
      skills: ["Quality Review", "Delivery"],
      phaseIndex: phases.length - 1,
      effort: 10,
    },
  ];

  const tasks = fallbackTaskTemplates.map((template, index) => {
    const targetPhase = phases[template.phaseIndex] ?? phases[0];
    const assignedOwner = members[index % members.length];
    const assignedReviewer = members.length > 1 ? members[(index + 1) % members.length] : null;

    const startDate = context.project.startDate || formatIsoDate(0);
    const calculatedDueDate = formatIsoDate((index + 1) * 8);
    const dueDate = context.project.deadline && calculatedDueDate > context.project.deadline
      ? context.project.deadline
      : calculatedDueDate;

    return {
      tempId: `fallback_task_${index + 1}_${seed}`,
      title: template.title,
      description: template.desc,
      phaseId: targetPhase.phaseId,
      milestoneTempId: milestones[index % milestones.length]?.tempId ?? null,
      primaryOwnerProfileId: assignedOwner.profileId,
      collaboratorProfileIds: [],
      requiredSkills: template.skills,
      estimatedEffortHours: template.effort,
      difficulty: 3,
      weight: 4,
      required: true,
      startDate,
      dueDate,
      dependencyTempIds: index > 0 ? [`fallback_task_${index}_${seed}`] : [],
      requiresReview: true,
      reviewerProfileId: assignedReviewer ? assignedReviewer.profileId : null,
      allocationExplanation: `Assigned to ${assignedOwner.displayName} for safety baseline execution.`,
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
