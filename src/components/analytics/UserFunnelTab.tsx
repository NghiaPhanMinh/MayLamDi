import { UiIcon } from "../common/UiIcon";
import { CheckCircle, LogOut, Clock, AlertCircle } from "lucide-react";
import type { UnifiedAnalyticsPayload } from "../../types/analytics";

interface UserFunnelTabProps {
  data: UnifiedAnalyticsPayload;
}

export function UserFunnelTab({ data }: UserFunnelTabProps) {
  const { funnel } = data;

  return (
    <div style={{ display: "grid", gap: "1.75rem" }}>
      {/* Header Info */}
      <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "0.3rem" }}>
          <UiIcon name="Target" /> End-to-End User Conversion Funnel (8-Stage Flow)
        </h3>
        <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
          Track user progression from initial landing page visit down to task completion.
        </p>
      </div>

      {/* 8 Stages Grid */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {funnel.map((step) => {
          const isHighDropOff = step.dropOffRate > 35;
          return (
            <div
              key={step.stage}
              style={{
                backgroundColor: "var(--color-surface)",
                border: "3px solid var(--color-ink)",
                borderRadius: "14px",
                padding: "1.25rem 1.5rem",
                boxShadow: "3px 3px 0px var(--color-ink)",
                display: "grid",
                gridTemplateColumns: "minmax(200px, 1fr) auto",
                gap: "1.25rem",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      backgroundColor: "var(--color-ink)",
                      color: "#ffffff",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "0.85rem",
                    }}
                  >
                    {step.stage}
                  </span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 900 }}>{step.name}</h4>
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={14} /> ~{step.avgDurationSeconds}s avg
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div style={{ width: "100%", height: "14px", backgroundColor: "#e2e8f0", borderRadius: "7px", overflow: "hidden", display: "flex", border: "1px solid var(--color-ink)" }}>
                  <div style={{ width: `${step.conversionRate}%`, backgroundColor: "var(--color-primary)", height: "100%", transition: "width 0.4s ease" }} />
                  <div style={{ width: `${step.dropOffRate}%`, backgroundColor: isHighDropOff ? "#FEAA01" : "#FF8AE7", height: "100%", transition: "width 0.4s ease" }} />
                </div>
              </div>

              {/* Stat Badges */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{step.count.toLocaleString()}</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#17A738", display: "flex", alignItems: "center", gap: "0.2rem", justifyContent: "flex-end" }}>
                    <CheckCircle size={12} /> {step.conversionRate}% retained
                  </div>
                </div>

                {step.stage > 1 && (
                  <div style={{ textAlign: "right", borderLeft: "2px dashed var(--color-ink)", paddingLeft: "1rem" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: isHighDropOff ? "#e53e3e" : "var(--color-text-muted)" }}>
                      {step.dropOffRate}%
                    </div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 800, color: isHighDropOff ? "#e53e3e" : "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.2rem", justifyContent: "flex-end" }}>
                      {isHighDropOff ? <AlertCircle size={12} /> : <LogOut size={12} />} Drop-off
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel Insights Card */}
      <div style={{ backgroundColor: "#FF8AE722", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "0.5rem" }}><UiIcon name="Lightbulb" /> User Funnel Friction Analysis</h3>
        <p style={{ fontSize: "0.88rem", color: "var(--color-ink)", lineHeight: 1.5, fontWeight: 700 }}>
          Compare retention and drop-off at each stage to see where users leave the flow.
        </p>
      </div>
    </div>
  );
}
