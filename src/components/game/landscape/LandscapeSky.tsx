type TransformOffset = { x: number; y: number; scale: number };

type LandscapeSkyProps = {
  cloudOffset?: TransformOffset;
  isNight?: boolean;
};

type CloudConfig = { id: number; x: number; y: number; scale: number };

const FAR_CLOUDS: CloudConfig[] = [
  { id: 1, x: 20, y: 15, scale: 1.1 },
  { id: 2, x: 220, y: 35, scale: 0.85 },
  { id: 3, x: 440, y: 10, scale: 1.0 },
  { id: 4, x: 680, y: 40, scale: 0.9 },
  { id: 5, x: 920, y: 25, scale: 1.15 },
];

const NEAR_CLOUDS: CloudConfig[] = [
  { id: 1, x: 80, y: 20, scale: 1.2 },
  { id: 2, x: 400, y: 45, scale: 0.95 },
  { id: 3, x: 750, y: 15, scale: 1.3 },
];

const NIGHT_STARS = [
  { id: 1, x: 45, y: 25, r: 1.5, opacity: 0.85, delay: "0s", sparkle: false },
  { id: 2, x: 95, y: 55, r: 1.2, opacity: 0.7, delay: "1.2s", sparkle: false },
  { id: 3, x: 140, y: 18, r: 2.0, opacity: 0.95, delay: "0.5s", sparkle: true },
  { id: 4, x: 185, y: 42, r: 1.0, opacity: 0.6, delay: "2.1s", sparkle: false },
  { id: 5, x: 230, y: 14, r: 1.8, opacity: 0.9, delay: "1.7s", sparkle: false },
  { id: 6, x: 275, y: 65, r: 1.3, opacity: 0.75, delay: "0.8s", sparkle: false },
  { id: 7, x: 320, y: 28, r: 2.2, opacity: 1.0, delay: "2.5s", sparkle: true },
  { id: 8, x: 365, y: 50, r: 1.1, opacity: 0.65, delay: "1.4s", sparkle: false },
  { id: 9, x: 410, y: 16, r: 1.6, opacity: 0.85, delay: "0.3s", sparkle: false },
  { id: 10, x: 460, y: 72, r: 1.4, opacity: 0.7, delay: "1.9s", sparkle: false },
  { id: 11, x: 505, y: 35, r: 1.9, opacity: 0.95, delay: "2.8s", sparkle: true },
  { id: 12, x: 550, y: 20, r: 1.2, opacity: 0.8, delay: "0.6s", sparkle: false },
  { id: 13, x: 595, y: 62, r: 1.5, opacity: 0.75, delay: "1.1s", sparkle: false },
  { id: 14, x: 640, y: 25, r: 2.0, opacity: 0.9, delay: "2.3s", sparkle: false },
  { id: 15, x: 685, y: 48, r: 1.1, opacity: 0.6, delay: "0.9s", sparkle: false },
  { id: 16, x: 730, y: 18, r: 1.7, opacity: 0.85, delay: "1.6s", sparkle: true },
  { id: 17, x: 775, y: 70, r: 1.3, opacity: 0.7, delay: "2.7s", sparkle: false },
  { id: 18, x: 860, y: 35, r: 1.2, opacity: 0.65, delay: "0.4s", sparkle: false },
  { id: 19, x: 910, y: 58, r: 1.8, opacity: 0.9, delay: "1.8s", sparkle: false },
  { id: 20, x: 960, y: 22, r: 1.4, opacity: 0.8, delay: "2.2s", sparkle: true },
];

