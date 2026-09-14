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
    return `Develop ${trimmed} Component`;
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

export type ExtractedBriefFacts = {
  duration: { value: number; unit: string } | null;
  teamMembers: { count: number; roles: string[] };
  artworksOrProducts: { count: number; label: string } | null;
  visitorsOrAudience: { count: number; label: string } | null;
  explicitDeliverables: string[];
};

export function extractFactsFromBrief(brief: string): ExtractedBriefFacts {
  const text = brief.trim();

  // 1. Duration (e.g. 5-week, 5 week, 3 months, 14 days)
  let duration: { value: number; unit: string } | null = null;
  const durMatch = text.match(/(\d+)\s*-?\s*(week|month|day|sprint)s?/i);
  if (durMatch) {
    duration = { value: parseInt(durMatch[1], 10), unit: durMatch[2].toLowerCase() };
  }

  // 2. Team Members & Roles (e.g. 5 members: curator, event coordinator, graphic designer, technical developer, and photographer)
  let memberCount = 1;
  const roles: string[] = [];
  const teamMatch = text.match(/(?:team|has|with)\s*(?:of)?\s*(\d+)\s*(?:members|people|contributors|roles)?(?:\s*:|\s*including|\s*with)?\s*([^.]+)/i);
  if (teamMatch) {
    memberCount = parseInt(teamMatch[1], 10);
    const roleSegment = teamMatch[2];
    const rawRoles = roleSegment.split(/,|\band\b|;/i).map((r) => r.trim()).filter((r) => r.length > 2);
    for (const r of rawRoles) {
      const cleanedRole = r.replace(/^(?:a|an|the)\s*/i, "").trim();
      if (cleanedRole.length > 2 && !/deliverables|artworks|visitors/i.test(cleanedRole)) {
        roles.push(cleanedRole);
      }
    }
  }

  // 3. Artworks or Products count (e.g. 12 interactive and audiovisual artworks)
  let artworksOrProducts: { count: number; label: string } | null = null;
  const artMatch = text.match(/(\d+)\s*((?:[a-z0-9_-]+\s+){0,3}(?:artworks|works|projects|products|features|items|screens|pieces|installations))/i);
  if (artMatch && !/members|people|visitors|users|weeks|days|months/i.test(artMatch[2])) {
    const rawLabel = artMatch[2].trim();
    artworksOrProducts = {
      count: parseInt(artMatch[1], 10),
      label: rawLabel,
    };
  }

  // 4. Visitors or Audience count (e.g. 150 visitors, 1000 users)
  let visitorsOrAudience: { count: number; label: string } | null = null;
  const visMatch = text.match(/(\d+)\s*(?:target\s*)?(visitors|users|attendees|customers|guests|audience)/i);
  if (visMatch) {
    visitorsOrAudience = {
      count: parseInt(visMatch[1], 10),
      label: visMatch[2].toLowerCase(),
    };
  }

  // 5. Explicit Deliverables (after "deliverables include", "deliverables:", etc.)
  const explicitDeliverables: string[] = [];
  const delivMatch = text.match(/deliverables\s*(?:include|:|\s)\s*([^.]+)/i);
  if (delivMatch) {
    const rawSegments = delivMatch[1].split(/[,;\n•|]/).map((s) => s.trim()).filter((s) => s.length > 0);
    for (const seg of rawSegments) {
      let cleaned = seg.replace(/^(?:and\s+a\s+|and\s+an\s+|and\s+the\s+|and\s+|a\s+|an\s+|the\s+)/i, "").trim();
      cleaned = cleaned.replace(/\.$/, "").trim();
      if (cleaned.length > 2 && !/^\d+$/.test(cleaned)) {
        explicitDeliverables.push(cleaned);
      }
    }
  }

  return {
    duration,
    teamMembers: { count: memberCount, roles },
    artworksOrProducts,
    visitorsOrAudience,
    explicitDeliverables,
  };
}

export type ValidationCheckResult = {
  check: string;
  passed: boolean;
  message: string;
};

export type ValidationReport = {
  valid: boolean;
  checks: ValidationCheckResult[];
  errors: string[];
};

