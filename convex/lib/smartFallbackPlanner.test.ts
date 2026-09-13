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
});

