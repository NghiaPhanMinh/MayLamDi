export function SVGDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
      <defs>
        {/* Reusable Cloud Cluster 1 */}
        <g id="cloud-cluster-1" fill="currentColor">
          <ellipse cx="40" cy="35" rx="30" ry="22" />
          <ellipse cx="75" cy="28" rx="36" ry="26" />
          <ellipse cx="110" cy="36" rx="28" ry="20" />
          <rect x="25" y="32" width="100" height="22" rx="10" />
        </g>

        {/* Reusable Cloud Cluster 2 */}
        <g id="cloud-cluster-2" fill="currentColor">
          <ellipse cx="30" cy="25" rx="22" ry="16" />
          <ellipse cx="58" cy="20" rx="28" ry="20" />
          <ellipse cx="86" cy="26" rx="20" ry="15" />
          <rect x="18" y="24" width="80" height="16" rx="8" />
        </g>

        {/* Medieval Watchtower */}
        <g id="watchtower-shape">
          {/* Stone Base */}
          <polygon points="12,120 16,65 44,65 48,120" fill="#3a4754" stroke="var(--scene-boss-slate)" strokeWidth="3" />
          {/* Wooden Cabin */}
          <rect x="10" y="35" width="40" height="30" fill="var(--scene-house-wall)" stroke="var(--scene-boss-slate)" strokeWidth="3" />
          {/* Cabin Windows */}
          <rect x="16" y="42" width="8" height="12" fill="var(--scene-boss-slate)" />
          <rect x="36" y="42" width="8" height="12" fill="var(--scene-boss-slate)" />
          {/* Conical Roof */}
          <polygon points="5,37 30,5 55,37" fill="var(--scene-house-roof)" stroke="var(--scene-boss-slate)" strokeWidth="3" strokeLinejoin="round" />
          {/* Flagpole & Banner */}
          <line x1="30" y1="5" x2="30" y2="-12" stroke="var(--scene-boss-slate)" strokeWidth="2.5" />
          <polygon points="30,-12 48,-7 30,-2" fill="var(--scene-ember-danger)" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
        </g>

        {/* Palisade Log Wall Segment */}
        <g id="palisade-wall-shape">
          {/* Wooden Log Spikes */}
          <polygon points="0,30 4,10 8,30" fill="#5c4033" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
          <rect x="0" y="30" width="8" height="35" fill="#6e4d3b" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
          <polygon points="8,30 12,8 16,30" fill="#5c4033" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
          <rect x="8" y="30" width="8" height="35" fill="#7a5542" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
          <polygon points="16,30 20,12 24,30" fill="#5c4033" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
          <rect x="16" y="30" width="8" height="35" fill="#6e4d3b" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
          {/* Horizontal Reinforcement Beam */}
          <rect x="-2" y="40" width="28" height="6" fill="#3d281d" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
        </g>

        {/* Background Wooden Split-Rail Fence */}
        <g id="background-fence-shape">
          <rect x="4" y="10" width="5" height="30" fill="#4a3525" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
          <rect x="34" y="10" width="5" height="30" fill="#4a3525" stroke="var(--scene-boss-slate)" strokeWidth="1.5" />
          <line x1="0" y1="16" x2="40" y2="16" stroke="#5c422e" strokeWidth="3" strokeLinecap="round" />
          <line x1="0" y1="28" x2="40" y2="28" stroke="#5c422e" strokeWidth="3" strokeLinecap="round" />
        </g>

      </defs>
    </svg>
  );
}
