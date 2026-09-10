export function LandscapeTerrain() {
  return (
    <>
      {/* Layer 3: Top Sky Horizon & Brighter Grey Mountain Ridges */}
      <div className="landscape-layer layer-3-hills" aria-hidden="true">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" width="100%" height="100%">
          <polygon
            points="0,115 90,82 190,105 320,68 450,100 580,62 710,95 840,72 950,90 1000,78 1000,400 0,400"
            fill="#64748b"
            opacity="0.85"
          />
          <polygon
            points="0,120 140,102 280,118 410,88 560,110 720,82 890,108 1000,98 1000,400 0,400"
            fill="#475569"
          />
        </svg>
      </div>

      {/* Layer 4: Multi-Layered Meadow & Curvy Winding Path */}
      {/* Starts at #17a738 in the foreground and progressively gets darker further away towards the horizon */}
      <div className="landscape-layer layer-4-ground" aria-hidden="true">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" width="100%" height="100%">
          <defs>
            {/* Subtle Grass Tuft Templates */}
            <g id="grass-tuft-dark">
              <polygon points="0,0 -2,-9 0,-6" fill="#083a12" />
              <polygon points="0,0 1,-12 3,-8" fill="#0c511b" />
              <polygon points="0,0 4,-7 5,-3" fill="#083a12" />
            </g>
            <g id="grass-tuft-light">
              <polygon points="0,0 -2,-9 0,-6" fill="#127b2a" />
              <polygon points="0,0 1,-12 3,-8" fill="#17a738" />
              <polygon points="0,0 4,-7 5,-3" fill="#127b2a" />
            </g>
            {/* Slate Pebble Template */}
            <g id="slate-pebble">
              <ellipse cx="0" cy="0" rx="4" ry="2.2" fill="#334155" />
              <ellipse cx="-1" cy="-0.6" rx="2.5" ry="1.2" fill="#475569" />
            </g>
          </defs>

          {/* Far Horizon Base Band (Shade 2) */}
          <rect x="0" y="95" width="1000" height="305" fill="#0d571e" />

          {/* Mid Distance Horizon Band (Shade 1) */}
          <path d="M0,128 Q280,118 560,132 T1000,124 L1000,400 L0,400 Z" fill="#127b2a" />

          {/* Main Primary Foreground Grass (80% of the grass terrain in vibrant #17a738) */}
          <path d="M0,158 Q300,146 600,162 T1000,154 L1000,400 L0,400 Z" fill="#17a738" />
          <rect x="0" y="165" width="1000" height="235" fill="#17a738" />

          {/* Decorative Grass Tufts */}
          <use href="#grass-tuft-dark" x="80" y="160" />
          <use href="#grass-tuft-dark" x="220" y="185" />
          <use href="#grass-tuft-dark" x="440" y="170" />
          <use href="#grass-tuft-dark" x="760" y="180" />
          <use href="#grass-tuft-light" x="110" y="240" />
          <use href="#grass-tuft-light" x="270" y="225" />
          <use href="#grass-tuft-light" x="390" y="250" />
          <use href="#grass-tuft-light" x="620" y="235" />
          <use href="#grass-tuft-light" x="810" y="245" />
          <use href="#grass-tuft-light" x="930" y="255" />
          <use href="#grass-tuft-light" x="260" y="340" />
          <use href="#grass-tuft-light" x="420" y="350" />
          <use href="#grass-tuft-light" x="650" y="365" />
        </svg>
      </div>
    </>
  );
}
