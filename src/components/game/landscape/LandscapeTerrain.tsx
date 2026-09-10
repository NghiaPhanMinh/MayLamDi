export function LandscapeTerrain() {
  return (
    <>
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

      {/* Layer 3: Distant Sky Horizon & Misty Mountain Ridges */}
      <div className="landscape-layer layer-3-hills" aria-hidden="true">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" width="100%" height="100%">
          <polygon
            points="0,115 90,82 190,105 320,68 450,100 580,62 710,95 840,72 950,90 1000,78 1000,160 0,160"
            fill="#64748b"
            opacity="0.55"
          />
          <polygon
            points="0,125 140,105 280,120 410,92 560,115 720,88 890,112 1000,102 1000,170 0,170"
            fill="#475569"
            opacity="0.45"
          />
        </svg>
      </div>

      {/* Layer 4: Floating Celestial Battle Island with Rocky Underside & Grassy Top */}
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
            {/* Floating Island Satellite Mini-Rocks */}
            <g id="mini-floating-rock">
              <polygon points="0,-6 7,-2 5,8 -4,9 -8,2" fill="#334155" stroke="#101517" strokeWidth="1.5" />
              <polygon points="-4,2 0,-3 4,-1 2,4 -3,4" fill="#64748b" />
            </g>
          </defs>

          {/* Satellite Floating Stones (Hovering gently in the open sky margins) */}
          <g className="floating-island-group" style={{ animationDelay: "-2s" }}>
            <use href="#mini-floating-rock" x="70" y="220" transform="scale(0.85)" />
            <use href="#mini-floating-rock" x="90" y="270" transform="scale(0.6)" />
            <use href="#mini-floating-rock" x="910" y="210" transform="scale(0.9)" />
            <use href="#mini-floating-rock" x="940" y="260" transform="scale(0.65)" />
          </g>

          {/* Main Hovering Celestial Island */}
          <g className="floating-island-group">
            {/* 1. Deep Rocky Crags Base (Underside of Floating Island) */}
            <polygon
              points="140,185 155,230 185,275 240,320 320,360 420,385 520,392 630,375 730,335 800,285 845,230 860,185"
              fill="#0f172a"
              stroke="#101517"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            {/* Faceted Slate Rock Formations (Stalactite & Craggy Chiseled Ridges) */}
            <polygon points="155,230 240,320 310,250 200,220" fill="#1e293b" />
            <polygon points="240,320 320,360 380,280 310,250" fill="#334155" />
            <polygon points="320,360 420,385 450,290 380,280" fill="#1e293b" />
            <polygon points="420,385 520,392 530,290 450,290" fill="#334155" />
            <polygon points="520,392 630,375 600,280 530,290" fill="#1e293b" />
            <polygon points="630,375 730,335 680,260 600,280" fill="#334155" />
            <polygon points="730,335 800,285 760,230 680,260" fill="#1e293b" />
            <polygon points="800,285 845,230 820,200 760,230" fill="#475569" />

            {/* Hanging Roots & Crystal Veins */}
            <path d="M290,340 Q305,370 300,385" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M470,380 Q485,410 478,420" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M660,355 Q675,390 670,405" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <polygon points="520,392 516,408 522,404 526,412 528,396" fill="#38bdf8" opacity="0.85" />

            {/* 2. Earth Soil Sub-layer */}
            <path
              d="M136,182 Q300,195 500,190 T864,182 L850,225 Q680,250 500,255 T150,225 Z"
              fill="#78350f"
              stroke="#101517"
              strokeWidth="2.5"
            />
            <path
              d="M142,184 Q320,198 500,194 T858,184 L846,215 Q680,238 500,242 T154,215 Z"
              fill="#92400e"
            />

            {/* 3. Top Grassy Surface Plateau */}
            <path
              d="M136,182 Q300,165 500,168 T864,182 L864,198 Q600,212 500,212 T136,198 Z"
              fill="#0d571e"
            />
            <path
              d="M138,186 Q320,172 500,174 T862,186 L860,208 Q600,224 500,224 T140,208 Z"
              fill="#127b2a"
            />
            <path
              d="M140,192 Q320,180 500,182 T860,192 L856,220 Q600,242 500,242 T144,220 Z"
              fill="#17a738"
              stroke="#101517"
              strokeWidth="2.5"
            />

            {/* Overhanging Grass Fringes along Plateau Edge */}
            <polygon points="160,221 168,232 174,222" fill="#17a738" />
            <polygon points="210,227 218,240 226,228" fill="#17a738" />
            <polygon points="310,236 320,250 328,237" fill="#17a738" />
            <polygon points="460,242 470,256 480,243" fill="#17a738" />
            <polygon points="610,241 620,254 628,242" fill="#17a738" />
            <polygon points="750,232 758,244 766,233" fill="#17a738" />
            <polygon points="820,224 826,234 834,225" fill="#17a738" />

            {/* Decorative Grass Tufts on Top Surface */}
            <use href="#grass-tuft-dark" x="220" y="198" />
            <use href="#grass-tuft-dark" x="380" y="194" />
            <use href="#grass-tuft-dark" x="540" y="196" />
            <use href="#grass-tuft-dark" x="720" y="198" />
            <use href="#grass-tuft-light" x="180" y="210" />
            <use href="#grass-tuft-light" x="290" y="218" />
            <use href="#grass-tuft-light" x="430" y="224" />
            <use href="#grass-tuft-light" x="580" y="222" />
            <use href="#grass-tuft-light" x="690" y="216" />
            <use href="#grass-tuft-light" x="800" y="212" />
          </g>
        </svg>
      </div>
    </>
  );
}
