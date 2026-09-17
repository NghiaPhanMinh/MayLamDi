import { useState } from "react";
import { useMutation } from "convex/react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { BuiltInFramework } from "../../data/frameworks";
import { getErrorMessage } from "../../lib/errors";

type DraftPhase = {
  key: string;
  name: string;
  description: string;
  isOptional: boolean;
  deliverables: string;
  skills: string;
  canOverlap: boolean;
  defaultDependencyKeys: string[];
  reviewCheckpoint: boolean;
};

type CustomFrameworkBuilderProps = {
  teamId: Id<"teams">;
  existing?: Doc<"customFrameworks">;
  seed?: BuiltInFramework;
  onCancel: () => void;
  onSaved: () => void;
};

let phaseSequence = 0;

function makePhaseKey() {
  phaseSequence += 1;
  return `phase_${Date.now().toString(36)}_${phaseSequence}`;
}

function blankPhase(): DraftPhase {
  return {
    key: makePhaseKey(),
    name: "",
    description: "",
    isOptional: false,
    deliverables: "",
    skills: "",
    canOverlap: false,
    defaultDependencyKeys: [],
    reviewCheckpoint: false,
  };
}

function makeInitialDraft(
  existing?: Doc<"customFrameworks">,
  seed?: BuiltInFramework,
) {
  if (existing) {
    return {
      name: existing.name,
      description: existing.description,
      sourceBuiltInId: existing.sourceBuiltInId,
      phases: existing.phases.map((phase) => ({
        key: phase.key,
        name: phase.name,
        description: phase.description,
        isOptional: phase.isOptional,
        deliverables: phase.suggestedDeliverables.join(", "),
        skills: phase.suggestedSkills.join(", "),
        canOverlap: phase.canOverlap,
        defaultDependencyKeys: phase.defaultDependencyKeys,
        reviewCheckpoint: phase.reviewCheckpoint,
      })),
    };
  }

  if (seed) {
    return {
      name: `${seed.shortName} — team copy`,
      description: seed.description,
      sourceBuiltInId: seed.id,
      phases: seed.phases.map((phase) => ({
        key: phase.id,
        name: phase.name,
        description: phase.description,
        isOptional: false,
        deliverables: phase.suggestedDeliverables.join(", "),
        skills: phase.suggestedSkills.join(", "),
        canOverlap: phase.canOverlap,
        defaultDependencyKeys: phase.defaultDependencies,
        reviewCheckpoint: phase.reviewCheckpoint,
      })),
    };
  }

  return {
    name: "",
    description: "",
    sourceBuiltInId: undefined,
    phases: [blankPhase()],
  };
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CustomFrameworkBuilder({
  teamId,
  existing,
  seed,
  onCancel,
  onSaved,
}: CustomFrameworkBuilderProps) {
  const initialDraft = makeInitialDraft(existing, seed);
  const createFramework = useMutation(api.customFrameworks.create);
  const updateFramework = useMutation(api.customFrameworks.update);
  const [name, setName] = useState(initialDraft.name);
  const [description, setDescription] = useState(initialDraft.description);
  const [phases, setPhases] = useState<DraftPhase[]>(initialDraft.phases);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function updatePhase(index: number, patch: Partial<DraftPhase>) {
    setPhases((current) =>
      current.map((phase, phaseIndex) =>
        phaseIndex === index ? { ...phase, ...patch } : phase,
      ),
    );
  }

  function movePhase(index: number, direction: -1 | 1) {
    const destination = index + direction;

    if (destination < 0 || destination >= phases.length) {
      return;
    }

    setPhases((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function removePhase(index: number) {
    if (phases.length === 1) {
      setSaveError("A custom framework needs at least one phase.");
      return;
    }

    const removedKey = phases[index].key;
    setPhases((current) =>
      current
        .filter((_, phaseIndex) => phaseIndex !== index)
        .map((phase) => ({
          ...phase,
          defaultDependencyKeys: phase.defaultDependencyKeys.filter(
            (dependencyKey) => dependencyKey !== removedKey,
          ),
        })),
    );
  }

  function toggleDependency(index: number, dependencyKey: string) {
    const currentDependencies = phases[index].defaultDependencyKeys;
    updatePhase(index, {
      defaultDependencyKeys: currentDependencies.includes(dependencyKey)
        ? currentDependencies.filter((key) => key !== dependencyKey)
        : [...currentDependencies, dependencyKey],
    });
  }

  async function handleSave() {
    setSaveError(null);
    setIsSaving(true);
    const payload = {
      name,
      description,
      phases: phases.map((phase) => ({
        key: phase.key,
        name: phase.name,
        description: phase.description,
        isOptional: phase.isOptional,
        suggestedDeliverables: splitCommaList(phase.deliverables),
        suggestedSkills: splitCommaList(phase.skills),
        canOverlap: phase.canOverlap,
        defaultDependencyKeys: phase.defaultDependencyKeys,
        reviewCheckpoint: phase.reviewCheckpoint,
      })),
      sourceBuiltInId: initialDraft.sourceBuiltInId,
    };

    try {
      if (existing) {
        await updateFramework({
          customFrameworkId: existing._id,
          ...payload,
        });
      } else {
        await createFramework({ teamId, ...payload });
      }
      onSaved();
    } catch (error) {
      setSaveError(
        getErrorMessage(error, "The custom framework could not be saved."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="custom-framework-builder">
      <header>
        <div>
          <p className="card-eyebrow">
            {existing ? `Editing version ${existing.version}` : "New team template"}
          </p>
          <h3>{seed ? `Customise ${seed.shortName}` : "Create a custom framework."}</h3>
        </div>
        <button className="quiet-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </header>

      <div className="framework-basics">
        <label>
          Framework name
          <input
            type="text"
            minLength={2}
            maxLength={80}
            required
            placeholder="e.g. 3D Character Pipeline, Mobile App Redesign..."
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            maxLength={500}
            placeholder="e.g. Standard team workflow for research, prototyping, testing, and final asset delivery..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </div>

      <ol className="custom-phase-editor-list">
        {phases.map((phase, index) => (
          <li key={phase.key} className="custom-phase-editor">
            <div className="custom-phase-toolbar">
              <span>Phase {index + 1}</span>
              <div>
                <button
                  type="button"
                  disabled={index === 0}
                  aria-label={`Move ${phase.name || `phase ${index + 1}`} up`}
                  onClick={() => movePhase(index, -1)}
                >
                  <ChevronUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={index === phases.length - 1}
                  aria-label={`Move ${phase.name || `phase ${index + 1}`} down`}
                  onClick={() => movePhase(index, 1)}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="remove-phase-button"
                  aria-label={`Remove ${phase.name || `phase ${index + 1}`}`}
                  onClick={() => removePhase(index)}
                >
                  <Trash2 size={15} aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-2px", marginRight: "4px" }} />
                  Remove
                </button>
              </div>
            </div>

            <div className="custom-phase-fields">
              <label>
                Phase name
                <input
                  type="text"
                  maxLength={80}
                  required
                  placeholder="e.g. Discovery & Research"
                  value={phase.name}
                  onChange={(event) =>
                    updatePhase(index, { name: event.target.value })
                  }
                />
              </label>
              <label>
                Phase description
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Define user requirements, gather references, and set up project scope..."
                  value={phase.description}
                  onChange={(event) =>
                    updatePhase(index, { description: event.target.value })
                  }
                />
              </label>
              <label>
                Suggested deliverables
                <input
                  type="text"
                  placeholder="e.g. Moodboard, User Journey, Prototype"
                  value={phase.deliverables}
                  onChange={(event) =>
                    updatePhase(index, { deliverables: event.target.value })
                  }
                />
                <small>Separate items with commas.</small>
              </label>
              <label>
                Common skills
                <input
                  type="text"
                  placeholder="e.g. Figma, Blender 3D, UI Research"
                  value={phase.skills}
                  onChange={(event) =>
                    updatePhase(index, { skills: event.target.value })
                  }
                />
                <small>Separate items with commas.</small>
              </label>
            </div>

            <div className="phase-option-grid">
              <label>
                <input
                  type="checkbox"
                  checked={phase.isOptional}
                  onChange={(event) =>
                    updatePhase(index, { isOptional: event.target.checked })
                  }
                />
                Optional phase
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={phase.canOverlap}
                  onChange={(event) =>
                    updatePhase(index, { canOverlap: event.target.checked })
                  }
                />
                May overlap
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={phase.reviewCheckpoint}
                  onChange={(event) =>
                    updatePhase(index, {
                      reviewCheckpoint: event.target.checked,
                    })
                  }
                />
                Review checkpoint
              </label>
            </div>

            {phases.length > 1 ? (
              <fieldset className="dependency-selector">
                <legend>Depends on</legend>
                <div>
                  {phases
                    .filter((candidate) => candidate.key !== phase.key)
                    .map((candidate) => (
                      <label key={candidate.key}>
                        <input
                          type="checkbox"
                          checked={phase.defaultDependencyKeys.includes(
                            candidate.key,
                          )}
                          onChange={() =>
                            toggleDependency(index, candidate.key)
                          }
                        />
                        {candidate.name ||
                          `Phase ${
                            phases.findIndex(
                              (item) => item.key === candidate.key,
                            ) + 1
                          }`}
                      </label>
                    ))}
                </div>
              </fieldset>
            ) : null}
          </li>
        ))}
      </ol>

      <button
        className="add-phase-button"
        type="button"
        disabled={phases.length >= 20}
        onClick={() => setPhases((current) => [...current, blankPhase()])}
      >
        <Plus size={16} aria-hidden="true" style={{ display: "inline-block", verticalAlign: "-2px", marginRight: "4px" }} />
        Add phase
      </button>

      {saveError ? (
        <p className="form-error" role="alert">
          {saveError}
        </p>
      ) : null}
      <div className="builder-actions">
        <span>{phases.length}/20 phases</span>
        <button
          className="primary-button"
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
        >
          {isSaving
            ? "Saving framework…"
            : existing
              ? "Save new version"
              : "Save to team"}
        </button>
      </div>
    </div>
  );
}
