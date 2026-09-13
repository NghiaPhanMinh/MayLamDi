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
  const userBriefText = brief.trim();
  const text = (userBriefText.length > 0 ? userBriefText : projectTitle).toLowerCase();
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
  if (/html|css|\bjs\b|javascript|typescript|github pages|netlify|vercel|web hosting|webpage|landing page|public url|zip submission/.test(text)) {
    deliverables.push(
      { title: "Ideation Selection & Project Scope Framing", desc: "Select project ideation, define target audience, and map out technical requirements.", skills: ["Research", "UI/UX"], weight: 3, diff: 2, effort: 4, offset: 3 },
      { title: "HTML/CSS Layout & Responsive Webpage Implementation", desc: "Build self-contained, responsive HTML/CSS frontend page based on chosen ideation.", skills: ["HTML", "CSS", "Frontend"], weight: 4, diff: 3, effort: 8, offset: 7 },
      { title: "JavaScript Interactive Functionality & Asset Assembly", desc: "Program client-side interactive logic, asset loading, and local script handlers.", skills: ["JavaScript", "Frontend"], weight: 4, diff: 3, effort: 8, offset: 11 },
      { title: "Live Hosting Deployment & Public URL Setup", desc: "Deploy webpage to live URL via GitHub Pages, Vercel, or Netlify and verify access.", skills: ["DevOps", "Web Hosting"], weight: 3, diff: 2, effort: 4, offset: 15 },
      { title: "Project Technical Note & Asset Archive Packaging", desc: "Write technical exploration note (idea, target audience, future improvements) and package zip asset submission.", skills: ["Technical Writing", "Documentation"], weight: 3, diff: 2, effort: 4, offset: 18 }
    );
  }

  // 2. Match Animation / Film / Narrative Briefs (using strict word boundaries)
  if (deliverables.length === 0 && /animation|animatic|\bscript\b|screenplay|narrative|shot list|storyboard|character design|greyscale|video|film|movie|3d animation|2d animation/.test(text)) {
    deliverables.push(
      {
        title: "Script & Narrative Screenplay",
        desc: "Draft full screenplay, character dialogues, and narrative story structure for target audience.",
        skills: ["Screenwriting", "Storytelling"],
        weight: 3, diff: 3, effort: 6, offset: 3,
      },
      {
        title: "Shot List & Storyboard Framing Composition",
        desc: "Detailed shot list breakdown, camera angles, timing, and key scene framing composition.",
        skills: ["Storyboarding", "Cinematography"],
        weight: 3, diff: 3, effort: 8, offset: 6,
      },
      {
        title: "Design Document & Art Direction Specs",
        desc: "Character design sheets, background turnarounds, visual style guide, and look development.",
        skills: ["Concept Art", "Art Direction"],
        weight: 4, diff: 3, effort: 10, offset: 10,
      },
      {
        title: "Greyscale Animatic Render & Timeline Assembly",
        desc: "Timed 45+ second greyscale animatic sequence with scratch audio and pacing validation.",
        skills: ["Video Editing", "Animation"],
        weight: 5, diff: 4, effort: 12, offset: 15,
      },
      {
        title: "Final Artwork Render & Presentation Assembly",
        desc: "Export final high-res animation file, full documentation, and project presentation deck.",
        skills: ["Post-Production", "Presentation"],
        weight: 3, diff: 2, effort: 6, offset: 18,
      }
    );
  }

  // 3. Match Marketing & Campaign Briefs
  if (deliverables.length === 0 && /campaign|marketing|brand|advertising|\bpr\b|social media|promotional|launch strategy/.test(text)) {
    deliverables.push(
      { title: "Audience Persona & Competitor Benchmark Matrix", desc: "Research target demographic, analyze competitor positioning, and define audience personas.", skills: ["Market Research", "Audience Insights"], weight: 3, diff: 2, effort: 6, offset: 4 },
      { title: "Campaign Strategy & Value Proposition Statement", desc: "Formulate central campaign theme, key message framework, and communication channels.", skills: ["Campaign Strategy", "Copywriting"], weight: 4, diff: 3, effort: 8, offset: 8 },
      { title: "Creative Visual Asset & Copy Deck Production", desc: "Design social media banners, promotional video cut-downs, and ad copy deck.", skills: ["Graphic Design", "Content Creation"], weight: 4, diff: 3, effort: 10, offset: 13 },
      { title: "Multi-Channel Launch Execution & Content Scheduling", desc: "Deploy media placements, schedule social posts, and launch promotional outreach.", skills: ["Media Planning", "Marketing Operations"], weight: 4, diff: 3, effort: 8, offset: 16 },
      { title: "Campaign Analytics Audit & Performance Report", desc: "Measure engagement metrics, conversion ROI, and optimize post-launch performance.", skills: ["Analytics", "Reporting"], weight: 3, diff: 2, effort: 5, offset: 19 }
    );
  }

  // 4. Match Business & Strategy Briefs
  if (deliverables.length === 0 && /business|startup|opportunity|market|business model|finance|pitch|revenue|investor|operating/.test(text)) {
    deliverables.push(
      { title: "Market Problem & Value Opportunity Definition", desc: "Analyze market gap, stakeholder needs, and define the core problem statement.", skills: ["Business Analysis", "Problem Framing"], weight: 3, diff: 2, effort: 6, offset: 4 },
      { title: "Customer Validation & Competitor Landscape Matrix", desc: "Conduct target customer interviews, review competitors, and map market fit.", skills: ["Market Research", "Customer Insights"], weight: 4, diff: 3, effort: 8, offset: 8 },
      { title: "Business Model Canvas & Value Unit Economics", desc: "Formulate revenue streams, cost structure, key partners, and pricing strategy.", skills: ["Financial Modeling", "Strategy"], weight: 4, diff: 3, effort: 10, offset: 13 },
      { title: "Operational Execution Roadmap & Risk Register", desc: "Build milestone implementation timeline, key metrics, and mitigation plans.", skills: ["Operations", "Risk Management"], weight: 4, diff: 3, effort: 8, offset: 16 },
      { title: "Executive Pitch Deck & Investor Presentation", desc: "Synthesize executive summary deck, financial forecast slides, and present proposal.", skills: ["Pitching", "Executive Communication"], weight: 3, diff: 2, effort: 6, offset: 19 }
    );
  }

  // 5. Match Architecture & Spatial Design Briefs
  if (deliverables.length === 0 && /architecture|spatial|building|site|floorplan|blueprint|landscape|interior|zoning/.test(text)) {
    deliverables.push(
      { title: "Site Context & Topographical Analysis Report", desc: "Document site contours, environmental orientation, regulatory constraints, and circulation.", skills: ["Site Analysis", "Mapping"], weight: 3, diff: 2, effort: 6, offset: 4 },
      { title: "Spatial Programme & Adjacency Diagram Spec", desc: "Define space requirements, user flow adjacencies, and volumetric zoning.", skills: ["Spatial Design", "Architectural Programming"], weight: 4, diff: 3, effort: 8, offset: 8 },
      { title: "Schematic Floor Plans & 3D Massing Model", desc: "Develop conceptual floor plans, building elevations, and massing models.", skills: ["3D CAD/BIM", "Drafting"], weight: 5, diff: 4, effort: 12, offset: 13 },
      { title: "Material Strategy & Technical Detailing Specs", desc: "Specify structural materials, environmental systems, and detail assembly sections.", skills: ["Technical Detailing", "Material Research"], weight: 4, diff: 3, effort: 10, offset: 17 },
      { title: "Architectural Renders & Review Presentation Package", desc: "Render high-quality perspective views, physical/digital model boards, and review deck.", skills: ["Visualisation", "Presentation"], weight: 3, diff: 2, effort: 6, offset: 20 }
    );
  }

  // 6. Match Creative & UX Design Briefs
  if (deliverables.length === 0 && /design|prototype|wireframe|user journey|usability|figma|interface|creative|user experience/.test(text)) {
    deliverables.push(
      { title: "User Persona & Journey Map Discovery", desc: "Interview target users, map behavioral pain points, and define design principles.", skills: ["UX Research", "Persona Mapping"], weight: 3, diff: 2, effort: 6, offset: 4 },
      { title: "Low-Fidelity Wireframes & Information Architecture", desc: "Sketch layout wireframes, navigation taxonomy, and component hierarchy.", skills: ["Wireframing", "UI Design"], weight: 4, diff: 3, effort: 8, offset: 8 },
      { title: "High-Fidelity Interactive Prototype & Design Tokens", desc: "Create interactive Figma prototype with visual design tokens and typography system.", skills: ["Figma", "Interaction Design"], weight: 5, diff: 4, effort: 12, offset: 13 },
      { title: "Usability Testing & Feedback Refinement", desc: "Run usability test sessions with target users and iterate on friction points.", skills: ["Usability Testing", "Design Iteration"], weight: 4, diff: 3, effort: 8, offset: 17 },
      { title: "Design Handoff Spec & Presentation Deck", desc: "Prepare component specs, asset redlines, and showcase presentation deck.", skills: ["Design Handoff", "Presentation"], weight: 3, diff: 2, effort: 5, offset: 20 }
    );
  }

  // 7. Match Software & Web Briefs
  if (deliverables.length === 0 && /web|frontend|backend|fullstack|react|vue|next|node|laravel|django|api|database|convex/.test(text)) {
    deliverables.push(
      { title: "System Architecture & Database Schema", desc: "Design data entities, Convex/SQL schema, and API specification.", skills: ["Backend", "Database"], weight: 4, diff: 3, effort: 8, offset: 4 },
      { title: "Figma Component Tokens & UI Layouts", desc: "Create responsive wireframes, design tokens, and interactive components.", skills: ["Figma", "UI/UX"], weight: 3, diff: 2, effort: 6, offset: 7 },
      { title: "Core Frontend Screen & State Implementation", desc: "Develop main user-facing views, forms, and client state handlers.", skills: ["React/TypeScript", "CSS"], weight: 5, diff: 4, effort: 12, offset: 12 },
      { title: "Backend API Endpoint & Mutation Services", desc: "Build realtime data mutations, authentication checks, and error boundaries.", skills: ["Node.js/Convex", "API"], weight: 4, diff: 3, effort: 10, offset: 15 },
      { title: "Vitest End-to-End Suite & Hosting Deployment", desc: "Run automated unit test coverage, set up SSL hosting, and verify production build.", skills: ["QA", "DevOps"], weight: 3, diff: 2, effort: 5, offset: 18 }
    );
  }

  // 8. Match Mobile App Briefs
  if (deliverables.length === 0 && /mobile|app|flutter|react native|ios|android|swift|kotlin/.test(text)) {
    deliverables.push(
      { title: "User Journey & Mobile Navigation Stack", desc: "Outline screen hierarchy, user flows, and navigation stack.", skills: ["UI/UX", "Mobile"], weight: 3, diff: 2, offset: 4, effort: 6 },
      { title: "Core Mobile Views & State Management", desc: "Develop primary mobile app screens, form inputs, and local storage.", skills: ["React Native/Flutter"], weight: 5, diff: 4, offset: 10, effort: 12 },
      { title: "Server API Sync & Push Notification Integration", desc: "Connect REST/WebSocket endpoints and configure notification alerts.", skills: ["API Integration"], weight: 4, diff: 3, offset: 14, effort: 8 },
      { title: "Device Compatibility & Store Release Audit", desc: "Audit performance across iOS/Android test devices and prepare app bundle.", skills: ["QA", "App Store"], weight: 3, diff: 2, offset: 18, effort: 6 }
    );
  }

  // 9. Match Game & 3D Briefs
  if (deliverables.length === 0 && /game|unity|unreal|godot|gamedev|2d|3d|physics|graphics/.test(text)) {
    deliverables.push(
      { title: "Game Design Document & Mechanics Spec", desc: "Define core loop, player controls, win/loss rules, and UI HUD layout.", skills: ["Game Design"], weight: 3, diff: 2, offset: 4, effort: 6 },
      { title: "3D Asset Modeling, Texturing & Rigging", desc: "Create 3D character/prop meshes, UV textures, and skeletal rigs.", skills: ["Blender/Maya", "3D Art"], weight: 4, diff: 3, offset: 9, effort: 10 },
      { title: "Level Environment & Lighting Assembly", desc: "Build scene geometry, collision bounds, dynamic lighting, and shaders.", skills: ["Level Design", "Unity/Unreal"], weight: 4, diff: 3, offset: 13, effort: 10 },
      { title: "Core Player Mechanics & Physics Scripts", desc: "Program movement controller, interaction scripts, and game state logic.", skills: ["C#/C++", "Gameplay Dev"], weight: 5, diff: 4, offset: 16, effort: 12 },
      { title: "Playtesting, Balance & Build Optimization", desc: "Run FPS stress tests, fix collision bugs, and build executable release.", skills: ["QA", "Optimization"], weight: 3, diff: 2, offset: 19, effort: 6 }
    );
  }

  // 10. Match Research & Writing Briefs
  if (deliverables.length === 0 && /research|thesis|study|survey|paper|analysis|report|essay|literature/.test(text)) {
    deliverables.push(
      { title: "Literature Review & Thesis Hypothesis Outline", desc: "Gather academic sources, analyze prior work, and formulate core research questions.", skills: ["Research", "Academic Writing"], weight: 3, diff: 2, offset: 4, effort: 6 },
      { title: "Methodology & Data Collection Tooling", desc: "Design survey questionnaires, experiment metrics, and sampling strategy.", skills: ["Data Analysis", "Methodology"], weight: 4, diff: 3, offset: 9, effort: 8 },
      { title: "Primary Data Gathering & Statistical Analysis", desc: "Execute survey data collection, run statistical tests, and chart findings.", skills: ["Statistics", "Data Mining"], weight: 4, diff: 3, offset: 14, effort: 10 },
      { title: "Draft Report Writing & Peer Citation Audit", desc: "Compile full report chapters, verify APA/IEEE citations, and proofread.", skills: ["Technical Writing", "Editing"], weight: 3, diff: 2, offset: 18, effort: 6 }
    );
  }

  // Helper to dynamically scale deliverables based on explicit items in user brief
  const userText = userBriefText.toLowerCase();

  // Extract explicit deliverables listed after "deliverables include", "deliverables:", etc.
  const explicitDeliverablesMatch = userBriefText.match(/deliverables\s*(?:include|:|\s)\s*([^.]+)/i);
  if (explicitDeliverablesMatch) {
    const rawItems = explicitDeliverablesMatch[1]
      .split(/,|\band\b|;|\n|•|-/i)
      .map((item) => item.trim())
      .filter((item) => item.length > 2 && !/^\d+$/.test(item));

    if (rawItems.length >= 3) {
      const dynamicDeliverables = rawItems.map((item, idx) => {
        // Clean title
        const cleanTitle = item.charAt(0).toUpperCase() + item.slice(1);
        const activeVerbTitle = /^(research|concept|curation|venue|promotional|interactive|event|visitor|post|design|setup|draft|build|implement|create)/i.test(cleanTitle)
          ? `Execute ${cleanTitle}`
          : `Deliver ${cleanTitle}`;
        return {
          title: activeVerbTitle,
          desc: `Complete ${item} according to project requirements and team specifications.`,
          skills: [idx % 2 === 0 ? "Execution" : "Planning"],
          weight: Math.min(5, Math.max(2, Math.round(10 / rawItems.length))),
          diff: idx % 3 === 0 ? 3 : 2,
          effort: Math.max(3, Math.round(30 / rawItems.length)),
          offset: Math.min(30, (idx + 1) * Math.max(2, Math.round(25 / rawItems.length))),
        };
      });
      return dynamicDeliverables;
    }
  }

  // 11. Fallback for general briefs
  if (deliverables.length === 0) {
    const rawTitle = projectTitle.trim() || "Project";
    deliverables.push(
      { title: `${rawTitle} — Requirement Spec & Scope Outline`, desc: "Detailed breakdown of project scope, milestone goals, and team roles.", skills: ["Planning"], weight: 2, diff: 2, effort: 4, offset: 3 },
      { title: `${rawTitle} — Core Component 1 Deliverable`, desc: "Build and verify the first primary deliverable specified in the brief.", skills: ["Execution"], weight: 4, diff: 3, effort: 8, offset: 8 },
      { title: `${rawTitle} — Core Component 2 Deliverable`, desc: "Build and verify the second main deliverable specified in the brief.", skills: ["Execution"], weight: 4, diff: 3, effort: 8, offset: 13 },
      { title: `${rawTitle} — Quality Verification & Final Submission`, desc: "Perform final review, complete documentation, and submit finished project.", skills: ["QA", "Review"], weight: 3, diff: 2, effort: 5, offset: 17 }
    );
  }

  // If simple brief (e.g. small website, 1 week, short brief text), scale down base deliverables
  if (userBriefText.length > 0 && userBriefText.length < 150 && deliverables.length > 3) {
    if (/simple|1 week|one week|portfolio|single page|small/i.test(userBriefText)) {
      return deliverables.slice(0, 3);
    }
  }

  return deliverables;
}

