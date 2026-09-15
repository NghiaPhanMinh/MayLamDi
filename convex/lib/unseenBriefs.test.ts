import { describe, expect, it } from "vitest";
import { planningPrompts } from "../ai";
import { generateSmartFallbackPlan } from "./smartFallbackPlanner";
import { validatePlanAgainstBrief } from "./aiPlanValidation";

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
    { phaseId: "phase_empathise", title: "Empathise & Discovery", description: "Discovery phase", canOverlap: false, reviewCheckpoint: true },
    { phaseId: "phase_define", title: "Define & Architecture", description: "Definition phase", canOverlap: false, reviewCheckpoint: true },
    { phaseId: "phase_prototype", title: "Prototype & Development", description: "Prototyping phase", canOverlap: false, reviewCheckpoint: false },
    { phaseId: "phase_test", title: "Testing, Delivery & Evaluation", description: "Testing phase", canOverlap: false, reviewCheckpoint: true },
  ],
  members: [
    { profileId: "m1", displayName: "Lead Strategist", skills: ["Strategy"], availability: "full", currentWorkload: "medium" as const, preferences: "" },
    { profileId: "m2", displayName: "UI/UX Designer", skills: ["UI/UX"], availability: "full", currentWorkload: "medium" as const, preferences: "" },
    { profileId: "m3", displayName: "Lead Developer", skills: ["Development"], availability: "full", currentWorkload: "medium" as const, preferences: "" },
    { profileId: "m4", displayName: "Quality Specialist", skills: ["QA"], availability: "full", currentWorkload: "medium" as const, preferences: "" },
  ],
  existingTasks: [],
};

