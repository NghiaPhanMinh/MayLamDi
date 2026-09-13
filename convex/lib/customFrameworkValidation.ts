import { v } from "convex/values";

const BUILT_IN_FRAMEWORK_IDS = new Set([
  "software-web-app",
  "ui-ux-product-strategy",
  "game-dev-3d-art",
  "data-science-ai",
  "creative-animation-video",
  "architecture-interior",
  "event-exhibition-mgmt",
  "digital-marketing-growth",
  "ecommerce-storefront",
  "academic-research-thesis",
  "design-nonlinear",
  "marketing-campaign",
  "business-project",
  "architecture-spatial",
  "media-production",
  "software-agile",
  "academic-research",
]);
const PHASE_KEY_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/;
const MAX_PHASES = 20;
const MAX_LIST_ITEMS = 12;

export const customFrameworkPhaseValidator = v.object({
  key: v.string(),
  name: v.string(),
  description: v.string(),
  isOptional: v.boolean(),
  suggestedDeliverables: v.array(v.string()),
  suggestedSkills: v.array(v.string()),
  canOverlap: v.boolean(),
  defaultDependencyKeys: v.array(v.string()),
  reviewCheckpoint: v.boolean(),
});

export type CustomFrameworkPhaseInput = {
  key: string;
  name: string;
  description: string;
  isOptional: boolean;
  suggestedDeliverables: string[];
  suggestedSkills: string[];
  canOverlap: boolean;
  defaultDependencyKeys: string[];
  reviewCheckpoint: boolean;
};

function normalizeRequiredText(
  value: string,
  label: string,
  minimum: number,
  maximum: number,
) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length < minimum) {
    throw new Error(`${label} must contain at least ${minimum} characters.`);
  }

  if (normalized.length > maximum) {
    throw new Error(`${label} must contain no more than ${maximum} characters.`);
  }

  return normalized;
}

function normalizeList(values: string[], label: string) {
  const normalized = [
    ...new Set(
      values
        .map((value) => value.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];

  if (normalized.length > MAX_LIST_ITEMS) {
    throw new Error(`${label} may contain no more than ${MAX_LIST_ITEMS} items.`);
  }

  if (normalized.some((value) => value.length > 80)) {
    throw new Error(`${label} items must contain no more than 80 characters.`);
  }

  return normalized;
}

function assertAcyclicDependencies(phases: CustomFrameworkPhaseInput[]) {
  const dependencies = new Map(
    phases.map((phase) => [phase.key, phase.defaultDependencyKeys]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(phaseKey: string) {
    if (visiting.has(phaseKey)) {
      throw new Error("Framework phase dependencies cannot contain a cycle.");
    }

    if (visited.has(phaseKey)) {
      return;
    }

    visiting.add(phaseKey);
    for (const dependencyKey of dependencies.get(phaseKey) ?? []) {
      visit(dependencyKey);
    }
    visiting.delete(phaseKey);
    visited.add(phaseKey);
  }

  for (const phase of phases) {
    visit(phase.key);
  }
}

export function validateCustomFramework(input: {
  name: string;
  description: string;
  phases: CustomFrameworkPhaseInput[];
  sourceBuiltInId?: string;
}) {
  const name = normalizeRequiredText(input.name, "Framework name", 2, 80);
  const description = input.description.trim().replace(/\s+/g, " ");

  if (description.length > 500) {
    throw new Error(
      "Framework description must contain no more than 500 characters.",
    );
  }

  if (input.phases.length < 1 || input.phases.length > MAX_PHASES) {
    throw new Error(
      `A custom framework must contain between 1 and ${MAX_PHASES} phases.`,
    );
  }

  if (
    input.sourceBuiltInId !== undefined &&
    !BUILT_IN_FRAMEWORK_IDS.has(input.sourceBuiltInId)
  ) {
    throw new Error("The source built-in framework is not recognised.");
  }

  const phaseKeys = new Set<string>();
  const phases = input.phases.map((phase, index) => {
    if (!PHASE_KEY_PATTERN.test(phase.key)) {
      throw new Error(`Phase ${index + 1} has an invalid key.`);
    }

    if (phaseKeys.has(phase.key)) {
      throw new Error("Every framework phase must have a unique key.");
    }
    phaseKeys.add(phase.key);

    return {
      key: phase.key,
      name: normalizeRequiredText(phase.name, `Phase ${index + 1} name`, 1, 80),
      description: phase.description.trim().replace(/\s+/g, " "),
      isOptional: phase.isOptional,
      suggestedDeliverables: normalizeList(
        phase.suggestedDeliverables,
        `Phase ${index + 1} deliverables`,
      ),
      suggestedSkills: normalizeList(
        phase.suggestedSkills,
        `Phase ${index + 1} skills`,
      ),
      canOverlap: phase.canOverlap,
      defaultDependencyKeys: [...new Set(phase.defaultDependencyKeys)],
      reviewCheckpoint: phase.reviewCheckpoint,
    };
  });

  for (const [index, phase] of phases.entries()) {
    if (phase.description.length > 500) {
      throw new Error(
        `Phase ${index + 1} description must contain no more than 500 characters.`,
      );
    }

    for (const dependencyKey of phase.defaultDependencyKeys) {
      if (!phaseKeys.has(dependencyKey)) {
        throw new Error(
          `Phase ${index + 1} references a dependency that does not exist.`,
        );
      }

      if (dependencyKey === phase.key) {
        throw new Error("A framework phase cannot depend on itself.");
      }
    }
  }

  assertAcyclicDependencies(phases);

  return {
    name,
    description,
    phases,
    sourceBuiltInId: input.sourceBuiltInId,
  };
}
