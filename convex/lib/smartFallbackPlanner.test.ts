import { describe, expect, it } from "vitest";
import { generateSmartFallbackPlan } from "./smartFallbackPlanner";

describe("smartFallbackPlanner", () => {
  const mockContext = {
    project: { projectId: "proj_1", title: "Prototype Website", description: "React app", frameworkName: "Agile", startDate: "2026-08-01", deadline: "2026-08-30" },
    phases: [{ phaseId: "phase_1", title: "Requirements" }, { phaseId: "phase_2", title: "Execution" }],
    members: [{ profileId: "mem_1", displayName: "Anh" }, { profileId: "mem_2", displayName: "Minh" }],
  };

  it("generates a web domain plan for web keywords", () => {
    const plan = generateSmartFallbackPlan(mockContext, "Build a React website with Convex backend");
    expect(plan.recommendedFramework).toContain("Agile");
    expect(plan.milestones.length).toBeGreaterThan(0);
    expect(plan.tasks.length).toBeGreaterThanOrEqual(5);
    expect(plan.tasks[0].primaryOwnerProfileId).toBe("mem_1");
  });

  it("generates a mobile app plan for app keywords", () => {
    const mobileContext = { ...mockContext, project: { ...mockContext.project, title: "Mobile Order App" } };
    const plan = generateSmartFallbackPlan(mobileContext, "Build Flutter mobile app for iOS and Android");
    expect(plan.tasks[0].title).toContain("Mobile");
  });

  it("generates a generic plan for unknown domain", () => {
    const genericContext = { ...mockContext, project: { ...mockContext.project, title: "Random Activity" } };
    const plan = generateSmartFallbackPlan(genericContext, "Do some tasks");
    expect(plan.tasks.length).toBe(4);
  });

  it("extracts specific animation deliverables for animation briefs", () => {
    const animContext = { ...mockContext, project: { ...mockContext.project, title: "A3 Narrative" } };
    const plan = generateSmartFallbackPlan(animContext, "creating a 2D animated narrative project delivered through Script, Shot List, Design Document, and 45+ second greyscale Animatic");
    const taskTitles = plan.tasks.map((t) => t.title);
    expect(taskTitles.some((t) => t.includes("Script"))).toBe(true);
    expect(taskTitles.some((t) => t.includes("Shot List"))).toBe(true);
    expect(taskTitles.some((t) => t.includes("Design Document"))).toBe(true);
    expect(taskTitles.some((t) => t.includes("Animatic"))).toBe(true);
  });

  it("generates marketing campaign deliverables for marketing briefs", () => {
    const mktContext = { ...mockContext, project: { ...mockContext.project, title: "Brand Launch" } };
    const plan = generateSmartFallbackPlan(mktContext, "Design social media campaign and launch strategy for new beverage brand");
    const taskTitles = plan.tasks.map((t) => t.title);
    expect(taskTitles.some((t) => t.includes("Persona") || t.includes("Campaign"))).toBe(true);
  });

  it("generates business strategy deliverables for business briefs", () => {
    const bizContext = { ...mockContext, project: { ...mockContext.project, title: "Startup Pitch" } };
    const plan = generateSmartFallbackPlan(bizContext, "Build a startup business model, financial revenue forecast, and investor pitch deck");
    const taskTitles = plan.tasks.map((t) => t.title);
    expect(taskTitles.some((t) => t.includes("Business Model") || t.includes("Pitch Deck"))).toBe(true);
  });

  it("generates spatial architectural deliverables for architecture briefs", () => {
    const archContext = { ...mockContext, project: { ...mockContext.project, title: "Civic Centre" } };
    const plan = generateSmartFallbackPlan(archContext, "Architectural spatial design proposal including site analysis, schematic floor plans, and 3D renders");
    const taskTitles = plan.tasks.map((t) => t.title);
    expect(taskTitles.some((t) => t.includes("Site") || t.includes("Schematic") || t.includes("Floor Plans"))).toBe(true);
  });

  it("handles Test A and Test B correctly in the SAME project with stored title 'A3 Narrative Animation'", () => {
    const staleAnimationProjectContext = {
      ...mockContext,
      project: {
        ...mockContext.project,
        title: "A3 Narrative Animation",
        description: "Old animation assignment description",
      },
    };

    const briefTestA = "Create a 2-minute narrative animation about loneliness. Team of 3: animator, illustrator, sound designer. Deadline: 3 weeks.";
    const planA = generateSmartFallbackPlan(staleAnimationProjectContext, briefTestA);
    const titlesA = planA.tasks.map((t) => t.title);
    expect(titlesA.some((t) => t.includes("Script") || t.includes("Animatic") || t.includes("Storyboard"))).toBe(true);

    const briefTestB = "Create a marketing campaign for a local coffee shop launching a seasonal drink. Team of 4: graphic designer, copywriter, social media manager, photographer. Deadline: 4 weeks. Deliverables include audience research, visual campaign assets, social media content, promotional event planning and a final performance report.";
    const planB = generateSmartFallbackPlan(staleAnimationProjectContext, briefTestB);
    const titlesB = planB.tasks.map((t) => t.title);

    // Test B MUST generate marketing tasks
    expect(titlesB.some((t) => /persona|campaign|launch|audience|research|assets/i.test(t))).toBe(true);
    // Test B MUST NOT generate animation/screenplay/storyboard tasks despite project title "A3 Narrative Animation"
    expect(titlesB.some((t) => /screenplay|storyboard|animatic/i.test(t))).toBe(false);
  });

  it("TEST 1 — dynamically scales task count based on project scope (Brief A vs Brief B)", () => {
    const simpleBrief = "Create a simple personal portfolio website for one designer. Deliverables: homepage, about page and contact form. Deadline: 1 week.";
    const complexBrief = "Create a 6-week university design exhibition for 150 visitors. The team has 5 members. Deliverables include research, exhibition concept, curation of 12 artworks, venue layout, promotional campaign, interactive installation setup, event logistics, visitor documentation and post-event evaluation.";

    const planSimple = generateSmartFallbackPlan(mockContext, simpleBrief);
    const planComplex = generateSmartFallbackPlan(mockContext, complexBrief);

    expect(planComplex.tasks.length).toBeGreaterThan(planSimple.tasks.length);
  });

  it("TEST 2 — produces independent drafts for identical brief in Project A vs Project B", () => {
    const identicalBrief = "Plan a 5-week university art exhibition showcasing student digital media projects. The team has 5 members: curator, event coordinator, graphic designer, technical developer, and photographer. The exhibition will feature 12 interactive and audiovisual artworks for approximately 150 visitors.";

    const projectAContext = { ...mockContext, project: { ...mockContext.project, projectId: "proj_A", title: "Project A" } };
    const projectBContext = { ...mockContext, project: { ...mockContext.project, projectId: "proj_B", title: "Project B" } };

    const planA = generateSmartFallbackPlan(projectAContext, identicalBrief);
    const planB = generateSmartFallbackPlan(projectBContext, identicalBrief);

    expect(planA).toBeDefined();
    expect(planB).toBeDefined();
    expect(planA.tasks.length).toBeGreaterThanOrEqual(5);
    expect(planB.tasks.length).toBeGreaterThanOrEqual(5);
  });
});
