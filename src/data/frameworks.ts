export type FrameworkPhase = {
  id: string;
  name: string;
  description: string;
  suggestedDeliverables: string[];
  suggestedSkills: string[];
  canOverlap: boolean;
  defaultDependencies: string[];
  reviewCheckpoint: boolean;
};

export type BuiltInFramework = {
  id: string;
  version: number;
  name: string;
  shortName: string;
  description: string;
  disciplines: string[];
  isBuiltIn: true;
  accent: "yellow" | "pink" | "green" | "blue" | "orange" | "magenta";
  phases: FrameworkPhase[];
};

type PhaseOptions = {
  canOverlap?: boolean;
  dependencies?: string[];
  reviewCheckpoint?: boolean;
};

function phase(
  id: string,
  name: string,
  description: string,
  suggestedDeliverables: string[],
  suggestedSkills: string[],
  options: PhaseOptions = {},
): FrameworkPhase {
  return {
    id,
    name,
    description,
    suggestedDeliverables,
    suggestedSkills,
    canOverlap: options.canOverlap ?? false,
    defaultDependencies: options.dependencies ?? [],
    reviewCheckpoint: options.reviewCheckpoint ?? false,
  };
}

export const BUILT_IN_FRAMEWORKS: BuiltInFramework[] = [
  {
    id: "design-nonlinear",
    version: 1,
    name: "Nonlinear Design Process",
    shortName: "Design & Creative",
    description:
      "A flexible discovery-to-delivery loop for visual, product, UX, interaction, and digital media work.",
    disciplines: ["UX/UI", "Graphic design", "Product design", "Digital media"],
    isBuiltIn: true,
    accent: "pink",
    phases: [
      phase(
        "empathise",
        "Empathise",
        "Understand the people, context, behaviours, and needs surrounding the design challenge.",
        ["Interview notes", "Observation summary", "Audience needs"],
        ["Interviewing", "Observation", "Synthesis"],
        { canOverlap: true },
      ),
      phase(
        "define-research",
        "Define / Research",
        "Frame the problem and gather evidence that sharpens the design direction.",
        ["Problem statement", "Research summary", "Design criteria"],
        ["Desk research", "Problem framing", "Critical analysis"],
        { canOverlap: true, dependencies: ["empathise"], reviewCheckpoint: true },
      ),
      phase(
        "ideate",
        "Ideate",
        "Generate, compare, and combine multiple responses before committing to one route.",
        ["Idea set", "Concept matrix", "Selected direction"],
        ["Brainstorming", "Sketching", "Concept evaluation"],
        { canOverlap: true, dependencies: ["define-research"] },
      ),
      phase(
        "prototype",
        "Prototype",
        "Make the idea tangible enough to inspect, demonstrate, and test.",
        ["Prototype", "Wireframes", "Interaction or visual system"],
        ["Prototyping", "Visual design", "Interaction design"],
        { canOverlap: true, dependencies: ["ideate"] },
      ),
      phase(
        "test",
        "Test",
        "Collect evidence from users or stakeholders and identify what should change.",
        ["Test plan", "Findings", "Prioritised issues"],
        ["Usability testing", "Facilitation", "Analysis"],
        { canOverlap: true, dependencies: ["prototype"], reviewCheckpoint: true },
      ),
      phase(
        "refine",
        "Refine",
        "Loop back to research, ideas, or prototypes and improve the chosen response.",
        ["Revised prototype", "Decision log", "Resolved issue list"],
        ["Iteration", "Design critique", "Quality assurance"],
        { canOverlap: true, dependencies: ["test"] },
      ),
      phase(
        "deliver",
        "Deliver",
        "Prepare the final design, documentation, and presentation for handoff.",
        ["Final artefact", "Handoff package", "Presentation"],
        ["Production", "Documentation", "Presentation"],
        { dependencies: ["refine"], reviewCheckpoint: true },
      ),
    ],
  },
  {
    id: "marketing-campaign",
    version: 1,
    name: "Campaign Development",
    shortName: "Marketing & Communications",
    description:
      "A research-led campaign flow connecting audience insight, creative production, channels, launch, and measurement.",
    disciplines: ["Marketing", "Advertising", "PR", "Content"],
    isBuiltIn: true,
    accent: "yellow",
    phases: [
      phase(
        "situation-audience",
        "Situation and Audience Research",
        "Establish the context, audience, competitors, and communication opportunity.",
        ["Audience profile", "Competitor review", "Situation summary"],
        ["Audience research", "Market research", "Insight writing"],
        { canOverlap: true },
      ),
      phase(
        "strategy-objectives",
        "Strategy and Objectives",
        "Set measurable communication objectives and the strategic route to reach them.",
        ["Campaign objectives", "Strategy statement", "Success measures"],
        ["Strategy", "Goal setting", "Stakeholder alignment"],
        { dependencies: ["situation-audience"], reviewCheckpoint: true },
      ),
      phase(
        "concept-development",
        "Concept Development",
        "Develop and select the central campaign idea, message, and creative direction.",
        ["Campaign idea", "Message framework", "Creative direction"],
        ["Concepting", "Copywriting", "Art direction"],
        { canOverlap: true, dependencies: ["strategy-objectives"] },
      ),
      phase(
        "content-production",
        "Content Production",
        "Create the campaign assets and adapt them to the intended formats.",
        ["Content plan", "Campaign assets", "Production schedule"],
        ["Content creation", "Design", "Production"],
        { canOverlap: true, dependencies: ["concept-development"] },
      ),
      phase(
        "channel-planning",
        "Channel Planning",
        "Choose channels, timing, ownership, and distribution based on audience behaviour.",
        ["Media plan", "Channel matrix", "Publishing calendar"],
        ["Media planning", "Scheduling", "Budgeting"],
        { canOverlap: true, dependencies: ["strategy-objectives"] },
      ),
      phase(
        "launch",
        "Launch",
        "Coordinate final checks, publishing, handoffs, and live campaign delivery.",
        ["Launch checklist", "Published campaign", "Issue log"],
        ["Coordination", "Publishing", "Quality assurance"],
        {
          dependencies: ["content-production", "channel-planning"],
          reviewCheckpoint: true,
        },
      ),
      phase(
        "measurement-optimisation",
        "Measurement and Optimisation",
        "Read performance evidence, report outcomes, and recommend improvements.",
        ["Performance report", "Learning summary", "Optimisation plan"],
        ["Analytics", "Evaluation", "Reporting"],
        { dependencies: ["launch"], reviewCheckpoint: true },
      ),
    ],
  },
  {
    id: "business-project",
    version: 1,
    name: "Business Project Framework",
    shortName: "Business & Entrepreneurship",
    description:
      "A structured path from opportunity and evidence to a viable operating proposal, risk view, and final pitch.",
    disciplines: ["Business", "Entrepreneurship", "Management", "Finance"],
    isBuiltIn: true,
    accent: "green",
    phases: [
      phase(
        "problem-opportunity",
        "Problem or Opportunity Identification",
        "Define the need, gap, or opportunity and why it deserves attention.",
        ["Opportunity statement", "Stakeholder map", "Initial assumptions"],
        ["Problem framing", "Stakeholder analysis", "Opportunity evaluation"],
      ),
      phase(
        "market-stakeholder",
        "Market and Stakeholder Research",
        "Test assumptions using market, user, competitor, and stakeholder evidence.",
        ["Market analysis", "Competitor map", "Stakeholder insights"],
        ["Market research", "Interviewing", "Data analysis"],
        { canOverlap: true, dependencies: ["problem-opportunity"] },
      ),
      phase(
        "solution-model",
        "Solution or Business Model",
        "Shape the value proposition, customer fit, and model for delivering value.",
        ["Value proposition", "Business model", "Solution concept"],
        ["Business modelling", "Service design", "Strategic thinking"],
        { dependencies: ["market-stakeholder"], reviewCheckpoint: true },
      ),
      phase(
        "financial-operational",
        "Financial and Operational Planning",
        "Explain resources, costs, revenue, workflows, and practical delivery.",
        ["Operating plan", "Budget", "Resource plan"],
        ["Financial planning", "Operations", "Budgeting"],
        { canOverlap: true, dependencies: ["solution-model"] },
      ),
      phase(
        "risk-assessment",
        "Risk Assessment",
        "Identify commercial, operational, ethical, and delivery risks with responses.",
        ["Risk register", "Mitigation plan", "Assumption log"],
        ["Risk analysis", "Scenario planning", "Governance"],
        { canOverlap: true, dependencies: ["solution-model"] },
      ),
      phase(
        "implementation-proposal",
        "Implementation Proposal",
        "Turn the model, operations, and risk work into a staged action plan.",
        ["Implementation roadmap", "Ownership plan", "Milestones"],
        ["Project planning", "Change planning", "Coordination"],
        {
          dependencies: ["financial-operational", "risk-assessment"],
          reviewCheckpoint: true,
        },
      ),
      phase(
        "evaluation-presentation",
        "Evaluation and Presentation",
        "Evaluate viability and communicate the proposal clearly to decision-makers.",
        ["Evaluation", "Final pitch", "Supporting report"],
        ["Evaluation", "Pitching", "Business writing"],
        { dependencies: ["implementation-proposal"], reviewCheckpoint: true },
      ),
    ],
  },
  {
    id: "architecture-spatial",
    version: 1,
    name: "Architectural Design Process",
    shortName: "Architecture & Spatial Design",
    description:
      "A nonlinear spatial design process balancing people, place, concept, technical constraints, documentation, and critique.",
    disciplines: ["Architecture", "Interior design", "Landscape", "Spatial design"],
    isBuiltIn: true,
    accent: "blue",
    phases: [
      phase(
        "site-context",
        "Site and Context Analysis",
        "Read the physical, social, environmental, and regulatory context.",
        ["Site analysis", "Context mapping", "Constraint summary"],
        ["Site research", "Mapping", "Environmental analysis"],
        { canOverlap: true },
      ),
      phase(
        "user-programme",
        "User and Programme Research",
        "Translate user needs and project requirements into a spatial programme.",
        ["User needs", "Programme schedule", "Adjacency study"],
        ["User research", "Brief analysis", "Programming"],
        { canOverlap: true },
      ),
      phase(
        "architectural-concept",
        "Concept Development",
        "Develop spatial concepts that respond to context, programme, and intent.",
        ["Concept diagrams", "Massing studies", "Design narrative"],
        ["Concept design", "Sketching", "Model making"],
        {
          canOverlap: true,
          dependencies: ["site-context", "user-programme"],
          reviewCheckpoint: true,
        },
      ),
      phase(
        "schematic-design",
        "Schematic Design",
        "Resolve the overall organisation, circulation, form, and major systems.",
        ["Plans and sections", "Spatial model", "Schematic package"],
        ["Drafting", "Spatial planning", "3D modelling"],
        { canOverlap: true, dependencies: ["architectural-concept"] },
      ),
      phase(
        "design-development",
        "Design Development",
        "Refine materials, structure, details, and technical coordination.",
        ["Developed drawings", "Material strategy", "Coordination notes"],
        ["Technical design", "Material research", "Coordination"],
        { canOverlap: true, dependencies: ["schematic-design"] },
      ),
      phase(
        "technical-documentation",
        "Technical Documentation",
        "Prepare accurate documentation for assessment, approval, or delivery.",
        ["Drawing set", "Schedules", "Specification notes"],
        ["Documentation", "Building systems", "Detailing"],
        { canOverlap: true, dependencies: ["design-development"] },
      ),
      phase(
        "visualisation-presentation",
        "Visualisation and Presentation",
        "Communicate the proposal through drawings, models, renders, and narrative.",
        ["Presentation boards", "Visualisations", "Physical or digital model"],
        ["Visualisation", "Layout", "Presentation"],
        { canOverlap: true, dependencies: ["design-development"] },
      ),
      phase(
        "review-revision",
        "Review and Revision",
        "Use critique and technical checks to revise earlier concept, schematic, or detailed work.",
        ["Critique response", "Revision log", "Final package"],
        ["Critique", "Iteration", "Quality assurance"],
        {
          dependencies: ["technical-documentation", "visualisation-presentation"],
          reviewCheckpoint: true,
        },
      ),
    ],
  },
  {
    id: "media-production",
    version: 1,
    name: "Production Pipeline",
    shortName: "Film, Animation & Media",
    description:
      "A dependency-aware production flow from development and script through assets, edit, revision, and release.",
    disciplines: ["Film", "Animation", "Motion", "Media production"],
    isBuiltIn: true,
    accent: "orange",
    phases: [
      phase(
        "development",
        "Development",
        "Define the purpose, format, audience, scope, and creative proposition.",
        ["Creative brief", "Format proposal", "Scope"],
        ["Creative development", "Scoping", "Pitching"],
      ),
      phase(
        "research-script",
        "Research and Script",
        "Develop the evidence, story, script, or narrative structure.",
        ["Research pack", "Script", "Treatment"],
        ["Research", "Writing", "Story development"],
        { dependencies: ["development"], reviewCheckpoint: true },
      ),
      phase(
        "pre-production",
        "Pre-production",
        "Plan the production through storyboards, schedules, roles, assets, and logistics.",
        ["Storyboard", "Production schedule", "Shot or asset list"],
        ["Storyboarding", "Scheduling", "Production planning"],
        { dependencies: ["research-script"], reviewCheckpoint: true },
      ),
      phase(
        "production",
        "Production",
        "Capture footage, record sound, animate scenes, or create the core media assets.",
        ["Footage or animation", "Audio", "Production assets"],
        ["Cinematography", "Animation", "Recording"],
        { dependencies: ["pre-production"] },
      ),
      phase(
        "post-production",
        "Post-production",
        "Assemble picture, motion, sound, graphics, and effects into a coherent cut.",
        ["Edit", "Sound mix", "Graphics and effects"],
        ["Editing", "Sound design", "Post-production"],
        { dependencies: ["production"] },
      ),
      phase(
        "testing-revision",
        "Testing and Revision",
        "Screen the work, collect feedback, and complete prioritised revisions.",
        ["Screening notes", "Revision list", "Final cut"],
        ["Audience testing", "Editing", "Quality assurance"],
        { dependencies: ["post-production"], reviewCheckpoint: true },
      ),
      phase(
        "distribution-presentation",
        "Distribution or Presentation",
        "Export, package, publish, or present the work for its intended context.",
        ["Master export", "Delivery package", "Presentation"],
        ["Exporting", "Distribution", "Presentation"],
        { dependencies: ["testing-revision"], reviewCheckpoint: true },
      ),
    ],
  },
  {
    id: "software-agile",
    version: 1,
    name: "Agile Development",
    shortName: "Software & IT",
    description:
      "An iterative backlog-based delivery flow supporting sprints, dependencies, blockers, testing, deployment, and review.",
    disciplines: ["Software", "Web", "Apps", "Information technology"],
    isBuiltIn: true,
    accent: "magenta",
    phases: [
      phase(
        "requirements",
        "Requirements",
        "Clarify users, outcomes, constraints, acceptance criteria, and non-functional needs.",
        ["Requirements", "User stories", "Acceptance criteria"],
        ["Requirements analysis", "User research", "Technical writing"],
        { canOverlap: true },
      ),
      phase(
        "backlog-planning",
        "Backlog and Planning",
        "Prioritise work, estimate effort, identify dependencies, and define a sprint goal.",
        ["Prioritised backlog", "Sprint plan", "Dependency map"],
        ["Estimation", "Prioritisation", "Sprint planning"],
        { canOverlap: true, dependencies: ["requirements"], reviewCheckpoint: true },
      ),
      phase(
        "ux-technical-design",
        "UX / Technical Design",
        "Design the experience, architecture, data, interfaces, and implementation approach.",
        ["UX flow", "Technical design", "Data or API plan"],
        ["UX design", "Architecture", "Data modelling"],
        { canOverlap: true, dependencies: ["requirements"] },
      ),
      phase(
        "software-development",
        "Development",
        "Implement backlog items in small reviewable increments.",
        ["Working increment", "Code review", "Technical notes"],
        ["Programming", "Version control", "Code review"],
        {
          canOverlap: true,
          dependencies: ["backlog-planning", "ux-technical-design"],
        },
      ),
      phase(
        "software-testing",
        "Testing",
        "Verify behaviour, usability, accessibility, security, and integration.",
        ["Test results", "Defect list", "Accepted increment"],
        ["Automated testing", "QA", "Accessibility testing"],
        {
          canOverlap: true,
          dependencies: ["software-development"],
          reviewCheckpoint: true,
        },
      ),
      phase(
        "deployment",
        "Deployment",
        "Release the verified increment with configuration, migration, and rollback readiness.",
        ["Deployment", "Release notes", "Rollback plan"],
        ["DevOps", "Release management", "Monitoring"],
        { dependencies: ["software-testing"] },
      ),
      phase(
        "review-iteration",
        "Review and Iteration",
        "Review outcomes and feedback, then return learning to requirements and the backlog.",
        ["Sprint review", "Retrospective", "Updated backlog"],
        ["Facilitation", "Evaluation", "Continuous improvement"],
        { dependencies: ["deployment"], reviewCheckpoint: true },
      ),
    ],
  },
  {
    id: "academic-research",
    version: 1,
    name: "Research Project Framework",
    shortName: "Academic Research",
    description:
      "A rigorous question-to-submission process for evidence, ethics, methods, analysis, discussion, and academic writing.",
    disciplines: ["Research", "Thesis", "Capstone", "Academic writing"],
    isBuiltIn: true,
    accent: "blue",
    phases: [
      phase(
        "research-question",
        "Research Question",
        "Define a focused, feasible, and meaningful question or hypothesis.",
        ["Research question", "Scope statement", "Initial rationale"],
        ["Question design", "Scoping", "Academic reasoning"],
      ),
      phase(
        "literature-review",
        "Literature Review",
        "Map existing knowledge, debates, gaps, concepts, and relevant evidence.",
        ["Source matrix", "Literature synthesis", "Conceptual frame"],
        ["Literature searching", "Critical reading", "Synthesis"],
        { canOverlap: true, dependencies: ["research-question"] },
      ),
      phase(
        "methodology",
        "Methodology",
        "Select and justify the design, methods, sample, measures, and analysis approach.",
        ["Method", "Sampling plan", "Analysis plan"],
        ["Research design", "Methods", "Academic writing"],
        { dependencies: ["literature-review"], reviewCheckpoint: true },
      ),
      phase(
        "ethics-preparation",
        "Ethics / Preparation",
        "Prepare ethics, instruments, permissions, pilots, or data-management arrangements where relevant.",
        ["Ethics materials", "Research instruments", "Data plan"],
        ["Research ethics", "Instrument design", "Data management"],
        { canOverlap: true, dependencies: ["methodology"], reviewCheckpoint: true },
      ),
      phase(
        "data-collection",
        "Data Collection",
        "Collect or compile evidence consistently according to the approved method.",
        ["Dataset or corpus", "Field notes", "Collection log"],
        ["Data collection", "Interviewing", "Documentation"],
        { dependencies: ["ethics-preparation"] },
      ),
      phase(
        "analysis",
        "Analysis",
        "Process and interpret the evidence using the planned analytical approach.",
        ["Analysis", "Figures or themes", "Results summary"],
        ["Quantitative analysis", "Qualitative analysis", "Visualisation"],
        { dependencies: ["data-collection"] },
      ),
      phase(
        "discussion",
        "Discussion",
        "Connect findings to the question, literature, limitations, and implications.",
        ["Discussion outline", "Interpretation", "Limitations"],
        ["Critical analysis", "Argumentation", "Synthesis"],
        { dependencies: ["analysis"] },
      ),
      phase(
        "writing",
        "Writing",
        "Develop the full report, thesis, paper, or research presentation.",
        ["Draft", "References", "Figures and appendices"],
        ["Academic writing", "Editing", "Referencing"],
        { canOverlap: true, dependencies: ["discussion"] },
      ),
      phase(
        "review-submission",
        "Review and Submission",
        "Revise for argument, evidence, structure, integrity, and submission requirements.",
        ["Reviewed manuscript", "Final report", "Submission package"],
        ["Peer review", "Proofreading", "Submission preparation"],
        { dependencies: ["writing"], reviewCheckpoint: true },
      ),
    ],
  },
];
