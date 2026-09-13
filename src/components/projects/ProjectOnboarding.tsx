import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useMutation } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { BUILT_IN_FRAMEWORKS } from "../../data/frameworks";
import { getErrorMessage } from "../../lib/errors";
import { trackEvent } from "../../lib/analytics";
import { createTelemetryTracker } from "../../lib/telemetry";
import { MAYLAMDI_FRAMEWORK_COLORS, paletteColorAt } from "../../lib/brandPalette";
import {
  clearPendingProjectDraft,
  loadPendingProjectDraft,
  type PendingProjectDraft,
  type PendingProjectTask,
} from "../../lib/pendingProjectDraft";

type ProjectOnboardingProps = {
  mode: "create" | "join";
  currentProfileId?: Id<"userProfiles">;
  onCancel: () => void;
  onRoomReady?: (teamId: Id<"teams">) => void;
  onAuthenticationRequired?: (draft: PendingProjectDraft) => Promise<void> | void;
  resumePendingDraft?: boolean;
};

type DraftTask = PendingProjectTask;

function dateAfter(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const STEP_LABELS = ["Specialization", "Brief", "Plan", "Allocate", "Create"];

export function ProjectOnboarding({
  mode,
  currentProfileId,
  onCancel,
  onRoomReady,
  onAuthenticationRequired,
  resumePendingDraft = false,
}: ProjectOnboardingProps) {
  const createTeam = useMutation(api.teams.create);
  const joinTeam = useMutation(api.teams.joinByCode);
  const createProject = useMutation(api.projects.create);
  const createCustomFramework = useMutation(api.customFrameworks.create);
  const logTelemetryEvent = useMutation(api.telemetry.logEvent);
  const telemetry = useMemo(() => createTelemetryTracker(logTelemetryEvent), [logTelemetryEvent]);

  const pendingDraft = useMemo(() => resumePendingDraft ? loadPendingProjectDraft() : null, [resumePendingDraft]);
  const formRef = useRef<HTMLFormElement | null>(null);
  const hasResumedCreation = useRef(false);
  const [step, setStep] = useState(pendingDraft ? 5 : 1);
  const [frameworkChoice, setFrameworkChoice] = useState(pendingDraft?.frameworkChoice ?? BUILT_IN_FRAMEWORKS[0].id);
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);
  const [customFrameworkName, setCustomFrameworkName] = useState(pendingDraft?.customFrameworkName ?? "My framework");
  const [customPhaseNames, setCustomPhaseNames] = useState(pendingDraft?.customPhaseNames ?? "Discover, Make, Review, Deliver");
  const [title, setTitle] = useState(pendingDraft?.title ?? "");
  const [brief, setBrief] = useState(pendingDraft?.brief ?? "");
  const [deadline, setDeadline] = useState(pendingDraft?.deadline ?? dateAfter(14));
  const [targetMemberCount, setTargetMemberCount] = useState(pendingDraft?.targetMemberCount ?? "4");
  const [taskCreationMode, setTaskCreationMode] = useState<"ai" | "manual">(pendingDraft?.taskCreationMode ?? "ai");
  const [allocationMode, setAllocationMode] = useState<"ai" | "manual" | "self_selection">(pendingDraft?.allocationMode ?? "ai");
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>(pendingDraft?.draftTasks ?? []);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftPhaseKey, setDraftPhaseKey] = useState("");
  const [draftOwnerMode, setDraftOwnerMode] = useState<DraftTask["ownerMode"]>("open");
  const [draftWeight, setDraftWeight] = useState("1");
  const [draftDueDate, setDraftDueDate] = useState(deadline);
  const [draftSkills, setDraftSkills] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [displayExperience, setDisplayExperience] = useState<"game" | "tool">("game");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingDraft || !currentProfileId || hasResumedCreation.current) return;
    hasResumedCreation.current = true;
    formRef.current?.requestSubmit();
  }, [currentProfileId, pendingDraft]);

  const selectedFramework = useMemo(() => {
    if (frameworkChoice === "custom") {
      const names = customPhaseNames.split(",").map((name) => name.trim()).filter(Boolean).slice(0, 12);
      return {
        type: "custom" as const,
        id: "custom",
        name: customFrameworkName.trim() || "My framework",
        description: "A custom workflow created for this project.",
        phases: (names.length ? names : ["Project work"]).map((name, index) => ({ key: `custom-${index + 1}`, name, description: `${name} project work.`, canOverlap: true, dependencyKeys: index ? [`custom-${index}`] : [] as string[], reviewCheckpoint: true })),
      };
    }
    if (frameworkChoice === "none") {
      return {
        type: "none" as const,
        id: "none",
        name: "Simple project",
        description: "Start with one flexible phase.",
        phases: [{ key: "project-work", name: "Project work", description: "Flexible project work.", canOverlap: true, dependencyKeys: [] as string[], reviewCheckpoint: true }],
      };
    }
    const framework = BUILT_IN_FRAMEWORKS.find((item) => item.id === frameworkChoice) ?? BUILT_IN_FRAMEWORKS[0];
    return {
      type: "built_in" as const,
      id: framework.id,
      name: framework.name,
      description: framework.description,
      phases: framework.phases.map((phase) => ({
        key: phase.id,
        name: phase.name,
        description: phase.description,
        canOverlap: phase.canOverlap,
        dependencyKeys: phase.defaultDependencies,
        reviewCheckpoint: phase.reviewCheckpoint,
      })),
    };
  }, [customFrameworkName, customPhaseNames, frameworkChoice]);

  const phaseChoices = selectedFramework.phases;
  const effectiveDraftPhaseKey = draftPhaseKey || phaseChoices[0]?.key || "project-work";

  function addDraftTask() {
    if (!draftTitle.trim() || !draftDescription.trim() || !draftDueDate) {
      setError("Add a task title, description, and due date.");
      return;
    }
    if (draftDueDate > deadline) {
      setError("Task due dates must be on or before the project deadline.");
      return;
    }
    setDraftTasks((current) => [...current, {
      id: crypto.randomUUID(),
      title: draftTitle.trim(),
      description: draftDescription.trim(),
      phaseKey: effectiveDraftPhaseKey,
      ownerMode: draftOwnerMode,
      weight: Number(draftWeight),
      dueDate: draftDueDate,
      skills: draftSkills,
    }]);
    setDraftTitle("");
    setDraftDescription("");
    setDraftSkills("");
    setError(null);
  }

  function validateStep() {
    if (step === 2) {
      if (!title.trim() || !brief.trim() || !deadline) return "Add a project name, deadline, team size, and brief.";
      if (brief.trim().length < 20) return "Project brief must be at least 20 characters to answer what you are making, who it is for, and what needs to be delivered.";
      if (brief.trim().length > 8000) return "Project brief must be 8,000 characters or fewer for optimal AI assistance.";
    }
    if (step === 3 && taskCreationMode === "manual" && draftTasks.length === 0) return "Add at least one task, or choose the AI-assisted plan.";
    return null;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      telemetry.trackStepError("project_creation", step, STEP_LABELS[step - 1], validationError);
      return;
    }
    telemetry.trackStepComplete("project_creation", step, STEP_LABELS[step - 1], {
      framework_choice: frameworkChoice,
      brief_length: brief.length,
      task_creation_mode: taskCreationMode,
    });
    if (step === 2) {
      trackEvent("brief_submitted", {
        has_deadline: Boolean(deadline),
        target_member_count: Number(targetMemberCount),
      });
    }
    if (step < 5) {
      const nextStep = step + 1;
      setStep(nextStep);
      telemetry.trackStepStart("project_creation", nextStep, STEP_LABELS[nextStep - 1]);
      return;
    }

    if (!currentProfileId) {
      if (!onAuthenticationRequired) {
        setError("Sign in is required to create this project.");
        return;
      }
      setIsSaving(true);
      try {
        await onAuthenticationRequired({
          version: 1,
          frameworkChoice,
          customFrameworkName,
          customPhaseNames,
          title,
          brief,
          deadline,
          targetMemberCount,
          taskCreationMode,
          allocationMode,
          draftTasks,
        });
      } catch (caughtError) {
        setError(getErrorMessage(caughtError, "Google sign-in could not start."));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      const teamId = await createTeam({ name: title.trim() });
      const customFrameworkId = selectedFramework.type === "custom"
        ? await createCustomFramework({
            teamId,
            name: selectedFramework.name,
            description: selectedFramework.description,
            phases: selectedFramework.phases.map((phase) => ({
              key: phase.key,
              name: phase.name,
              description: phase.description,
              isOptional: false,
              suggestedDeliverables: [],
              suggestedSkills: [],
              canOverlap: phase.canOverlap,
              defaultDependencyKeys: phase.dependencyKeys,
              reviewCheckpoint: phase.reviewCheckpoint,
            })),
          })
        : undefined;
      const projectId = await createProject({
        teamId,
        title: title.trim(),
        description: brief.trim(),
        deadline,
        targetMemberCount: Number(targetMemberCount),
        frameworkType: selectedFramework.type,
        builtInFrameworkId: selectedFramework.type === "built_in" ? selectedFramework.id : undefined,
        customFrameworkId,
        frameworkName: selectedFramework.name,
        phases: selectedFramework.phases,
        setupMode: taskCreationMode,
        taskCreationMode,
        allocationStrategy: allocationMode,
      });

      trackEvent("project_created", {
        framework_type: selectedFramework.type,
        allocation_strategy: allocationMode,
        task_creation_mode: taskCreationMode,
      });

      trackEvent("project_launched", {
        framework_type: selectedFramework.type,
        task_creation_mode: taskCreationMode,
      });

      if (taskCreationMode === "manual") {
        // Phase IDs exist only after the project mutation. The room resolves these
        // stable framework keys and saves the reviewed task drafts immediately.
        sessionStorage.setItem(`maylamdi:draft-tasks:${projectId}`, JSON.stringify(draftTasks));
        sessionStorage.setItem(`maylamdi:draft-owner:${projectId}`, currentProfileId);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(`project_display_mode_${projectId}`, displayExperience);
        localStorage.setItem("project_display_mode", displayExperience);
      }
      clearPendingProjectDraft();
      onRoomReady?.(teamId);
    } catch (caughtError) {
      const errorMsg = getErrorMessage(caughtError, "The room could not be created.");
      setError(errorMsg);
      telemetry.trackStepError("project_creation", 5, "Create", caughtError);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const teamId = await joinTeam({ code: joinCode });
      onRoomReady?.(teamId);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "That room code is not valid."));
    } finally {
      setIsSaving(false);
    }
  }

  if (mode === "join") {
    return (
      <section className="guided-flow" aria-labelledby="join-flow-title">
        <button className="guided-back-link" type="button" onClick={onCancel}>← Back</button>
        <div>
          <p className="kicker">Join a project</p>
          <h1 className="display-heading" id="join-flow-title">Enter the room code</h1>
        </div>
        <form className="guided-card guided-join-card" onSubmit={handleJoin}>
          <label className="guided-code-field"><span>Room code</span><input autoFocus required minLength={6} maxLength={8} value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="ABC234" /></label>
          <p>Your saved profile skills and weekly capacity will be shared with this project. You can add project availability after joining.</p>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="guided-form-actions">
            <button className="primary-button guided-primary" type="submit" disabled={isSaving}>{isSaving ? "Joining…" : "Join Room"}</button>
          </div>
        </form>
      </section>
    );
  }

  const stepLabels = ["Specialization", "Brief", "Plan", "Allocate", "Create"];
  return (
    <section className="guided-flow" aria-labelledby="create-flow-title">
      <button
        className="guided-back-link"
        type="button"
        onClick={() => {
          if (step === 1) {
            telemetry.trackStepAbandon("project_creation", 1, STEP_LABELS[0], "User cancelled at Step 1");
            onCancel();
          } else {
            telemetry.trackStepAbandon("project_creation", step, STEP_LABELS[step - 1], "User went back to previous step");
            setStep((current) => current - 1);
            setError(null);
          }
        }}
      >
        ← Back
      </button>
      <ol className="guided-stepper" aria-label="Create project progress">{stepLabels.map((label, index) => <li key={label} className={step === index + 1 ? "is-current" : step > index + 1 ? "is-complete" : ""}><span>{index + 1}</span><small>{label}</small></li>)}</ol>
      <form className="guided-card" onSubmit={handleCreate} ref={formRef}>
        {step === 1 ? <>
          <p className="kicker">Step 1 · Project Specialization</p>
          <h1 className="display-heading" id="create-flow-title">Project Specialization</h1>
          <p className="guided-helper">Select your project specialization domain.</p>
          <div className="framework-choice-grid">
            {BUILT_IN_FRAMEWORKS.map((framework, index) => (
              <button
                key={framework.id}
                className={frameworkChoice === framework.id ? "framework-choice is-selected" : "framework-choice"}
                style={{ "--mld-framework-color": paletteColorAt(MAYLAMDI_FRAMEWORK_COLORS, index) } as CSSProperties}
                type="button"
                onClick={() => setFrameworkChoice(framework.id)}
              >
                <strong>{framework.name}</strong>
                {frameworkChoice === framework.id ? <span className="framework-selected-mark" aria-label="Selected">✓</span> : null}
              </button>
            ))}
          </div>
        </> : null}

        {step === 2 ? <><p className="kicker">Step 2 · Brief</p><h1 className="display-heading" id="create-flow-title">Tell us about your project</h1><div className="guided-field-grid"><label className="guided-field-wide brief-primary"><span>Project brief</span><small>Paste your assignment requirements or project goals (up to 8,000 characters).</small><textarea required minLength={20} maxLength={8000} value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Paste your full assignment requirements, submission criteria, or project brief here..." /><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", fontWeight: 700, color: brief.length > 8000 || (brief.length > 0 && brief.length < 20) ? "var(--color-orange, #feaa01)" : "var(--color-muted)", marginTop: "0.35rem" }}><span>Paste assignment requirements, deliverables, or goals (20 - 8,000 chars).</span><span>{brief.length} / 8,000 chars</span></div></label><label><span>Project name</span><input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="deadline-inline-field"><span>Deadline</span><div className="deadline-input-preset-row"><input required type="date" min={dateAfter(1)} value={deadline} onChange={(event) => { setDeadline(event.target.value); setDraftDueDate(event.target.value); }} /><div className="deadline-preset-buttons"><button className="preset-pill-btn" type="button" onClick={() => setDeadline(dateAfter(7))}>7 days</button><button className="preset-pill-btn" type="button" onClick={() => setDeadline(dateAfter(14))}>14 days</button></div></div></label><label><span>Team size</span><select value={targetMemberCount} onChange={(event) => setTargetMemberCount(event.target.value)}>{Array.from({ length: 10 }, (_, index) => index + 1).map((size) => <option key={size} value={size}>{size === 1 ? "1 person" : `${size} people`}</option>)}</select></label><label><span>Specialization</span><select value={frameworkChoice} onChange={(event) => setFrameworkChoice(event.target.value)}>{BUILT_IN_FRAMEWORKS.map((framework) => <option key={framework.id} value={framework.id}>{framework.name}</option>)}</select></label></div></> : null}

        {step === 3 ? <><p className="kicker">Step 3 · Plan</p><h1 className="display-heading" id="create-flow-title">Build your project plan</h1><div className="allocation-mode-grid"><button className={taskCreationMode === "ai" ? "allocation-mode-card ai-mode is-recommended is-selected" : "allocation-mode-card ai-mode is-recommended"} type="button" onClick={() => setTaskCreationMode("ai")}><strong>AI-assisted plan · Recommended</strong><span>Start with an editable plan of phases, tasks, descriptions, skills, weights, and due dates. Generate it after the room opens.</span></button><button className={taskCreationMode === "manual" ? "allocation-mode-card is-selected" : "allocation-mode-card"} type="button" onClick={() => setTaskCreationMode("manual")}><strong>Build manually</strong><span>Create the initial task list yourself with the same review and ownership controls.</span></button></div>{taskCreationMode === "manual" ? <section className="onboarding-task-builder"><div className="project-field-grid"><label className="project-field-wide"><span>Title</span><input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} /></label><label className="project-field-wide"><span>Description</span><textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} /></label><label><span>Phase <small>Groups related tasks into a stage of the project.</small></span><select value={effectiveDraftPhaseKey} onChange={(event) => setDraftPhaseKey(event.target.value)}>{phaseChoices.map((phase) => <option key={phase.key} value={phase.key}>{phase.name}</option>)}</select></label><label><span>Owner</span><select value={draftOwnerMode} onChange={(event) => setDraftOwnerMode(event.target.value as DraftTask["ownerMode"])}><option value="creator">Creator</option><option value="open">Open for claiming</option><option value="unassigned">Unassigned until allocation</option></select></label><label><span>Task Weight <small>How much this task contributes to overall project progress.</small></span><input type="number" min="0.5" max="100" step="0.5" value={draftWeight} onChange={(event) => setDraftWeight(event.target.value)} /></label><label><span>Due Date</span><input type="date" max={deadline} value={draftDueDate} onChange={(event) => setDraftDueDate(event.target.value)} /></label><label className="project-field-wide"><span>Skills</span><input value={draftSkills} onChange={(event) => setDraftSkills(event.target.value)} placeholder="Figma, research" /></label><label><span>Peer Reviewer</span><select disabled><option>Owner chooses later</option></select></label></div><button className="quiet-button" type="button" onClick={addDraftTask}>Add to task list</button><div className="onboarding-draft-list">{draftTasks.map((task) => <article key={task.id}><div><strong>{task.title}</strong><small>{phaseChoices.find((phase) => phase.key === task.phaseKey)?.name} · due {task.dueDate} · weight {task.weight}</small></div><button type="button" className="text-link" onClick={() => setDraftTasks((current) => current.filter((item) => item.id !== task.id))}>Remove</button></article>)}</div></section> : <p className="ai-safety-note">After the room is created, Project Plan opens with Generate AI Project Plan as the primary action. If providers are busy, build the plan manually.</p>}</> : null}

        {step === 4 ? <><p className="kicker">Step 4 · Allocate</p><h1 className="display-heading" id="create-flow-title">How should task ownership be decided?</h1><div className="allocation-mode-grid"><button className={allocationMode === "ai" ? "allocation-mode-card ai-mode is-recommended is-selected" : "allocation-mode-card ai-mode is-recommended"} type="button" onClick={() => setAllocationMode("ai")}><strong>AI-assisted allocation · Recommended</strong><span>Suggest owners using joined members’ saved skills and weekly capacity. You can edit every suggestion before saving.</span></button><button className={allocationMode === "manual" ? "allocation-mode-card is-selected" : "allocation-mode-card"} type="button" onClick={() => setAllocationMode("manual")}><strong>Creator-managed allocation</strong><span>Assign tasks yourself after teammates join. Leave any task Open for claiming or Unassigned.</span></button></div><p className="allocation-availability-note">Open for claiming and Unassigned remain available per task. Older self-selection projects continue to work.</p></> : null}

        {step === 5 ? <><p className="kicker">Step 5 · Create</p><h1 className="display-heading" id="create-flow-title">Review your project</h1><div className="guided-review-sections"><section><p className="card-eyebrow">Project</p><dl className="guided-summary"><div><dt>Name</dt><dd>{title}</dd></div><div><dt>Deadline</dt><dd>{deadline}</dd></div><div><dt>Team</dt><dd>{targetMemberCount === "1" ? "1 person" : `${targetMemberCount} people`}</dd></div></dl></section><section><p className="card-eyebrow">Plan</p><dl className="guided-summary"><div><dt>Structure</dt><dd>{selectedFramework.name} · {selectedFramework.phases.length} phases</dd></div><div><dt>Tasks</dt><dd>{taskCreationMode === "ai" ? "AI plan after room creation" : `${draftTasks.length} manual tasks`}</dd></div><div><dt>AI status</dt><dd>{taskCreationMode === "ai" ? "Ready to generate" : "Not used"}</dd></div></dl></section><section><p className="card-eyebrow">Allocation</p><dl className="guided-summary"><div><dt>Ownership</dt><dd>{allocationMode === "ai" ? "AI-assisted suggestions" : allocationMode === "manual" ? "Creator-managed" : "Open for claiming"}</dd></div></dl></section><section><p className="card-eyebrow">Display Experience</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}><button type="button" className={`allocation-mode-card ${displayExperience === "game" ? "is-selected" : ""}`} onClick={() => setDisplayExperience("game")} style={{ textAlign: "left", cursor: "pointer", padding: "12px" }}><strong>🎮 Game Mode</strong><span>Full dragon boss, quest visual effects, and animated spell battles.</span></button><button type="button" className={`allocation-mode-card ${displayExperience === "tool" ? "is-selected" : ""}`} onClick={() => setDisplayExperience("tool")} style={{ textAlign: "left", cursor: "pointer", padding: "12px" }}><strong>📊 Tool Mode</strong><span>Plain progress bar, minimal clean dashboard, zero dragon art.</span></button></div></section></div><p>Creating the room starts the project immediately and reveals its invite code.</p></> : null}

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="guided-form-actions">
          <span />
          <button className="primary-button guided-primary" type="submit" disabled={isSaving}>
            {isSaving ? (currentProfileId ? "Creating project…" : "Opening Google…") : step === 5 ? "Create Project" : step === 2 ? "Continue to Project Plan" : step === 3 ? "Continue to Allocation" : step === 4 ? "Review Project" : "Continue"}
          </button>
        </div>
      </form>
    </section>
  );
}