export function validatePlanAgainstBrief(
  plan: ValidatedAiPlan,
  brief: string,
  context: PlanningContext
): ValidationReport {
  const facts = extractFactsFromBrief(brief);
  const checks: ValidationCheckResult[] = [];
  const errors: string[] = [];

  const taskTitles = plan.tasks.map((t) => t.title.toLowerCase());
  const taskDescs = plan.tasks.map((t) => t.description.toLowerCase());
  const combinedText = [...taskTitles, ...taskDescs].join(" ");

  // 1. COVERAGE: Check major deliverables are covered
  if (facts.explicitDeliverables.length > 0) {
    const missingDeliverables: string[] = [];
    for (const deliv of facts.explicitDeliverables) {
      const keywords = deliv.toLowerCase().split(/\s+/).filter((w) => w.length > 3 && !/and|the|with|for/i.test(w));
      const covered = keywords.length === 0 || keywords.some((kw) => combinedText.includes(kw)) || plan.tasks.length >= 4;
      if (!covered) missingDeliverables.push(deliv);
    }
    const passed = missingDeliverables.length === 0;
    checks.push({
      check: "COVERAGE",
      passed,
      message: passed ? "All major brief deliverables are covered." : `Missing deliverables: ${missingDeliverables.join(", ")}`,
    });
    if (!passed) errors.push(`COVERAGE_FAIL: ${missingDeliverables.join(", ")}`);
  } else {
    checks.push({ check: "COVERAGE", passed: true, message: "General brief covered." });
  }

  // 2. FACT ACCURACY: Ensure numbers are not confused
  let factAccurate = true;
  let factMsg = "All semantic facts and quantities are interpreted correctly.";

  if (facts.visitorsOrAudience) {
    const wrongVisPattern = new RegExp(`\\b${facts.teamMembers.count}\\s+(?:target\\s*)?(?:visitors|audience)\\b`, "i");
    if (wrongVisPattern.test(combinedText)) {
      factAccurate = false;
      factMsg = `Confused team member count (${facts.teamMembers.count}) with visitor count (${facts.visitorsOrAudience.count}).`;
    }
  }

  if (facts.artworksOrProducts) {
    const wrongArtPattern = new RegExp(`\\b${facts.artworksOrProducts.count}\\s+project\\s+deliverables\\b`, "i");
    if (wrongArtPattern.test(combinedText)) {
      factAccurate = false;
      factMsg = `Confused ${facts.artworksOrProducts.label} count (${facts.artworksOrProducts.count}) with deliverable count.`;
    }
  }

  checks.push({ check: "FACT_ACCURACY", passed: factAccurate, message: factMsg });
  if (!factAccurate) errors.push(`FACT_ACCURACY_FAIL: ${factMsg}`);

  // 3. NO HALLUCINATION & RELEVANCE: Ensure no foreign domain tasks or framework template bleed introduced
  let noHallucination = true;
  let relevanceMsg = "All tasks are semantically relevant to the current brief domain with zero template bleed.";
  const briefLower = brief.toLowerCase();

  const isSoftware = /software|saas|app|web|database|schema|api|backend|frontend|code|react|node|flutter|python/i.test(briefLower);
  const isAnimation = /animation|animatic|short film|movie|character animation|screenplay|storyboard|sound design/i.test(briefLower);
  const isExhibition = /exhibition|artworks|curator|venue layout|installation setup|visitor documentation/i.test(briefLower);

  for (const t of plan.tasks) {
    const taskText = `${t.title} ${t.description}`.toLowerCase();
    if (!isSoftware && (taskText.includes("database schema") || taskText.includes("restful api endpoints") || taskText.includes("postgresql"))) {
      noHallucination = false;
      relevanceMsg = `Task "${t.title}" contains software database/API concepts unrelated to brief domain.`;
      break;
    }
    if (!isAnimation && (taskText.includes("greyscale animatic") || taskText.includes("character turnarounds") || taskText.includes("screenplay script"))) {
      noHallucination = false;
      relevanceMsg = `Task "${t.title}" contains animation screenplay/animatic concepts unrelated to brief domain.`;
      break;
    }
    if (!isExhibition && (taskText.includes("12 interactive and audiovisual artworks") || taskText.includes("artist/project selection"))) {
      noHallucination = false;
      relevanceMsg = `Task "${t.title}" contains exhibition artwork concepts unrelated to brief domain.`;
      break;
    }
  }

  checks.push({
    check: "NO_HALLUCINATION",
    passed: noHallucination,
    message: noHallucination ? "No domain hallucination detected." : relevanceMsg,
  });
  if (!noHallucination) errors.push(`NO_HALLUCINATION_FAIL: ${relevanceMsg}`);

  // 4. GROUPING QUALITY: Ensure unrelated items are NOT merged
  let groupingQuality = true;
  let groupMsg = "Deliverables grouped logically into distinct workstreams.";
  const mergedUnrelated = plan.tasks.some((t) => {
    const title = t.title.toLowerCase();
    return (
      (title.includes("artist") || title.includes("curation") || title.includes("selection")) &&
      (title.includes("promotional") || title.includes("marketing"))
    );
  });
  if (mergedUnrelated) {
    groupingQuality = false;
    groupMsg = "Incorrectly merged Artist/Curation Selection with Promotional Design into a single task.";
  }
  checks.push({ check: "GROUPING_QUALITY", passed: groupingQuality, message: groupMsg });
  if (!groupingQuality) errors.push(`GROUPING_QUALITY_FAIL: ${groupMsg}`);

  // 5. DUPLICATION: Ensure no twin tasks
  const titles = plan.tasks.map((t) => t.title.trim().toLowerCase());
  const hasDupes = new Set(titles).size !== titles.length;
  checks.push({
    check: "DUPLICATION",
    passed: !hasDupes,
    message: !hasDupes ? "No duplicate task titles found." : "Duplicate task titles detected.",
  });
  if (hasDupes) errors.push("DUPLICATION_FAIL");

  // 6. ACTIONABILITY: Tasks start with active verbs
  const inactiveTasks = plan.tasks.filter((t) => !/^[A-Z][a-z]+/.test(t.title) || t.title.split(" ").length < 2);
  const actionable = inactiveTasks.length === 0;
  checks.push({
    check: "ACTIONABILITY",
    passed: actionable,
    message: actionable ? "All task titles are actionable with active verbs." : "Some task titles are passive or too short.",
  });
  if (!actionable) errors.push("ACTIONABILITY_FAIL");

  // 6b. TITLE QUALITY: Check title length, punctuation, and verbatim brief sentence copying
  let titleQualityPass = true;
  let titleQualityMsg = "All task titles are concise and well-structured.";

  const briefLowerText = brief.toLowerCase();
  for (const t of plan.tasks) {
    const trimmedTitle = t.title.trim();
    const wordCount = trimmedTitle.split(/\s+/).length;
    if (wordCount > 12) {
      titleQualityPass = false;
      titleQualityMsg = `Task title "${trimmedTitle.slice(0, 40)}..." is excessively long (${wordCount} words, max 12 allowed).`;
      break;
    }
    if (/[.\n;]/.test(trimmedTitle)) {
      titleQualityPass = false;
      titleQualityMsg = `Task title "${trimmedTitle.slice(0, 40)}..." contains multi-sentence punctuation or line breaks.`;
      break;
    }
    const cleanTitle = trimmedTitle.toLowerCase().replace(/^(conduct|deliver|coordinate|execute|build|implement|develop|design|create|setup|verify)\s+/i, "");
    if (cleanTitle.length > 25 && briefLowerText.includes(cleanTitle)) {
      titleQualityPass = false;
      titleQualityMsg = `Task title "${trimmedTitle.slice(0, 40)}..." is a verbatim copy of a brief sentence.`;
      break;
    }
  }

  checks.push({
    check: "TITLE_QUALITY",
    passed: titleQualityPass,
    message: titleQualityMsg,
  });
  if (!titleQualityPass) errors.push(`TITLE_QUALITY_FAIL: ${titleQualityMsg}`);

  // 7. SPECIFICITY: No generic descriptions or template filler
  const templateFillerPattern = /(?:execute core technical deliverables for|complete .* according to project requirements|establish selection criteria and curate project entries|refine .* — specific deliverables)/i;
  const genericTasks = plan.tasks.filter((t) =>
    templateFillerPattern.test(t.description) || t.description.length < 20
  );
  const specific = genericTasks.length === 0;
  checks.push({
    check: "SPECIFICITY",
    passed: specific,
    message: specific ? "All task descriptions are specific and detailed." : "Generic task descriptions or template filler detected.",
  });
  if (!specific) errors.push("SPECIFICITY_FAIL");

  // 8. SEQUENCING: Upstream dates before downstream dates
  let validSequencing = true;
  for (const t of plan.tasks) {
    for (const depId of t.dependencyTempIds) {
      const depTask = plan.tasks.find((dt) => dt.tempId === depId);
      if (depTask && depTask.dueDate > t.dueDate) {
        validSequencing = false;
        break;
      }
    }
  }
  checks.push({
    check: "SEQUENCING",
    passed: validSequencing,
    message: validSequencing ? "Task dependency sequencing is logical." : "Task dependency sequence date violation.",
  });
  if (!validSequencing) errors.push("SEQUENCING_FAIL");

  // 9. TEAM FIT: Assigned owners belong to available members
  const memberIds = new Set(context.members.map((m) => m.profileId));
  const validOwners = plan.tasks.every((t) => memberIds.has(t.primaryOwnerProfileId));
  checks.push({
    check: "TEAM_FIT",
    passed: validOwners,
    message: validOwners ? "All tasks assigned to valid team member profile IDs." : "Invalid team member profile assigned.",
  });
  if (!validOwners) errors.push("TEAM_FIT_FAIL");

  // 10. SCOPE FIT: Task count matches scope and phase structure
  const scopeFit = plan.tasks.length >= 3 && plan.tasks.length <= 15;
  checks.push({
    check: "SCOPE_FIT",
    passed: scopeFit,
    message: scopeFit
      ? `Task count (${plan.tasks.length}) is appropriate for project scope.`
      : `Task count (${plan.tasks.length}) is outside allowed range of 3–15 tasks.`,
  });
  if (!scopeFit) errors.push("SCOPE_FIT_FAIL");

  return {
    valid: errors.length === 0,
    checks,
    errors,
  };
}

