import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Share2, Monitor, Users, Target } from "lucide-react";
import type { UnifiedAnalyticsPayload } from "../../types/analytics";

interface AcquisitionTabProps {
  data: UnifiedAnalyticsPayload;
}

const COLORS = ["#FEAA01", "#FF8AE7", "#1DD851", "#4CA0FE", "#101517"];

export function AcquisitionTab({ data }: AcquisitionTabProps) {
  const { acquisition } = data;

  return (
    <div style={{ display: "grid", gap: "1.75rem" }}>
      {/* Top Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {/* Traffic Sources */}
        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Share2 size={18} /> Traffic Sources Breakdown
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Acquisition channels by user volume</p>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={acquisition.sources} dataKey="users" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }: any) => `${name}: ${value}`}>
                  {acquisition.sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--color-ink)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "2px solid var(--color-ink)", borderRadius: "8px", fontWeight: 800 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Monitor size={18} /> Devices &amp; Browsers
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>Desktop vs Mobile vs Tablet</p>

          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acquisition.devices}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="device" stroke="var(--color-ink)" style={{ fontSize: "0.8rem", fontWeight: 800 }} />
                <YAxis stroke="var(--color-ink)" style={{ fontSize: "0.8rem", fontWeight: 800 }} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "2px solid var(--color-ink)", borderRadius: "8px", fontWeight: 800 }} />
                <Bar dataKey="users" fill="#4CA0FE" stroke="var(--color-ink)" strokeWidth={2} radius={[8, 8, 0, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* New vs Returning Users */}
      <div style={{ backgroundColor: "#FFF73F33", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={20} /> New vs Returning Users Ratio
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
            Users visiting for the first time compared with returning users.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <div style={{ textAlign: "center", backgroundColor: "#ffffff", border: "2px solid var(--color-ink)", padding: "0.75rem 1.5rem", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>New Users</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#17A738" }}>{acquisition.userTypes.newUsers}</div>
          </div>
          <div style={{ textAlign: "center", backgroundColor: "#ffffff", border: "2px solid var(--color-ink)", padding: "0.75rem 1.5rem", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)" }}>Returning Users</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#4CA0FE" }}>{acquisition.userTypes.returningUsers}</div>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink)" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Target size={18} /> Acquisition Campaigns Analysis
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-bg)", borderBottom: "2px solid var(--color-ink)" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>Campaign Name</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>Users</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>Conversions</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {acquisition.campaigns.map((camp, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 800 }}>{camp.name}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>{camp.users}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>{camp.conversions}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ display: "inline-block", padding: "0.2rem 0.5rem", borderRadius: "6px", backgroundColor: "#1DD85122", border: "1px solid var(--color-ink)", fontWeight: 800, color: "#17A738" }}>
                      {camp.conversionRate}%
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
