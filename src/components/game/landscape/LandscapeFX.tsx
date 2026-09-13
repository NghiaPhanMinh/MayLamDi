import { useEffect, useMemo } from "react";
import { gameAudio } from "../../../lib/gameAudio";

export type ActiveAttacker = {
  profileId: string;
  displayName: string;
  spellType?: string; // "lightning" | "fire" | "ice" | "water" | "arcane"
  startX: number;
  startY: number;
};

type ActiveCombatEvent = {
  id: string;
  attackerName: string;
  damage: number;
  spellType?: string;
  target?: "goblin" | "dragon" | "all";
  targetX?: number;
  targetY?: number;
};

type LandscapeFXProps = {
  activeEvent?: ActiveCombatEvent | null;
  isVictory: boolean;
  activeAttackers?: ActiveAttacker[];
  dragonTarget?: { x: number; y: number };
};

export function LandscapeFX({
  activeEvent = null,
  isVictory,
  activeAttackers = [],
  dragonTarget = { x: 660, y: 195 },
}: LandscapeFXProps) {
  // Trigger elemental projectile sounds precisely when the spell reaches and hits the dragon (1.9s flight)
  useEffect(() => {
    if (activeAttackers.length === 0) return;

    const playAttackSounds = () => {
      activeAttackers.forEach((attacker, idx) => {
        const timer = setTimeout(() => {
          gameAudio.playProjectileSound(attacker.spellType);
        }, idx * 800 + 1900);
        return timer;
      });
    };

    playAttackSounds();
    const interval = setInterval(playAttackSounds, 5000);
    return () => clearInterval(interval);
  }, [activeAttackers]);

  return (
    <div className="landscape-layer layer-9-fx" aria-hidden="true">
      <style>{`
        @keyframes player-hover {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .player-independent-hover {
          animation: player-hover 3.6s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>
      <div className="ambient-combat-exchange" style={{ opacity: 0.95, position: "absolute", inset: 0, pointerEvents: "none" }}>
        <svg viewBox="0 0 1000 400" width="100%" height="100%">
          <defs>
            {/* Projectile Filter Glows */}
            <filter id="glow-fire" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f97316" />
            </filter>
            <filter id="glow-ice" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38bdf8" />
            </filter>
            <filter id="glow-lightning" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fde047" />
            </filter>
            <filter id="glow-arcane" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#c084fc" />
            </filter>
          </defs>

          {/* =========================================================================
              CONTINUOUS ELEMENTAL ATTACK PROJECTILES FROM PLAYERS TO DRAGON
              Synced with the independent player hover animation
              Originates precisely from the peak of each attacking player's staff
             ========================================================================= */}
          <g className="player-independent-hover">
            {activeAttackers.map((attacker, idx) => {
              const spellType = (attacker.spellType || "lightning").toLowerCase();
              const isAtkFire = spellType === "fire";
              const isAtkIce = spellType === "ice" || spellType === "water";
              const isAtkLightning = spellType === "lightning" || spellType === "spark";
              const isAtkArcane = !isAtkFire && !isAtkIce && !isAtkLightning;

              const sx = attacker.startX;
              const sy = attacker.startY;
              const tx = dragonTarget.x;
              const ty = dragonTarget.y + (idx % 2 === 0 ? -12 : 12);

              const dx = tx - sx;
              const dy = ty - sy;
              const angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
              const flightDur = "5s";
              const animDelay = `${(idx * 0.8).toFixed(2)}s`;

              return (
                <g key={`attacker-fx-${attacker.profileId}-${idx}`}>
                  {/* 1. Flying Projectile Group */}
                  <g>
                    {/* Motion along path from player to dragon (travels for 1.9s then pauses until 5s) */}
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values={`${sx} ${sy}; ${tx} ${ty}; ${tx} ${ty}`}
                      keyTimes="0; 0.38; 1"
                      dur={flightDur}
                      begin={animDelay}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0; 1; 1; 0; 0"
                      keyTimes="0; 0.04; 0.36; 0.39; 1"
                      dur={flightDur}
                      begin={animDelay}
                      repeatCount="indefinite"
                    />

                    {/* Projectile Shape Rotated Towards Dragon */}
                    <g transform={`rotate(${angle})`}>
                      {/* --- FIRE PROJECTILE (Flaming Meteor & Cometary Tail) --- */}
                      {isAtkFire && (
                        <g filter="url(#glow-fire)">
                          <polygon points="-4,-3 -28,-1 -10,0" fill="#dc2626" opacity="0.75" />
                          <polygon points="-3,3 -32,2 -8,0" fill="#ea580c" opacity="0.85" />
                          <ellipse cx="-12" cy="0" rx="14" ry="4.5" fill="#f97316" />
                          <circle cx="2" cy="0" r="7" fill="#fef08a" />
                          <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
                          <circle cx="-18" cy="-3" r="1.5" fill="#fde047">
                            <animate attributeName="opacity" values="1;0;1" dur="0.2s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="-24" cy="2" r="1.8" fill="#f97316" />
                        </g>
                      )}

                      {/* --- ICE PROJECTILE (Piercing Glacial Icicle Lance) --- */}
                      {isAtkIce && (
                        <g filter="url(#glow-ice)">
                          <line x1="-24" y1="-2" x2="-4" y2="0" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                          <line x1="-20" y1="2" x2="-3" y2="0" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                          <polygon points="14,0 -12,-5.5 -6,0 -12,5.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
                          <polygon points="8,0 -6,-2.5 -3,0 -6,2.5" fill="#ffffff" />
                          <circle cx="-6" cy="0" r="3" fill="#a5f3fc" />
                          <circle cx="-16" cy="-4" r="1.5" fill="#ffffff">
                            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.25s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="-22" cy="3" r="1.4" fill="#bae6fd" />
                        </g>
                      )}

                      {/* --- LIGHTNING PROJECTILE (Electric Plasma Spark Sphere) --- */}
                      {isAtkLightning && (
                        <g filter="url(#glow-lightning)">
                          <path d="M -22,-3 L -14,3 L -6,-2 L 0,0" fill="none" stroke="#67e8f9" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M -26,2 L -18,-2 L -10,2 L 0,0" fill="none" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />
                          <circle cx="0" cy="0" r="7.5" fill="#facc15" />
                          <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
                          <polygon points="0,-13 3,-4 11,-2 3,3 5,11 0,4 -5,11 -3,3 -11,-2 -3,-4" fill="#38bdf8" opacity="0.9" />
                        </g>
                      )}

                      {/* --- ARCANE / NATURE PROJECTILE (Magical Stardust Orb) --- */}
                      {isAtkArcane && (
                        <g filter="url(#glow-arcane)">
                          <circle cx="-14" cy="-2" r="2.2" fill="#c084fc" opacity="0.7" />
                          <circle cx="-22" cy="1" r="1.8" fill="#e879f9" opacity="0.6" />
                          <circle cx="0" cy="0" r="8" fill="#a855f7" />
                          <circle cx="0" cy="0" r="5" fill="#f472b6" />
                          <circle cx="0" cy="0" r="2.8" fill="#ffffff" />
                          <polygon points="0,-9 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2" fill="#fdf4ff" opacity="0.85" />
                        </g>
                      )}
                    </g>
                  </g>

                  {/* 2. Impact Blast on Dragon Chest (Triggers precisely on landing at 1.9s mark of the 5s cycle) */}
                  <g transform={`translate(${tx}, ${ty})`}>
                    <g>
                      <animate
                        attributeName="opacity"
                        values="0; 0; 1; 0.8; 0"
                        keyTimes="0; 0.37; 0.40; 0.46; 1"
                        dur={flightDur}
                        begin={animDelay}
                        repeatCount="indefinite"
                      />
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        values="0.3; 0.3; 1.5; 1.8; 0"
                        keyTimes="0; 0.37; 0.40; 0.46; 1"
                        dur={flightDur}
                        begin={animDelay}
                        repeatCount="indefinite"
                      />

                      {isAtkFire && (
                        <g>
                          <circle cx="0" cy="0" r="24" fill="#f97316" opacity="0.75" />
                          <circle cx="0" cy="0" r="14" fill="#fef08a" />
                          <polygon points="0,-26 7,-9 26,0 7,9 0,26 -7,9 -26,0 -7,-9" fill="#ef4444" />
                        </g>
                      )}
                      {isAtkIce && (
                        <g>
                          <circle cx="0" cy="0" r="22" fill="#38bdf8" opacity="0.75" />
                          <polygon points="0,-25 8,-8 25,0 8,8 0,25 -8,8 -25,0 -8,-8" fill="#ffffff" />
                          <polygon points="-16,-16 0,-8 16,-16 8,0 16,16 0,8 -16,16 -8,0" fill="#7dd3fc" opacity="0.8" />
                        </g>
                      )}
                      {isAtkLightning && (
                        <g>
                          <ellipse cx="0" cy="0" rx="26" ry="12" fill="none" stroke="#facc15" strokeWidth="2.5" />
                          <circle cx="0" cy="0" r="16" fill="#fef08a" opacity="0.8" />
                          <polygon points="-8,3 -4,12 2,4 12,2 4,-5 8,-14 -1,-5 -12,-3" fill="#38bdf8" />
                        </g>
                      )}
                      {isAtkArcane && (
                        <g>
                          <circle cx="0" cy="0" r="22" fill="#c084fc" opacity="0.8" />
                          <polygon points="0,-24 6,-8 24,0 6,8 0,24 -6,8 -24,0 -6,-8" fill="#fdf4ff" />
                          <circle cx="0" cy="0" r="10" fill="#ffffff" />
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

      {/* Floating Damage Text on Dragon and Goblins */}
      {activeEvent && (
        <>
          <div
            key={activeEvent.id + "-boss"}
            className="floating-damage"
            style={{
              position: "absolute",
              left: "75%",
              top: "35%",
              fontSize: "1.4rem",
              fontWeight: 900,
              color: activeEvent.spellType === "lightning" ? "#facc15" : activeEvent.spellType === "fire" ? "#ef4444" : "#38bdf8",
              textShadow: "0 2px 4px #000",
              pointerEvents: "none",
            }}
          >
            -{activeEvent.damage} HP
          </div>
          <div
            key={activeEvent.id + "-goblin"}
            className="floating-damage"
            style={{
              position: "absolute",
              left: "54%",
              top: "52%",
              fontSize: "1.1rem",
              fontWeight: 900,
              color: activeEvent.spellType === "lightning" ? "#facc15" : activeEvent.spellType === "fire" ? "#ef4444" : "#38bdf8",
              textShadow: "0 2px 4px #000",
              pointerEvents: "none",
            }}
          >
            -100 HP
          </div>
        </>
      )}

      {/* Victory Particle Burst on Final Blow */}
      {isVictory ? (
        <svg viewBox="0 0 1000 400" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <g transform="translate(800, 80)">
            <circle cx="0" cy="0" r="8" fill="#facc15" opacity="0.8" />
            <polygon points="0,-15 5,-5 15,0 5,5 0,15 -5,5 -15,0 -5,-5" fill="#facc15" />
            <polygon points="-30,-30 -20,-25 -25,-15" fill="#ef4444" />
            <polygon points="30,-40 25,-25 40,-30" fill="#38bdf8" />
          </g>
        </svg>
      ) : null}
    </div>
  );
}