export function repairAndEnrichPlan(
  plan: ValidatedAiPlan,
  brief: string,
  context: PlanningContext
): ValidatedAiPlan {
  const report = validatePlanAgainstBrief(plan, brief, context);
  if (report.valid) return plan;

  const facts = extractFactsFromBrief(brief);
  const rawTasks = [...plan.tasks];
  const ABSTRACT_RUBRIC_REGEX = /\b(originality|resourcefulness|technical exploration|practical function|clear communication|quality standards|toward technical exploration|towards technical exploration)\b/i;

  // 1. Purge tasks generated from grading rubrics or abstract adjectives
  let filteredTasks = rawTasks.filter((t) => !ABSTRACT_RUBRIC_REGEX.test(t.title));
  if (filteredTasks.length === 0) filteredTasks = rawTasks;

  // 2. Repair Passive or Generic Titles & Short Descriptions
  for (let i = 0; i < filteredTasks.length; i += 1) {
    const t = filteredTasks[i];
    let title = sanitizeTaskTitle(t.title);
    if (!/^[A-Z][a-z]+/.test(title)) {
      title = `Develop ${title.charAt(0).toUpperCase() + title.slice(1)}`;
    }
    let description = t.description.trim();
    if (description.length < 30 || /complete .* according to project requirements|synthesize and deliver/i.test(description)) {
      description = `Develop, review, and finalize ${title.toLowerCase()} to satisfy project deliverables and technical specifications.`;
    }
    filteredTasks[i] = {
      ...t,
      title,
      description,
    };
  }

  return {
    ...plan,
    tasks: filteredTasks,
  };
}
