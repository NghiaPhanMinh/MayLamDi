import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "../../lib/errors";

type Workspace = FunctionReturnType<typeof api.tasks.getWorkspace>;

type AllocationWorkbenchProps = {
  workspace: Workspace;
};

const SCORE_LABELS = {
  skillMatch: "Skills",
  availabilityFit: "Availability",
  workloadBalance: "Workload",
  preferenceFit: "Preference",
  dependencyTiming: "Dependencies",
};

export function AllocationWorkbench({ workspace }: AllocationWorkbenchProps) {
  const allocation = useQuery(api.allocation.getForProject, {
    projectId: workspace.project._id,
  });
  const updateTask = useMutation(api.tasks.updateTask);
  const [applyingTaskId, setApplyingTaskId] = useState<Id<"tasks"> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function applySuggestion(
    taskId: Id<"tasks">,
    candidateProfileId: string,
    candidateName: string,
  ) {
    const task = workspace.tasks.find((candidate) => candidate._id === taskId);

    if (!task) return;

    if (
      task.requiresReview &&
      task.reviewerProfileId === candidateProfileId
    ) {
      setError(
        "This person is the task reviewer. Edit the task and choose another reviewer before assigning them as owner.",
      );
      return;
    }

    setError(null);
    setMessage(null);
    setApplyingTaskId(taskId);

    try {
      await updateTask({
        taskId,
        phaseId: task.phaseId,
        milestoneId: task.milestoneId,
        title: task.title,
        description: task.description,
        primaryOwnerProfileId: candidateProfileId as Id<"userProfiles">,
        collaboratorProfileIds: task.collaboratorProfileIds.filter(
          (profileId) => profileId !== candidateProfileId,
        ),
        requiredSkills: task.requiredSkills,
        estimatedEffortHours: task.estimatedEffortHours,
        difficulty: task.difficulty,
        weight: task.weight,
        required: task.required,
        startDate: task.startDate,
        dueDate: task.dueDate,
        dependencyTaskIds: task.dependencyTaskIds,
        requiresReview: task.requiresReview,
        reviewerProfileId: task.reviewerProfileId,
      });
      setMessage(`${task.title} is now assigned to ${candidateName}.`);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "The suggested owner could not be applied."));
    } finally {
      setApplyingTaskId(null);
    }
  }

  if (allocation === undefined) {
    return (
      <section className="allocation-workbench" aria-busy="true">
        <p>Checking workload and allocation inputs…</p>
      </section>
    );
  }

  return (
    <section className="allocation-workbench" aria-labelledby="allocation-title">
      <div className="allocation-heading">
        <div>
          <p className="card-eyebrow">Decision support</p>
          <h3 className="display-heading" id="allocation-title">Allocation & workload lab</h3>
        </div>
        <span className="allocation-total">100-point transparent model</span>
      </div>
      <p className="allocation-caveat">{allocation.caveat}</p>
      <div className="allocation-weight-row" aria-label="Allocation score weights">
        {Object.entries(allocation.scoreWeights).map(([key, value]) => (
          <span key={key}>
            {SCORE_LABELS[key as keyof typeof SCORE_LABELS]} {value}
          </span>
        ))}
      </div>

      <section className="workload-section" aria-labelledby="workload-title">
        <div className="allocation-subheading">
          <h4 id="workload-title">Workload snapshot</h4>
          <p>Compare estimated task hours with each teammate’s reported capacity.</p>
        </div>
        <div className="workload-grid">
          {allocation.workload.map((member) => (
            <article
              key={member.profileId}
              className={member.overloaded ? "workload-card is-overloaded" : "workload-card"}
            >
              <div className="workload-card-heading">
                <h5>{member.displayName}</h5>
                <span>{member.currentWorkload} reported load</span>
              </div>
              <p className="workload-hours">
                <strong>{member.openEffortHours}h</strong> open effort
                {member.weeklyCapacity === undefined
                  ? " · capacity not supplied"
                  : ` · ${member.weeklyCapacity}h weekly capacity`}
              </p>
              <p>{member.availability || "No availability note supplied."}</p>
              <div className="workload-meta">
                <span>{member.openTaskCount} open tasks</span>
                <span>{member.overdueTaskCount} overdue</span>
              </div>
              {member.phaseEffort.length > 0 ? (
                <ul className="phase-effort-list">
                  {member.phaseEffort.map((phase) => (
                    <li key={phase.phaseId}>
                      <span>{phase.phaseTitle}</span>
                      <strong>{phase.effortHours}h</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="allocation-muted">No open assigned effort.</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="risk-section" aria-labelledby="risk-title">
        <div className="allocation-subheading">
          <h4 id="risk-title">Risk flags</h4>
          <p>Warnings are derived from saved dates, dependencies, reviews, and capacity.</p>
        </div>
        {allocation.risks.length === 0 ? (
          <div className="risk-empty">No current rule-based risks detected.</div>
        ) : (
          <div className="risk-list">
            {allocation.risks.map((risk) => (
              <article key={risk.id} className={`risk-item risk-${risk.severity}`}>
                <span>{risk.severity === "high" ? "High" : "Check"}</span>
                <div>
                  <h5>{risk.title}</h5>
                  <p>{risk.detail}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="suggestion-section" aria-labelledby="suggestion-title">
        <div className="allocation-subheading">
          <h4 id="suggestion-title">Explainable owner suggestions</h4>
          <p>Open a task to inspect every candidate before making a change.</p>
        </div>
        {message ? <p className="form-success" role="status">{message}</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {allocation.suggestions.length === 0 ? (
          <div className="risk-empty">Complete tasks do not need owner suggestions.</div>
        ) : (
          <div className="suggestion-list">
            {allocation.suggestions.map((suggestion) => {
              const currentOwner = workspace.members.find(
                (member) => member.profileId === suggestion.currentOwnerProfileId,
              );

              return (
                <details key={suggestion.taskId} className="suggestion-task">
                  <summary>
                    <span>
                      <strong>{suggestion.taskTitle}</strong>
                      <small>Current owner: {currentOwner?.displayName ?? "Unknown"}</small>
                    </span>
                    <span>{suggestion.candidates[0]?.displayName ?? "No eligible suggestion"}</span>
                  </summary>
                  <div className="candidate-list">
                    {suggestion.candidates.map((candidate) => {
                      const isCurrentOwner =
                        candidate.memberId === suggestion.currentOwnerProfileId;
                      const task = workspace.tasks.find(
                        (savedTask) => savedTask._id === suggestion.taskId,
                      );
                      const conflictsWithReviewer =
                        task?.requiresReview &&
                        task.reviewerProfileId === candidate.memberId;

                      return (
                        <article
                          key={candidate.memberId}
                          className={!candidate.eligible ? "candidate-card is-ineligible" : "candidate-card"}
                        >
                          <div className="candidate-heading">
                            <div>
                              <h5>{candidate.displayName}</h5>
                              <p>{isCurrentOwner ? "Current owner" : candidate.eligible ? "Eligible suggestion" : "Unavailable"}</p>
                            </div>
                            <strong>{candidate.totalScore}/100</strong>
                          </div>
                          <div className="candidate-score-grid">
                            {Object.entries(candidate.breakdown).map(([key, value]) => (
                              <span key={key}>
                                {SCORE_LABELS[key as keyof typeof SCORE_LABELS]} <strong>{value}</strong>
                              </span>
                            ))}
                          </div>
                          <ul className="candidate-explanation">
                            {candidate.explanation.map((line) => <li key={line}>{line}</li>)}
                          </ul>
                          {!isCurrentOwner && candidate.eligible ? (
                            <button
                              className="secondary-button"
                              type="button"
                              disabled={
                                !allocation.canWrite ||
                                conflictsWithReviewer ||
                                applyingTaskId === suggestion.taskId
                              }
                              onClick={() => void applySuggestion(
                                suggestion.taskId,
                                candidate.memberId,
                                candidate.displayName,
                              )}
                            >
                              {applyingTaskId === suggestion.taskId
                                ? "Applying…"
                                : conflictsWithReviewer
                                  ? "Reviewer cannot be owner"
                                  : `Assign to ${candidate.displayName}`}
                            </button>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
