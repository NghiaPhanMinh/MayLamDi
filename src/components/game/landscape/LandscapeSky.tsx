type TransformOffset = { x: number; y: number; scale: number };

type LandscapeSkyProps = {
  cloudOffset?: TransformOffset;
  isNight?: boolean;
};

type CloudConfig = { id: number; x: number; y: number; scale: number };

const FAR_CLOUDS: CloudConfig[] = [
  { id: 1, x: 20, y: 15, scale: 0.45 },
  { id: 2, x: 220, y: 32, scale: 0.38 },
  { id: 3, x: 440, y: 10, scale: 0.42 },
  { id: 4, x: 680, y: 36, scale: 0.40 },
  { id: 5, x: 920, y: 22, scale: 0.46 },
];

const NEAR_CLOUDS: CloudConfig[] = [
  { id: 1, x: 80, y: 22, scale: 0.55 },
  { id: 2, x: 400, y: 42, scale: 0.50 },
  { id: 3, x: 750, y: 18, scale: 0.58 },
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

      {/* Night-Only Layer: Moon (Fixed aspect-ratio, perfectly round, clean vector graphic shape, elegant lunar grey) */}
      {isNight && (
        <div
          style={{
            position: "absolute",
            top: "36px",
            right: "18%",
            width: "52px",
            height: "52px",
            pointerEvents: "none",
            zIndex: 1,
            animation: "night-moon-drift 12s ease-in-out infinite alternate",
          }}
        >
          <svg viewBox="0 0 52 52" width="52" height="52">
            <defs>
              <radialGradient id="moonBodyGradGrey" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="55%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </radialGradient>
            </defs>
            {/* Moon body - completely round circle */}
            <circle cx="26" cy="26" r="25" fill="url(#moonBodyGradGrey)" />
            {/* Moon subtle craters */}
            <circle cx="19" cy="21" r="4" fill="#94a3b8" opacity="0.45" />
            <circle cx="34" cy="33" r="3.5" fill="#94a3b8" opacity="0.4" />
            <circle cx="32" cy="19" r="2.5" fill="#94a3b8" opacity="0.42" />
            <circle cx="22" cy="35" r="2" fill="#94a3b8" opacity="0.35" />
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
            animation: "landscape-cloud-drift-far 450s linear infinite",
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

      {/* Adjustable Cloud Layer Container (Positioned above mountains, behind main elements) */}
      <div
        style={{
          position: "absolute",
          top: "4%",
          left: 0,
          right: 0,
          height: "140px",
          pointerEvents: "none",
          zIndex: 3,
          transform: `translate(${cloudOffset.x}px, ${cloudOffset.y}px) scale(${cloudOffset.scale})`,
          transformOrigin: "500px 40px",
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
                  fill={isNight ? "#cbd5e1" : "#ffffff"}
                  opacity={isNight ? "0.55" : "0.75"}
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
                  fill={isNight ? "#cbd5e1" : "#ffffff"}
                  opacity={isNight ? "0.55" : "0.75"}
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
                  fill={isNight ? "#e2e8f0" : "#ffffff"}
                  opacity={isNight ? "0.70" : "0.92"}
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
                  fill={isNight ? "#e2e8f0" : "#ffffff"}
                  opacity={isNight ? "0.70" : "0.92"}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
