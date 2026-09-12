export type PlanningContext = {
  project: { startDate: string; deadline: string };
  phases: Array<{ phaseId: string }>;
  members: Array<{ profileId: string }>;
};

export type AiMilestoneDraft = {
  tempId: string;
  title: string;
  description: string;
  phaseId: string;
  dueDate: string;
};

export type AiTaskDraft = {
  tempId: string;
  title: string;
  description: string;
  phaseId: string;
  milestoneTempId: string | null;
  primaryOwnerProfileId: string;
  collaboratorProfileIds: string[];
  requiredSkills: string[];
  estimatedEffortHours: number;
  difficulty: number;
  weight: number;
  required: boolean;
  startDate: string;
  dueDate: string;
  dependencyTempIds: string[];
  requiresReview: boolean;
  reviewerProfileId: string | null;
  allocationExplanation: string;
  longTaskBreakdown: string;
};

export type ValidatedAiPlan = {
  recommendedFramework: string;
  frameworkReason: string;
  milestones: AiMilestoneDraft[];
  tasks: AiTaskDraft[];
  risks: string[];
  assumptions: string[];
};

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("AI returned an invalid planning object.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, maximum: number) {
  if (typeof value !== "string") throw new Error(`AI ${label} must be text.`);
  const normalised = value.trim().replace(/\s+/g, " ");
  if (normalised.length === 0 || normalised.length > maximum) {
    throw new Error(`AI ${label} must contain 1–${maximum} characters.`);
  }
  return normalised;
}

function textArray(value: unknown, label: string, maximumItems: number) {
  if (!Array.isArray(value) || value.length > maximumItems) {
    throw new Error(`AI ${label} must be a short list.`);
  }
  return value.map((item) => text(item, label, 300));
}

function numberInRange(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`AI ${label} is outside the allowed range.`);
  }
  return value;
}

function dateInProject(value: unknown, label: string, context: PlanningContext) {
  const date = text(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`AI ${label} must use YYYY-MM-DD.`);
  }
  if (date < context.project.startDate || date > context.project.deadline) {
    throw new Error(`AI ${label} falls outside the project dates.`);
  }
  return date;
}

const GENERIC_TITLE_REGEX = /^(research|testing|ui design|ux analysis|backend|frontend|build frontend|build backend|implementation|setup|task \d+|overview|project setup|development|design|testing & qa|ai development|ai testing|technical note|project technical note|asset archive packaging|do research|build website|create content|write paper|make design|do analysis)$/i;

function sanitizeTaskTitle(rawTitle: string): string {
  const trimmed = rawTitle.trim();
  if (GENERIC_TITLE_REGEX.test(trimmed) || trimmed.split(" ").length < 2) {
    if (/testing|qa/i.test(trimmed)) {
      return "Run usability and functional testing on core project workflow";
    }
    if (/ux|design/i.test(trimmed)) {
      return "Analyse user experience requirements and refine core UI workflow";
    }
    if (/backend|api/i.test(trimmed)) {
      return "Implement core backend API services, data flow, and error handling";
    }
    if (/frontend|build|implementation/i.test(trimmed)) {
      return "Refine core responsive frontend interaction and component workflow";
    }
    if (/note|documentation|setup|packaging/i.test(trimmed)) {
      return "Document architecture, security fallbacks, and technical presentation package";
    }
    if (/research|analysis|study/i.test(trimmed)) {
      return "Conduct target research analysis and synthesize core findings";
    }
    if (/content|paper|write|script/i.test(trimmed)) {
      return "Draft core asset content and detailed project documentation";
    }
    return `Refine ${trimmed} — specific deliverables and verification steps`;
  }
  return trimmed;
}

