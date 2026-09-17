import { useState } from "react";
import { useMutation } from "convex/react";
import { SpellIcon } from "../common/UiIcon";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  CHARACTER_PALETTE,
  SPELL_OPTIONS,
  type SpellType,
} from "../../lib/character";
import { getErrorMessage } from "../../lib/errors";

type CharacterCustomizerProps = {
  teamId?: Id<"teams">;
  member: {
    displayName: string;
    characterFill: string;
    characterOutline: string;
    spellType?: SpellType;
  };
};

export function CharacterCustomizer({
  teamId,
  member,
}: CharacterCustomizerProps) {
  const updateCharacter = useMutation(api.teams.updateCharacter);
  const [fill, setFill] = useState(member.characterFill);
  const [outline, setOutline] = useState(member.characterOutline);
  const [spellType, setSpellType] = useState<SpellType | undefined>(
    member.spellType,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const coloursMatch = fill === outline;
  const hasChanges =
    fill !== member.characterFill ||
    outline !== member.characterOutline ||
    spellType !== member.spellType;

  async function handleSave() {
    setSaveError(null);
    setIsSaving(true);

    try {
      await updateCharacter({
        teamId,
        fill,
        outline,
        spellType,
      });
    } catch (error) {
      setSaveError(
        getErrorMessage(error, "Your character could not be saved."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="character-card" aria-labelledby="character-title">
      <div className="character-copy">
        <p className="card-eyebrow">Your team character</p>
        <h2 className="character-card-title" id="character-title">Choose your character colours.</h2>
        <p>
          These colours belong to you in this team only. Teammates see changes
          as soon as you save.
        </p>

        <div className="character-controls">
          <fieldset>
            <legend>Fill colour</legend>
            <div className="palette-grid" role="radiogroup">
              {CHARACTER_PALETTE.map((colour) => (
                <button
                  key={`fill-${colour.value}`}
                  className="palette-option"
                  type="button"
                  role="radio"
                  aria-checked={fill === colour.value}
                  aria-label={`${colour.name} fill`}
                  onClick={() => setFill(colour.value)}
                >
                  <span
                    style={{ backgroundColor: colour.value }}
                    aria-hidden="true"
                  />
                  {colour.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Outline colour</legend>
            <div className="palette-grid" role="radiogroup">
              {CHARACTER_PALETTE.map((colour) => (
                <button
                  key={`outline-${colour.value}`}
                  className="palette-option"
                  type="button"
                  role="radio"
                  aria-checked={outline === colour.value}
                  aria-label={`${colour.name} outline`}
                  onClick={() => setOutline(colour.value)}
                >
                  <span
                    style={{ backgroundColor: colour.value }}
                    aria-hidden="true"
                  />
                  {colour.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Spell style</legend>
            <div className="spell-grid" role="radiogroup">
              {SPELL_OPTIONS.map((spell) => {
                const selectedValue = spellType ?? "none";

                return (
                  <button
                    key={spell.value}
                    type="button"
                    role="radio"
                    aria-checked={selectedValue === spell.value}
                    onClick={() =>
                      setSpellType(
                        spell.value === "none" ? undefined : spell.value,
                      )
                    }
                  >
                    <span aria-hidden="true"><SpellIcon spellType={spell.value === "none" ? undefined : spell.value} /></span>
                    {spell.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {coloursMatch ? (
          <p className="form-error" role="alert">
            Fill and outline must be different so your character stays visible.
          </p>
        ) : null}
        {saveError ? (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        ) : null}
        <button
          className="primary-button"
          type="button"
          disabled={isSaving || coloursMatch || !hasChanges}
          onClick={() => void handleSave()}
        >
          {isSaving ? "Saving character…" : "Save character"}
        </button>
      </div>

      <div className="character-preview">
        <span>Live preview</span>
        <div
          className="character-orb"
          style={{
            backgroundColor: fill,
            borderColor: outline,
            color: outline,
          }}
        >
          <strong>{member.displayName.slice(0, 1).toUpperCase()}</strong>
          <i aria-hidden="true"><SpellIcon spellType={spellType} /></i>
        </div>
        <p>{member.displayName}</p>
      </div>
    </article>
  );
}
