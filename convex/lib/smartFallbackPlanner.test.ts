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
});
