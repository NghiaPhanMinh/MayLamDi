import { UiIcon } from "../common/UiIcon";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getErrorMessage } from "../../lib/errors";
import { TaskEvidencePanel } from "./TaskEvidencePanel";
import { TaskTradePanel } from "./TaskTradePanel";
import { REVIEW_WAITING_MESSAGE } from "./reviewCopy";

type SectionName = "Action Needed" | "In Progress" | "Waiting Review" | "Waiting Creator" | "Complete";

export function PersonalTasks({ onOpenRoom }: { onOpenRoom: (roomId: Id<"teams">) => void }) {
  const groups = useQuery(api.tasks.listMineAcrossRooms);
  const claimTask = useMutation(api.tasks.claimTask);
  const acceptTask = useMutation(api.tasks.acceptTask);
  const declineTask = useMutation(api.tasks.declineTask);
  const updateStatus = useMutation(api.tasks.updateTaskStatus);
  const [openTaskId, setOpenTaskId] = useState<Id<"tasks"> | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<Id<"tasks"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(taskId: Id<"tasks">, action: () => Promise<unknown>) {
    setPendingTaskId(taskId);
    setError(null);
    try { await action(); } catch (caughtError) { setError(getErrorMessage(caughtError, "The task could not be updated.")); } finally { setPendingTaskId(null); }
  }

  const taskSections = useMemo(() => {
    const sections = new Map<SectionName, Array<NonNullable<typeof groups>[number]["tasks"][number] & { roomId: Id<"teams">; roomName: string; projectId: Id<"projects">; projectTitle: string }>>([
      ["Action Needed", []], ["In Progress", []], ["Waiting Review", []], ["Waiting Creator", []], ["Complete", []],
    ]);
    for (const group of groups ?? []) {
      for (const task of group.tasks) {
        const decorated = { ...task, roomId: group.roomId, roomName: group.roomName, projectId: group.projectId, projectTitle: group.projectTitle };
        if (task.acceptanceStatus === "pending" || task.isOpenForClaiming || (task.isReviewer && ["submitted", "review"].includes(task.status))) sections.get("Action Needed")!.push(decorated);
        else if (["submitted", "review"].includes(task.status)) sections.get("Waiting Review")!.push(decorated);
        else if (task.status === "awaiting_creator") sections.get("Waiting Creator")!.push(decorated);
        else if (["completed", "verified"].includes(task.status)) sections.get("Complete")!.push(decorated);
        else sections.get("In Progress")!.push(decorated);
      }
    }
    return sections;
  }, [groups]);

  return (
    <section className="personal-tasks-page" aria-labelledby="personal-tasks-title">
      <header className="focused-page-heading"><div><h1 className="display-heading" id="personal-tasks-title">My Tasks</h1></div></header>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {groups === undefined ? <p aria-busy="true">Loading your tasks…</p> : null}
      {groups?.length === 0 ? <div className="project-empty"><strong>No tasks or review requests yet.</strong><p>Assigned work and review requests will appear here.</p></div> : null}

      {[...taskSections.entries()].map(([section, tasks]) => tasks.length ? (
        <section key={section} className={`personal-status-section personal-${section.toLowerCase().replaceAll(" ", "-")}`}>
          <header><h2>{section}</h2><span>{tasks.length}</span></header>
          <div className="personal-task-list">{tasks.map((task) => (
            <article
              key={task._id}
              className={`personal-task-card task-${task.status} ${openTaskId === task._id ? "is-expanded" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => setOpenTaskId((current) => current === task._id ? null : task._id)}
            >
              <div className="personal-task-header-row">
                <div className="personal-task-tags">
                  <span className="project-badge-tag"><UiIcon name="Folder" /> {task.projectTitle}</span>
                  <span className="room-phase-tag">{task.roomName} • {task.phaseName}</span>
                  <span className="due-date-tag">Due {task.dueDate}</span>
                </div>
                <button className="text-link open-room-link" type="button" onClick={(e) => { e.stopPropagation(); onOpenRoom(task.roomId); }}>
                  Open room <UiIcon name="ArrowUpRight" />
                </button>
              </div>
              <h3>{task.title}</h3>
              <p>{task.description || "No task description."}</p>
              <dl><div><dt>Weight</dt><dd>{task.weight}</dd></div><div><dt>Reviewer</dt><dd>{task.reviewerName}</dd></div><div><dt>Skills</dt><dd>{(task.requiredSkills ?? []).join(", ") || "None specified"}</dd></div></dl>
              <div className="personal-task-actions">
                {task.isMine && task.acceptanceStatus === "pending" ? <><button className="primary-button" type="button" disabled={pendingTaskId === task._id} onClick={(e) => { e.stopPropagation(); void run(task._id, () => acceptTask({ taskId: task._id })); }}>Accept Task</button><button className="quiet-button" type="button" disabled={pendingTaskId === task._id} onClick={(e) => { e.stopPropagation(); void run(task._id, () => declineTask({ taskId: task._id })); }}>Decline</button></> : null}
                {task.isOpenForClaiming ? <button className="primary-button" type="button" disabled={pendingTaskId === task._id} onClick={(e) => { e.stopPropagation(); void run(task._id, async () => { await claimTask({ taskId: task._id }); setOpenTaskId(task._id); }); }}>Claim Task</button> : null}
                {task.isMine && task.status === "todo" && task.acceptanceStatus !== "pending" ? <button className="primary-button maylamdi-button" type="button" disabled={pendingTaskId === task._id} onClick={(e) => { e.stopPropagation(); void run(task._id, async () => { await updateStatus({ taskId: task._id, status: "in_progress" }); setOpenTaskId(task._id); }); }}>MayLamDi</button> : null}
                {(task.isMine || task.isReviewer) && !["completed", "verified"].includes(task.status) ? <button className="secondary-button" type="button" onClick={(e) => { e.stopPropagation(); setOpenTaskId((current) => current === task._id ? null : task._id); }}>{task.isReviewer ? "MayReviewDi" : "Details & Evidence"}</button> : null}
                {task.status === "awaiting_creator" ? <span className="waiting-label">Waiting for room creator</span> : task.isReviewer && !["submitted", "review", "completed", "verified"].includes(task.status) ? <span className="waiting-label">{REVIEW_WAITING_MESSAGE}</span> : null}
              </div>
              {openTaskId === task._id ? <TaskEvidencePanel taskId={task._id} taskTitle={task.title} taskStatus={task.status} requiresReview={task.requiresReview} reviewerName={task.reviewerName === "Owner chooses later" ? undefined : task.reviewerName} /> : null}
            </article>
          ))}</div>
        </section>
      ) : null)}

      {groups?.length ? (
        <div className="personal-trade-groups" aria-label="Task trades by project">
          {groups.map((group) => (
            <details key={group.projectId} className="personal-trade-details">
              <summary>{group.projectTitle} task trades</summary>
              <TaskTradePanel projectId={group.projectId} />
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
