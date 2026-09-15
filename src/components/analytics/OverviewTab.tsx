import { UiIcon } from "../common/UiIcon";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Users, Activity, TrendingUp, AlertTriangle, CheckCircle, Zap, ShieldAlert, MousePointerClick } from "lucide-react";
import type { UnifiedAnalyticsPayload } from "../../types/analytics";

interface OverviewTabProps {
  data: UnifiedAnalyticsPayload;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { overview, dailyTrends, funnel } = data;

  return (
    <div style={{ display: "grid", gap: "1.75rem" }}>
      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
        <div className="card" style={{ border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", background: "var(--color-surface)", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Total Users</span>
            <Users size={18} style={{ color: "var(--color-primary)" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem" }}>{overview.totalUsers.toLocaleString()}</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#17A738", marginTop: "0.2rem" }}>
            Active: {overview.activeUsers} this period
          </div>
        </div>

        <div className="card" style={{ border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", background: "var(--color-surface)", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Sessions</span>
            <Activity size={18} style={{ color: "#4CA0FE" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem" }}>{overview.sessions.toLocaleString()}</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Sign-ups: {overview.signUps}
          </div>
        </div>

        <div className="card" style={{ border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", background: "#1DD85115", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Conversion Rate</span>
            <TrendingUp size={18} style={{ color: "#17A738" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem", color: "#17A738" }}>{overview.conversionRate}%</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Engagement: {overview.engagementRate}%
          </div>
        </div>

        <div className="card" style={{ border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", background: "#FEAA0122", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>UX Friction</span>
            <MousePointerClick size={18} style={{ color: "#d97706" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem", color: "#d97706" }}>
            {overview.rageClicks + overview.deadClicks} <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>clicks</span>
          </div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e53e3e", marginTop: "0.2rem" }}>
            Rage: {overview.rageClicks} | Dead: {overview.deadClicks}
          </div>
        </div>

        <div className="card" style={{ border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.25rem", background: "#FF8AE722", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Error Rate</span>
            <AlertTriangle size={18} style={{ color: "#e53e3e" }} />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, marginTop: "0.4rem", color: "#e53e3e" }}>{overview.errorRate}%</div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Script Errors: {overview.errorRate > 0 ? "Monitored" : "Clean"}
          </div>
        </div>
      </div>

      {/* Main Trends Chart */}
      <div style={{ background: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900 }}><UiIcon name="TrendingUp" /> Daily Users & Sessions Activity</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Real-time user engagement over time</p>
          </div>
        </div>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="var(--color-ink)" style={{ fontSize: "0.78rem", fontWeight: 700 }} />
              <YAxis stroke="var(--color-ink)" style={{ fontSize: "0.78rem", fontWeight: 700 }} />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "2px solid var(--color-ink)", borderRadius: "8px", fontWeight: 800 }}
              />
              <Area type="monotone" dataKey="sessions" stroke="#4CA0FE" fill="#4CA0FE33" strokeWidth={3} name="Sessions" />
              <Area type="monotone" dataKey="users" stroke="#FEAA01" fill="#FEAA0133" strokeWidth={3} name="Active Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Funnel Overview & Insights Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
        {/* Main Conversion Funnel */}
        <div style={{ background: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "1rem" }}><UiIcon name="Target" /> Conversion Funnel Summary</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel.slice(0, 5)} layout="vertical">
                <XAxis type="number" stroke="var(--color-ink)" style={{ fontSize: "0.75rem", fontWeight: 700 }} />
                <YAxis dataKey="name" type="category" stroke="var(--color-ink)" width={120} style={{ fontSize: "0.75rem", fontWeight: 700 }} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "2px solid var(--color-ink)", borderRadius: "8px", fontWeight: 800 }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 8, 8, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Insights & Actionable Recommendations */}
        <div style={{ background: "#1DD85115", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#17A738", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={20} /> Reported metrics
            </h3>
            <ul style={{ listStyle: "none", display: "grid", gap: "0.75rem", fontSize: "0.9rem", fontWeight: 700 }}>
              <li style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <CheckCircle size={18} style={{ color: "#17A738", flexShrink: 0, marginTop: "2px" }} />
                <span>Conversion rate: <strong>{overview.conversionRate}%</strong>.</span>
              </li>
              <li style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <ShieldAlert size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
                <span>Recorded <strong>{overview.rageClicks} rage clicks</strong>. Check session replays to investigate repeated clicks.</span>
              </li>
              <li style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <CheckCircle size={18} style={{ color: "#17A738", flexShrink: 0, marginTop: "2px" }} />
                <span>Engagement rate: <strong>{overview.engagementRate}%</strong>.</span>
              </li>
            </ul>
          </div>
          <div style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "2px dashed var(--color-ink)", fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
            Unified GA4 + Clarity + Convex Engine
          </div>
        </div>
      </div>
    </div>
  );
}
