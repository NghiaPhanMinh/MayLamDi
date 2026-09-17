import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OverviewTab } from "./OverviewTab";
import { AcquisitionTab } from "./AcquisitionTab";
import { UserFunnelTab } from "./UserFunnelTab";
import { AiAssistantTab } from "./AiAssistantTab";
import { UxFrictionTab } from "./UxFrictionTab";
import type { AnalyticsTimeframe, UnifiedAnalyticsPayload } from "../../types/analytics";
import {
  LayoutDashboard,
  Share2,
  Filter,
  Bot,
  AlertOctagon,
  RotateCw,
  Clock,
  ShieldCheck,
  Globe,
} from "lucide-react";

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "acquisition" | "funnel" | "ai" | "ux">("overview");
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>("30d");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAnalytics = useQuery((api as any).analyticsApi.getUnifiedAnalytics, { timeframe });
  const isLoading = rawAnalytics === undefined;
  const analyticsData = rawAnalytics as UnifiedAnalyticsPayload | undefined;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      {/* Top Header & Brand Bar */}
      <header
        style={{
          backgroundColor: "var(--color-surface)",
          border: "3px solid var(--color-ink)",
          borderRadius: "16px",
          padding: "1.5rem 2rem",
          marginBottom: "1.75rem",
          boxShadow: "5px 5px 0px var(--color-ink)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                backgroundColor: "var(--color-primary)",
                border: "2px solid var(--color-ink)",
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.2rem",
                boxShadow: "2px 2px 0px var(--color-ink)",
              }}
            >
              M
            </div>
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 900, lineHeight: 1.2 }}>
                Maylamdi Analytics Dashboard
              </h1>
              <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", fontWeight: 700, marginTop: "0.2rem" }}>
                GA4 traffic, Clarity session data and Convex app events
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Status Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
          {/* Status Badges */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.4rem 0.75rem",
                borderRadius: "20px",
                border: "2px solid var(--color-ink)",
                backgroundColor: analyticsData?.ga4Connected ? "#1DD85133" : "#FFF73F33",
                fontSize: "0.78rem",
                fontWeight: 800,
              }}
            >
              <Globe size={14} /> GA4: {analyticsData?.ga4Connected ? "Connected" : "Empirical Telemetry"}
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.4rem 0.75rem",
                borderRadius: "20px",
                border: "2px solid var(--color-ink)",
                backgroundColor: analyticsData?.clarityConnected ? "#1DD85133" : "#FF8AE733",
                fontSize: "0.78rem",
                fontWeight: 800,
              }}
            >
              <ShieldCheck size={14} /> Clarity: {analyticsData?.clarityConnected ? "Export API" : "Live Telemetry"}
            </span>
          </div>

          {/* Timeframe Filter */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as AnalyticsTimeframe)}
            style={{
              padding: "0.5rem 0.8rem",
              borderRadius: "10px",
              border: "2px solid var(--color-ink)",
              fontWeight: 800,
              fontSize: "0.85rem",
              backgroundColor: "var(--color-surface)",
              boxShadow: "2px 2px 0px var(--color-ink)",
              cursor: "pointer",
            }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="14d">Last 14 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.75rem" }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: "12px",
            border: "2.5px solid var(--color-ink)",
            fontWeight: 900,
            fontSize: "0.9rem",
            backgroundColor: activeTab === "overview" ? "var(--color-primary)" : "var(--color-surface)",
            boxShadow: activeTab === "overview" ? "3px 3px 0px var(--color-ink)" : "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <LayoutDashboard size={16} /> Overview
        </button>

        <button
          onClick={() => setActiveTab("acquisition")}
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: "12px",
            border: "2.5px solid var(--color-ink)",
            fontWeight: 900,
            fontSize: "0.9rem",
            backgroundColor: activeTab === "acquisition" ? "#4CA0FE" : "var(--color-surface)",
            boxShadow: activeTab === "acquisition" ? "3px 3px 0px var(--color-ink)" : "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Share2 size={16} /> Acquisition
        </button>

        <button
          onClick={() => setActiveTab("funnel")}
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: "12px",
            border: "2.5px solid var(--color-ink)",
            fontWeight: 900,
            fontSize: "0.9rem",
            backgroundColor: activeTab === "funnel" ? "#1DD851" : "var(--color-surface)",
            boxShadow: activeTab === "funnel" ? "3px 3px 0px var(--color-ink)" : "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Filter size={16} /> User Funnel
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: "12px",
            border: "2.5px solid var(--color-ink)",
            fontWeight: 900,
            fontSize: "0.9rem",
            backgroundColor: activeTab === "ai" ? "#FF8AE7" : "var(--color-surface)",
            boxShadow: activeTab === "ai" ? "3px 3px 0px var(--color-ink)" : "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Bot size={16} /> AI Assistant
        </button>

        <button
          onClick={() => setActiveTab("ux")}
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: "12px",
            border: "2.5px solid var(--color-ink)",
            fontWeight: 900,
            fontSize: "0.9rem",
            backgroundColor: activeTab === "ux" ? "#FFF73F" : "var(--color-surface)",
            boxShadow: activeTab === "ux" ? "3px 3px 0px var(--color-ink)" : "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertOctagon size={16} /> UX &amp; Friction
        </button>
      </nav>

      {/* Main Content View */}
      {isLoading ? (
        <div style={{ backgroundColor: "var(--color-surface)", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "4rem 2rem", textAlign: "center", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <RotateCw size={32} style={{ color: "var(--color-primary)", margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900 }}>Loading Maylamdi Analytics...</h3>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>Loading data from GA4, Clarity and Convex</p>
        </div>
      ) : !analyticsData ? (
        <div style={{ backgroundColor: "#FF8AE722", border: "3px solid var(--color-ink)", borderRadius: "16px", padding: "3rem 2rem", textAlign: "center", boxShadow: "4px 4px 0px var(--color-ink)" }}>
          <AlertOctagon size={36} style={{ color: "#e53e3e", margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900 }}>Unable to load analytics payload</h3>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>Please check your Convex connection or retry</p>
        </div>
      ) : (
        <>
          {activeTab === "overview" && <OverviewTab data={analyticsData} />}
          {activeTab === "acquisition" && <AcquisitionTab data={analyticsData} />}
          {activeTab === "funnel" && <UserFunnelTab data={analyticsData} />}
          {activeTab === "ai" && <AiAssistantTab data={analyticsData} />}
          {activeTab === "ux" && <UxFrictionTab data={analyticsData} />}

          {/* Footer Timestamp */}
          <footer style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.82rem", color: "var(--color-text-muted)", fontWeight: 700, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem" }}>
            <Clock size={14} /> Last Updated: {new Date(analyticsData.lastUpdated).toLocaleTimeString()} ({timeframe} range window)
          </footer>
        </>
      )}
    </div>
  );
}