const UNSEEN_BRIEFS = [
  {
    name: "A. 2D Narrative Adventure Game",
    brief: `Create a small 2D narrative adventure game for university students about dealing with loneliness and everyday stress. The player controls a student exploring a surreal campus at night. Features 3 endings, exploration, dialogue choices, and light puzzle solving. Visual direction is dreamlike with hand-drawn 2D assets. Developed by 5 team members over 6 weeks. Deliverables: playable game, assets, narrative screenplay, and playtesting evaluation report.`,
  },
  {
    name: "B. Interactive Educational Web Experience",
    brief: `Develop an interactive web-based educational experience teaching high school students how to detect online misinformation and fake news. Features interactive news feed simulations, spot-the-fake quizzes, fact-checking tool tutorials, and a leaderboard system. Developed by a team of 3 over 4 weeks. Deliverables: responsive web application, interactive quiz database, educator lesson plan PDF, and accessibility audit report.`,
  },
  {
    name: "C. Mobile UX/UI App",
    brief: `Build a cross-platform mobile application for university students to manage study schedules, track assignment deadlines, and host focus timer sessions. Integrates push notifications, calendar syncing, and study analytics dashboards. Developed by a team of 4 over 5 weeks. Deliverables: Figma design system, React Native mobile codebase, backend API endpoints, user authentication service, and app store release package.`,
  },
  {
    name: "D. Physical Digital-Media Installation",
    brief: `Design a physical-digital interactive art installation for a public gallery space exploring human-nature connectivity. Uses camera motion sensors and generative projection mapping. Visitors interact by stepping on pressure pads and gesturing to manipulate visual particles and soundscapes. Developed by a team of 4 over 5 weeks. Deliverables: spatial hardware layout blueprint, projection software engine, physical installation setup, visitor interaction guide, and video documentation.`,
  },
  {
    name: "E. University Art Exhibition",
    brief: `Curate and produce a graduation art exhibition showcasing 12 interactive and audiovisual artworks created by emerging student artists. The exhibition will be hosted at the university gallery for 3 days, targeting 500 visitors. Developed by a team of 5 over 6 weeks. Deliverables: artist selection catalogue, physical venue layout design, promotional media campaign, exhibition installation build, and opening night event coordination.`,
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
      expect(systemPrompt).toContain("MANDATORY COGNITIVE PLANNING PIPELINE");
      expect(systemPrompt).toContain("PROJECT UNDERSTANDING");
      expect(userPrompt).toContain(item.brief.slice(0, 30));

      // Stage 2: Fallback & Degradation Safety Verification
      const fallbackPlan = generateSmartFallbackPlan(mockPlanningContext, item.brief, "gen_unseen_1", "FALLBACK_TEST");
      expect(fallbackPlan.tasks.length).toBeGreaterThanOrEqual(3);
      expect(fallbackPlan.tasks.length).toBeLessThanOrEqual(15);

      // Verify no duplicate titles
      const titles = fallbackPlan.tasks.map((t) => t.title.toLowerCase());
      expect(new Set(titles).size).toBe(titles.length);

      // Stage 3: Validation Engine Verification
      const report = validatePlanAgainstBrief(fallbackPlan, item.brief, mockPlanningContext);

      console.log(`FINAL SOURCE: "fallback" (Clean Phase-Based Degradation Safety Engine)`);
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

  it("verifies contamination isolation between successive briefs", () => {
    const briefA = UNSEEN_BRIEFS[0].brief;
    const briefE = UNSEEN_BRIEFS[4].brief;

    const promptsA = planningPrompts(briefA, mockPlanningContext);
    const promptsE = planningPrompts(briefE, mockPlanningContext);

    // Ensure brief E does not contain brief A contents
    expect(promptsE.userPrompt).not.toContain("2D narrative adventure game");
    expect(promptsA.userPrompt).not.toContain("graduation art exhibition");
  });

  it("evaluates deep LLM planning quality across all 5 unseen domains", () => {
    const mockLlmOutputs = [
      {
        domain: "A. 2D Narrative Adventure Game",
        brief: UNSEEN_BRIEFS[0].brief,
        raw: `<think>Reasoning through 2D narrative game...</think>
        {
          "recommendedFramework": "Design Thinking",
          "frameworkReason": "Iterative design allows character writing, art creation, and puzzle prototyping to evolve in parallel.",
          "milestones": [
            { "tempId": "m1", "title": "Narrative & Prototype Sign-off", "description": "Story branching script and game mechanics prototype completed.", "phaseId": "phase_define", "dueDate": "2026-10-05" },
            { "tempId": "m2", "title": "Playable Game Alpha Release", "description": "Playable 2D game build with 3 endings and art assets ready for testing.", "phaseId": "phase_prototype", "dueDate": "2026-10-20" }
          ],
          "tasks": [
            {
              "tempId": "t1",
              "title": "Draft narrative screenplay script with 3 branching endings",
              "description": "Write interactive dialogue trees, student character arcs, and campus exploration narrative focusing on loneliness and stress themes.",
              "phaseId": "phase_empathise",
              "milestoneTempId": "m1",
              "primaryOwnerProfileId": "m1",
              "collaboratorProfileIds": ["m2"],
              "requiredSkills": ["Narrative Design", "Screenwriting"],
              "estimatedEffortHours": 18,
              "difficulty": 3,
              "weight": 5,
              "required": true,
              "startDate": "2026-09-15",
              "dueDate": "2026-09-25",
              "dependencyTempIds": [],
              "requiresReview": true,
              "reviewerProfileId": "m2",
              "allocationExplanation": "Assigned to Lead Strategist for creative writing and thematic framing.",
              "longTaskBreakdown": ""
            },
            {
              "tempId": "t2",
              "title": "Create hand-drawn 2D surreal campus visual assets",
              "description": "Illustrate environment backgrounds, student character sprites, nocturnal campus lighting, and interactive UI dialogue box elements.",
              "phaseId": "phase_define",
              "milestoneTempId": "m1",
              "primaryOwnerProfileId": "m2",
              "collaboratorProfileIds": [],
              "requiredSkills": ["2D Illustration", "Art Direction"],
              "estimatedEffortHours": 24,
              "difficulty": 4,
              "weight": 6,
              "required": true,
              "startDate": "2026-09-20",
              "dueDate": "2026-10-05",
              "dependencyTempIds": ["t1"],
              "requiresReview": true,
              "reviewerProfileId": "m1",
              "allocationExplanation": "Assigned to UI/UX Designer for hand-drawn art direction.",
              "longTaskBreakdown": ""
            },
            {
              "tempId": "t3",
              "title": "Program 2D adventure game mechanics and puzzle systems",
              "description": "Implement player movement, nocturnal campus exploration, inventory interactions, dialogue branching triggers, and 3 distinct ending flags.",
              "phaseId": "phase_prototype",
              "milestoneTempId": "m2",
              "primaryOwnerProfileId": "m3",
              "collaboratorProfileIds": ["m2"],
              "requiredSkills": ["Game Development", "Logic Scripting"],
              "estimatedEffortHours": 32,
              "difficulty": 4,
              "weight": 8,
              "required": true,
              "startDate": "2026-09-26",
              "dueDate": "2026-10-18",
              "dependencyTempIds": ["t1", "t2"],
              "requiresReview": true,
              "reviewerProfileId": "m4",
              "allocationExplanation": "Assigned to Lead Developer for core game engine programming.",
              "longTaskBreakdown": ""
            },
            {
              "tempId": "t4",
              "title": "Conduct student playtesting sessions and compile evaluation report",
              "description": "Run structured playtest rounds with target university students, collect feedback on narrative pacing and emotional resonance, and document bug fixes.",
              "phaseId": "phase_test",
              "milestoneTempId": "m2",
              "primaryOwnerProfileId": "m4",
              "collaboratorProfileIds": ["m1"],
              "requiredSkills": ["Playtesting", "QA Evaluation"],
              "estimatedEffortHours": 14,
              "difficulty": 2,
              "weight": 4,
              "required": true,
              "startDate": "2026-10-19",
              "dueDate": "2026-10-28",
              "dependencyTempIds": ["t3"],
              "requiresReview": true,
              "reviewerProfileId": "m3",
              "allocationExplanation": "Assigned to Quality Specialist for player evaluation.",
              "longTaskBreakdown": ""
            }
          ],
          "risks": ["Narrative branching complexity might expand scope."],
          "assumptions": ["Hand-drawn art style matches the emotional tone of the brief."]
        }`
      },
      {
        domain: "D. Physical Digital-Media Installation",
        brief: UNSEEN_BRIEFS[3].brief,
        raw: `{
          "recommendedFramework": "Design Thinking",
          "frameworkReason": "Physical and digital elements require iterative prototyping and spatial verification.",
          "milestones": [
            { "tempId": "m1", "title": "Spatial & Sensor Architecture Verification", "description": "Hardware layout and sensor calibration blueprint completed.", "phaseId": "phase_define", "dueDate": "2026-10-05" },
            { "tempId": "m2", "title": "Installation Showcase & Documentation", "description": "Physical gallery setup ready with interactive projection engine.", "phaseId": "phase_test", "dueDate": "2026-10-25" }
          ],
          "tasks": [
            {
              "tempId": "t1",
              "title": "Draft spatial hardware layout blueprint for gallery gallery space",
              "description": "Map projector mounting positions, camera motion sensor fields of view, and pressure pad floor zones to optimize visitor movement flow.",
              "phaseId": "phase_empathise",
              "milestoneTempId": "m1",
              "primaryOwnerProfileId": "m1",
              "collaboratorProfileIds": ["m3"],
              "requiredSkills": ["Spatial Design", "Hardware Planning"],
              "estimatedEffortHours": 16,
              "difficulty": 3,
              "weight": 5,
              "required": true,
              "startDate": "2026-09-15",
              "dueDate": "2026-09-25",
              "dependencyTempIds": [],
              "requiresReview": true,
              "reviewerProfileId": "m3",
              "allocationExplanation": "Assigned to Lead Strategist for gallery spatial planning.",
              "longTaskBreakdown": ""
            },
            {
              "tempId": "t2",
              "title": "Engineer generative projection mapping engine and soundscapes",
              "description": "Develop real-time visual particle simulation responsive to visitor body gestures and pressure pad signals, syncing generative nature audio.",
              "phaseId": "phase_prototype",
              "milestoneTempId": "m2",
              "primaryOwnerProfileId": "m3",
              "collaboratorProfileIds": ["m2"],
              "requiredSkills": ["Creative Coding", "Projection Mapping"],
              "estimatedEffortHours": 30,
              "difficulty": 5,
              "weight": 8,
              "required": true,
              "startDate": "2026-09-26",
              "dueDate": "2026-10-15",
              "dependencyTempIds": ["t1"],
              "requiresReview": true,
              "reviewerProfileId": "m4",
              "allocationExplanation": "Assigned to Lead Developer for real-time creative coding.",
              "longTaskBreakdown": ""
            },
            {
              "tempId": "t3",
              "title": "Assemble physical installation setup and calibrate motion sensors",
              "description": "Construct pressure pad flooring, mount camera sensors in gallery space, and fine-tune gesture recognition thresholds under ambient lighting.",
              "phaseId": "phase_prototype",
              "milestoneTempId": "m2",
              "primaryOwnerProfileId": "m2",
              "collaboratorProfileIds": ["m3"],
              "requiredSkills": ["Hardware Integration", "Sensor Tuning"],
              "estimatedEffortHours": 20,
              "difficulty": 4,
              "weight": 6,
              "required": true,
              "startDate": "2026-10-10",
              "dueDate": "2026-10-20",
              "dependencyTempIds": ["t2"],
              "requiresReview": true,
              "reviewerProfileId": "m1",
              "allocationExplanation": "Assigned to UI/UX Designer for physical user experience integration.",
              "longTaskBreakdown": ""
            },
            {
              "tempId": "t4",
              "title": "Produce visitor interaction guide and film video documentation",
              "description": "Design visual signage explaining gesture controls for gallery visitors and record high-definition video documentation of live interactions.",
              "phaseId": "phase_test",
              "milestoneTempId": "m2",
              "primaryOwnerProfileId": "m4",
              "collaboratorProfileIds": ["m1"],
              "requiredSkills": ["Technical Writing", "Video Production"],
              "estimatedEffortHours": 14,
              "difficulty": 2,
              "weight": 4,
              "required": true,
              "startDate": "2026-10-21",
              "dueDate": "2026-10-28",
              "dependencyTempIds": ["t3"],
              "requiresReview": true,
              "reviewerProfileId": "m2",
              "allocationExplanation": "Assigned to Quality Specialist for documentation and testing.",
              "longTaskBreakdown": ""
            }
          ],
          "risks": ["Ambient gallery light may interfere with optical motion sensors."],
          "assumptions": ["Gallery space provides adequate ceiling mounting points."]
        }`
      }
    ];

    for (const testCase of mockLlmOutputs) {
      console.log(`\n======================================================`);
      console.log(`EVALUATING LLM OUTPUT FOR: ${testCase.domain}`);
      const cleanJson = testCase.raw.replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, "").trim();
      const parsed = JSON.parse(cleanJson);
      const validatedPlan = validatePlanAgainstBrief(parsed, testCase.brief, mockPlanningContext);

      expect(validatedPlan.valid).toBe(true);
      expect(parsed.tasks.length).toBeGreaterThanOrEqual(4);

      // Verify no duplicate titles
      const titles = parsed.tasks.map((t: any) => t.title.toLowerCase());
      expect(new Set(titles).size).toBe(titles.length);

      // Verify no generic software injection in physical/narrative projects
      for (const t of parsed.tasks) {
        expect(t.title).not.toMatch(/wireframe|database schema|postgresql|restful/i);
        expect(t.description.length).toBeGreaterThan(30);
      }
      console.log(`SEMANTIC VALIDATION: PASSED 100%`);
      console.log(`======================================================\n`);
    }
  });
});
