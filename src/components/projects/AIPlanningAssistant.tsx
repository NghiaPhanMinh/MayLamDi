import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, CreditCard, Layers, Rocket, Scale, Search, Sparkles, Zap } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { getErrorMessage } from "../../lib/errors";
import { getByokSession } from "../../lib/byokSession";
import { friendlyAiError } from "../../lib/aiErrors";
import { AI_RETRY_DELAYS_MS, isRetryablePlatformAiError } from "../../lib/aiRetry";
import { trackEvent } from "../../lib/analytics";
import { createTelemetryTracker } from "../../lib/telemetry";

type Workspace = FunctionReturnType<typeof api.tasks.getWorkspace>;
type AiPlan = FunctionReturnType<typeof api.ai.generateProjectPlan>;
export type AiTaskSuggestion = AiPlan["tasks"][number];

type AIPlanningAssistantProps = {
  workspace: Workspace;
  onUseTask: (task: AiTaskSuggestion) => void;
  autoStart?: boolean;
  onGeneratingChange?: (isGenerating: boolean) => void;
};

export function AIPlanningAssistant({
  workspace,
  onUseTask,
  autoStart = false,
  onGeneratingChange,
}: AIPlanningAssistantProps) {
  const generateProjectPlan = useAction(api.ai.generateProjectPlan);
  const generateProjectPlanWithKey = useAction(api.ai.generateProjectPlanWithKey);
  const savePlan = useMutation(api.aiDrafts.savePlan);
  const logTelemetryEvent = useMutation(api.telemetry.logEvent);
  const telemetry = createTelemetryTracker(logTelemetryEvent);
  const usage = useQuery(api.aiUsage.getProjectUsage, { projectId: workspace.project._id });
  const [brief, setBrief] = useState(workspace.project.description || workspace.project.title);
  const [draft, setDraft] = useState<AiPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [retryNotice, setRetryNotice] = useState<string | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoStartedRef = useRef(false);
  const byokActive = getByokSession() !== null;
  const isLeader = workspace.canManageProject || workspace.isTeamOwner;
  const [editingTempId, setEditingTempId] = useState<string | null>(null);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  useEffect(() => {
    setBrief(workspace.project.description || workspace.project.title);
    setDraft(null);
    setError(null);
    setAdjustment("");
    setSaveMessage(null);
    setRetryNotice(null);
    hasAutoStartedRef.current = false;
  }, [workspace.project._id, workspace.project.description, workspace.project.title]);

  useEffect(() => {
    trackEvent("ai_assistant_opened", {
      project_status: workspace.project.status,
    });
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [workspace.project.status]);

  useEffect(() => {
    if (isGenerating) {
      setLoadingProgress(10);
      setLoadingSeconds(0);
      const startTime = Date.now();
      loadingIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setLoadingSeconds(Math.floor(elapsed));
        setLoadingProgress(Math.min(98, Math.floor(100 * (1 - Math.exp(-elapsed / 2.8)))));
      }, 100);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setLoadingProgress(100);
    }
  }, [isGenerating]);

  async function generateDraft(nextBrief: string) {
    const byok = getByokSession();
    let retryCount = 0;

    while (true) {
      try {
        const result = byok
          ? await generateProjectPlanWithKey({ projectId: workspace.project._id, brief: nextBrief, apiKey: byok.apiKey, model: byok.model })
          : await generateProjectPlan({ projectId: workspace.project._id, brief: nextBrief });
        setRetryNotice(null);
        return result;
      } catch (caughtError) {
        if (byok || !isRetryablePlatformAiError(caughtError) || retryCount >= AI_RETRY_DELAYS_MS.length) throw caughtError;

        const delay = AI_RETRY_DELAYS_MS[retryCount];
        retryCount += 1;
        setRetryNotice(`Free AI providers are busy. Retrying automatically in ${Math.round(delay / 1000)} seconds (${retryCount}/${AI_RETRY_DELAYS_MS.length})…`);
        await new Promise<void>((resolve) => {
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            resolve();
          }, delay);
        });
      }
    }
  }

  async function runGeneration(briefText: string) {
    setError(null);
    setRetryNotice(null);
    setIsGenerating(true);

    telemetry.trackStepStart("ai_planning", 1, "Generate AI Plan");
    trackEvent("brief_submitted", {
      brief_length: briefText.length,
    });
    trackEvent("ai_prompt_submitted", {
      prompt_type: "initial_brief",
      prompt_length: briefText.length,
    });

    try {
      const result = await generateDraft(briefText);
      trackEvent("ai_plan_generated", {
        task_count: result.tasks.length,
        risk_count: result.risks.length,
      });
      telemetry.trackStepComplete("ai_planning", 1, "Generate AI Plan", {
        task_count: result.tasks.length,
        risk_count: result.risks.length,
      });
      setDraft(result);
      setSaveMessage(null);
    } catch (caughtError) {
      const friendlyMsg = friendlyAiError(caughtError);
      setError(friendlyMsg);
      telemetry.trackStepError("ai_planning", 1, "Generate AI Plan", friendlyMsg);
      setRetryNotice(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runGeneration(brief);
  }

  useEffect(() => {
    if (autoStart && !hasAutoStartedRef.current && !draft && !isGenerating) {
      hasAutoStartedRef.current = true;
      const briefToUse = brief.trim() || workspace.project.title;
      if (briefToUse.length >= 3) {
        void runGeneration(briefToUse);
      }
    }
  }, [autoStart, brief, draft, isGenerating, workspace.project.title]);

  async function handleAdjustment() {
    if (!adjustment.trim()) return;
    setError(null);
    setRetryNotice(null);
    setIsGenerating(true);

    trackEvent("ai_prompt_submitted", {
      prompt_type: "adjustment",
      prompt_length: adjustment.trim().length,
    });

    try {
      const adjustedBrief = `${brief}\n\nHuman adjustment request: ${adjustment.trim()}`.slice(0, 8000);
      const result = await generateDraft(adjustedBrief);
      trackEvent("ai_plan_generated", {
        task_count: result.tasks.length,
        risk_count: result.risks.length,
      });
      setDraft(result);
      setAdjustment("");
      setSaveMessage("A revised draft is ready. Review it before saving.");
    } catch (caughtError) {
      setError(friendlyAiError(caughtError));
      setRetryNotice(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSavePlan() {
    if (!draft) return;
    setError(null);
    setRetryNotice(null);
    setIsGenerating(true);
    try {
      const result = await savePlan({ projectId: workspace.project._id, plan: draft });
      trackEvent("plan_confirmed", {
        task_count: result.taskCount,
      });
      setSaveMessage(`${result.taskCount} tasks were saved. Assigned teammates can now accept or decline.`);
      setDraft(null);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "The reviewed AI plan could not be saved."));
    } finally {
      setIsGenerating(false);
    }
  }

  function updateTask(tempId: string, patch: Partial<AiTaskSuggestion>) {
    setDraft((current) => current
      ? {
          ...current,
          tasks: current.tasks.map((task) =>
            task.tempId === tempId ? { ...task, ...patch } : task,
          ),
        }
      : current);
  }

  function deleteTask(tempId: string) {
    setDraft((current) => current
      ? {
          ...current,
          tasks: current.tasks.filter((task) => task.tempId !== tempId),
        }
      : current);
  }

  function handleAddNewTask() {
    const newTask: AiTaskSuggestion = {
      tempId: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: "New Custom Task",
      description: "Enter task requirements and deliverables...",
      phaseId: workspace.phases[0]?._id ?? "",
      milestoneTempId: null,
      primaryOwnerProfileId: workspace.members[0]?.profileId ?? workspace.currentProfileId,
      collaboratorProfileIds: [],
      reviewerProfileId: null,
      requiredSkills: [],
      estimatedEffortHours: 3,
      difficulty: 2,
      weight: 3,
      required: true,
      startDate: workspace.project.startDate || new Date().toISOString().split("T")[0],
      dueDate: workspace.project.deadline || new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
      dependencyTempIds: [],
      requiresReview: true,
      allocationExplanation: "Manually added by room leader.",
      longTaskBreakdown: "",
    };
    setDraft((current) => current
      ? {
          ...current,
          tasks: [...current.tasks, newTask],
        }
      : current);
    setEditingTempId(newTask.tempId);
  }

  return (
    <section className="ai-planning-assistant" aria-labelledby="ai-planning-title">
      <div className="ai-planning-heading">
        <div>
          <h3 className="display-heading" id="ai-planning-title">Build the project plan with AI</h3>
        </div>
        <span className="ai-draft-label">Draft only</span>
      </div>
      <p className="ai-safety-note">
        AI creates a reviewable draft. Nothing is saved or assigned until a person checks the plan and confirms it.
      </p>
      <form className="ai-brief-form" onSubmit={handleGenerate}>
        <label>
          <span>Project or assignment brief</span>
          <textarea
            required
            minLength={3}
            maxLength={8000}
            value={brief}
            readOnly={!isLeader}
            onChange={(event) => setBrief(event.target.value)}
            placeholder={isLeader ? "Paste the assignment requirements, deliverables, audience, constraints, and assessment criteria…" : "The room leader will enter the project brief here."}
          />
        </label>
        <div>
          <span>{brief.length}/8000</span>
          {isLeader ? (
            (workspace.tasks?.length ?? 0) > 0 ? (
              <Link
                to="/subscription"
                className="primary-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  textDecoration: "none",
                  background: "var(--color-pink)",
                  color: "#101517",
                  fontWeight: 800,
                }}
              >
                <CreditCard size={15} /> Subscription to Regenerate
              </Link>
            ) : (
              <button
                className="primary-button"
                type="submit"
                disabled={isGenerating || workspace.project.status === "archived"}
              >
                {isGenerating ? (
                  "Building a draft…"
                ) : draft ? (
                  "Regenerate Plan"
                ) : (
                  <>
                    <Zap
                      size={15}
                      style={{
                        display: "inline-block",
                        verticalAlign: "-2px",
                        marginRight: "4px",
                      }}
                    />{" "}
                    Generate AI Plan
                  </>
                )}
              </button>
            )
          ) : null}
        </div>
      </form>
      {!isLeader && !draft && (workspace.tasks?.length ?? 0) === 0 ? (
        <div className="member-waiting-card" style={{ margin: "1.25rem 0", padding: "1.25rem", borderRadius: "16px", background: "color-mix(in srgb, var(--color-yellow) 12%, var(--color-surface))", border: "2px solid var(--color-yellow)", color: "var(--color-text)" }}>
          <strong style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.05rem", marginBottom: "0.3rem" }}>
            <Clock size={18} style={{ color: "var(--color-yellow)", flexShrink: 0 }} /> Waiting for Room Leader to Generate AI Plan...
          </strong>
          <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.9 }}>
            The room leader is preparing the project brief and generating task allocations. You will see the draft preview right here as soon as it is generated!
          </p>
        </div>
      ) : null}
      {error ? <p className="form-error ai-error" role="alert">{error}</p> : null}
      {retryNotice ? <p className="ai-retry-notice" role="status">{retryNotice}</p> : null}
      {saveMessage ? (
        <p className="form-success" role="status" style={{ margin: "1rem 0", fontSize: "1.05rem", fontWeight: 800 }}>
          {saveMessage}
        </p>
      ) : null}

      {usage && !usage.platformGenerationAvailable && !byokActive ? (
        <div className="subscription-limit-card" style={{ margin: "1.25rem 0", padding: "1.5rem", borderRadius: "20px", background: "color-mix(in srgb, var(--color-pink) 15%, var(--color-surface))", border: "3px solid #101517", boxShadow: "6px 6px 0 #101517", color: "var(--color-text)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "var(--color-pink)", color: "#101517", padding: "0.25rem 0.65rem", borderRadius: "999px", fontWeight: "900", border: "1.5px solid #101517", fontSize: "0.88rem" }}>
              <CreditCard size={13} /> SUBSCRIPTION LIMIT REACHED ({usage.used}/{usage.limit ?? 1} USED)
            </span>
          </div>
          <h3 style={{ margin: "0.3rem 0 0.5rem", fontSize: "1.35rem", fontWeight: "900" }}>
            Upgrade Your Plan to Generate More AI Drafts
          </h3>
          <p style={{ margin: "0 0 1rem", fontSize: "0.92rem", lineHeight: "1.5", opacity: 0.9 }}>
            Free tier includes 1 AI plan &amp; 1 allocation per project. Upgrade your plan on the Subscription page to unlock unlimited AI project plan regenerations, workload balancing, and priority AI execution!
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
            <Link to="/subscription" className="primary-button hero-save-plan-button" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", minHeight: "auto", fontSize: "1rem", textDecoration: "none" }}>
              <Sparkles size={16} /> Open Subscription Page <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : null}

      {isGenerating ? (
        <div className="ai-plan-loading-card" role="status" aria-live="polite" style={{ margin: "1.25rem 0", padding: "1.25rem", borderRadius: "16px", background: "color-mix(in srgb, var(--color-yellow) 12%, var(--color-surface))", border: "1.5px solid var(--color-yellow)", color: "var(--color-text)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <strong style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem" }}>
              <Zap size={16} className="spinner-icon" style={{ color: "var(--color-yellow)" }} /> Building AI Project Plan...
            </strong>
            <small style={{ fontWeight: 700, opacity: 0.85 }}>
              {loadingSeconds < 8 ? `~${Math.max(1, 8 - loadingSeconds)}s remaining` : "<1s remaining"} ({loadingSeconds}s elapsed)
            </small>
          </div>
          <div className="loading-bar-track" style={{ width: "100%", height: "10px", borderRadius: "999px", background: "rgba(0,0,0,0.15)", overflow: "hidden", marginBottom: "0.75rem" }}>
            <div
              className="loading-bar-fill"
              style={{
                width: `${loadingProgress}%`,
                height: "100%",
                background: "var(--color-yellow)",
                borderRadius: "999px",
                transition: "width 0.15s ease-out",
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: "0.88rem", opacity: 0.9, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {loadingSeconds < 2.5 ? (
              <><Search size={14} /> Analyzing brief requirements &amp; deliverables...</>
            ) : loadingSeconds < 5.0 ? (
              <><Layers size={14} /> Structuring project phases &amp; task allocation...</>
            ) : loadingSeconds < 7.5 ? (
              <><Scale size={14} /> Balancing effort hours, weights &amp; risk factors...</>
            ) : (
              <><Sparkles size={14} /> Finalizing draft plan for your review...</>
            )}
          </p>
        </div>
      ) : null}

      {draft ? (
        <div className="ai-draft" aria-live="polite">
          <section className="ai-output-card ai-plan-output" aria-labelledby="ai-plan-output-title">
            <div className="ai-draft-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h4 id="ai-plan-output-title" style={{ margin: 0 }}>Suggested project plan ({draft.tasks.length} Tasks)</h4>
              <button
                className="quiet-button"
                type="button"
                onClick={() => setDraft(null)}
                style={{ padding: "0.25rem 0.65rem", fontSize: "0.82rem", fontWeight: 700 }}
              >
                Discard draft
              </button>
            </div>
            
            <div className="ai-task-list" style={{ display: "grid", gap: "0.85rem" }}>
              {draft.tasks.map((task) => {
                const ownerMember = workspace.members.find((member) => member.profileId === task.primaryOwnerProfileId);
                const ownerName = ownerMember?.displayName ?? "Choose owner";
                const isEditing = editingTempId === task.tempId;

                return (
                  <article
                    key={task.tempId}
                    className="task-card ai-plan-task-card"
                    style={{
                      padding: "1rem 1.25rem",
                      borderRadius: "8px",
                      boxShadow: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isEditing ? (
                      <div className="ai-task-editor" style={{ display: "grid", gap: "0.85rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "1.05rem" }}>Edit Task Details</strong>
                          <button
                            type="button"
                            className="quiet-button"
                            onClick={() => setEditingTempId(null)}
                            style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}
                          >
                            ✕ Close
                          </button>
                        </div>
                        <label style={{ display: "grid", gap: "0.3rem", fontWeight: 800 }}>
                          <span style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>Task Title</span>
                          <input
                            value={task.title}
                            onChange={(event) => updateTask(task.tempId, { title: event.target.value })}
                            className="allocated-task-input"
                            style={{ minHeight: "40px", padding: "0.45rem 0.75rem" }}
                          />
                        </label>
                        <label style={{ display: "grid", gap: "0.3rem", fontWeight: 800 }}>
                          <span style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>Task Description</span>
                          <textarea
                            rows={3}
                            value={task.description}
                            onChange={(event) => updateTask(task.tempId, { description: event.target.value })}
                            className="allocated-task-textarea"
                            style={{ padding: "0.45rem 0.75rem", resize: "vertical" }}
                          />
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                          <label style={{ display: "grid", gap: "0.3rem", fontWeight: 800 }}>
                            <span style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>Suggested Owner</span>
                            <select
                              value={task.primaryOwnerProfileId}
                              onChange={(event) => updateTask(task.tempId, {
                                primaryOwnerProfileId: event.target.value,
                                collaboratorProfileIds: task.collaboratorProfileIds.filter((profileId) => profileId !== event.target.value),
                                reviewerProfileId: task.reviewerProfileId === event.target.value ? null : task.reviewerProfileId,
                              })}
                              className="allocated-task-select"
                              style={{ minHeight: "40px", padding: "0.45rem 0.75rem" }}
                            >
                              {workspace.members.map((member) => (
                                <option key={member.profileId} value={member.profileId}>{member.displayName}</option>
                              ))}
                            </select>
                          </label>
                          <label style={{ display: "grid", gap: "0.3rem", fontWeight: 800 }}>
                            <span style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>Due Date</span>
                            <input
                              type="date"
                              max={workspace.project.deadline}
                              value={task.dueDate}
                              onChange={(event) => updateTask(task.tempId, { dueDate: event.target.value })}
                              className="allocated-task-input"
                              style={{ minHeight: "40px", padding: "0.45rem 0.75rem" }}
                            />
                          </label>
                          <label style={{ display: "grid", gap: "0.3rem", fontWeight: 800 }}>
                            <span style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>Effort Hours</span>
                            <input
                              type="number"
                              min="0.5"
                              max="2000"
                              step="0.5"
                              value={task.estimatedEffortHours}
                              onChange={(event) => updateTask(task.tempId, { estimatedEffortHours: Number(event.target.value) })}
                              className="allocated-task-input"
                              style={{ minHeight: "40px", padding: "0.45rem 0.75rem" }}
                            />
                          </label>
                          <label style={{ display: "grid", gap: "0.3rem", fontWeight: 800 }}>
                            <span style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>Difficulty (1-5)</span>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="1"
                              value={task.difficulty}
                              onChange={(event) => updateTask(task.tempId, { difficulty: Number(event.target.value) })}
                              className="allocated-task-input"
                              style={{ minHeight: "40px", padding: "0.45rem 0.75rem" }}
                            />
                          </label>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => deleteTask(task.tempId)}
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", borderRadius: "6px" }}
                          >
                            Delete Task
                          </button>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => setEditingTempId(null)}
                            style={{ padding: "0.35rem 0.85rem", fontSize: "0.85rem", borderRadius: "6px" }}
                          >
                            Done Editing
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                            <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.15rem", fontWeight: 900 }}>{task.title}</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.85rem" }}>
                              <span style={{ fontWeight: 700 }}>{ownerName}</span>
                              <span style={{ opacity: 0.75 }}>· Due {task.dueDate}</span>
                              <span style={{ opacity: 0.75 }}>· {task.estimatedEffortHours}h effort</span>
                              <span style={{ opacity: 0.75 }}>· Difficulty {task.difficulty}/5</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                            <button
                              type="button"
                              className="quiet-button task-edit-btn"
                              onClick={() => setEditingTempId(task.tempId)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => deleteTask(task.tempId)}
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", borderRadius: "6px" }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {task.description ? (
                          <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem", lineHeight: "1.5", opacity: 0.9, whiteSpace: "pre-line" }}>
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              className="primary-button ai-add-custom-task-btn"
              onClick={handleAddNewTask}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "10px 16px",
                borderRadius: "14px",
                border: "2px solid #101517",
                background: "var(--color-yellow, #fff73f)",
                color: "#101517",
                fontWeight: 900,
                fontSize: "0.95rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              + Add Task
            </button>
          </section>

          <details className="ai-output-card ai-risk-output">
            <summary className="ai-draft-section-heading"><h4>Risks &amp; assumptions</h4><span>Check</span></summary>
            <div className="ai-notes-grid">
              <section><h4>Risks to check</h4><ul>{draft.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul></section>
              <section><h4>Assumptions to verify</h4><ul>{draft.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></section>
              <section><h4>Meeting suggestions</h4><p>Open Team in the project workspace to use deterministic calendar overlap. AI never invents availability.</p></section>
            </div>
            <p className="ai-model-note">Generated through a free AI route. This draft is not saved.</p>
          </details>

          {isLeader ? (
            <div className="ai-save-actions-hero">
              <div className="ai-save-notice">
                <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Sparkles size={18} style={{ color: "var(--color-pink)" }} /> Ready to Launch Your Project?
                </strong>
                <p>Clicking confirm saves all AI generated tasks, assigns team responsibilities, and unlocks the Battle Board, Tasks, and Progress tabs!</p>
              </div>
              <button className="primary-button hero-save-plan-button" type="button" disabled={isGenerating} onClick={() => void handleSavePlan()}>
                {isGenerating ? <><Rocket size={18} style={{ display: "inline-block", verticalAlign: "-2px", marginRight: "6px" }} /> Saving &amp; Launching Project…</> : <><CheckCircle2 size={18} style={{ display: "inline-block", verticalAlign: "-2px", marginRight: "6px" }} /> Confirm &amp; Save Plan</>}
              </button>
            </div>
          ) : (
            <p className="ai-safety-note" style={{ marginTop: "1rem", textAlign: "center", fontWeight: 700 }}>
              Viewing AI plan preview draft. Only the room leader can confirm and save this plan.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