export function generateSmartFallbackPlan(context: PlanningContext, brief: string): ValidatedAiPlan {
  const phases = context.phases.length > 0 ? context.phases : [{ phaseId: "phase_1", title: "Project Execution" }];
  const members = context.members.length > 0 ? context.members : [{ profileId: "member_1", displayName: "Team Member" }];

  const rawTasks = extractDeliverablesFromBrief(brief, context.project.title);

  const milestones = phases.slice(0, Math.min(6, phases.length)).map((phase, index) => ({
    tempId: `milestone_${index + 1}`,
    title: `Milestone ${index + 1}: ${phase.title}`,
    description: `Completion check for ${phase.title} deliverables.`,
    phaseId: phase.phaseId,
    dueDate: context.project.deadline || formatIsoDate((index + 1) * 5),
  }));

  const tasks = rawTasks.map((task, index) => {
    const assignedPhase = phases[Math.floor((index / rawTasks.length) * phases.length)] || phases[0];
    const assignedOwner = members[index % members.length];
    const assignedReviewer = members.length > 1 ? members[(index + 1) % members.length] : null;

    const startDate = context.project.startDate || formatIsoDate(0);
    const calculatedDueDate = formatIsoDate(task.offset);
    const dueDate = context.project.deadline && calculatedDueDate > context.project.deadline
      ? context.project.deadline
      : calculatedDueDate;

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
      startDate,
      dueDate,
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
