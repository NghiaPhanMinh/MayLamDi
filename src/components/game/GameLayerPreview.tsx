import { useMemo, useState } from "react";

import {
  calculateMilestoneProgress,
  calculateWeightedProgress,
  derivePracticalProjectStatus,
  describeGameState,
  type WeightedProgressTask,
} from "../../lib/gameProgress";

import { SVGDefs } from "./landscape/SVGDefs";
import { LandscapeSky } from "./landscape/LandscapeSky";
import { LandscapeTerrain } from "./landscape/LandscapeTerrain";
import { LandscapeVillage } from "./landscape/LandscapeVillage";
import { LandscapeGoblins } from "./landscape/LandscapeGoblins";
import { LandscapePlayers } from "./landscape/LandscapePlayers";
import { LandscapeDragon } from "./landscape/LandscapeDragon";
import { LandscapeFX } from "./landscape/LandscapeFX";

const PREVIEW_TASKS: Omit<WeightedProgressTask, "status">[] = [
  {
    id: "research",
    title: "Map the audience",
    weight: 2,
    required: true,
  },
  {
    id: "direction",
    title: "Choose the creative direction",
    weight: 3,
    required: true,
  },
  {
    id: "prototype",
    title: "Build and test the prototype",
    weight: 4,
    required: true,
  },
  {
    id: "handoff",
    title: "Prepare the final handoff",
    weight: 1,
    required: true,
  },
];

const PREVIEW_MILESTONES = [
  {
    id: "discovery",
    title: "Discovery cleared",
    requiredTaskIds: ["research", "direction"],
  },
  {
    id: "delivery",
    title: "Delivery cleared",
    requiredTaskIds: ["prototype", "handoff"],
  },
];

export function GameLayerPreview() {
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [showOverdueState, setShowOverdueState] = useState(false);
  const tasks = useMemo(
    () =>
      PREVIEW_TASKS.map((task) => ({
        ...task,
        status: completedTaskIds.has(task.id)
          ? ("completed" as const)
          : ("todo" as const),
      })),
    [completedTaskIds],
  );
  const progress = calculateWeightedProgress(tasks);
  const milestoneProgress = calculateMilestoneProgress(
    tasks,
    PREVIEW_MILESTONES,
  );
  const practicalStatus = derivePracticalProjectStatus({
    tasks,
    deadline: showOverdueState ? "2026-07-01" : "2026-12-31",
    today: "2026-07-31",
  });
  const bossDefeated = practicalStatus === "completed";

  function toggleTask(taskId: string) {
    setCompletedTaskIds((current) => {
      const next = new Set(current);

      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }

      return next;
    });
  }

  const previewGoblins = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "completed")
        .map((t) => ({
          id: t.id,
          memberId: t.id,
          memberName: t.title,
          isDefeated: false,
        })),
    [tasks],
  );

  return (
    <section className="game-layer-preview" aria-labelledby="game-layer-title">
      <SVGDefs />
      <div className="game-layer-heading">
        <div>
          <p className="kicker">Game functions lab</p>
          <h2 className="display-heading" id="game-layer-title">Preview task progress in the game.</h2>
          <p>
            This preview demonstrates the presentation layer. Real saved
            progress will come only from weighted project tasks and milestones,
            never from a manual game score.
          </p>
        </div>
        <span className="preview-only-badge">Preview controls · not saved</span>
      </div>

      <div className="game-layer-grid">
        <article
          className={`boss-stage ${
            bossDefeated ? "boss-defeated" : ""
          } milestone-power-${milestoneProgress.completedCount}`}
        >
          <div className="boss-status-row">
            <span>Practical status</span>
            <strong>{practicalStatus.replace("_", " ")}</strong>
          </div>

          <div className="landscape-scene-container" aria-label="Interactive preview encounter scene">
            <LandscapeSky />
            <LandscapeTerrain />
            <LandscapeVillage villageHpPercent={progress.bossHealthPercent} />
            <LandscapeGoblins goblins={previewGoblins} />
            <LandscapePlayers members={[]} />
            <LandscapeDragon bossHpPercent={progress.bossHealthPercent} isDefeated={bossDefeated} />
            <LandscapeFX activeEvent={null} isVictory={bossDefeated} />
          </div>

          <div className="boss-health">
            <div>
              <span>Boss health</span>
              <strong>{progress.bossHealthPercent}%</strong>
            </div>
            <div
              className="boss-health-track"
              role="progressbar"
              aria-label="Boss health"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.bossHealthPercent}
            >
              <span
                style={{ width: `${progress.bossHealthPercent}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
          <p className="boss-message" role="status">
            {describeGameState(practicalStatus)}
          </p>
        </article>

        <article className="quest-preview-card">
          <div className="card-heading">
            <div>
              <p className="card-eyebrow">Weighted required tasks</p>
              <h3>
                {progress.completedWeight}/{progress.totalWeight} power cleared
              </h3>
            </div>
            <strong className="progress-medallion">
              {progress.progressPercent}%
            </strong>
          </div>

          <ul className="preview-quest-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <label>
                  <input
                    aria-label={task.title}
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span>
                    <strong>{task.title}</strong>
                    <small>Weight {task.weight} · required task</small>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="preview-milestones">
            {milestoneProgress.milestones.map((milestone) => (
              <span
                key={milestone.id}
                className={milestone.completed ? "is-cleared" : ""}
              >
                {milestone.completed ? "✦ " : ""}
                {milestone.title}
              </span>
            ))}
          </div>

          <label className="overdue-preview-toggle">
            <input
              type="checkbox"
              checked={showOverdueState}
              onChange={(event) => setShowOverdueState(event.target.checked)}
            />
            Preview a passed deadline
          </label>
        </article>
      </div>

      <div className="fair-play-rules">
        <strong>Fair-play rules</strong>
        <span>No teammate leaderboard</span>
        <span>No punitive XP</span>
        <span>No goblin quota</span>
        <span>Game visuals never block work</span>
      </div>
    </section>
  );
}
