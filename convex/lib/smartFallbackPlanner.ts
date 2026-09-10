import type { ValidatedAiPlan } from "./aiPlanValidation";

type PlanningContext = {
  project: { projectId: string; title: string; startDate: string; deadline: string; frameworkName: string };
  phases: Array<{ phaseId: string; title: string }>;
  members: Array<{ profileId: string; displayName: string }>;
};

export type GeneratedAiPlan = ValidatedAiPlan & {
  generatedAt: number;
  source?: "ai" | "smart_template";
};

function formatIsoDate(daysFromNow: number): string {
  const target = new Date();
  target.setDate(target.getDate() + daysFromNow);
  return target.toISOString().slice(0, 10);
}

export function extractDeliverablesFromBrief(brief: string, projectTitle: string): Array<{
  title: string;
  desc: string;
  skills: string[];
  weight: number;
  diff: number;
  effort: number;
  offset: number;
}> {
  const text = `${projectTitle} ${brief}`.toLowerCase();
  const deliverables: Array<{
    title: string;
    desc: string;
    skills: string[];
    weight: number;
    diff: number;
    effort: number;
    offset: number;
  }> = [];

  // 1. Match Web / HTML / CSS / Deployment / Software Briefs FIRST
  if (/html|css|\bjs\b|javascript|typescript|web|website|github pages|netlify|vercel|hosting|deploy|page|url|zip|submission|asset/.test(text)) {
    deliverables.push(
      { title: "HTML/CSS Layout & Responsive Webpage Implementation", desc: "Build self-contained, responsive HTML/CSS frontend page based on chosen ideation.", skills: ["HTML", "CSS", "Frontend"], weight: 4, diff: 3, effort: 8, offset: 4 },
      { title: "JavaScript Interactive Functionality & Asset Assembly", desc: "Program client-side interactive logic, asset loading, and local script handlers.", skills: ["JavaScript", "Frontend"], weight: 4, diff: 3, effort: 8, offset: 8 },
      { title: "Live Hosting Deployment & Public URL Setup", desc: "Deploy webpage to live URL via GitHub Pages, Vercel, or Netlify and verify access.", skills: ["DevOps", "Web Hosting"], weight: 3, diff: 2, effort: 4, offset: 12 },
      { title: "Project Technical Note & Asset Archive Packaging", desc: "Write technical exploration note (idea, target audience, future improvements) and package zip asset submission.", skills: ["Technical Writing", "Documentation"], weight: 3, diff: 2, effort: 4, offset: 16 }
    );
  }

  // 2. Match Animation / Film / Narrative Briefs (using strict word boundaries)
  if (deliverables.length === 0 && /animation|animatic|\bscript\b|screenplay|narrative|shot list|storyboard|character design|\b2d\b|\b3d\b|greyscale|video|film|movie/.test(text)) {
    if (/\bscript\b|screenplay|narrative|story/.test(text)) {
      deliverables.push({
        title: "Script & Narrative Screenplay",
        desc: "Draft full screenplay, character dialogues, and narrative story structure for target audience.",
        skills: ["Screenwriting", "Storytelling"],
        weight: 3, diff: 3, effort: 6, offset: 3,
      });
    }
    if (/shot list|storyboard|framing|camera/.test(text)) {
      deliverables.push({
        title: "Shot List & Storyboard Framing",
        desc: "Detailed shot list breakdown, camera angles, timing, and key scene framing composition.",
        skills: ["Storyboarding", "Cinematography"],
        weight: 3, diff: 3, effort: 8, offset: 6,
      });
    }
    if (/design document|character|art direction|look dev|greyscale|background/.test(text)) {
      deliverables.push({
        title: "Design Document & Art Direction Specs",
        desc: "Character design sheets, background turnarounds, visual style guide, and look development.",
        skills: ["Concept Art", "Art Direction"],
        weight: 4, diff: 3, effort: 10, offset: 10,
      });
    }
    if (/animatic|greyscale|edit|timeline|45\+?|second/.test(text)) {
      deliverables.push({
        title: "Greyscale Animatic Render & Timeline Assembly",
        desc: "Timed 45+ second greyscale animatic sequence with scratch audio and pacing validation.",
        skills: ["Video Editing", "Animation"],
        weight: 5, diff: 4, effort: 12, offset: 15,
      });
    }
    if (/final|animated|presentation|artwork/.test(text) || deliverables.length < 4) {
      deliverables.push({
        title: "Final Artwork Render & Presentation Assembly",
        desc: "Export final high-res animation file, full documentation, and project presentation deck.",
        skills: ["Post-Production", "Presentation"],
        weight: 3, diff: 2, effort: 6, offset: 18,
      });
    }
  }

  // Match Web / Software Briefs
  if (deliverables.length === 0 && /web|frontend|backend|fullstack|react|vue|next|node|laravel|django|api|database|convex/.test(text)) {
    deliverables.push(
      { title: "System Architecture & Database Schema", desc: "Design data entities, Convex/SQL schema, and API specification.", skills: ["Backend", "Database"], weight: 4, diff: 3, effort: 8, offset: 4 },
      { title: "Figma Component Tokens & UI Layouts", desc: "Create responsive wireframes, design tokens, and interactive components.", skills: ["Figma", "UI/UX"], weight: 3, diff: 2, effort: 6, offset: 7 },
      { title: "Core Frontend Screen & State Implementation", desc: "Develop main user-facing views, forms, and client state handlers.", skills: ["React/TypeScript", "CSS"], weight: 5, diff: 4, effort: 12, offset: 12 },
      { title: "Backend API Endpoint & Mutation Services", desc: "Build realtime data mutations, authentication checks, and error boundaries.", skills: ["Node.js/Convex", "API"], weight: 4, diff: 3, effort: 10, offset: 15 },
      { title: "Vitest End-to-End Suite & Hosting Deployment", desc: "Run automated unit test coverage, set up SSL hosting, and verify production build.", skills: ["QA", "DevOps"], weight: 3, diff: 2, effort: 5, offset: 18 }
    );
  }

  // Match Mobile App Briefs
  if (deliverables.length === 0 && /mobile|app|flutter|react native|ios|android|swift|kotlin/.test(text)) {
    deliverables.push(
      { title: "User Journey & Mobile Navigation Stack", desc: "Outline screen hierarchy, user flows, and navigation stack.", skills: ["UI/UX", "Mobile"], weight: 3, diff: 2, offset: 4, effort: 6 },
      { title: "Core Mobile Views & State Management", desc: "Develop primary mobile app screens, form inputs, and local storage.", skills: ["React Native/Flutter"], weight: 5, diff: 4, offset: 10, effort: 12 },
      { title: "Server API Sync & Push Notification Integration", desc: "Connect REST/WebSocket endpoints and configure notification alerts.", skills: ["API Integration"], weight: 4, diff: 3, offset: 14, effort: 8 },
      { title: "Device Compatibility & Store Release Audit", desc: "Audit performance across iOS/Android test devices and prepare app bundle.", skills: ["QA", "App Store"], weight: 3, diff: 2, offset: 18, effort: 6 }
    );
  }

  // Match Game & 3D Briefs
  if (deliverables.length === 0 && /game|unity|unreal|godot|gamedev|2d|3d|physics|graphics/.test(text)) {
    deliverables.push(
      { title: "Game Design Document & Mechanics Spec", desc: "Define core loop, player controls, win/loss rules, and UI HUD layout.", skills: ["Game Design"], weight: 3, diff: 2, offset: 4, effort: 6 },
      { title: "3D Asset Modeling, Texturing & Rigging", desc: "Create 3D character/prop meshes, UV textures, and skeletal rigs.", skills: ["Blender/Maya", "3D Art"], weight: 4, diff: 3, offset: 9, effort: 10 },
      { title: "Level Environment & Lighting Assembly", desc: "Build scene geometry, collision bounds, dynamic lighting, and shaders.", skills: ["Level Design", "Unity/Unreal"], weight: 4, diff: 3, offset: 13, effort: 10 },
      { title: "Core Player Mechanics & Physics Scripts", desc: "Program movement controller, interaction scripts, and game state logic.", skills: ["C#/C++", "Gameplay Dev"], weight: 5, diff: 4, offset: 16, effort: 12 },
      { title: "Playtesting, Balance & Build Optimization", desc: "Run FPS stress tests, fix collision bugs, and build executable release.", skills: ["QA", "Optimization"], weight: 3, diff: 2, offset: 19, effort: 6 }
    );
  }

  // Match Research & Writing Briefs
  if (deliverables.length === 0 && /research|thesis|study|survey|paper|analysis|report|essay|literature/.test(text)) {
    deliverables.push(
      { title: "Literature Review & Thesis Hypothesis Outline", desc: "Gather academic sources, analyze prior work, and formulate core research questions.", skills: ["Research", "Academic Writing"], weight: 3, diff: 2, offset: 4, effort: 6 },
      { title: "Methodology & Data Collection Tooling", desc: "Design survey questionnaires, experiment metrics, and sampling strategy.", skills: ["Data Analysis", "Methodology"], weight: 4, diff: 3, offset: 9, effort: 8 },
      { title: "Primary Data Gathering & Statistical Analysis", desc: "Execute survey data collection, run statistical tests, and chart findings.", skills: ["Statistics", "Data Mining"], weight: 4, diff: 3, offset: 14, effort: 10 },
      { title: "Draft Report Writing & Peer Citation Audit", desc: "Compile full report chapters, verify APA/IEEE citations, and proofread.", skills: ["Technical Writing", "Editing"], weight: 3, diff: 2, offset: 18, effort: 6 }
    );
  }

  // Fallback for general briefs
  if (deliverables.length === 0) {
    const rawTitle = projectTitle.trim() || "Project";
    deliverables.push(
      { title: `${rawTitle} — Requirement Spec & Scope Outline`, desc: "Detailed breakdown of project scope, milestone goals, and team roles.", skills: ["Planning"], weight: 2, diff: 2, effort: 4, offset: 3 },
      { title: `${rawTitle} — Core Component 1 Deliverable`, desc: "Build and verify the first primary deliverable specified in the brief.", skills: ["Execution"], weight: 4, diff: 3, effort: 8, offset: 8 },
      { title: `${rawTitle} — Core Component 2 Deliverable`, desc: "Build and verify the second main deliverable specified in the brief.", skills: ["Execution"], weight: 4, diff: 3, effort: 8, offset: 13 },
      { title: `${rawTitle} — Quality Verification & Final Submission`, desc: "Perform final review, complete documentation, and submit finished project.", skills: ["QA", "Review"], weight: 3, diff: 2, effort: 5, offset: 17 }
    );
  }

  return deliverables;
}

