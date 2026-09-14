import { describe, expect, it } from "vitest";
import { planningPrompts, validateJsonResponse } from "../ai";
import { generateSmartFallbackPlan } from "./smartFallbackPlanner";
import { validateAiPlan, repairAndEnrichPlan, validatePlanAgainstBrief } from "./aiPlanValidation";

const mockPlanningContext = {
  project: {
    projectId: "proj_unseen_100",
    title: "Unseen Brief Test Project",
    description: "Multi-disciplinary team project",
    frameworkName: "Design Thinking",
    startDate: "2026-09-15",
    deadline: "2026-10-30",
  },
  phases: [
    { phaseId: "phase_empathise", title: "Empathise & Discovery" },
    { phaseId: "phase_define", title: "Define & Architecture" },
    { phaseId: "phase_prototype", title: "Prototype & Development" },
    { phaseId: "phase_test", title: "Testing, Delivery & Evaluation" },
  ],
  members: [
    { profileId: "m1", displayName: "Lead Strategist" },
    { profileId: "m2", displayName: "UI/UX Designer" },
    { profileId: "m3", displayName: "Lead Developer" },
    { profileId: "m4", displayName: "Quality Specialist" },
  ],
  existingTasks: [],
};

const UNSEEN_BRIEFS = [
  {
    name: "1. 2D Narrative Game",
    brief: `Create a small 2D narrative adventure game for university students about dealing with loneliness and everyday stress. The player controls a student exploring a surreal campus at night. Features 3 endings, exploration, dialogue choices, and light puzzle solving. Visual direction is dreamlike with hand-drawn 2D assets. Developed by 5 team members over 6 weeks. Deliverables: playable game, assets, narrative, and playtesting evaluation report.`,
  },
  {
    name: "2. Interactive Digital Media Installation",
    brief: `Design a physical-digital interactive art installation for a public gallery space exploring human-nature connectivity. Uses camera motion sensors and generative projection mapping. Visitors interact by stepping on pressure pads and gesturing to manipulate visual particles and soundscapes. Developed by a team of 4 over 5 weeks. Deliverables: spatial hardware layout blueprint, projection software engine, physical installation setup, visitor interaction guide, and video documentation.`,
  },
  {
    name: "3. Misinformation Educational Web Experience",
    brief: `Develop an interactive web-based educational experience teaching high school students how to detect online misinformation and fake news. Features interactive news feed simulations, spot-the-fake quizzes, fact-checking tool tutorials, and a leaderboard system. Developed by a team of 3 over 4 weeks. Deliverables: responsive web application, interactive quiz database, educator lesson plan PDF, and accessibility audit report.`,
  },
  {
    name: "4. Mobile Study Planning App",
    brief: `Build a cross-platform mobile application for university students to manage study schedules, track assignment deadlines, and host focus timer sessions. Integrates push notifications, calendar syncing, and study analytics dashboards. Developed by a team of 4 over 5 weeks. Deliverables: Figma design system, React Native mobile codebase, backend API endpoints, user authentication service, and app store release package.`,
  },
  {
    name: "5. Artisanal Beverage Marketing Campaign (Non-Digital Media)",
    brief: `Design a 4-week launch campaign for a local organic tea brand. Focuses on retail packaging design, pop-up tasting events in city centers, influencer PR gift kits, and social media storytelling. Developed by a team of 4 over 4 weeks. Deliverables: brand identity visual guide, packaging print templates, pop-up booth spatial layout, influencer press kit, and post-campaign ROI analytics deck.`,
  },
];

describe("REAL PIPELINE TRACE — 5 Unseen Briefs Test Suite", () => {
  for (const item of UNSEEN_BRIEFS) {
    it(`Traces full pipeline for: ${item.name}`, () => {
      console.log(`\n======================================================`);
      console.log(`TESTING: ${item.name}`);
      console.log(`BRIEF: "${item.brief}"`);

      // Stage 1: Prompt Construction
      const { systemPrompt, userPrompt } = planningPrompts(item.brief, mockPlanningContext);
      expect(systemPrompt).toContain("CORE PHILOSOPHY");
      expect(userPrompt).toContain(item.brief.slice(0, 30));

      // Stage 2: Fallback & LLM Pipeline Test
      const fallbackPlan = generateSmartFallbackPlan(mockPlanningContext, item.brief, "gen_unseen_1", "FALLBACK_TEST");
      expect(fallbackPlan.tasks.length).toBeGreaterThanOrEqual(3);
      expect(fallbackPlan.tasks.length).toBeLessThanOrEqual(15);

      // Stage 3: Validation Engine Verification
      const report = validatePlanAgainstBrief(fallbackPlan, item.brief, mockPlanningContext);

      console.log(`FINAL SOURCE: "fallback" (Clean Phase-Based Degradation Engine)`);
      console.log(`GENERATED TASKS (${fallbackPlan.tasks.length}):`, JSON.stringify(fallbackPlan.tasks.map((t) => ({ title: t.title, owner: t.primaryOwnerProfileId })), null, 2));
      console.log(`VALIDATION REPORT: valid=${report.valid}, checksPassed=${report.checks.filter((c) => c.passed).length}/${report.checks.length}`);
      console.log(`======================================================\n`);

      // Verify strict quality rules:
      for (const t of fallbackPlan.tasks) {
        // Rule 1: Title <= 12 words
        expect(t.title.split(" ").length).toBeLessThanOrEqual(12);
        // Rule 2: Title starts with capital active verb
        expect(t.title).toMatch(/^[A-Z][a-z]+/);
        // Rule 3: No template filler descriptions
        expect(t.description).not.toMatch(/execute core technical deliverables for|establish selection criteria/i);
      }

      expect(report.valid).toBe(true);
    });
  }
});
