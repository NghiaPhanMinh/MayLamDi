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
  const explicitItems = parseExplicitDeliverables(userBriefText);
  if (explicitItems.length >= 3) {
    const synthesized = synthesizeWorkstreamTasks(explicitItems, userBriefText);
    if (synthesized.length >= 2) {
      return synthesized;
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

import { extractFactsFromBrief } from "./aiPlanValidation";

export function parseExplicitDeliverables(userBriefText: string): string[] {
  const explicitMatch = userBriefText.match(/deliverables\s*(?:include|:|\s)\s*([^.]+)/i);
  if (!explicitMatch) return [];

  const rawSegmentText = explicitMatch[1];
  // Split strictly by commas, semicolons, newlines, bullet points, pipes (NEVER hyphens)
  const segments = rawSegmentText
    .split(/[,;\n•|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const items: string[] = [];
  for (const seg of segments) {
    let cleaned = seg.replace(/^(?:and\s+a\s+|and\s+an\s+|and\s+the\s+|and\s+|a\s+|an\s+|the\s+)/i, "").trim();
    cleaned = cleaned.replace(/\.$/, "").trim();
    if (cleaned.length > 2 && !/^\d+$/.test(cleaned)) {
      items.push(cleaned);
    }
  }

  return items;
}

export function synthesizeWorkstreamTasks(rawItems: string[], userBriefText: string): Array<{
  title: string;
  desc: string;
  skills: string[];
  weight: number;
  diff: number;
  effort: number;
  offset: number;
}> {
  if (rawItems.length === 0) return [];

  const facts = extractFactsFromBrief(userBriefText);
  const tasks: Array<{
    title: string;
    desc: string;
    skills: string[];
    weight: number;
    diff: number;
    effort: number;
    offset: number;
  }> = [];

  // Coupling rules: Only merge naturally paired items (e.g. concept + theme). Keep independent items separate.
  const processedIndices = new Set<number>();

  for (let i = 0; i < rawItems.length; i++) {
    if (processedIndices.has(i)) continue;
    const current = rawItems[i];
    const currentLower = current.toLowerCase();

    // Check if current item can pair with next item if tightly coupled
    let combinedTitle = current.charAt(0).toUpperCase() + current.slice(1);
    let isPaired = false;

    if (i + 1 < rawItems.length && !processedIndices.has(i + 1)) {
      const next = rawItems[i + 1];
      const nextLower = next.toLowerCase();

      if (
        (currentLower.includes("concept") && nextLower.includes("theme")) ||
        (currentLower.includes("theme") && nextLower.includes("concept"))
      ) {
        combinedTitle = "Exhibition Concept & Theme";
        processedIndices.add(i + 1);
        isPaired = true;
      } else if (
        (currentLower.includes("script") && nextLower.includes("storyboard")) ||
        (currentLower.includes("storyboard") && nextLower.includes("script"))
      ) {
        combinedTitle = "Script & Storyboard Framing";
        processedIndices.add(i + 1);
        isPaired = true;
      }
    }

    processedIndices.add(i);

    // Active verb selection based on deliverable domain
    let activeVerb = "Develop";
    let skills = ["Planning"];
    let desc = "";

    if (/artist|curation|selection|project selection/i.test(combinedTitle)) {
      activeVerb = "Conduct";
      skills = ["Curation", "Selection"];
      desc = `Establish selection criteria and curate project entries${facts.artworksOrProducts ? ` for ${facts.artworksOrProducts.count} ${facts.artworksOrProducts.label}` : ""}, aligning with brief requirements.`;
    } else if (/promotional|materials|marketing|campaign|social/i.test(combinedTitle)) {
      activeVerb = "Design";
      skills = ["Graphic Design", "Marketing"];
      desc = `Create promotional signage, media assets, and marketing collateral${facts.visitorsOrAudience ? ` tailored for approximately ${facts.visitorsOrAudience.count} ${facts.visitorsOrAudience.label}` : ""}.`;
    } else if (/layout|venue|spatial|floorplan/i.test(combinedTitle)) {
      activeVerb = "Plan";
      skills = ["Spatial Planning", "Layout"];
      desc = `Map physical space, define circulation pathways, and arrange layout logistics${facts.artworksOrProducts ? ` for ${facts.artworksOrProducts.count} ${facts.artworksOrProducts.label}` : ""}.`;
    } else if (/installation|setup|technical|hardware|backend|schema|database|api/i.test(combinedTitle)) {
      activeVerb = /api|backend|schema/i.test(combinedTitle) ? "Implement" : "Configure";
      skills = ["Technical Development", "Setup"];
      desc = `Set up technical infrastructure, equipment, and installation hardware${facts.artworksOrProducts ? ` for ${facts.artworksOrProducts.count} ${facts.artworksOrProducts.label}` : ""}, verifying pre-event operation.`;
    } else if (/logistics|event logistics|operations/i.test(combinedTitle)) {
      activeVerb = "Coordinate";
      skills = ["Event Logistics", "Operations"];
      desc = `Manage live event logistics, staff scheduling, visitor flow, and operational execution.`;
    } else if (/visitor documentation|media archiving|photography/i.test(combinedTitle)) {
      activeVerb = "Produce";
      skills = ["Documentation", "Media Archiving"];
      desc = `Capture visual media, record visitor engagement, and produce comprehensive documentation during execution.`;
    } else if (/evaluation|post-event|post-project|retrospective/i.test(combinedTitle)) {
      activeVerb = "Execute";
      skills = ["Evaluation", "Analytics"];
      desc = `Collect feedback data, analyze performance metrics, and compile final post-event evaluation report.`;
    } else if (/concept|theme/i.test(combinedTitle)) {
      activeVerb = "Develop";
      skills = ["Concept Strategy", "Framing"];
      desc = `Formulate foundational concept, theme, and scope framework for target audience execution.`;
    } else {
      activeVerb = /build|implement|code/i.test(combinedTitle) ? "Build" : "Execute";
      skills = ["Execution"];
      desc = `Synthesize and deliver ${combinedTitle} according to brief specifications, meeting all project quality standards.`;
    }

    const title = combinedTitle.startsWith(activeVerb) ? combinedTitle : `${activeVerb} ${combinedTitle}`;

    tasks.push({
      title,
      desc,
      skills,
      weight: isPaired ? 4 : 3,
      diff: 3,
      effort: isPaired ? 8 : 6,
      offset: (tasks.length + 1) * 4,
    });
  }

  return tasks;
}

function findBestMember(
  members: Array<{ profileId: string; displayName: string; skills?: string[] }>,
  task: { title: string; skills: string[] },
  fallbackIndex: number
) {
  if (members.length === 0) return { profileId: "member_1", displayName: "Team Member" };
  const taskTitle = task.title.toLowerCase();

  for (const m of members) {
    const memberName = m.displayName.toLowerCase();

    if (/developer|tech|engineer|coder/i.test(memberName) && /installation|setup|layout|technical|database|backend|schema|api|endpoint|services/i.test(taskTitle)) {
      return m;
    }
    if (/designer|graphic|artist|visual|ui|ux/i.test(memberName) && /design|promotional|visual|art|ui|ux|dashboard/i.test(taskTitle)) {
      return m;
    }
    if (/curator|lead|manager|director|owner/i.test(memberName) && /concept|theme|curation|strategy|develop|draft/i.test(taskTitle)) {
      return m;
    }
    if (/coordinator|event|logistics|ops/i.test(memberName) && /logistics|event|operations|coordinate/i.test(taskTitle)) {
      return m;
    }
    if (/photographer|qa|tester|writer/i.test(memberName) && /documentation|evaluation|visitor|review|compile|testing/i.test(taskTitle)) {
      return m;
    }
  }

  return members[fallbackIndex % members.length];
}

function mapTaskToFrameworkPhase(
  task: { title: string; skills: string[] },
  phases: Array<{ phaseId: string; title: string }>,
  index: number,
  totalTasks: number
) {
  if (phases.length === 0) return { phaseId: "phase_1", title: "Execution" };
  if (phases.length === 1) return phases[0];

  const taskText = `${task.title} ${task.skills.join(" ")}`.toLowerCase();

  for (const phase of phases) {
    const phaseTitle = phase.title.toLowerCase();

    if (
      (/research|empath|discovery|define|concept|analysis|requirements|framing/i.test(phaseTitle)) &&
      (/concept|theme|curation|selection|research|requirements|scope|persona|hypothesis|script|screenplay/i.test(taskText))
    ) {
      return phase;
    }

    if (
      (/design|ideate|prototype|architecture|schema|spec/i.test(phaseTitle)) &&
      (/design|promotional|wireframe|layout|spatial|floorplan|schema|architecture|prototype|materials|asset|banner/i.test(taskText))
    ) {
      return phase;
    }

    if (
      (/build|execute|implement|develop|production|construct/i.test(phaseTitle)) &&
      (/installation|setup|hardware|code|backend|api|endpoint|animation|render|logistics|event/i.test(taskText))
    ) {
      return phase;
    }

    if (
      (/test|verify|deliver|launch|review|evaluation|retrospective/i.test(phaseTitle)) &&
      (/documentation|evaluation|post-event|testing|qa|audit|archiving|reporting/i.test(taskText))
    ) {
      return phase;
    }
  }

  const fallbackIndex = Math.min(phases.length - 1, Math.floor((index / Math.max(1, totalTasks)) * phases.length));
  return phases[fallbackIndex] || phases[0];
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
    const assignedPhase = mapTaskToFrameworkPhase(task, phases, index, rawTasks.length);
    const assignedOwner = findBestMember(members, task, index);
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
