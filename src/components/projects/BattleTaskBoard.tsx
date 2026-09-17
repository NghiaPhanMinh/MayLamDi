import { UiIcon } from "../common/UiIcon";
import { AlertTriangle, Lock } from "lucide-react";
import {
  getBattleTaskAction,
  type BattleTaskStatus,
  type BattleTaskSummary,
} from "./battleTaskAction";
import { CharacterAvatar } from "../common/CharacterAvatar";
import { REVIEW_WAITING_MESSAGE } from "./reviewCopy";

export type { BattleTaskSummary } from "./battleTaskAction";

type BattleTaskBoardProps = {
  tasks: BattleTaskSummary[];
  canManageProject: boolean;
  tasksLocked: boolean;
  disabled?: boolean;
  onOpenDetails: (taskId: string) => void;
  onClaim: (taskId: string) => void;
  onAccept: (taskId: string) => void;
  onDecline: (taskId: string) => void;
  onReleaseOverdue?: (taskId: string) => void;
};

const STATUS_LABELS: Record<BattleTaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Waiting Review",
  submitted: "Submitted for Review",
  changes_requested: "Changes Requested",
  awaiting_creator: "Awaiting Creator",
  completed: "Complete",
  verified: "Complete",
};

function BattleTaskNote({
  task,
  canManageProject,
  tasksLocked,
  disabled,
  onOpenDetails,
  onClaim,
  onAccept,
  onDecline,
  onReleaseOverdue,
}: {
  task: BattleTaskSummary;
  canManageProject: boolean;
  tasksLocked: boolean;
  disabled?: boolean;
  onOpenDetails: (taskId: string) => void;
  onClaim: (taskId: string) => void;
  onAccept: (taskId: string) => void;
  onDecline: (taskId: string) => void;
  onReleaseOverdue?: (taskId: string) => void;
}) {
  const action = getBattleTaskAction(task, canManageProject);
  const isOverdue = Boolean(
    task.dueDate &&
    new Date(`${task.dueDate}T23:59:59Z`).getTime() < Date.now() &&
    !["completed", "verified"].includes(task.status)
  );

  return (
    <article className={`battle-task-note task-${task.status} ${task.isMine ? "is-mine" : ""}`}>
      <button
        className="battle-task-note-main"
        type="button"
        aria-label={`Open details for ${task.title}`}
        onClick={() => onOpenDetails(task.id)}
      >
        <span className="battle-task-phase">{task.phase}</span>
        <strong>{task.title}</strong>
        <span className="battle-task-owner" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          {!task.isOpenForClaiming && task.owner !== "Unassigned" ? (
            <CharacterAvatar
              fill={task.ownerFill}
              outline={task.ownerOutline}
              spellType={task.ownerSpellType as any}
              name={task.owner}
              size="xs"
            />
          ) : null}
          {task.owner}{tasksLocked && !task.isOpenForClaiming ? <Lock size={12} aria-label="Task allocation locked" style={{ display: "inline-block", verticalAlign: "-2px" }} /> : null}
        </span>
        <span className="battle-task-date">
          Due {task.dueDate}
          {isOverdue ? <strong style={{ color: "#ef4444", marginLeft: "6px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "2px" }}><AlertTriangle size={12} /> Overdue</strong> : null}
        </span>
        <span className="battle-task-reviewer">Reviewer: {task.reviewer}</span>
        <span className="battle-task-impact">Weight {task.weight} · {task.damage} DMG</span>
        <span className={`battle-task-status status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
      </button>

      <div className="battle-task-actions">
        {action === "claim" ? (
          <button className="primary-button" type="button" disabled={disabled} onClick={() => onClaim(task.id)}>Claim Task</button>
        ) : null}
        {action === "accept_or_decline" ? (
          <>
            <button className="primary-button" type="button" disabled={disabled} onClick={() => onAccept(task.id)}>Accept</button>
            <button className="quiet-button" type="button" disabled={disabled} onClick={() => onDecline(task.id)}>Decline</button>
          </>
        ) : null}
        {action === "submit" ? (
          <button className={task.status === "todo" ? "primary-button maylamdi-button" : "primary-button"} type="button" disabled={disabled} onClick={() => onOpenDetails(task.id)}>
            {task.status === "todo" ? "MayLamDi" : task.status === "changes_requested" ? "Resubmit Task" : "Submit Task"}
          </button>
        ) : null}
        {action === "review" ? (
          <button className="primary-button" type="button" onClick={() => onOpenDetails(task.id)}>MayReviewDi</button>
        ) : null}
        {action === "approve" ? (
          <button className="primary-button" type="button" onClick={() => onOpenDetails(task.id)}>Approve Completion</button>
        ) : null}
        {isOverdue && canManageProject && !task.isOpenForClaiming ? (
          <button
            className="quiet-button"
            type="button"
            title="Release task back to team so active members can claim it"
            onClick={(e) => {
              e.stopPropagation();
              onReleaseOverdue?.(task.id);
            }}
          >
            Re-open to Team
          </button>
        ) : null}
        {action === "waiting_review" ? <span className="battle-task-waiting">{task.isReviewer ? REVIEW_WAITING_MESSAGE : "Waiting for Review"}</span> : null}
        {action === "waiting_approval" ? <span className="battle-task-waiting">Waiting for Approval</span> : null}
        {action === "complete" ? <span className="battle-task-complete">Completed <UiIcon name="Check" /></span> : null}
        {action === "details" ? (
          <button className="text-link" type="button" onClick={() => onOpenDetails(task.id)}>View details</button>
        ) : null}
      </div>
    </article>
  );
}

export function BattleTaskBoard({
  tasks,
  canManageProject,
  tasksLocked,
  disabled,
  onOpenDetails,
  onClaim,
  onAccept,
  onDecline,
  onReleaseOverdue,
}: BattleTaskBoardProps) {
  const myTasks = tasks.filter((task) =>
    task.isMine &&
    !task.isOpenForClaiming &&
    task.acceptanceStatus !== "declined" &&
    !["completed", "verified"].includes(task.status),
  );
  const teamTasks = tasks.filter((task) => !myTasks.some((mine) => mine.id === task.id));

  const renderTask = (task: BattleTaskSummary) => (
    <BattleTaskNote
      key={task.id}
      task={task}
      canManageProject={canManageProject}
      tasksLocked={tasksLocked}
      disabled={disabled}
      onOpenDetails={onOpenDetails}
      onClaim={onClaim}
      onAccept={onAccept}
      onDecline={onDecline}
      onReleaseOverdue={onReleaseOverdue}
    />
  );

  return (
    <section className="battle-task-board" aria-labelledby="battle-task-board-title">
      <header className="battle-task-board-heading">
        <span>{tasks.filter((task) => !["completed", "verified"].includes(task.status)).length} active tasks</span>
      </header>

      <section className="battle-task-group" aria-labelledby="my-battle-tasks-title">
        <div className="battle-task-group-heading">
          <h4 id="my-battle-tasks-title">My active tasks</h4>
          <span>{myTasks.length}</span>
        </div>
        {myTasks.length > 0 ? (
          <div className="battle-task-strip battle-my-task-strip">{myTasks.map(renderTask)}</div>
        ) : (
          <p className="battle-task-empty">No active task is assigned to you. You can still claim an open team task.</p>
        )}
      </section>

      <section className="battle-task-group" aria-labelledby="team-battle-tasks-title">
        <div className="battle-task-group-heading">
          <h4 id="team-battle-tasks-title">Team tasks</h4>
          <span>{teamTasks.length}</span>
        </div>
        {teamTasks.length > 0 ? (
          <div className="battle-task-strip">{teamTasks.map(renderTask)}</div>
        ) : (
          <p className="battle-task-empty">All team tasks are already shown in your active strip.</p>
        )}
      </section>
    </section>
  );
}
