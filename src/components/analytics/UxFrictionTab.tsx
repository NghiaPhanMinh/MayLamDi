import { UiIcon } from "../common/UiIcon";
import { MousePointerClick, AlertOctagon, Scroll, Flame, Clock, Eye } from "lucide-react";
import type { UnifiedAnalyticsPayload } from "../../types/analytics";

interface UxFrictionTabProps {
  data: UnifiedAnalyticsPayload;
}

export function UxFrictionTab({ data }: UxFrictionTabProps) {
  const { ux, clarityConnected } = data;

  return (
    <div style={{ display: "grid", gap: "1.75rem" }}>
      {/* External Clarity Notice */}
      <div style={{ backgroundColor: clarityConnected ? "#1DD85115" : "#FFF73F33", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem 1.5rem", boxShadow: "4px 4px 0px var(--color-ink)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Flame size={18} style={{ color: "#FF8AE7" }} /> Microsoft Clarity Integration Status
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            {clarityConnected
              ? "Connected: Fetching live recent-data friction window from Clarity Export API."
              : "Telemetry Mode: Active DB Telemetry tracking friction events. Configure CLARITY_PROJECT_ID for full session replays."}
          </p>
        </div>
        <a
          href="https://clarity.microsoft.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: "var(--color-pink)", textDecoration: "none", color: "var(--color-ink)", fontWeight: 800, padding: "0.5rem 1rem", borderRadius: "8px", border: "2px solid var(--color-ink)" }}
        >
          <UiIcon name="Clapperboard" /> Open Clarity Replays
        </a>
      </div>

      {/* UX Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
        <div style={{ backgroundColor: "#FEAA0122", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Rage Clicks</span>
            <MousePointerClick size={18} style={{ color: "#d97706" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem", color: "#d97706" }}>{ux.rageClicks}</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Repeated fast clicks
          </div>
        </div>

        <div style={{ backgroundColor: "#FF8AE722", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Dead Clicks</span>
            <AlertOctagon size={18} style={{ color: "#e53e3e" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem", color: "#e53e3e" }}>{ux.deadClicks}</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Clicks without element action
          </div>
        </div>

        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Excessive Scroll</span>
            <Scroll size={18} style={{ color: "#4CA0FE" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem" }}>{ux.excessiveScrolls}</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Fast up/down scrolls
          </div>
        </div>

        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Avg Engagement</span>
            <Clock size={18} style={{ color: "#17A738" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem" }}>{Math.round(ux.avgEngagementSeconds / 60)} m</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#17A738", marginTop: "0.2rem" }}>
            High session depth
          </div>
        </div>
      </div>

      {/* Popular Pages Table */}
      <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Eye size={18} /> Popular Pages &amp; Exit Rate Ranking
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-bg)", borderBottom: "2px solid var(--color-ink)" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>Page Route</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>Page Views</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>Exit Rate</th>
              </tr>
            </thead>
            <tbody>
              {ux.popularPages.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 800 }}>{p.page}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>{p.views.toLocaleString()}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "6px", backgroundColor: p.exitRate > 20 ? "#FEAA0133" : "#1DD85122", border: "1px solid var(--color-ink)", fontWeight: 800 }}>
                      {p.exitRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