export function validateAiPlan(value: unknown, context: PlanningContext): ValidatedAiPlan {
  const source = record(value);
  const phaseIds = new Set(context.phases.map((phase) => phase.phaseId));
  const memberIds = new Set(context.members.map((member) => member.profileId));
  const rawMilestones = source.milestones;
  const rawTasks = source.tasks;

  if (!Array.isArray(rawMilestones) || rawMilestones.length > 6) {
    throw new Error("AI milestones must contain at most 6 items.");
  }
  if (!Array.isArray(rawTasks) || rawTasks.length === 0 || rawTasks.length > 15) {
    throw new Error("AI tasks must contain 1–15 items.");
  }

  const milestones = rawMilestones.map((value) => {
    const item = record(value);
    const phaseId = text(item.phaseId, "milestone phase", 100);
    if (!phaseIds.has(phaseId)) throw new Error("AI selected an unknown milestone phase.");
    return {
      tempId: text(item.tempId, "milestone ID", 40),
      title: text(item.title, "milestone title", 100),
      description: text(item.description, "milestone description", 800),
      phaseId,
      dueDate: dateInProject(item.dueDate, "milestone due date", context),
    };
  });
  const milestoneIds = new Set(milestones.map((item) => item.tempId));
  if (milestoneIds.size !== milestones.length) throw new Error("AI milestone IDs must be unique.");

  const tasks = rawTasks.map((value) => {
    const item = record(value);
    const phaseId = text(item.phaseId, "task phase", 100);
    const ownerId = text(item.primaryOwnerProfileId, "task owner", 100);
    const milestoneTempId = item.milestoneTempId === null
      ? null
      : text(item.milestoneTempId, "task milestone", 40);
    const reviewerProfileId = item.reviewerProfileId === null
      ? null
      : text(item.reviewerProfileId, "reviewer", 100);
    const collaborators = textArray(item.collaboratorProfileIds, "collaborators", 12);
    const startDate = dateInProject(item.startDate, "task start date", context);
    const dueDate = dateInProject(item.dueDate, "task due date", context);

    if (!phaseIds.has(phaseId)) throw new Error("AI selected an unknown task phase.");
    if (!memberIds.has(ownerId)) throw new Error("AI selected an unknown task owner.");
    if (milestoneTempId && !milestoneIds.has(milestoneTempId)) {
      throw new Error("AI linked a task to an unknown milestone.");
    }
    if (dueDate < startDate) throw new Error("AI task dates are reversed.");
    if (collaborators.some((id) => !memberIds.has(id) || id === ownerId)) {
      throw new Error("AI selected an invalid collaborator.");
    }
    if (typeof item.requiresReview !== "boolean" || typeof item.required !== "boolean") {
      throw new Error("AI task flags are invalid.");
    }
    if (reviewerProfileId && !memberIds.has(reviewerProfileId)) {
      throw new Error("AI selected an unknown reviewer.");
    }
    if (!item.requiresReview && reviewerProfileId) {
      throw new Error("AI supplied a reviewer for a task without review.");
    }
    if (reviewerProfileId === ownerId) throw new Error("AI assigned a task owner as reviewer.");
    const difficulty = numberInRange(item.difficulty, "task difficulty", 1, 5);
    if (!Number.isInteger(difficulty)) {
      throw new Error("AI task difficulty must be a whole number.");
    }

    return {
      tempId: text(item.tempId, "task ID", 40),
      title: sanitizeTaskTitle(text(item.title, "task title", 120)),
      description: text(item.description, "task description", 1_500),
      phaseId,
      milestoneTempId,
      primaryOwnerProfileId: ownerId,
      collaboratorProfileIds: [...new Set(collaborators)],
      requiredSkills: [...new Set(textArray(item.requiredSkills, "required skills", 20))],
      estimatedEffortHours: numberInRange(item.estimatedEffortHours, "task effort", 0.5, 2_000),
      difficulty,
      weight: numberInRange(item.weight, "task weight", 0.5, 100),
      required: true,
      startDate,
      dueDate,
      dependencyTempIds: textArray(item.dependencyTempIds, "task dependencies", 12),
      requiresReview: true,
      reviewerProfileId,
      allocationExplanation: text(item.allocationExplanation, "allocation explanation", 600),
      longTaskBreakdown: typeof item.longTaskBreakdown === "string"
        ? item.longTaskBreakdown.trim().slice(0, 800)
        : "",
    };
  });
  const taskIds = new Set(tasks.map((item) => item.tempId));
  if (taskIds.size !== tasks.length) throw new Error("AI task IDs must be unique.");
  if (tasks.some((task) => task.dependencyTempIds.some((id) => !taskIds.has(id) || id === task.tempId))) {
    throw new Error("AI task dependencies are invalid.");
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(tasks.map((task) => [task.tempId, task]));
  function visit(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependencyId of byId.get(id)?.dependencyTempIds ?? []) {
      if (visit(dependencyId)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  if (tasks.some((task) => visit(task.tempId))) {
    throw new Error("AI created a circular dependency.");
  }

  return {
    recommendedFramework: text(source.recommendedFramework, "framework recommendation", 120),
    frameworkReason: text(source.frameworkReason, "framework reason", 800),
    milestones,
    tasks,
    risks: textArray(source.risks, "risks", 10),
    assumptions: textArray(source.assumptions, "assumptions", 10),
  };
}
