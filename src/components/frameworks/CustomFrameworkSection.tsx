import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { BuiltInFramework } from "../../data/frameworks";
import { CustomFrameworkBuilder } from "./CustomFrameworkBuilder";

type CustomFrameworkSectionProps = {
  teamId: Id<"teams">;
  currentProfileId: Id<"userProfiles">;
  currentRole: "owner" | "member";
  seed: BuiltInFramework | null;
  onSeedClosed: () => void;
};

export function CustomFrameworkSection({
  teamId,
  currentProfileId,
  currentRole,
  seed,
  onSeedClosed,
}: CustomFrameworkSectionProps) {
  const frameworks = useQuery(api.customFrameworks.listForTeam, { teamId });
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Doc<"customFrameworks"> | null>(null);
  const builderOpen = seed !== null || isCreating || editing !== null;

  function closeBuilder() {
    setIsCreating(false);
    setEditing(null);
    onSeedClosed();
  }

  return (
    <section
      className="custom-framework-section"
      aria-labelledby="custom-framework-title"
    >
      <div className="custom-framework-heading">
        <div>
          <p className="kicker">Team-owned templates</p>
          <h2 className="display-heading" id="custom-framework-title">Create a team framework.</h2>
          <p>
            Create a framework or copy a preset. Set its phases, outputs, skills, dependencies and review points.
          </p>
        </div>
        {!builderOpen ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() => setIsCreating(true)}
          >
            Create custom framework
          </button>
        ) : null}
      </div>

      {builderOpen ? (
        <CustomFrameworkBuilder
          key={
            editing
              ? `edit-${editing._id}-${editing.version}`
              : seed
                ? `seed-${seed.id}`
                : "blank"
          }
          teamId={teamId}
          existing={editing ?? undefined}
          seed={seed ?? undefined}
          onCancel={closeBuilder}
          onSaved={closeBuilder}
        />
      ) : frameworks === undefined ? (
        <p role="status">Loading team frameworks…</p>
      ) : frameworks.length === 0 ? (
        <div className="custom-framework-empty">
          <strong>No custom frameworks yet.</strong>
          <p>
            Start from a blank flow here, or use “Copy and customise” on any
            built-in template above.
          </p>
        </div>
      ) : (
        <div className="custom-framework-grid" aria-live="polite">
          {frameworks.map((framework) => {
            const canEdit =
              currentRole === "owner" ||
              framework.creatorProfileId === currentProfileId;

            return (
              <article key={framework._id}>
                <span>Version {framework.version}</span>
                <h3>{framework.name}</h3>
                <p>{framework.description || "No description yet."}</p>
                <ul>
                  {framework.phases.map((phase, index) => (
                    <li key={phase.key}>
                      {index + 1}. {phase.name}
                      {phase.isOptional ? " · optional" : ""}
                    </li>
                  ))}
                </ul>
                {canEdit ? (
                  <button
                    className="quiet-button"
                    type="button"
                    onClick={() => setEditing(framework)}
                  >
                    Edit framework
                  </button>
                ) : (
                  <small>Only the creator or team owner can edit.</small>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
