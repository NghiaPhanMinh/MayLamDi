type TransformOffset = { x: number; y: number; scale: number };

type LandscapeSkyProps = {
  cloudOffset?: TransformOffset;
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

export function LandscapeSky({
  cloudOffset = { x: 0, y: 0, scale: 1 },
}: LandscapeSkyProps) {
  return (
    <>
      {/* Layer 0: Sky Blue Canvas */}
      <div className="landscape-layer layer-0-sky" aria-hidden="true">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" width="100%" height="100%">
          <rect width="1000" height="400" fill="#4ca0fe" />
        </svg>
      </div>

      {/* Adjustable Cloud Layer Container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
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
                  opacity="0.65"
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
                  opacity="0.65"
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
                  opacity="0.9"
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
                  opacity="0.9"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
