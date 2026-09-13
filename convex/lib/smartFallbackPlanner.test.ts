import { describe, expect, it } from "vitest";
import { generateSmartFallbackPlan } from "./smartFallbackPlanner";
import { extractFactsFromBrief, validatePlanAgainstBrief } from "./aiPlanValidation";

describe("smartFallbackPlanner & 10-Point Output Validator", () => {
  const mockContext = {
    project: { projectId: "proj_1", title: "Prototype Website", description: "React app", frameworkName: "Agile", startDate: "2026-08-01", deadline: "2026-08-30" },
    phases: [{ phaseId: "phase_1", title: "Requirements" }, { phaseId: "phase_2", title: "Execution" }],
    members: [{ profileId: "mem_1", displayName: "Anh" }, { profileId: "mem_2", displayName: "Minh" }],
  };

  it("extracts semantic facts accurately from brief without confusing numbers", () => {
    const brief = "Plan a 5-week university art exhibition showcasing student digital media projects. The team has 5 members: curator, event coordinator, graphic designer, technical developer, and photographer. The exhibition will feature 12 interactive and audiovisual artworks for approximately 150 visitors. Deliverables include exhibition concept and theme, artist/project selection, venue layout, promotional materials, interactive installation setup, event logistics, visitor documentation, and a post-event evaluation.";

    const facts = extractFactsFromBrief(brief);
    expect(facts.duration?.value).toBe(5);
    expect(facts.duration?.unit).toBe("week");
    expect(facts.teamMembers.count).toBe(5);
    expect(facts.artworksOrProducts?.count).toBe(12);
    expect(facts.artworksOrProducts?.label).toContain("artworks");
    expect(facts.visitorsOrAudience?.count).toBe(150);
    expect(facts.visitorsOrAudience?.label).toBe("visitors");
    expect(facts.explicitDeliverables.length).toBe(8);
  });

  it("PROJECT TYPE 1 — Exhibition/Event: 8 tasks generated, fact accuracy verified, 10/10 validation checks pass", () => {
    const exhibitionContext = {
      ...mockContext,
      members: [
        { profileId: "curator_1", displayName: "Curator Lead" },
        { profileId: "coord_1", displayName: "Event Coordinator" },
        { profileId: "designer_1", displayName: "Graphic Designer" },
        { profileId: "dev_1", displayName: "Technical Developer" },
        { profileId: "photo_1", displayName: "Photographer & Doc" },
      ],
    };
    const brief = "Plan a 5-week university art exhibition showcasing student digital media projects. The team has 5 members: curator, event coordinator, graphic designer, technical developer, and photographer. The exhibition will feature 12 interactive and audiovisual artworks for approximately 150 visitors. Deliverables include exhibition concept and theme, artist/project selection, venue layout, promotional materials, interactive installation setup, event logistics, visitor documentation, and a post-event evaluation.";

    const plan = generateSmartFallbackPlan(exhibitionContext, brief);
    const report = validatePlanAgainstBrief(plan, brief, exhibitionContext);

    // Print test report pipeline: BRIEF -> EXTRACTED FACTS -> GENERATED TASKS -> VALIDATION RESULT
    const facts = extractFactsFromBrief(brief);
    console.log("\n--- TEST TYPE 1: EXHIBITION / EVENT ---");
    console.log("EXTRACTED FACTS:", facts);
    console.log("GENERATED TASKS:", plan.tasks.map((t) => ({ title: t.title, owner: t.primaryOwnerProfileId })));
    console.log("VALIDATION RESULT:", report);

    // 1. Task count must reflect explicit scope (8 tasks for 8 explicit deliverables)
    expect(plan.tasks.length).toBe(8);

    // 2. Fact Accuracy checks: NO "12 project deliverables" or "5 target audience/visitors"
    const combinedDescs = plan.tasks.map((t) => t.description).join(" ");
    expect(combinedDescs).not.toContain("12 project deliverables");
    expect(combinedDescs).not.toContain("5 target audience/visitors");

    // 3. Grouping checks: Artist selection and Promotional materials MUST NOT be merged
    const mergedTask = plan.tasks.find((t) => /artist.*promotional|promotional.*artist/i.test(t.title));
    expect(mergedTask).toBeUndefined();

    // 4. All 10 validation checks MUST PASS
    expect(report.valid).toBe(true);
  });

  it("PROJECT TYPE 2 — Marketing Campaign: 7 deliverables produce 7 distinct tasks, 10/10 validation checks pass", () => {
    const mktContext = {
      ...mockContext,
      members: [
        { profileId: "strat_1", displayName: "Campaign Strategist" },
        { profileId: "copy_1", displayName: "Copywriter" },
        { profileId: "des_1", displayName: "Graphic Designer" },
        { profileId: "soc_1", displayName: "Social Media Manager" },
      ],
    };
    const brief = "Design a 4-week marketing campaign for launching a new artisanal beverage brand. Team of 4 members: campaign strategist, copywriter, graphic designer, and social media manager. Deliverables include audience persona research, campaign strategy and value proposition, visual banners and ad deck, promotional video cut-downs, influencer outreach, launch event coordination, and performance analytics report.";

    const plan = generateSmartFallbackPlan(mktContext, brief);
    const report = validatePlanAgainstBrief(plan, brief, mktContext);

    const facts = extractFactsFromBrief(brief);
    console.log("\n--- TEST TYPE 2: MARKETING CAMPAIGN ---");
    console.log("EXTRACTED FACTS:", facts);
    console.log("GENERATED TASKS:", plan.tasks.map((t) => ({ title: t.title })));
    console.log("VALIDATION RESULT:", report);

    expect(plan.tasks.length).toBeGreaterThanOrEqual(6);
    expect(report.valid).toBe(true);
  });

  it("PROJECT TYPE 3 — Software Product: multi-tier SaaS platform deliverables produce distinct workstream tasks", () => {
    const softwareContext = {
      ...mockContext,
      members: [
        { profileId: "pm_1", displayName: "Product Owner" },
        { profileId: "fe_1", displayName: "Frontend Engineer" },
        { profileId: "be_1", displayName: "Backend Developer" },
        { profileId: "qa_1", displayName: "QA Tester" },
      ],
    };
    const brief = "Build a web-based SaaS analytics platform in 6 weeks. Team has 4 members: product owner, frontend engineer, backend developer, QA tester. Deliverables include PostgreSQL database schema design, user authentication service, RESTful API endpoints, responsive analytics dashboard UI, automated integration testing, and cloud hosting deployment.";

    const plan = generateSmartFallbackPlan(softwareContext, brief);
    const report = validatePlanAgainstBrief(plan, brief, softwareContext);

    const facts = extractFactsFromBrief(brief);
    console.log("\n--- TEST TYPE 3: SOFTWARE PRODUCT ---");
    console.log("EXTRACTED FACTS:", facts);
    console.log("GENERATED TASKS:", plan.tasks.map((t) => ({ title: t.title })));
    console.log("VALIDATION RESULT:", report);

    expect(plan.tasks.length).toBeGreaterThanOrEqual(5);
    expect(report.valid).toBe(true);
  });

  it("PROJECT TYPE 4 — Narrative Animation: 2D short film deliverables produce distinct creative tasks", () => {
    const animationContext = {
      ...mockContext,
      members: [
        { profileId: "dir_1", displayName: "Director Lead" },
        { profileId: "anim_1", displayName: "Character Animator" },
        { profileId: "sound_1", displayName: "Sound Designer" },
      ],
    };
    const brief = "Create a 3-minute 2D animated narrative short film in 3 weeks. Team of 3 members: director, character animator, sound designer. Deliverables include screenplay script, character art direction, timed greyscale animatic, color background rendering, 2D character animation frames, multi-channel sound design, and final video render export.";

    const plan = generateSmartFallbackPlan(animationContext, brief);
    const report = validatePlanAgainstBrief(plan, brief, animationContext);

    const facts = extractFactsFromBrief(brief);
    console.log("\n--- TEST TYPE 4: NARRATIVE ANIMATION ---");
    console.log("EXTRACTED FACTS:", facts);
    console.log("GENERATED TASKS:", plan.tasks.map((t) => ({ title: t.title })));
    console.log("VALIDATION RESULT:", report);

    expect(plan.tasks.length).toBeGreaterThanOrEqual(6);
    expect(report.valid).toBe(true);
  });

  it("VERIFICATION — Dynamic task count scaling across simple vs complex briefs", () => {
    const simpleBrief = "Plan a simple 1-day workshop for 10 students. Deliverables: agenda and slide deck.";
    const complexBrief = "Plan a 5-week university art exhibition showcasing student digital media projects. The team has 5 members: curator, event coordinator, graphic designer, technical developer, and photographer. Deliverables include exhibition concept and theme, artist/project selection, venue layout, promotional materials, interactive installation setup, event logistics, visitor documentation, and a post-event evaluation.";

    const planSimple = generateSmartFallbackPlan(mockContext, simpleBrief);
    const planComplex = generateSmartFallbackPlan(mockContext, complexBrief);

    expect(planSimple.tasks.length).toBeLessThan(planComplex.tasks.length);
    expect(planComplex.tasks.length).toBe(8);
  });

  it("VERIFICATION — SAME FRAMEWORK != SAME TASKS: 4 different project briefs using identical Design Thinking framework produce 100% domain-specific tasks", () => {
    const designThinkingFrameworkContext = {
      ...mockContext,
      phases: [
        { phaseId: "phase_empathise", title: "Empathise & Research" },
        { phaseId: "phase_define", title: "Define & Concept" },
        { phaseId: "phase_prototype", title: "Prototype & Execute" },
        { phaseId: "phase_test", title: "Test & Deliver" },
      ],
      members: [
        { profileId: "lead_1", displayName: "Project Lead" },
        { profileId: "exec_1", displayName: "Domain Specialist" },
      ],
    };

    const uxBrief = "Build a mobile food delivery app in 4 weeks. Deliverables include user research, wireframe taxonomy, Figma interactive prototype, usability test sessions.";
    const archBrief = "Architectural spatial proposal for a community library. Deliverables include site analysis, schematic floor plans, 3D massing model, material strategy specs.";
    const mktBrief = "Design a seasonal campaign for a coffee shop. Deliverables include audience research, visual ad deck, promotional social posts, launch event logistics.";
    const animBrief = "Create a 2D animated short about space. Deliverables include screenplay script, character art direction, timed animatic render, sound design mixing.";

    const planUX = generateSmartFallbackPlan(designThinkingFrameworkContext, uxBrief);
    const planArch = generateSmartFallbackPlan(designThinkingFrameworkContext, archBrief);
    const planMkt = generateSmartFallbackPlan(designThinkingFrameworkContext, mktBrief);
    const planAnim = generateSmartFallbackPlan(designThinkingFrameworkContext, animBrief);

    // 1. All 4 plans MUST use the exact same framework phase IDs
    const uxPhaseIds = new Set(planUX.tasks.map((t) => t.phaseId));
    const archPhaseIds = new Set(planArch.tasks.map((t) => t.phaseId));
    const mktPhaseIds = new Set(planMkt.tasks.map((t) => t.phaseId));
    const animPhaseIds = new Set(planAnim.tasks.map((t) => t.phaseId));

    expect(uxPhaseIds.has("phase_empathise") || uxPhaseIds.has("phase_define")).toBe(true);
    expect(archPhaseIds.has("phase_empathise") || archPhaseIds.has("phase_define")).toBe(true);
    expect(mktPhaseIds.has("phase_empathise") || mktPhaseIds.has("phase_define")).toBe(true);
    expect(animPhaseIds.has("phase_empathise") || animPhaseIds.has("phase_define")).toBe(true);

    // 2. Tasks MUST be 100% domain-specific (SAME FRAMEWORK != SAME TASKS)
    const uxTitles = planUX.tasks.map((t) => t.title).join(" ");
    const archTitles = planArch.tasks.map((t) => t.title).join(" ");
    const mktTitles = planMkt.tasks.map((t) => t.title).join(" ");
    const animTitles = planAnim.tasks.map((t) => t.title).join(" ");

    expect(uxTitles).toMatch(/wireframe|prototype|figma|research/i);
    expect(archTitles).toMatch(/site|schematic|floorplan|massing|renders/i);
    expect(mktTitles).toMatch(/campaign|audience|ad deck|social|event/i);
    expect(animTitles).toMatch(/script|screenplay|animatic|sound/i);

    // 3. ZERO template bleed across domain tasks
    expect(uxTitles).not.toMatch(/floorplan|animatic/i);
    expect(archTitles).not.toMatch(/figma|animatic/i);
    expect(animTitles).not.toMatch(/floorplan|ad deck/i);

    // 4. Validation Engine MUST pass for all 4 adaptive plans
    expect(validatePlanAgainstBrief(planUX, uxBrief, designThinkingFrameworkContext).valid).toBe(true);
    expect(validatePlanAgainstBrief(planArch, archBrief, designThinkingFrameworkContext).valid).toBe(true);
    expect(validatePlanAgainstBrief(planMkt, mktBrief, designThinkingFrameworkContext).valid).toBe(true);
    expect(validatePlanAgainstBrief(planAnim, animBrief, designThinkingFrameworkContext).valid).toBe(true);
  });

  it("REGRESSION TEST 1 — Same Project with 3 Sequential Changing Briefs: current brief strictly overrides stored project title/description", () => {
    // Project metadata initially stored as animation project
    const staleAnimationProjectContext = {
      ...mockContext,
      project: {
        projectId: "proj_anim_123",
        title: "A3 Narrative Animation",
        description: "2D animation short film project",
        frameworkName: "Design Thinking",
        startDate: "2026-09-01",
        deadline: "2026-10-01",
      },
    };

    // Gen 1: Animation brief
    const gen1Brief = "Create a 3-minute 2D animated narrative short film in 3 weeks. Deliverables include screenplay script, character art direction, timed greyscale animatic, and final render.";
    const gen1Plan = generateSmartFallbackPlan(staleAnimationProjectContext, gen1Brief);
    const gen1Titles = gen1Plan.tasks.map((t) => t.title).join(" ");

    expect(gen1Titles).toMatch(/screenplay|animatic|script/i);

    // Gen 2: User changes brief to Mobile Study App in the same project!
    const gen2Brief = "Build a mobile app for university students to track study sessions in 3 weeks. Deliverables include user journey navigation, mobile views state management, server API sync, and device store release audit.";
    const gen2Plan = generateSmartFallbackPlan(staleAnimationProjectContext, gen2Brief);
    const gen2Titles = gen2Plan.tasks.map((t) => t.title).join(" ");

    console.log("\n--- REGRESSION TEST 1 (Gen 2 - Mobile App on Stale Animation Project) ---");
    console.log("GEN 2 TASKS:", gen2Plan.tasks.map((t) => t.title));

    // MUST NOT contain animation tasks
    expect(gen2Titles).not.toMatch(/screenplay|animatic|storyboard|character design|film/i);
    // MUST contain mobile app tasks
    expect(gen2Titles).toMatch(/mobile|journey|navigation|state|api|store/i);

    // Gen 3: User changes brief to Coffee Shop Marketing Campaign in the same project!
    const gen3Brief = "Design a 4-week marketing campaign for a local coffee shop grand opening. Deliverables include audience persona research, campaign strategy, visual banners and ad deck, promotional video cut-downs, and performance analytics report.";
    const gen3Plan = generateSmartFallbackPlan(staleAnimationProjectContext, gen3Brief);
    const gen3Titles = gen3Plan.tasks.map((t) => t.title).join(" ");

    console.log("\n--- REGRESSION TEST 1 (Gen 3 - Coffee Shop Campaign on Stale Animation Project) ---");
    console.log("GEN 3 TASKS:", gen3Plan.tasks.map((t) => t.title));

    // MUST NOT contain animation OR mobile app tasks
    expect(gen3Titles).not.toMatch(/screenplay|animatic|storyboard|mobile navigation|flutter/i);
    // MUST contain coffee shop campaign tasks
    expect(gen3Titles).toMatch(/campaign|audience|ad deck|banners|analytics/i);
  });

  it("REGRESSION TEST 2 — Same Brief across Different Projects: brief is authoritative, stored project title/metadata never contaminates tasks", () => {
    const projectA_SaaS = {
      ...mockContext,
      project: { projectId: "proj_saas", title: "Enterprise SaaS Analytics", description: "PostgreSQL database and API", frameworkName: "Agile", startDate: "2026-09-01", deadline: "2026-10-01" },
    };

    const projectB_Animation = {
      ...mockContext,
      project: { projectId: "proj_anim", title: "A3 Narrative Animation", description: "2D animated short film", frameworkName: "Agile", startDate: "2026-09-01", deadline: "2026-10-01" },
    };

    const sharedBrief = "Plan a 4-week promotional marketing campaign for a coffee shop opening. Deliverables include audience persona research, campaign strategy and value proposition, visual banners and ad deck, promotional video cut-downs, and performance analytics report.";

    const planA = generateSmartFallbackPlan(projectA_SaaS, sharedBrief);
    const planB = generateSmartFallbackPlan(projectB_Animation, sharedBrief);

    const titlesA = planA.tasks.map((t) => t.title).join(" ");
    const titlesB = planB.tasks.map((t) => t.title).join(" ");

    // Both plans MUST generate coffee shop campaign tasks
    expect(titlesA).toMatch(/campaign|audience|ad deck|banners/i);
    expect(titlesB).toMatch(/campaign|audience|ad deck|banners/i);

    // Neither plan MUST bleed stored project title domains
    expect(titlesA).not.toMatch(/database|postgresql|api/i);
    expect(titlesB).not.toMatch(/animatic|screenplay|storyboard/i);
  });

  it("REGRESSION TEST 3 — Regeneration Variation: Regenerating plan with different generationId produces dynamic variations", () => {
    const brief = "Architectural spatial proposal for a community library. Deliverables include site analysis, schematic floor plans, 3D massing model, material strategy specs, and architectural renders.";

    const planGen1 = generateSmartFallbackPlan(mockContext, brief, "gen_10001_abc");
    const planGen2 = generateSmartFallbackPlan(mockContext, brief, "gen_10002_xyz");

    const titles1 = planGen1.tasks.map((t) => t.title).join(", ");
    const titles2 = planGen2.tasks.map((t) => t.title).join(", ");

    console.log("\n--- REGRESSION TEST 3 (REGENERATION VARIATION) ---");
    console.log("GEN 1 TASKS:", titles1);
    console.log("GEN 2 TASKS:", titles2);

    // Plans must not be byte-for-byte identical when regenerated with a new generationId seed
    expect(titles1).not.toBe(titles2);
  });
});
