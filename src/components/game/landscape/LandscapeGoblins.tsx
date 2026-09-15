import { Ghost } from "lucide-react";

type GoblinInfo = {
  id: string;
  memberId: string;
  memberName: string;
  goblinState?: "ghost" | "active";
  isDefeated?: boolean;
};

type LandscapeGoblinsProps = {
  goblins: GoblinInfo[];
};

// Deterministically generate a random clothing color from teammate palette that changes daily
export function getGoblinClothingColor(memberId: string) {
  const today = new Date();
  const dateSeed = today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate();
  let hash = dateSeed;
  for (let i = 0; i < memberId.length; i++) {
    hash = memberId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#feaa01", // Vibrant Amber Orange
    "#fff73f", // Bright Canary Yellow
    "#ff8ae7", // Soft Pink
    "#fd39e4", // Vivid Magenta
    "#1dd851", // Bright Neon Green
    "#4ca0fe", // Sky Blue
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function getGoblinCoordinates(index: number = 0, totalCount: number = 1) {
  if (totalCount <= 2) {
    const x = 425 + index * 40;
    const y = 265 + (index % 2) * 10;
    return { x, y };
  }
  // Staggered 2-column vertical stacking for 3+ goblins
  const col = index % 2;
  const row = Math.floor(index / 2);
  const x = 420 + col * 38;
  const y = 246 + row * 26;
  return { x, y };
}

export function LandscapeGoblins({ goblins }: LandscapeGoblinsProps) {
  const count = Math.max(1, goblins.length);

  return (
    <div className="landscape-layer layer-6-goblins" aria-label="Daily goblins wave defense">
      <style>{`
        @keyframes goblin-breath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes goblin-ghost-soul {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.75; }
          50% { transform: translateY(-7px) scale(1.08); opacity: 0.95; }
        }
      `}</style>
      <svg viewBox="0 0 1000 400" width="100%" height="100%">
        {/* Center middle field face-off zone closer to players */}
        <g>
          {goblins.map((goblin, index) => {
            const { x: offsetX, y: offsetY } = getGoblinCoordinates(index, count);
            const isGhost = goblin.goblinState === "ghost" || (goblin.isDefeated ?? false);
            const clothingColor = getGoblinClothingColor(goblin.memberId || goblin.id);

            return (
              <g
                key={goblin.id}
                transform={`translate(${offsetX}, ${offsetY})`}
                className={`goblin-item ${isGhost ? "goblin-ghost-defeated" : "goblin-active-attacking"}`}
                style={{
                  opacity: isGhost ? 0.75 : 1,
                  filter: isGhost ? "drop-shadow(0 0 6px #60a5fa)" : "none",
                }}
                role="img"
                aria-label={`Goblin wave defense for ${goblin.memberName} (${isGhost ? "Defeated ghost" : "Attacking fence"})`}
              >
                {/* 1. Ground Shadow (Always visible on floor) */}
                <ellipse cx="15" cy="38" rx="14" ry="4" fill="rgba(0,0,0,0.22)" stroke="none" />

                {isGhost ? (
                  /* =========================================================================
                     2. DEFEATED / FALLEN APART STATE + FLOATING GHOST SOUL
                     ========================================================================= */
                  <g>
                    {/* Dropped Spear (Lying horizontally on the ground) */}
                    <line x1="38" y1="37" x2="8" y2="37" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                    <polygon points="3,37 9,34 9,40" fill="#cbd5e1" stroke="none" />

                    {/* Collapsed Torso / Body lying flat */}
                    <polygon points="10,32 25,31 23,37 8,36" fill={clothingColor} opacity="0.5" stroke="none" />

                    {/* Detached Arms */}
                    <polygon points="4,34 0,38 3,39 7,35" fill="#a3e635" opacity="0.5" stroke="none" />
                    <polygon points="26,33 31,36 30,38 25,35" fill="#a3e635" opacity="0.5" stroke="none" />

                    {/* Rolled Head (Fallen to the side) */}
                    <circle cx="-2" cy="33" r="6.5" fill="#bef264" opacity="0.5" stroke="none" />
                    <polygon points="-7,32 -14,28 -6,35" fill="#65a30d" opacity="0.5" stroke="none" />
                    <polygon points="3,32 10,29 4,36" fill="#65a30d" opacity="0.5" stroke="none" />

                    {/* Dead X Eyes */}
                    <line x1="-5" y1="31" x2="-3" y2="33" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="-3" y1="31" x2="-5" y2="33" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="-1" y1="31" x2="1" y2="33" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="1" y1="31" x2="-1" y2="33" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />

                    {/* Persistent Elemental Ice/Burn Shards on defeated goblin */}
                    <polygon points="-8,25 -2,20 2,26" fill="#7dd3fc" opacity="0.8" stroke="none" />
                    <polygon points="12,28 18,22 22,30" fill="#bae6fd" opacity="0.85" stroke="none" />
                    <polygon points="28,30 34,25 36,32" fill="#38bdf8" opacity="0.75" stroke="none" />

                    {/* Ethereal Floating Ghost Soul */}
                    <g style={{ animation: "goblin-ghost-soul 2.2s ease-in-out infinite" }}>
                      {/* Ghost Tail & Body */}
                      <path d="M 9,15 Q 15,0 21,15 Q 24,24 15,24 Q 6,24 9,15 Z" fill="#93c5fd" opacity="0.65" />
                      <circle cx="15" cy="8" r="5" fill="#bae6fd" opacity="0.85" />
                      {/* Spectral Eyes */}
                      <circle cx="13.5" cy="7.5" r="1" fill="#1e3a8a" />
                      <circle cx="16.5" cy="7.5" r="1" fill="#1e3a8a" />
                      {/* Ghost Text Label */}
                      <Ghost aria-hidden="true" x="-9" y="-11" width="8" height="8" color="#60a5fa" />
                      <text x="15" y="-3" textAnchor="middle" fill="#60a5fa" fontSize="8.5" fontWeight="900" style={{ letterSpacing: "0.03em" }}>
                        Ghost
                      </text>
                    </g>
                  </g>
                ) : (
                  /* =========================================================================
                     3. ACTIVE GOBLIN (High Contrast Lime Skin, Pointy Ears, Glowing Eyes, Spear & Breathing)
                     ========================================================================= */
                  <g
                    style={{
                      animation: "goblin-breath 2s ease-in-out infinite",
                      animationDelay: `${(index * 0.35) % 2.0}s`,
                    }}
                  >
                    {/* Feet / Boots */}
                    <rect x="8" y="34" width="4" height="4" rx="1" fill="#0f172a" stroke="none" />
                    <rect x="18" y="34" width="4" height="4" rx="1" fill="#0f172a" stroke="none" />

                    {/* Body Tunic */}
                    <polygon points="7,20 23,20 21,34 9,34" fill={clothingColor} stroke="none" />
                    {/* Belt & Buckle */}
                    <rect x="8" y="27" width="14" height="2.5" fill="#451a03" stroke="none" />
                    <rect x="13.5" y="26.5" width="3" height="3.5" fill="#facc15" stroke="none" />

                    {/* Left Arm */}
                    <polygon points="7,21 2,28 5,30 9,24" fill="#a3e635" stroke="none" />

                    {/* Right Arm (Gripping Weapon) */}
                    <polygon points="23,21 29,26 27,29 21,24" fill="#a3e635" stroke="none" />

                    {/* Weapon (Spear) */}
                    <line x1="28" y1="36" x2="28" y2="3" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                    <polygon points="28,-2 24,5 32,5" fill="#f8fafc" stroke="none" />
                    <rect x="26.5" y="5" width="3" height="2" fill="#dc2626" stroke="none" />

                    {/* Head & Pointy Ears (High Contrast Vibrant Chartreuse) */}
                    <circle cx="15" cy="12" r="7" fill="#bef264" stroke="none" />
                    <polygon points="9,10 0,6 8,14" fill="#65a30d" stroke="none" />
                    <polygon points="21,10 30,6 22,14" fill="#65a30d" stroke="none" />

                    {/* Nose */}
                    <polygon points="15,11 13.5,14 16.5,14" fill="#65a30d" stroke="none" />

                    {/* Glowing Crimson Eyes */}
                    <circle cx="12.5" cy="10.5" r="1.3" fill="#ff0033" stroke="none" />
                    <circle cx="17.5" cy="10.5" r="1.3" fill="#ff0033" stroke="none" />

                    {/* Underbite Fangs */}
                    <polygon points="13,15 14,15 13.5,17" fill="#ffffff" stroke="none" />
                    <polygon points="16,15 17,15 16.5,17" fill="#ffffff" stroke="none" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
