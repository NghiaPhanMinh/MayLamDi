type PlayerMember = {
  profileId: string;
  displayName: string;
  characterFill?: string;
  characterOutline?: string;
  spellType?: string;
  isActiveToday: boolean;
  isAttacking?: boolean;
};

type LandscapePlayersProps = {
  members: PlayerMember[];
};

export type MageType = "lightning" | "fire" | "ice";

export function getMageTheme(spellType?: string, profileId: string = "", index: number = 0) {
  let type: MageType = "lightning";
  if (spellType === "fire") type = "fire";
  else if (spellType === "ice" || spellType === "water") type = "ice";
  else if (spellType === "lightning") type = "lightning";
  else {
    // Deterministic random elemental assignment based on player ID & index
    let hash = 0;
    for (let i = 0; i < profileId.length; i++) {
      hash = profileId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const types: MageType[] = ["lightning", "fire", "ice"];
    type = types[Math.abs(hash + index) % types.length];
  }

  if (type === "lightning") {
    return {
      type,
      name: "Lightning Mage",
      robePrimary: "#1e3a8a",
      trim: "#4ca0fe",
      hat: "#172554",
      ribbon: "#fff73f",
      orbCore: "#fff73f",
      orbAccent: "#4ca0fe",
      glowColor: "#fff73f",
    };
  } else if (type === "fire") {
    return {
      type,
      name: "Fire Mage",
      robePrimary: "#991b1b",
      trim: "#feaa01",
      hat: "#450a0a",
      ribbon: "#feaa01",
      orbCore: "#fd39e4",
      orbAccent: "#fff73f",
      glowColor: "#feaa01",
    };
  } else {
    return {
      type,
      name: "Ice Mage",
      robePrimary: "#0369a1",
      trim: "#ff8ae7",
      hat: "#0c4a6e",
      ribbon: "#fffded",
      orbCore: "#4ca0fe",
      orbAccent: "#ffffff",
      glowColor: "#ff8ae7",
    };
  }
}

export function getPlayerLayoutInfo(index: number = 0, totalCount: number = 1) {
  const count = Math.max(1, totalCount);
  let numCols: number;
  let spriteScale: number;

  if (count <= 2) {
    numCols = 2;
    spriteScale = 1.25;
  } else if (count <= 4) {
    numCols = 2;
    spriteScale = 1.15;
  } else if (count <= 8) {
    numCols = 4;
    spriteScale = 1.0;
  } else if (count <= 14) {
    numCols = 5;
    spriteScale = 0.88;
  } else {
    numCols = Math.min(7, Math.ceil(Math.sqrt(count * 2)));
    spriteScale = Math.max(0.68, 0.88 - (count - 14) * 0.015);
  }

  const numRows = Math.ceil(count / numCols);
  const row = Math.floor(index / numCols);
  const col = index % numCols;

  const minX = 175;
  const maxX = 465;
  const minY = 188;
  const maxY = 250;

  const colGap = numCols > 1 ? (maxX - minX) / (numCols - 1) : 0;
  const rowGap = numRows > 1 ? (maxY - minY) / (numRows - 1) : 0;

  // Stagger alternate rows slightly for RPG party feel
  const stagger = (row % 2) * (colGap * 0.35);
  const rawX = minX + col * colGap + stagger;
  const rawY = minY + row * rowGap;

  // Strict clamp within island plateau bounds so heroes never spill over
  const x = Math.round(Math.max(minX, Math.min(maxX, rawX)));
  const y = Math.round(Math.max(minY, Math.min(maxY, rawY)));

  return { x, y, scale: spriteScale };
}

export function getPlayerCoordinates(index: number = 0, totalCount: number = 1) {
  const info = getPlayerLayoutInfo(index, totalCount);
  return { x: info.x, y: info.y };
}

export function getPlayerStaffTip(
  index: number = 0,
  totalCount: number = 1,
  isAttacking: boolean = true,
  playerLayerTransform: { x: number; y: number; scale: number } = { x: 0, y: 0, scale: 1 },
) {
  const { x, y, scale } = getPlayerLayoutInfo(index, totalCount);
  // Precise peak of the elemental staff crystal head (28, 0) rotated 60 deg around hand (26, 32)
  const tipRelX = (isAttacking ? 54.71 : 28) * scale;
  const tipRelY = (isAttacking ? 17.73 : 0) * scale;

  // World coordinates factoring in player layer transform
  const worldX = Math.round((x + tipRelX) * playerLayerTransform.scale + playerLayerTransform.x);
  const worldY = Math.round((y + tipRelY) * playerLayerTransform.scale + playerLayerTransform.y);

  return { x: worldX, y: worldY };
}

export function LandscapePlayers({ members }: LandscapePlayersProps) {
  const count = Math.max(1, members.length);

  return (
    <div className="landscape-layer layer-7-players" aria-label="Party members roster">
      <style>{`
        @keyframes island-hover {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .floating-island-group {
          animation: island-hover 5.5s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>
      <svg viewBox="0 0 1000 400" width="100%" height="100%">
        {/* Synced with island floating animation */}
        <g className="floating-island-group">
          {members.map((member, index) => {
            const { x: offsetX, y: offsetY, scale: spriteScale } = getPlayerLayoutInfo(index, count);
            const active = member.isActiveToday;
            const mage = getMageTheme(member.spellType, member.profileId, index);
            const isAttacking = Boolean(member.isAttacking);

            return (
              <g
                key={member.profileId}
                transform={`translate(${offsetX}, ${offsetY}) scale(${spriteScale})`}
                className={`player-character ${isAttacking ? "is-attacking" : ""}`}
                role="img"
                aria-label={`${member.displayName} (${mage.name}, ${active ? "Active today" : "Idle"})`}>
                {/* 1. Ground Shadow */}
                <ellipse cx="15" cy="46" rx="14" ry="4.5" fill="rgba(0,0,0,0.22)" stroke="none" />

                {/* 2. Game ID Tag Pill (Positioned cleanly below the hero feet so it NEVER covers any hero) */}
                <g transform="translate(15, 53)">
                  <rect
                    x="-24"
                    y="-6"
                    width="48"
                    height="13"
                    rx="6.5"
                    fill="#0f172a"
                    stroke={mage.ribbon}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="8"
                    fontWeight="800"
                    fontFamily="sans-serif"
                  >
                    {member.displayName.slice(0, 8)}
                  </text>
                </g>

                {/* 3. Mage Avatar with Idle Floating / Breathing Animation */}
                <g
                  style={{
                    animation: "mage-float 2.2s ease-in-out infinite",
                    animationDelay: `${(index * 0.4) % 2.0}s`,
                  }}
                >
                  {/* Flowing Wizard Robe */}
                  <polygon points="6,45 24,45 21,24 9,24" fill={mage.robePrimary} stroke="none" />
                  {/* Robe Hem Trim */}
                  <polygon points="5,45 25,45 24,42 6,42" fill={mage.trim} stroke="none" />
                  {/* Robe Mantle / Cowl */}
                  <polygon points="7,23 23,23 19,30 11,30" fill={mage.trim} stroke="none" />
                  {/* Leather Belt & Rune Buckle */}
                  <rect x="8" y="32" width="14" height="2.5" fill="#1e1b18" stroke="none" />
                  <rect x="13.5" y="31.5" width="3" height="3.5" fill={mage.ribbon} stroke="none" />

                  {/* Wizard Face */}
                  <circle cx="15" cy="18" r="6" fill="#fde68a" stroke="none" />
                  <circle cx="13" cy="18" r="0.9" fill="#0f172a" stroke="none" />
                  <circle cx="17" cy="18" r="0.9" fill="#0f172a" stroke="none" />

                  {/* Conical Wizard Hat */}
                  {/* Hat Brim */}
                  <ellipse cx="15" cy="14" rx="13" ry="3.5" fill={mage.hat} stroke="none" />
                  {/* Hat Cone */}
                  <polygon points="7,14 15,0 23,14" fill={mage.hat} stroke="none" />
                  {/* Curved Tip */}
                  <polygon points="14,2 15,0 18,2 20,4" fill={mage.hat} stroke="none" />
                  {/* Hat Ribbon */}
                  <rect x="9" y="11.5" width="12" height="2.5" fill={mage.ribbon} stroke="none" />

                  {/* Wizard Staff - Tilts 60 degrees pointing forward at the dragon when attacking */}
                  <g
                    transform={isAttacking ? "rotate(60, 26, 32)" : "rotate(0, 26, 32)"}
                    style={{ transition: "transform 0.4s ease-in-out" }}
                  >
                    {/* Staff Wood Pole */}
                    <line x1="28" y1="45" x2="28" y2="9" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                    {/* Crystal Claws */}
                    <polygon points="26,11 28,7 30,11" fill="#b45309" stroke="none" />

                    {/* Elemental Staff Crystal Head */}
                    {mage.type === "lightning" && (
                      <g>
                        <circle cx="28" cy="5" r="4" fill={mage.orbCore} stroke="none" />
                        <polygon points="28,1 26.5,5 29.5,5 28,9" fill="#eab308" stroke="none" />
                      </g>
                    )}
                    {mage.type === "fire" && (
                      <g>
                        <polygon points="28,0 24,7 32,7" fill={mage.orbCore} stroke="none" />
                        <circle cx="28" cy="5.5" r="2" fill={mage.orbAccent} stroke="none" />
                      </g>
                    )}
                    {mage.type === "ice" && (
                      <g>
                        <polygon points="28,0 24,5 28,10 32,5" fill={mage.orbCore} stroke="none" />
                        <polygon points="28,2 26,5 28,8 30,5" fill="#ffffff" stroke="none" />
                      </g>
                    )}
                  </g>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
