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
    id: "software-web-app",
    version: 1,
    name: "Software & Web/App Engineering",
    shortName: "Software & Web/App",
    description: "End-to-end web, mobile, and software development lifecycle from requirements and architecture to live SSL deployment and asset packaging.",
    disciplines: ["Frontend", "Backend", "Fullstack", "DevOps", "Web Development"],
    isBuiltIn: true,
    accent: "blue",
    phases: [
      phase("req-ideation", "Requirements Analysis & Ideation Selection", "Analyze brief constraints, evaluate 3 target concepts, and define system scope.", ["Requirement Spec", "Ideation Selection Matrix"], ["Requirements Analysis", "System Design"]),
      phase("arch-design", "Architecture & Component Hierarchy Design", "Design data models, Convex/SQL schema, API specifications, and UI component taxonomy.", ["Architecture Diagram", "API Spec", "Design Tokens"], ["Software Architecture", "Database Design"], { dependencies: ["req-ideation"] }),
      phase("frontend-layout", "Responsive Frontend Structure & HTML Layout", "Build semantic HTML5 elements, CSS3 Flexbox/Grid layouts, and responsive viewports.", ["HTML Skeleton", "Responsive CSS Stylesheet"], ["HTML5", "CSS3", "Responsive Design"], { canOverlap: true, dependencies: ["arch-design"] }),
      phase("client-interactivity", "Client Interactivity & State Management", "Implement JavaScript event handlers, DOM manipulations, form validation, and client state.", ["Interactive Views", "Client State Handlers"], ["JavaScript", "TypeScript", "React"], { canOverlap: true, dependencies: ["frontend-layout"] }),
      phase("backend-mutations", "Backend Mutations, API & Database Logic", "Develop server mutations, REST/GraphQL endpoints, database queries, and error boundaries.", ["API Endpoints", "Database Mutations"], ["Node.js", "Convex", "API Integration"], { canOverlap: true, dependencies: ["arch-design"] }),
      phase("devops-deployment", "DevOps & Live Hosting Deployment", "Deploy application to public hosting (GitHub Pages, Vercel, Netlify), setup SSL and domain.", ["Live Webpage URL", "Deployment Build"], ["DevOps", "Hosting", "Deployment"], { dependencies: ["client-interactivity", "backend-mutations"], reviewCheckpoint: true }),
      phase("packaging-summary", "Asset Archiving & Technical Summary Documentation", "Bundle HTML/CSS/JS assets into a zipped archive and write a technical exploration summary note.", ["Zipped Asset Archive", "Technical Exploration Note"], ["Documentation", "Technical Writing"], { dependencies: ["devops-deployment"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "ui-ux-product-strategy",
    version: 1,
    name: "UI/UX Design & Product Strategy",
    shortName: "UI/UX & Product",
    description: "Human-centered product design process connecting user research, information architecture, lo-fi wireframes, design systems, and hi-fi prototypes.",
    disciplines: ["UI Design", "UX Research", "Product Strategy", "Figma Prototyping"],
    isBuiltIn: true,
    accent: "pink",
    phases: [
      phase("user-research", "User Research & Discovery", "Analyze competitor products, conduct user interviews, build Personas, and define Empathy Maps.", ["User Interview Notes", "User Personas"], ["UX Research", "User Interviewing"]),
      phase("information-arch", "User Journey & Information Architecture", "Map user flow diagrams, sitemap hierarchy, and navigation taxonomy.", ["User Flow Diagram", "Sitemap"], ["Information Architecture", "User Flows"], { dependencies: ["user-research"] }),
      phase("lofi-wireframes", "Lo-Fi Wireframing", "Sketch low-fidelity black-and-white layouts, test structural placement, and organize information hierarchy.", ["Lo-Fi Wireframes", "Layout Sketches"], ["Wireframing", "Layout Design"], { canOverlap: true, dependencies: ["information-arch"] }),
      phase("design-system", "Design System & Tokens", "Design color palettes, typography scales, icon sets, and reusable UI component tokens in Figma.", ["Figma Design System", "Component Library"], ["Design System", "Figma"], { dependencies: ["lofi-wireframes"] }),
      phase("hifi-prototyping", "Hi-Fi UI & Interactive Prototyping", "Complete high-fidelity screens, connect interactive prototype flows, and design micro-interactions.", ["Hi-Fi Prototype", "Interactive Screens"], ["UI Design", "Figma Prototyping"], { dependencies: ["design-system"] }),
      phase("usability-testing", "Usability Testing & Iteration", "Conduct user usability testing sessions, identify friction points, and iterate interface designs.", ["Usability Test Report", "Iteration Log"], ["Usability Testing", "UX Evaluation"], { dependencies: ["hifi-prototyping"], reviewCheckpoint: true }),
      phase("developer-handoff", "Developer Handoff Specs", "Export design redlines, component tokens, and production assets for engineering handoff.", ["Developer Handoff Package", "Redline Specs"], ["Design Handoff", "Documentation"], { dependencies: ["usability-testing"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "game-dev-3d-art",
    version: 1,
    name: "Game Development & 3D Interactive Art",
    shortName: "Game Dev & 3D",
    description: "End-to-end interactive game engine pipeline covering game design documents, 3D asset modeling, level assembly, mechanics scripting, and build optimization.",
    disciplines: ["Game Design", "3D Modeling", "Unity/Unreal", "C# Gameplay"],
    isBuiltIn: true,
    accent: "magenta",
    phases: [
      phase("gdd-design", "Game Design Document (GDD & Core Loop)", "Draft game mechanics, player controls, physics rules, scoring system, and HUD overlay.", ["Game Design Document", "Core Loop Spec"], ["Game Design", "Game Balance"]),
      phase("3d-asset-production", "3D Asset Production & Rigging", "Mesh 3D character/prop models, unwrap UVs, paint textures, and set up skeletal rigging.", ["3D Character Models", "Skeletal Rigs"], ["Blender", "Maya", "3D Art"], { canOverlap: true, dependencies: ["gdd-design"] }),
      phase("level-assembly", "Level Design & Environment Assembly", "Build scene geometry, place environmental props, set up collision bounds, and configure dynamic lighting.", ["Level Environment", "Collision Bounds"], ["Level Design", "Unity/Unreal"], { canOverlap: true, dependencies: ["3d-asset-production"] }),
      phase("gameplay-scripting", "Gameplay Programming & Physics", "Script player movement controller, collision triggers, camera tracking, and game loop logic.", ["Player Controller Script", "Game State Logic"], ["C#", "C++", "Gameplay Dev"], { dependencies: ["level-assembly"] }),
      phase("vfx-audio-assembly", "VFX & Audio Assembly", "Integrate particle systems, visual shaders, background music tracks, and interactive SFX.", ["VFX Particle Systems", "Audio Mix"], ["VFX", "Sound Design"], { canOverlap: true, dependencies: ["gameplay-scripting"] }),
      phase("fps-playtesting", "FPS Performance & Playtesting", "Stress test frame rates, fix collision clipping bugs, and balance level difficulty.", ["Playtest Report", "Bug Fix Log"], ["QA", "Game Optimization"], { dependencies: ["vfx-audio-assembly"], reviewCheckpoint: true }),
      phase("executable-release", "Executable Build Release", "Export standalone release build (EXE/APK/WebGL), package assets, and write player guide.", ["Executable Release Build", "Player Guide"], ["Build Deployment", "Packaging"], { dependencies: ["fps-playtesting"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "data-science-ai",
    version: 1,
    name: "Data Science & AI Engineering",
    shortName: "Data Science & AI",
    description: "End-to-end data mining and machine learning workflow from data ingestion and cleaning to feature engineering, model training, evaluation, and Docker deployment.",
    disciplines: ["Data Mining", "Machine Learning", "Python", "Docker API"],
    isBuiltIn: true,
    accent: "green",
    phases: [
      phase("problem-ingestion", "Problem Definition & Data Ingestion", "Define predictive objectives, ingest raw datasets via APIs, SQL databases, or web scraping.", ["Raw Dataset", "Data Dictionary"], ["Data Collection", "SQL"]),
      phase("cleaning-preprocessing", "Data Cleaning & Preprocessing", "Handle missing values, filter outliers, normalize numerical distributions, and encode categorical data.", ["Cleaned Dataset", "Preprocessing Pipeline"], ["Data Cleaning", "Pandas"], { dependencies: ["problem-ingestion"] }),
      phase("exploratory-eda", "Exploratory Data Analysis (EDA)", "Plot correlation matrices, generate distribution charts, and identify key data signals.", ["EDA Report", "Feature Heatmaps"], ["Data Analysis", "Matplotlib/Seaborn"], { canOverlap: true, dependencies: ["cleaning-preprocessing"] }),
      phase("feature-engineering", "Feature Engineering", "Select predictive features, transform variables, and split data into Train/Validation/Test sets.", ["Feature Set", "Train/Test Splits"], ["Feature Engineering", "Scikit-Learn"], { dependencies: ["exploratory-eda"] }),
      phase("model-training", "Model Training & Hyperparameter Tuning", "Train algorithms (Random Forest, XGBoost, CNN/Transformer) and tune hyperparameters.", ["Trained Model Checkpoint", "Hyperparameter Log"], ["Machine Learning", "PyTorch/TensorFlow"], { dependencies: ["feature-engineering"] }),
      phase("model-evaluation", "Model Evaluation", "Evaluate accuracy metrics (Accuracy, Precision, Recall, F1-Score, RMSE) and plot confusion matrices.", ["Model Evaluation Metrics", "Confusion Matrix"], ["Model Testing", "Statistics"], { dependencies: ["model-training"], reviewCheckpoint: true }),
      phase("api-deployment", "Model API Deployment & Monitoring", "Package model into REST API (FastAPI/Flask), deploy Docker container, and build monitoring dashboard.", ["Docker Model API Container", "Monitoring Dashboard"], ["Docker", "FastAPI", "DevOps"], { dependencies: ["model-evaluation"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "creative-animation-video",
    version: 1,
    name: "Creative, Animation & Video Production",
    shortName: "Creative & Video",
    description: "Complete media production pipeline spanning moodboard creative direction, screenplay writing, storyboarding, animation, video editing, and 4K master rendering.",
    disciplines: ["Video Editing", "Motion Graphics", "2D/3D Animation", "Screenplay"],
    isBuiltIn: true,
    accent: "orange",
    phases: [
      phase("moodboard-direction", "Research & Creative Direction", "Gather visual references, define color palette, and set artistic direction moodboards.", ["Visual Moodboard", "Art Direction Spec"], ["Creative Direction", "Art Direction"]),
      phase("scriptwriting-screenplay", "Scriptwriting & Screenplay Breakdown", "Draft literary script, format dialogue screenplay, and map scene timing beats.", ["Literary Script", "Formatted Screenplay"], ["Scriptwriting", "Screenplay"]),
      phase("storyboard-animatic", "Storyboarding & Animatic Framing", "Draw visual storyboard panels, set camera angles, and build timing animatics.", ["Visual Storyboard", "Timing Animatic"], ["Storyboarding", "Animatic"], { dependencies: ["scriptwriting-screenplay"] }),
      phase("asset-character-prod", "Asset & Character Production", "Draw character concepts, design backgrounds, paint keyframe art, and format production props.", ["Character Sheets", "Background Assets"], ["Character Design", "Illustration"], { canOverlap: true, dependencies: ["storyboard-animatic"] }),
      phase("voiceover-keyframing", "Voiceover & Keyframe Animation", "Record dialogue tracks, animate character keyframes, sync lip movements, and design SFX.", ["Animation Sequences", "Voiceover Audio"], ["Animation", "Voiceover", "SFX"], { dependencies: ["asset-character-prod"] }),
      phase("editing-vfx-grading", "Editing, VFX & Color Grading", "Cut video sequences, composite motion graphics VFX, master multi-track audio, and grade colors.", ["Edits Cut", "VFX Composites", "Color Graded Master"], ["Video Editing", "VFX", "Color Grading"], { dependencies: ["voiceover-keyframing"], reviewCheckpoint: true }),
      phase("master-render-export", "Master Render & Export", "Export master video files (MP4/ProRes 4K), generate promotional stills, and archive project assets.", ["Master Video File (4K)", "Showcase Stills"], ["Video Export", "Media Archiving"], { dependencies: ["editing-vfx-grading"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "architecture-interior",
    version: 1,
    name: "Architecture & Interior Design",
    shortName: "Architecture & Interior",
    description: "Comprehensive spatial design methodology connecting site survey, architectural concept massing, interior materials, 3D visualization, and BOQ cost estimation.",
    disciplines: ["Architecture", "Interior Design", "3D Rendering", "Construction Docs"],
    isBuiltIn: true,
    accent: "yellow",
    phases: [
      phase("site-zoning-survey", "Site Survey & Zoning Analysis", "Measure existing site dimensions, analyze sun/wind orientation, local zoning laws, and space needs.", ["Site Survey Plan", "Zoning Analysis"], ["Site Survey", "Architecture"]),
      phase("spatial-concept", "Architectural Concept Design", "Sketch space concepts, create functional zoning diagrams, and define building massing.", ["Concept Sketches", "Functional Zoning Diagram"], ["Concept Design", "Massing"], { dependencies: ["site-zoning-survey"] }),
      phase("3d-exterior-modeling", "3D Architecture Modeling", "Build 3D massing model (Revit/SketchUp/Rhino), design exterior facades, and select exterior materials.", ["3D Exterior Model", "Facade Specs"], ["Revit", "SketchUp", "3D Modeling"], { canOverlap: true, dependencies: ["spatial-concept"] }),
      phase("interior-materials", "Interior Layout & Materials", "Plan interior furniture placement, select materials (wood, stone, glass), and design lighting layouts.", ["Interior Layout Plan", "Material Palette"], ["Interior Design", "Lighting"], { dependencies: ["3d-exterior-modeling"] }),
      phase("3d-photorealistic-viz", "Photorealistic 3D Visualization", "Set up cameras, natural/artificial lighting, and render high-resolution 3D perspective views.", ["3D Renderings", "Perspective Views"], ["V-Ray/Lumion", "3D Rendering"], { dependencies: ["interior-materials"] }),
      phase("construction-drawings", "Construction Working Drawings", "Draft architectural, structural, MEP drawings, construction details, and material schedules.", ["Working Drawing Set", "Detail Specs"], ["AutoCAD", "Drafting"], { dependencies: ["3d-photorealistic-viz"], reviewCheckpoint: true }),
      phase("boq-cost-estimation", "BOQ Cost Estimation & Presentation", "Extract quantity takeoffs (BOQ), calculate construction cost estimates, and compile presentation deck.", ["BOQ Cost Estimate", "Presentation Deck"], ["Cost Estimation", "Presentation"], { dependencies: ["construction-drawings"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "event-exhibition-mgmt",
    version: 1,
    name: "Event Planning & Exhibition Management",
    shortName: "Event & Exhibition",
    description: "End-to-end event production framework covering curation criteria, spatial floorplans, promotional branding, AV hardware setup, live management, and media archiving.",
    disciplines: ["Event Management", "Exhibition Curation", "AV Hardware", "Logistics"],
    isBuiltIn: true,
    accent: "pink",
    phases: [
      phase("concept-curation", "Concept & Curation Criteria", "Define event theme, establish exhibitor/artist selection criteria, and outline event schedule.", ["Event Theme Spec", "Curation Criteria"], ["Event Planning", "Curation"]),
      phase("spatial-floorplan", "Spatial Layout & Floorplan", "Draft venue floorplan layout, map visitor circulation pathways, and arrange booth placements.", ["Venue Floorplan", "Circulation Map"], ["Spatial Planning", "Layout"], { dependencies: ["concept-curation"] }),
      phase("branding-collateral", "Branding & Collateral Design", "Design event logo, promotional banners, signage, tickets, and social media marketing kits.", ["Event Branding Kit", "Promotional Banners"], ["Graphic Design", "Branding"], { canOverlap: true, dependencies: ["concept-curation"] }),
      phase("av-hardware-setup", "AV & Interactive Hardware Setup", "Install sound/lighting hardware, configure interactive displays, and run pre-event tech dry runs.", ["AV Equipment Setup", "Tech Dry Run Log"], ["AV Setup", "Hardware Setup"], { dependencies: ["spatial-floorplan"] }),
      phase("logistics-staffing", "Logistics, Permits & Staffing", "Secure venue permits, coordinate catering/security logistics, and schedule staff duties.", ["Event Permits", "Staff Duty Schedule"], ["Logistics", "Operations"], { dependencies: ["av-hardware-setup"] }),
      phase("live-management", "Live Event Management", "Coordinate live event flow, manage speaker stage timing, and handle real-time attendee requests.", ["On-Site Run Sheet", "Live Incident Log"], ["Event Coordination", "Management"], { dependencies: ["logistics-staffing"], reviewCheckpoint: true }),
      phase("media-retrospective", "Media & Retrospective Report", "Capture high-res photo/video footage, gather attendee feedback, and write evaluation report.", ["Event Photo Archive", "Evaluation Report"], ["Documentation", "Reporting"], { dependencies: ["live-management"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "digital-marketing-growth",
    version: 1,
    name: "Digital Marketing & Growth Campaign",
    shortName: "Marketing & Growth",
    description: "Data-driven campaign framework connecting audience persona research, sales copywriting, ad banner creative design, landing page tracking, and ROAS optimization.",
    disciplines: ["Digital Marketing", "Copywriting", "Paid Ads", "Analytics"],
    isBuiltIn: true,
    accent: "yellow",
    phases: [
      phase("market-personas", "Market Research & Personas", "Audit competitors, profile buyer personas, define core value propositions, and set campaign KPIs.", ["Buyer Personas", "Campaign KPI Matrix"], ["Market Research", "Strategy"]),
      phase("content-copywriting", "Content Strategy & Copywriting", "Write ad headlines, draft sales landing copy, format email sequences, and script promo clips.", ["Sales Copy", "Email Sequences"], ["Copywriting", "Content Strategy"], { dependencies: ["market-personas"] }),
      phase("visual-ad-assets", "Visual Marketing Assets", "Design display ad banners, create social media graphics, format email templates, and edit ad videos.", ["Ad Banners", "Social Media Graphics"], ["Graphic Design", "Video Editing"], { canOverlap: true, dependencies: ["content-copywriting"] }),
      phase("landing-pixels", "Landing Page & Tracking Pixels", "Build high-converting landing pages, integrate GA4/Meta tracking pixels, and test form hooks.", ["Landing Page URL", "Tracking Pixel Setup"], ["Web Design", "Analytics Setup"], { dependencies: ["content-copywriting"] }),
      phase("multichannel-launch", "Multichannel Campaign Execution", "Launch paid ad campaigns (Google/Meta/TikTok), schedule social posts, and blast email sequences.", ["Active Ad Campaigns", "Scheduled Posts"], ["Campaign Execution", "Media Buying"], { dependencies: ["visual-ad-assets", "landing-pixels"] }),
      phase("realtime-optimization", "Realtime Optimization & A/B Testing", "Monitor CTR/CVR analytics, run A/B copy/creative tests, and reallocate ad spend to top assets.", ["A/B Test Results", "Budget Optimization Log"], ["A/B Testing", "Analytics"], { dependencies: ["multichannel-launch"], reviewCheckpoint: true }),
      phase("roas-analytics-report", "ROAS & Analytics Report", "Track Customer Acquisition Cost (CAC), Return on Ad Spend (ROAS), and compile campaign report.", ["ROAS Performance Report", "CAC Analysis"], ["Data Reporting", "Evaluation"], { dependencies: ["realtime-optimization"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "ecommerce-storefront",
    version: 1,
    name: "E-Commerce & Digital Storefront",
    shortName: "E-Commerce & Retail",
    description: "End-to-end digital retail launch workflow covering catalog product strategy, storefront UX, PDP conversion optimization, payment gateways, and CRM retention.",
    disciplines: ["E-Commerce", "Shopify/Shopee", "Conversion Optimization", "Logistics"],
    isBuiltIn: true,
    accent: "green",
    phases: [
      phase("catalog-strategy", "Market & Catalog Strategy", "Select hero product catalog, analyze profit margins, and establish pricing tiers.", ["Product Catalog", "Pricing Model"], ["Market Strategy", "Pricing"]),
      phase("storefront-ux", "Storefront UX & Branding", "Design E-Commerce store theme (Shopify/Shopee/WooCommerce), homepage banners, and category navigation.", ["Storefront Theme Design", "Category Navigation"], ["UI/UX", "Branding"], { dependencies: ["catalog-strategy"] }),
      phase("pdp-optimization", "Product Detail Page (PDP) Optimization", "Write SEO-optimized product descriptions, design detail graphics, size charts, and reviews.", ["PDP Graphics", "SEO Product Copy"], ["Copywriting", "SEO"], { canOverlap: true, dependencies: ["storefront-ux"] }),
      phase("payment-shipping", "Payment & Logistics Setup", "Connect online payment gateways (Credit Card, Wallets, COD) and integrate shipping partners.", ["Payment Gateway Setup", "Shipping Integration"], ["Payment Setup", "Logistics"], { dependencies: ["storefront-ux"] }),
      phase("inventory-orders", "Inventory & Order Flow Setup", "Sync inventory stock counts, configure automated order fulfillment flows, and SMS/Email notifications.", ["Inventory Sync", "Order Flow Config"], ["Operations", "Automation"], { dependencies: ["payment-shipping"] }),
      phase("promotional-upsell", "Promotional Engine & Upsell", "Configure discount codes, product bundle deals, post-purchase upsells, and lead popups.", ["Discount Rules", "Bundle Deals Config"], ["E-Commerce Marketing"], { dependencies: ["inventory-orders"] }),
      phase("cvr-crm-analytics", "CVR Analytics & CRM", "Track cart abandonment rates, build automated win-back email flows, and monitor customer lifetime value.", ["CVR Analytics Report", "CRM Email Flows"], ["Analytics", "CRM"], { dependencies: ["promotional-upsell"], reviewCheckpoint: true }),
    ],
  },
  {
    id: "academic-research-thesis",
    version: 1,
    name: "Academic Research & Thesis",
    shortName: "Academic Research",
    description: "Rigorously structured research framework spanning literature review matrix, methodology design, fieldwork survey data collection, statistical SEM/ANOVA analysis, and thesis manuscript drafting.",
    disciplines: ["Academic Writing", "Statistics", "Data Collection", "Research Methodology"],
    isBuiltIn: true,
    accent: "blue",
    phases: [
      phase("lit-review-hypothesis", "Literature Review & Hypothesis", "Gather peer-reviewed journal papers, build literature matrix, and state research hypotheses.", ["Literature Matrix", "Hypotheses Outline"], ["Literature Review", "Research"]),
      phase("methodology-survey", "Methodology & Survey Design", "Design research methodology, construct survey questionnaires, and map sampling plan.", ["Methodology Spec", "Survey Questionnaire"], ["Methodology Design", "Survey Design"], { dependencies: ["lit-review-hypothesis"] }),
      phase("fieldwork-data", "Fieldwork & Data Ingestion", "Distribute survey instruments, conduct qualitative interviews, and aggregate raw survey data.", ["Raw Survey Data", "Interview Transcripts"], ["Fieldwork", "Data Collection"], { dependencies: ["methodology-survey"] }),
      phase("statistical-analysis", "Statistical Analysis", "Run statistical tests (t-test, ANOVA, SEM, Regression), clean data, and generate chart figures.", ["Statistical Test Output", "Chart Figures"], ["Statistics", "SPSS/R/Python"], { dependencies: ["fieldwork-data"] }),
      phase("manuscript-drafting", "Manuscript Drafting", "Write introduction, literature review, methodology, findings, and discussion thesis chapters.", ["Thesis Manuscript Draft"], ["Academic Writing", "Technical Writing"], { dependencies: ["statistical-analysis"] }),
      phase("citation-plagiarism", "Citation Audit & Plagiarism Check", "Verify APA/IEEE reference citations, proofread academic prose, and check similarity scores.", ["APA/IEEE Citation List", "Similarity Report"], ["Proofreading", "Citation Audit"], { dependencies: ["manuscript-drafting"], reviewCheckpoint: true }),
      phase("defense-slide-deck", "Defense Deck & Final Submission", "Design thesis presentation slide deck, rehearse defense Q&A, and submit final thesis manuscript.", ["Thesis Presentation Deck", "Final Thesis Submission"], ["Presentation", "Final Submission"], { dependencies: ["citation-plagiarism"], reviewCheckpoint: true }),
    ],
  },
];
