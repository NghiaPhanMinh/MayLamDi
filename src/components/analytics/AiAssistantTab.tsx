import { UiIcon } from "../common/UiIcon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Bot, CheckCircle2, Clock, FileCheck } from "lucide-react";
import type { UnifiedAnalyticsPayload } from "../../types/analytics";

interface AiAssistantTabProps {
  data: UnifiedAnalyticsPayload;
}

const COLORS = ["#FEAA01", "#FF8AE7", "#1DD851", "#4CA0FE"];

export function AiAssistantTab({ data }: AiAssistantTabProps) {
  const { ai } = data;

  return (
    <div style={{ display: "grid", gap: "1.75rem" }}>
      {/* Top Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>AI Operations</span>
            <Bot size={18} style={{ color: "var(--color-primary)" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem" }}>{ai.totalOperations}</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Plans &amp; adjustments
          </div>
        </div>

        <div style={{ backgroundColor: "#1DD85115", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>AI Success Rate</span>
            <CheckCircle2 size={18} style={{ color: "#17A738" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem", color: "#17A738" }}>{ai.successRate}%</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Failures: {ai.failureCount}
          </div>
        </div>

        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Avg Latency</span>
            <Clock size={18} style={{ color: "#4CA0FE" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem" }}>{ai.avgResponseTimeMs} ms</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#17A738", marginTop: "0.2rem" }}>
            Average response time
          </div>
        </div>

        <div style={{ backgroundColor: "#FFF73F33", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Plan Acceptance</span>
            <FileCheck size={18} style={{ color: "var(--color-ink)" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem" }}>
            {Math.round((ai.plansAccepted / Math.max(ai.plansGenerated, 1)) * 100)}%
          </div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Accepted: {ai.plansAccepted} | Edited: {ai.plansEdited}
          </div>
        </div>
      </div>

      {/* Plan Acceptance & Model Usage Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {/* Plans Acceptance Bar Chart */}
        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "0.2rem" }}><UiIcon name="ClipboardCheck" /> AI Plans Acceptance Ratio</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Plans accepted without modifications vs edited</p>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { category: "Generated", count: ai.plansGenerated },
                  { category: "Accepted", count: ai.plansAccepted },
                  { category: "Edited", count: ai.plansEdited },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" stroke="var(--color-ink)" style={{ fontSize: "0.8rem", fontWeight: 800 }} />
                <YAxis stroke="var(--color-ink)" style={{ fontSize: "0.8rem", fontWeight: 800 }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "2px solid var(--color-ink)", borderRadius: "8px", fontWeight: 800 }} />
                <Bar dataKey="count" fill="var(--color-primary)" stroke="var(--color-ink)" strokeWidth={2} radius={[8, 8, 0, 0]} name="Plans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Model Breakdown */}
        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "0.2rem" }}><UiIcon name="Bot" /> LLM Provider &amp; Model Distribution</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Models used to generate plans</p>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ai.modelBreakdown} dataKey="count" nameKey="model" cx="50%" cy="50%" outerRadius={75} label={({ name, value }: any) => `${name}: ${value}`}>
                  {ai.modelBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--color-ink)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "2px solid var(--color-ink)", borderRadius: "8px", fontWeight: 800 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