export function generateSmartFallbackPlan(context: PlanningContext, brief: string): ValidatedAiPlan {
  const phases = context.phases.length > 0 ? context.phases : [{ phaseId: "phase_1", title: "Project Execution" }];
  const members = context.members.length > 0 ? context.members : [{ profileId: "member_1", displayName: "Team Member" }];

  const rawTasks = extractDeliverablesFromBrief(brief, context.project.title);

  const milestones = phases.slice(0, Math.min(3, phases.length)).map((phase, index) => ({
    tempId: `milestone_${index + 1}`,
    title: `Milestone ${index + 1}: ${phase.title}`,
    description: `Completion check for ${phase.title} deliverables.`,
    phaseId: phase.phaseId,
    dueDate: formatIsoDate((index + 1) * 6),
  }));

  const tasks = rawTasks.map((task, index) => {
    const assignedPhase = phases[index % phases.length];
    const assignedOwner = members[index % members.length];
    const assignedReviewer = members.length > 1 ? members[(index + 1) % members.length] : null;

    return {
      tempId: `task_${index + 1}`,
      title: task.title,
      description: task.desc,
      phaseId: assignedPhase.phaseId,
      milestoneTempId: milestones[index % milestones.length]?.tempId ?? null,
      primaryOwnerProfileId: assignedOwner.profileId,
      collaboratorProfileIds: [],
      requiredSkills: task.skills,
      estimatedEffortHours: task.effort,
      difficulty: task.diff,
      weight: task.weight,
      required: true,
      startDate: context.project.startDate || formatIsoDate(0),
      dueDate: formatIsoDate(task.offset),
      dependencyTempIds: index > 0 ? [`task_${index}`] : [],
      requiresReview: true,
      reviewerProfileId: assignedReviewer ? assignedReviewer.profileId : null,
      allocationExplanation: `Assigned to ${assignedOwner.displayName} based on domain workload balance.`,
      longTaskBreakdown: task.effort > 10 ? "Break down into sub-tasks for daily progress checks." : "",
    };
  });

  return {
    recommendedFramework: `${context.project.frameworkName || "Agile Sprint"} (Smart Template)`,
    frameworkReason: "Instant structured plan generated via Smart Deliverable Extraction Engine for immediate execution.",
    milestones,
    tasks,
    risks: [
      "Scope creep: Additional requirements identified during execution phase.",
      "Timeline compression: Ensure tasks are claimed and started on time to prevent HP penalties.",
    ],
    assumptions: [
      "Team members have access to required development tools and environments.",
      "Phase review checkpoints will be verified before final submission.",
    ],
  };
}
