import type { SpellType } from "../../lib/character";
import { SpellIcon } from "./UiIcon";

type CharacterAvatarProps = {
  name: string;
  fill?: string;
  outline?: string;
  spellType?: SpellType;
  imageUrl?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

export function CharacterAvatar({
  name,
  fill = "#FFF73F",
  outline = "#4CA0FE",
  spellType,
  size = "sm",
  className = "",
}: CharacterAvatarProps) {
  const initial = (name || "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={`character-avatar-orb size-${size} ${className}`}
      style={{
        backgroundColor: fill,
        borderColor: outline,
        color: outline,
      }}
      title={`${name}${spellType ? ` (${spellType})` : ""}`}
    >
      <span className="avatar-initial">{initial}</span>
      {spellType ? (
        <i className="avatar-spell-badge" style={{ backgroundColor: outline, color: fill }}>
          <SpellIcon spellType={spellType} />
        </i>
      ) : null}
    </div>
  );
}