export function LandscapeSky({
  cloudOffset = { x: 0, y: 0, scale: 1 },
  isNight = false,
}: LandscapeSkyProps) {
  return (
    <>
      {/* Layer 0: Sky Canvas (Day Blue vs Night Midnight Gradient) */}
      <div className="landscape-layer layer-0-sky" aria-hidden="true">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" width="100%" height="100%">
          {isNight ? (
            <>
              <defs>
                <linearGradient id="nightSkyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#040914" />
                  <stop offset="45%" stopColor="#0a1628" />
                  <stop offset="100%" stopColor="#12253f" />
                </linearGradient>
                <radialGradient id="moonGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#fef08a" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="moonBodyGrad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="65%" stopColor="#fef9c3" />
                  <stop offset="100%" stopColor="#fef08a" />
                </radialGradient>
              </defs>
              <rect width="1000" height="400" fill="url(#nightSkyGrad)" />
            </>
          ) : (
            <rect width="1000" height="400" fill="#4ca0fe" />
          )}
        </svg>
      </div>

      {/* Night-Only Layer: Moon with gentle drift animation */}
      {isNight && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <svg
            viewBox="0 0 1000 400"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            style={{
              animation: "night-moon-drift 12s ease-in-out infinite alternate",
            }}
          >
            {/* Soft radial glow halo */}
            <circle cx="820" cy="55" r="70" fill="url(#moonGlowGrad)" />
            <circle cx="820" cy="55" r="42" fill="url(#moonGlowGrad)" />
            {/* Moon body */}
            <circle cx="820" cy="55" r="26" fill="url(#moonBodyGrad)" />
            {/* Moon subtle craters */}
            <circle cx="813" cy="50" r="4.5" fill="#fde047" opacity="0.3" />
            <circle cx="828" cy="62" r="3.5" fill="#fde047" opacity="0.25" />
            <circle cx="826" cy="48" r="2.5" fill="#fde047" opacity="0.28" />
            <circle cx="816" cy="64" r="2.0" fill="#fde047" opacity="0.2" />
          </svg>
        </div>
      )}

      {/* Night-Only Layer: Drifting & Twinkling Parallax Starfield */}
      {isNight && (
        <div
          className="night-stars-wrapper"
          style={{
            position: "absolute",
            top: "2%",
            left: 0,
            width: "2000px",
            height: "120px",
            pointerEvents: "none",
            zIndex: 2,
            animation: "landscape-cloud-drift-far 120s linear infinite",
            willChange: "transform",
          }}
        >
          <svg viewBox="0 0 2000 120" width="2000" height="120">
            {/* Segment 1 */}
            {NIGHT_STARS.map((s) => (
              <g
                key={`s1-${s.id}`}
                style={{
                  animation: `night-star-twinkle 3s ease-in-out ${s.delay} infinite alternate`,
                }}
              >
                {s.sparkle ? (
                  <path
                    d={`M ${s.x} ${s.y - 4} L ${s.x + 1} ${s.y - 1} L ${s.x + 4} ${s.y} L ${s.x + 1} ${s.y + 1} L ${s.x} ${s.y + 4} L ${s.x - 1} ${s.y + 1} L ${s.x - 4} ${s.y} L ${s.x - 1} ${s.y - 1} Z`}
                    fill="#ffffff"
                    opacity={s.opacity}
                  />
                ) : (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    fill={s.id % 3 === 0 ? "#fef08a" : "#ffffff"}
                    opacity={s.opacity}
                  />
                )}
              </g>
            ))}

            {/* Segment 2 (Offset by exactly +1000px for seamless loop) */}
            {NIGHT_STARS.map((s) => (
              <g
                key={`s2-${s.id}`}
                style={{
                  animation: `night-star-twinkle 3s ease-in-out ${s.delay} infinite alternate`,
                }}
              >
                {s.sparkle ? (
                  <path
                    d={`M ${s.x + 1000} ${s.y - 4} L ${s.x + 1001} ${s.y - 1} L ${s.x + 1004} ${s.y} L ${s.x + 1001} ${s.y + 1} L ${s.x + 1000} ${s.y + 4} L ${s.x + 999} ${s.y + 1} L ${s.x + 996} ${s.y} L ${s.x + 999} ${s.y - 1} Z`}
                    fill="#ffffff"
                    opacity={s.opacity}
                  />
                ) : (
                  <circle
                    cx={s.x + 1000}
                    cy={s.y}
                    r={s.r}
                    fill={s.id % 3 === 0 ? "#fef08a" : "#ffffff"}
                    opacity={s.opacity}
                  />
                )}
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Adjustable Cloud Layer Container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 3,
          transform: `translate(${cloudOffset.x}px, ${cloudOffset.y}px) scale(${cloudOffset.scale})`,
          transformOrigin: "500px 70px",
        }}
      >
        {/* Layer 1: Far Clouds */}
        <div className="landscape-layer layer-1-far-clouds" aria-hidden="true">
          <div className="cloud-far-wrapper">
            <svg viewBox="0 0 2000 120" width="2000" height="120">
              {/* Segment 1 */}
              {FAR_CLOUDS.map((cloud) => (
                <use
                  key={`far-1-${cloud.id}`}
                  href="#cloud-cluster-1"
                  x={cloud.x}
                  y={cloud.y}
                  transform={`scale(${cloud.scale})`}
                  opacity={isNight ? "0.22" : "0.65"}
                />
              ))}
              {/* Segment 2 (Offset by exactly +1000px for seamless loop) */}
              {FAR_CLOUDS.map((cloud) => (
                <use
                  key={`far-2-${cloud.id}`}
                  href="#cloud-cluster-1"
                  x={cloud.x + 1000}
                  y={cloud.y}
                  transform={`scale(${cloud.scale})`}
                  opacity={isNight ? "0.22" : "0.65"}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Layer 2: Near Clouds */}
        <div className="landscape-layer layer-2-near-clouds" aria-hidden="true">
          <div className="cloud-near-wrapper">
            <svg viewBox="0 0 2000 140" width="2000" height="140">
              {/* Segment 1 */}
              {NEAR_CLOUDS.map((cloud) => (
                <use
                  key={`near-1-${cloud.id}`}
                  href="#cloud-cluster-2"
                  x={cloud.x}
                  y={cloud.y}
                  transform={`scale(${cloud.scale})`}
                  opacity={isNight ? "0.3" : "0.9"}
                />
              ))}
              {/* Segment 2 (Offset by exactly +1000px for seamless loop) */}
              {NEAR_CLOUDS.map((cloud) => (
                <use
                  key={`near-2-${cloud.id}`}
                  href="#cloud-cluster-2"
                  x={cloud.x + 1000}
                  y={cloud.y}
                  transform={`scale(${cloud.scale})`}
                  opacity={isNight ? "0.3" : "0.9"}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
