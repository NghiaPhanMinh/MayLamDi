import { ConvexError } from "convex/values";

const BUILT_IN_FRAMEWORK_IDS = new Set([
  "design-nonlinear",
  "marketing-campaign",
  "business-project",
  "architecture-spatial",
  "media-production",
  "software-agile",
  "academic-research",
]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ProjectPhaseInput = {
  key: string;
  name: string;
  description: string;
  canOverlap: boolean;
  dependencyKeys: string[];
  reviewCheckpoint: boolean;
};

export type ProjectMemberInput = {
  profileId: string;
  skills: string[];
  availability: string;
  currentWorkload: "low" | "medium" | "high";
  preferences: string;
  weeklyCapacity?: number;
};

function normaliseText(value: string, label: string, maxLength: number) {
  const normalised = value.trim().replace(/\s+/g, " ");

  if (normalised.length > maxLength) {
    throw new ConvexError(`${label} must be ${maxLength} characters or fewer for optimal AI assistance.`);
  }

  return normalised;
}

export function validateProjectDetails(input: {
  title: string;
  description: string;
  startDate?: string;
  deadline: string;
}) {
  const title = normaliseText(input.title, "Project title", 100);
  const description = normaliseText(
    input.description,
    "Project brief",
    8000,
  );

  if (title.length < 2) {
    throw new ConvexError("Project title must contain at least 2 characters.");
  }

  if (description.length < 20) {
    throw new ConvexError(
      "Project brief must be at least 20 characters describing what you are making, who it is for, and what needs to be delivered.",
    );
  }

  const startDate = input.startDate ?? new Date().toISOString().slice(0, 10);

  if (!ISO_DATE_PATTERN.test(startDate) || !ISO_DATE_PATTERN.test(input.deadline)) {
    throw new ConvexError("Dates must be valid YYYY-MM-DD values.");
  }

  if (input.deadline < startDate) {
    throw new ConvexError("Project deadline cannot be before the start date.");
  }

  return { title, description, startDate, deadline: input.deadline };
}

export function validateTargetMemberCount(value?: number) {
  if (value === undefined) return undefined;

  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new ConvexError("Team size must be between 1 and 10 people.");
  }

  return value;
}

export function validateProjectPhases(phases: ProjectPhaseInput[]) {
  if (phases.length < 1 || phases.length > 20) {
    throw new ConvexError("Projects must contain between 1 and 20 phases.");
  }

  const phaseKeys = new Set<string>();

  const validated = phases.map((phase, index) => {
    if (!phase.key.trim()) {
      throw new ConvexError(`Phase ${index + 1} is missing a key.`);
    }

    if (phaseKeys.has(phase.key)) {
      throw new ConvexError(`Phase key "${phase.key}" is duplicated.`);
    }

    phaseKeys.add(phase.key);

    return {
      key: phase.key,
      name: normaliseText(phase.name, `Phase ${index + 1} name`, 80),
      description: normaliseText(
        phase.description,
        `Phase ${index + 1} description`,
        500,
      ),
      canOverlap: Boolean(phase.canOverlap),
      dependencyKeys: Array.from(new Set(phase.dependencyKeys)),
      reviewCheckpoint: Boolean(phase.reviewCheckpoint),
    };
  });

  validated.forEach((phase) => {
    phase.dependencyKeys.forEach((dependencyKey) => {
      if (!phaseKeys.has(dependencyKey)) {
        throw new ConvexError(
          `Phase "${phase.name}" depends on non-existent phase "${dependencyKey}".`,
        );
      }

      if (dependencyKey === phase.key) {
        throw new ConvexError(`Phase "${phase.name}" cannot depend on itself.`);
      }
    });
  });

  return validated;
}

export function validateFrameworkSelection(input: {
  frameworkType: "none" | "built_in" | "custom";
  frameworkName: string;
  builtInFrameworkId?: string;
  customFrameworkId?: string;
}) {
  const frameworkName = normaliseText(
    input.frameworkName,
    "Framework name",
    80,
  );

  if (input.frameworkType === "built_in") {
    if (
      !input.builtInFrameworkId ||
      !BUILT_IN_FRAMEWORK_IDS.has(input.builtInFrameworkId)
    ) {
      throw new ConvexError("Select a supported built-in framework template.");
    }
  }

  return {
    frameworkType: input.frameworkType,
    frameworkName,
    builtInFrameworkId: input.builtInFrameworkId,
    customFrameworkId: input.customFrameworkId,
  };
}

export function validateBuiltInFramework(
  builtInFrameworkId?: string,
  frameworkName?: string,
  phases?: ProjectPhaseInput[],
) {
  if (!builtInFrameworkId || !BUILT_IN_FRAMEWORK_IDS.has(builtInFrameworkId)) {
    throw new ConvexError("Select a supported built-in framework template.");
  }
  const validatedPhases = phases ? validateProjectPhases(phases) : [];
  return {
    frameworkName: frameworkName?.trim() || "Built-in Framework",
    phases: validatedPhases,
  };
}

export function validateMemberPlanning(member: ProjectMemberInput) {
  return {
    skills: member.skills ?? [],
    availability: member.availability?.trim() ?? "",
    currentWorkload: member.currentWorkload ?? "medium",
    preferences: member.preferences?.trim() ?? "",
    weeklyCapacity: member.weeklyCapacity,
  };
}
