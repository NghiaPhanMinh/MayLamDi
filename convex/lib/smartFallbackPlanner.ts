import type { ValidatedAiPlan } from "./aiPlanValidation";
import { extractFactsFromBrief } from "./aiPlanValidation";

type PlanningContext = {
  project: { projectId: string; title: string; startDate: string; deadline: string; frameworkName: string };
  phases: Array<{ phaseId: string; title: string; description?: string }>;
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

function parseDateOrFallback(isoStr: string | undefined, defaultDate: Date): Date {
  if (!isoStr) return defaultDate;
  const parsed = new Date(isoStr);
  return isNaN(parsed.getTime()) ? defaultDate : parsed;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function interpolateDate(startDate: Date, endDate: Date, progress: number): string {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const targetMs = startMs + Math.max(0, Math.min(1, progress)) * (endMs - startMs);
  return formatDate(new Date(targetMs));
}

function getDomainTaskTemplates(brief: string, phaseTitle: string, phaseIndex: number, totalPhases: number) {
  const text = brief.toLowerCase();
  const phaseLower = phaseTitle.toLowerCase();

  // Position ratios
  const isFirst = phaseIndex === 0;
  const isLast = phaseIndex === totalPhases - 1;
  const isSecond = phaseIndex === 1 && totalPhases >= 4;
  const isThird = phaseIndex === 2 && totalPhases >= 5;

  // Domain detection
  const isGame = /game|narrative|player|playable|adventure|puzzle/i.test(text);
  const isInstallation = /installation|projection mapping|pressure pad|touchdesigner/i.test(text) && !/exhibition/i.test(text);
  const isExhibition = /exhibition|curat|artworks|catalogue|placard|museum|heritage/i.test(text);
  const isMisinfoOrEdu = /misinformation|fake news|quiz curriculum|lesson plan|fact-checking/i.test(text);
  const isMarketing = /retail packaging|die-cut|tea brand|beverage|pop-up tasting|press kit|marketing campaign/i.test(text);
  const isMobileOrApp = /figma|wcag|wireframe|usability|mobile|app|ui\/ux|design system|user flow|support-finding/i.test(text);
  const isWebOrSoftware = /software|saas|web|database|frontend|backend|api|react/i.test(text);

  if (isGame) {
    if (isFirst) {
      return {
        title: "Draft Narrative Screenplay & Character Arcs",
        desc: "Outline multi-branching story arcs, student dialogue choice trees, and campus exploration interaction triggers.",
        skills: ["Narrative Design", "Screenwriting"],
        effort: 14,
        difficulty: 3,
      };
    }
    if (isSecond) {
      return {
        title: "Create 2D Visual Style & Environmental Art Assets",
        desc: "Illustrate hand-drawn 2D campus scenery layers, sprite animation frames, and user interface dialogue palettes.",
        skills: ["2D Illustration", "Concept Art"],
        effort: 20,
        difficulty: 4,
      };
    }
    if (isThird || (phaseIndex === 1 && totalPhases < 4)) {
      return {
        title: "Implement Core Gameplay Mechanics & Controls",
        desc: "Program player navigation physics, keyboard controls, and interactive object state handlers.",
        skills: ["Game Development", "Logic Scripting"],
        effort: 24,
        difficulty: 4,
      };
    }
    if (!isLast) {
      return {
        title: "Integrate Game Audio-Visual Assets & Playable Scenes",
        desc: "Assemble hand-drawn sprites, nocturnal ambient soundscapes, and scene transition logic into playable build.",
        skills: ["Game Engine", "Asset Integration"],
        effort: 22,
        difficulty: 4,
      };
    }
    return {
      title: "Conduct Playtesting Sessions & Evaluation Report",
      desc: "Run structured user playtesting rounds with university students, analyze narrative feedback, and document build adjustments.",
      skills: ["Playtesting", "QA Evaluation"],
      effort: 12,
      difficulty: 2,
    };
  }

  if (isInstallation) {
    if (isFirst) {
      return {
        title: "Draft Spatial Hardware Layout Blueprint",
        desc: "Map projector throw distances, camera motion sensor fields of view, and floor pressure pad zones for gallery integration.",
        skills: ["Spatial Design", "Hardware Planning"],
        effort: 14,
        difficulty: 3,
      };
    }
    if (isSecond) {
      return {
        title: "Design Generative Audio-Visual Interaction Spec",
        desc: "Specify real-time generative particle reactions to motion tracking inputs and multi-channel spatial sound parameters.",
        skills: ["Interaction Design", "Creative Audio"],
        effort: 16,
        difficulty: 3,
      };
    }
    if (isThird || (phaseIndex === 1 && totalPhases < 4)) {
      return {
        title: "Engineer Real-Time Motion Tracking & Sensor Interface",
        desc: "Program optical camera tracking scripts and pressure sensor communication drivers in TouchDesigner.",
        skills: ["Creative Coding", "Sensor Integration"],
        effort: 22,
        difficulty: 5,
      };
    }
    if (!isLast) {
      return {
        title: "Assemble Physical Installation Rig & Projection Mapping",
        desc: "Mount hardware projection brackets in gallery space, calibrate multi-surface mapping, and balance acoustics.",
        skills: ["Hardware Rigging", "Projection Mapping"],
        effort: 24,
        difficulty: 4,
      };
    }
    return {
      title: "Produce Visitor Interaction Guide & Video Documentation",
      desc: "Design gallery interaction signage explaining gesture controls and record multi-angle video documentation of live user engagement.",
      skills: ["Technical Writing", "Video Production"],
      effort: 12,
      difficulty: 2,
    };
  }

  if (isExhibition) {
    if (isFirst) {
      return {
        title: "Curate Theme & Catalogue Content for Artworks",
        desc: "Synthesize artist statements, write interpretive curatorial essays, and compile editorial material for the exhibition catalogue.",
        skills: ["Curatorial Writing", "Art History"],
        effort: 14,
        difficulty: 3,
      };
    }
    if (isSecond) {
      return {
        title: "Research Historical Context & Exhibit Narrative Structure",
        desc: "Examine archival records, verify historical artifacts, and structure chronological visitor narrative stations.",
        skills: ["Historical Research", "Archival Analysis"],
        effort: 16,
        difficulty: 3,
      };
    }
    if (isThird || (phaseIndex === 1 && totalPhases < 4)) {
      return {
        title: "Draft Spatial Floorplan & Interactive Visitor Stations",
        desc: "Map visitor circulation flow, artwork mount positions, interactive station layouts, and lighting specs in gallery space.",
        skills: ["Spatial Design", "Exhibition Layout"],
        effort: 18,
        difficulty: 3,
      };
    }
    if (!isLast) {
      return {
        title: "Assemble Physical Artwork Mounts & AV Display Rig",
        desc: "Construct display plinths, mount audiovisual screens, configure audio headsets, and test visitor station wiring.",
        skills: ["Fabrication", "AV Technical Setup"],
        effort: 20,
        difficulty: 4,
      };
    }
    return {
      title: "Coordinate Opening Logistics & Attendance Evaluation Report",
      desc: "Collate visitor survey responses, manage opening reception crowd flow, and synthesize final exhibition documentation.",
      skills: ["Event Logistics", "Documentation"],
      effort: 12,
      difficulty: 2,
    };
  }

  if (isMarketing) {
    if (isFirst) {
      return {
        title: "Formulate Brand Identity & Packaging Guidelines",
        desc: "Establish brand color palettes, typographic hierarchies, and print die-cut templates for product packaging.",
        skills: ["Branding", "Packaging Design"],
        effort: 14,
        difficulty: 3,
      };
    }
    if (isSecond) {
      return {
        title: "Design Pop-Up Activation Layout & PR Press Kit",
        desc: "Draft spatial booth layouts for city center pop-up tasting events and assemble curated influencer media kits.",
        skills: ["Spatial Planning", "PR Strategy"],
        effort: 16,
        difficulty: 3,
      };
    }
    if (isThird || (phaseIndex === 1 && totalPhases < 4)) {
      return {
        title: "Produce Promotional Assets & Social Media Schedule",
        desc: "Create social media motion teasers, print marketing collateral, and schedule digital storytelling release sequences.",
        skills: ["Content Creation", "Social Media"],
        effort: 18,
        difficulty: 3,
      };
    }
    if (!isLast) {
      return {
        title: "Coordinate Retail Display Fabrication & Event Logistics",
        desc: "Oversee print packaging production runs, arrange pop-up equipment delivery, and brief on-site event staff.",
        skills: ["Production Ops", "Event Coordination"],
        effort: 18,
        difficulty: 3,
      };
    }
    return {
      title: "Execute Event Activation & Synthesize ROI Analytics",
      desc: "Coordinate on-site pop-up launch operations, measure audience engagement conversions, and produce post-campaign ROI deck.",
      skills: ["Operations", "Analytics"],
      effort: 12,
      difficulty: 2,
    };
  }

  if (isMisinfoOrEdu) {
    if (isFirst) {
      return {
        title: "Research Fact-Checking Scenarios & Quiz Curriculum",
        desc: "Curate real-world media literacy case studies, fact-checking workflows, and interactive question scenarios.",
        skills: ["Curriculum Design", "Content Research"],
        effort: 14,
        difficulty: 2,
      };
    }
    if (isSecond) {
      return {
        title: "Design Interactive Feed Interface & Wireframes",
        desc: "Create responsive UI mockups simulating social media news feeds, interactive quiz widgets, and leaderboard components.",
        skills: ["UI/UX Design", "Wireframing"],
        effort: 16,
        difficulty: 3,
      };
    }
    if (isThird || (phaseIndex === 1 && totalPhases < 4)) {
      return {
        title: "Build Responsive Web Application & Quiz Engine",
        desc: "Develop interactive news feed components, stateful quiz verification logic, and scoring analytics algorithms.",
        skills: ["Frontend Development", "TypeScript"],
        effort: 24,
        difficulty: 4,
      };
    }
    if (!isLast) {
      return {
        title: "Integrate Educational Content & Leaderboard Systems",
        desc: "Connect quiz database schema, leaderboard ranking endpoints, and fact-checking tool guide pages.",
        skills: ["Fullstack Dev", "Database"],
        effort: 20,
        difficulty: 4,
      };
    }
    return {
      title: "Execute Accessibility Audit & Educator Lesson Plan",
      desc: "Validate WCAG 2.1 AA accessibility standards, conduct student usability tests, and format educator teaching guide PDF.",
      skills: ["Accessibility", "Technical Writing"],
      effort: 12,
      difficulty: 2,
    };
  }

  if (isMobileOrApp) {
    if (isFirst) {
      return {
        title: "Conduct User Research & Journey Mapping",
        desc: "Synthesize user research findings, map primary user journeys, and document baseline accessibility and contrast criteria.",
        skills: ["User Research", "Journey Mapping"],
        effort: 14,
        difficulty: 2,
      };
    }
    if (isSecond) {
      return {
        title: "Draft Low-Fidelity Wireframes & Flow Architecture",
        desc: "Create preliminary wireframe screen flows, validate information architecture, and review navigation steps against WCAG AA standards.",
        skills: ["Wireframing", "Figma", "Information Architecture"],
        effort: 16,
        difficulty: 3,
      };
    }
    if (isThird || (phaseIndex === 1 && totalPhases < 4)) {
      return {
        title: "Design Figma UI Design System & Component Library",
        desc: "Build scalable Figma UI components, color typography tokens, and interactive screen states meeting WCAG contrast guidelines.",
        skills: ["Figma", "UI/UX Design", "Design Systems"],
        effort: 22,
        difficulty: 4,
      };
    }
    if (!isLast) {
      return {
        title: "Build Clickable Prototype & Main Flow Interactions",
        desc: "Connect user interaction transitions, assemble end-to-end clickable prototype flows, and prepare user task scenarios in Figma.",
        skills: ["Prototyping", "Interaction Design"],
        effort: 20,
        difficulty: 3,
      };
    }
    return {
      title: "Conduct Usability Testing Sessions & Final Presentation",
      desc: "Run structured usability testing with participants, measure completion without guidance, and compile final evidence presentation deck.",
      skills: ["Usability Testing", "Evaluation", "Presentation"],
      effort: 12,
      difficulty: 2,
    };
  }

  if (isWebOrSoftware) {
    if (isFirst) {
      return {
        title: "Establish Software Architecture & API Specification",
        desc: "Define database schemas, API contracts, backend service boundaries, and frontend component architectural requirements.",
        skills: ["System Architecture", "API Design"],
        effort: 14,
        difficulty: 3,
      };
    }
    if (isSecond) {
      return {
        title: "Implement Core Backend Services & Data Models",
        desc: "Build database models, secure endpoint handlers, user authentication middleware, and data validation routines.",
        skills: ["Backend Development", "Database"],
        effort: 18,
        difficulty: 4,
      };
    }
    if (isThird || (phaseIndex === 1 && totalPhases < 4)) {
      return {
        title: "Develop Responsive Frontend Views & State Logic",
        desc: "Build user interface views, client state synchronization handlers, and integrate client-side API communications.",
        skills: ["Frontend Development", "TypeScript"],
        effort: 24,
        difficulty: 4,
      };
    }
    if (!isLast) {
      return {
        title: "Integrate End-to-End Workflows & CI/CD Pipelines",
        desc: "Configure automated build pipelines, run integration tests, and connect third-party service dependencies.",
        skills: ["DevOps", "Integration Testing"],
        effort: 18,
        difficulty: 3,
      };
    }
    return {
      title: "Perform Quality Verification & Prepare Release Package",
      desc: "Execute end-to-end device testing, verify notification edge cases, and compile production app store release archives.",
      skills: ["QA Testing", "DevOps"],
      effort: 12,
      difficulty: 3,
    };
  }

  // General custom framework phase fallback with unique titles
  const cleanPhaseName = phaseTitle.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, " ").trim().replace(/\s+/g, " ");
  const shortName = cleanPhaseName.split(" ").slice(0, 3).join(" ");

  if (isFirst) {
    return {
      title: `Establish Requirements & Scope for ${shortName}`,
      desc: `Review initial project objectives, interview core stakeholders, and synthesize baseline deliverables for ${phaseTitle}.`,
      skills: ["Planning", "Requirements Analysis"],
      effort: 12,
      difficulty: 2,
    };
  }
  if (isSecond) {
    return {
      title: `Design Architecture Specification for ${shortName}`,
      desc: `Formulate detailed architectural blueprints, component specifications, and workflow models for ${phaseTitle}.`,
      skills: ["System Design", "Architecture"],
      effort: 16,
      difficulty: 3,
    };
  }
  if (isThird || (phaseIndex === 1 && totalPhases < 4)) {
    return {
      title: `Construct Core Deliverables for ${shortName}`,
      desc: `Execute primary production work, implement required components, and integrate assets aligned with ${phaseTitle}.`,
      skills: ["Production", "Technical Execution"],
      effort: 20,
      difficulty: 4,
    };
  }
  if (!isLast) {
    return {
      title: `Integrate System Components for ${shortName}`,
      desc: `Assemble subsystem components, perform integration testing, and align deliverables with ${phaseTitle}.`,
      skills: ["Integration", "Execution"],
      effort: 18,
      difficulty: 3,
    };
  }
  return {
    title: `Execute Quality Verification for ${shortName}`,
    desc: `Conduct comprehensive verification audits, user acceptance reviews, and assemble deployment handover package for ${phaseTitle}.`,
    skills: ["Quality Assurance", "Release Management"],
    effort: 12,
    difficulty: 3,
  };
}

export function generateSmartFallbackPlan(
  context: PlanningContext,
  brief: string,
  generationId?: string,
  fallbackReason: string = "FALLBACK_TRIGGERED"
): ValidatedAiPlan {
  const frameworkName = context.project.frameworkName || "Agile Framework";

  const defaultPhases = [
    { phaseId: "phase_discovery", title: "Discovery & Requirements" },
    { phaseId: "phase_definition", title: "Architecture & Definition" },
    { phaseId: "phase_execution", title: "Design & Construction" },
    { phaseId: "phase_verification", title: "Testing & Quality Verification" },
    { phaseId: "phase_delivery", title: "Deployment & Documentation" },
  ];

  const phases = context.phases && context.phases.length > 0
    ? context.phases
    : defaultPhases;

  const members = context.members && context.members.length > 0
    ? context.members
    : [{ profileId: "member_1", displayName: "Team Lead", skills: ["Management", "Coordination"] }];

  const now = new Date();
  const defaultStart = formatIsoDate(0);
  const defaultEnd = formatIsoDate(30);

  const startDateStr = context.project.startDate || defaultStart;
  const deadlineStr = context.project.deadline || defaultEnd;

  const projectStartDate = parseDateOrFallback(startDateStr, now);
  const projectDeadlineDate = parseDateOrFallback(deadlineStr, new Date(now.getTime() + 30 * 86400000));

  const seed = generationId
    ? Array.from(generationId).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : 101;

  // Build milestones (1 per phase, up to 6)
  const milestoneCount = Math.min(6, phases.length);
  const milestones = phases.slice(0, milestoneCount).map((phase, idx) => {
    const progress = (idx + 1) / milestoneCount;
    return {
      tempId: `milestone_${idx + 1}`,
      title: `Milestone ${idx + 1}: ${phase.title.slice(0, 45)}`,
      description: `Target completion and deliverable review checkpoint for ${phase.title}.`,
      phaseId: phase.phaseId,
      dueDate: interpolateDate(projectStartDate, projectDeadlineDate, progress),
    };
  });

  // Generate tasks across phases (target: 4 to 8 tasks)
  type TaskDraftItem = {
    title: string;
    description: string;
    skills: string[];
    effort: number;
    difficulty: number;
    phaseId: string;
    milestoneTempId: string | null;
  };

  const rawTaskItems: TaskDraftItem[] = [];

  phases.forEach((phase, phaseIndex) => {
    const tpl = getDomainTaskTemplates(brief, phase.title, phaseIndex, phases.length);
    const assignedMilestone = milestones.find((m) => m.phaseId === phase.phaseId) || milestones[Math.min(phaseIndex, milestones.length - 1)];

    // Clean title: ensure concise <= 12 words and starts with capital active verb
    const words = tpl.title.trim().split(/\s+/);
    const cleanTitle = words.slice(0, 12).join(" ");

    rawTaskItems.push({
      title: cleanTitle,
      description: tpl.desc,
      skills: tpl.skills,
      effort: tpl.effort,
      difficulty: tpl.difficulty,
      phaseId: phase.phaseId,
      milestoneTempId: assignedMilestone?.tempId ?? null,
    });
  });

  // If we have fewer than 3 tasks, pad with domain-specific tasks
  if (rawTaskItems.length < 3) {
    const lastPhase = phases[phases.length - 1];
    rawTaskItems.push({
      title: "Conduct Final Quality Review & Project Handover",
      description: "Perform comprehensive testing, assemble final documentation, and obtain project sign-off.",
      skills: ["Quality Review", "Delivery"],
      effort: 10,
      difficulty: 2,
      phaseId: lastPhase.phaseId,
      milestoneTempId: milestones[milestones.length - 1]?.tempId ?? null,
    });
  }

  // Deduplicate task titles if any
  const seenTitles = new Set<string>();
  const uniqueTaskItems: TaskDraftItem[] = [];
  for (const item of rawTaskItems) {
    if (!seenTitles.has(item.title.toLowerCase())) {
      seenTitles.add(item.title.toLowerCase());
      uniqueTaskItems.push(item);
    }
  }

  const totalTasks = uniqueTaskItems.length;

  const tasks = uniqueTaskItems.map((item, index) => {
    const ownerIndex = (index + seed) % members.length;
    const assignedOwner = members[ownerIndex];
    const reviewerIndex = members.length > 1 ? (ownerIndex + 1) % members.length : -1;
    const assignedReviewer = reviewerIndex >= 0 ? members[reviewerIndex] : null;

    const startProgress = index / totalTasks;
    const dueProgress = (index + 1) / totalTasks;

    const taskStartDate = interpolateDate(projectStartDate, projectDeadlineDate, startProgress);
    const taskDueDate = interpolateDate(projectStartDate, projectDeadlineDate, dueProgress);

    const tempId = `fallback_task_${index + 1}_${seed}`;
    const dependencyTempIds = index > 0 ? [`fallback_task_${index}_${seed}`] : [];

    return {
      tempId,
      title: item.title,
      description: item.description,
      phaseId: item.phaseId,
      milestoneTempId: item.milestoneTempId,
      primaryOwnerProfileId: assignedOwner.profileId,
      collaboratorProfileIds: [],
      requiredSkills: item.skills,
      estimatedEffortHours: item.effort,
      difficulty: item.difficulty,
      weight: Math.min(10, Math.max(2, Math.round(item.effort / 3))),
      required: true,
      startDate: taskStartDate,
      dueDate: taskDueDate,
      dependencyTempIds,
      requiresReview: true,
      reviewerProfileId: assignedReviewer ? assignedReviewer.profileId : null,
      allocationExplanation: `Assigned to ${assignedOwner.displayName} based on domain responsibilities and phase alignment.`,
      longTaskBreakdown: "",
    };
  });

  return {
    recommendedFramework: `${frameworkName} (Smart Fallback Mode)`,
    frameworkReason: `Framework-aligned execution plan generated via Smart Fallback Planner (Reason: ${fallbackReason}).`,
    milestones,
    tasks,
    risks: [
      "Scope alignment: Ensure task breakdown is reviewed during the first phase checkpoint.",
      "Timeline tracking: Monitor deliverable completion across phase milestones.",
    ],
    assumptions: [
      "Team members have access to necessary development tools and assets.",
      "Phase review milestones will be verified collaboratively before final handover.",
    ],
  };
}

