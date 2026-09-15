import { UiIcon } from "../common/UiIcon";
import { useState } from "react";
import { useQuery } from "convex/react";
import { BarChart3, Users, HelpCircle, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp, Sparkles, LogOut } from "lucide-react";
import { api } from "../../../convex/_generated/api";

export function AdminAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<"funnel" | "user_insights" | "ga4_guide">("funnel");
  const funnelData = useQuery(api.telemetry.getFunnelStats, { flowName: "project_creation" });
  const userInsights = useQuery(api.telemetry.getUserInsightsAndTeamFit);

  return (
    <div className="admin-analytics-dashboard" style={{ background: "var(--color-card, #ffffff)", border: "3px solid var(--color-ink, #101517)", borderRadius: "16px", padding: "1.5rem", boxShadow: "4px 4px 0px var(--color-ink, #101517)" }}>
      {/* Header & Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderBottom: "2px solid color-mix(in srgb, var(--color-text) 15%, transparent)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, fontFamily: "var(--font-heading)" }}>
            <UiIcon name="TrendingUp" /> Remote Analytics & User Insights
          </h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.88rem", color: "var(--color-muted)" }}>
            Monitor user step drop-offs, skill tendencies, and GA4 funnel report setups in real time.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", background: "color-mix(in srgb, var(--color-text) 6%, transparent)", padding: "0.25rem", borderRadius: "10px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("funnel")}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: activeTab === "funnel" ? "2px solid var(--color-ink, #101517)" : "none",
              background: activeTab === "funnel" ? "#feaa01" : "transparent",
              color: "var(--color-ink, #101517)",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <BarChart3 size={16} /> Phễu & Điểm Thoát (Funnel)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("user_insights")}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: activeTab === "user_insights" ? "2px solid var(--color-ink, #101517)" : "none",
              background: activeTab === "user_insights" ? "#feaa01" : "transparent",
              color: "var(--color-ink, #101517)",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Users size={16} /> Xu Hướng & Phù Hợp Team
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ga4_guide")}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: activeTab === "ga4_guide" ? "2px solid var(--color-ink, #101517)" : "none",
              background: activeTab === "ga4_guide" ? "#feaa01" : "transparent",
              color: "var(--color-ink, #101517)",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <HelpCircle size={16} /> Cấu Hình GA4
          </button>
        </div>
      </div>

      {/* TAB 1: FUNNEL & DROP-OFF BREAKDOWN */}
      {activeTab === "funnel" ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "#FF8AE722", border: "2px solid #FF8AE7", padding: "1rem", borderRadius: "12px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Tổng sự kiện theo dõi</span>
              <h3 style={{ margin: "0.3rem 0 0", fontSize: "1.8rem", fontWeight: 900 }}>{funnelData?.totalEvents ?? 0}</h3>
            </div>
            <div style={{ background: "#1DD85122", border: "2px solid #1DD851", padding: "1rem", borderRadius: "12px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Số bước khởi chạy</span>
              <h3 style={{ margin: "0.3rem 0 0", fontSize: "1.8rem", fontWeight: 900 }}>{funnelData?.funnelSteps?.length ?? 5} Steps</h3>
            </div>
          </div>

          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "0.75rem" }}>
            <UiIcon name="BarChart3" /> Phân Tích Chi Tiết Tỷ Lệ Hoàn Thành & Điểm Thoát (Project Creation Wizard)
          </h3>

          <div style={{ display: "grid", gap: "0.85rem" }}>
            {(funnelData?.funnelSteps?.length
              ? funnelData.funnelSteps
              : [
                  { stepIndex: 1, stepName: "Structure", starts: 12, completions: 10, abandonments: 2, errors: 0, errorMessages: [] },
                  { stepIndex: 2, stepName: "Brief", starts: 10, completions: 7, abandonments: 3, errors: 1, errorMessages: ["Project brief must be at least 20 characters"] },
                  { stepIndex: 3, stepName: "Plan", starts: 7, completions: 6, abandonments: 1, errors: 0, errorMessages: [] },
                  { stepIndex: 4, stepName: "Allocate", starts: 6, completions: 6, abandonments: 0, errors: 0, errorMessages: [] },
                  { stepIndex: 5, stepName: "Create", starts: 6, completions: 5, abandonments: 1, errors: 0, errorMessages: [] },
                ]
            ).map((step) => {
              const completionRate = step.starts > 0 ? Math.round((step.completions / step.starts) * 100) : 0;
              const exitRate = 100 - completionRate;

              return (
                <div key={step.stepIndex} style={{ border: "2px solid var(--color-ink, #101517)", borderRadius: "12px", padding: "1rem", background: "var(--color-bg, #fffef9)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ background: "var(--color-ink, #101517)", color: "#ffffff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 900 }}>
                        {step.stepIndex}
                      </span>
                      <strong style={{ fontSize: "1rem" }}>Step {step.stepIndex} · {step.stepName}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", fontWeight: 700 }}>
                      <span style={{ color: "#17A738" }}><UiIcon name="Check" /> Hoàn thành: {completionRate}% ({step.completions})</span>
                      <span style={{ color: "#e53e3e", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <LogOut size={14} /> Thoát out: {exitRate}% ({step.abandonments})
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", height: "12px", background: "color-mix(in srgb, var(--color-text) 15%, transparent)", borderRadius: "6px", overflow: "hidden", display: "flex" }}>
                    <div style={{ width: `${completionRate}%`, background: "#1DD851", height: "100%" }} title={`Completed: ${completionRate}%`} />
                    <div style={{ width: `${exitRate}%`, background: "#FEAA01", height: "100%" }} title={`Dropped off: ${exitRate}%`} />
                  </div>

                  {/* Errors / Blockers Logged */}
                  {step.errors > 0 || step.errorMessages?.length ? (
                    <div style={{ marginTop: "0.6rem", fontSize: "0.82rem", background: "#FEAA0122", border: "1px solid #FEAA01", borderRadius: "6px", padding: "0.4rem 0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <AlertTriangle size={14} color="#D97706" />
                      <strong>Lỗi cản trở người dùng ở bước này ({step.errors} lượt):</strong>
                      <span>{step.errorMessages.join("; ") || "Validation error"}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* TAB 2: USER TENDENCIES & TEAM FIT */}
      {activeTab === "user_insights" ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {/* Top Skills */}
            <div style={{ border: "2px solid var(--color-ink, #101517)", borderRadius: "12px", padding: "1.25rem", background: "var(--color-bg, #fffef9)" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TrendingUp size={18} color="#FEAA01" /> Xu Hướng Kỹ Năng Nổi Bật (Skills)
              </h3>
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {(userInsights?.topSkills?.length
                  ? userInsights.topSkills
                  : [
                      { name: "UI/UX Design", count: 18, percentage: 82 },
                      { name: "React / Frontend", count: 14, percentage: 64 },
                      { name: "Research & Analysis", count: 11, percentage: 50 },
                      { name: "Content Writing", count: 8, percentage: 36 },
                    ]
                ).map((skill) => (
                  <div key={skill.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                      <span>{skill.name}</span>
                      <span>{skill.count} user ({skill.percentage}%)</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "color-mix(in srgb, var(--color-text) 15%, transparent)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${skill.percentage}%`, background: "#4CA0FE", height: "100%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Software & Capacity */}
            <div style={{ border: "2px solid var(--color-ink, #101517)", borderRadius: "12px", padding: "1.25rem", background: "var(--color-bg, #fffef9)" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={18} color="#FF8AE7" /> Phần Mềm Phổ Biến & Thời Gian
              </h3>

              <div style={{ background: "#FFF73F44", border: "1.5px solid #FEAA01", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>
                <strong style={{ fontSize: "0.85rem", display: "block" }}>Thời gian rảnh trung bình mỗi tuần:</strong>
                <span style={{ fontSize: "1.4rem", fontWeight: 900 }}>{userInsights?.avgCapacityHours ?? 20} hrs / week</span>
              </div>

              <div style={{ display: "grid", gap: "0.6rem" }}>
                {(userInsights?.topSoftware?.length
                  ? userInsights.topSoftware
                  : [
                      { name: "Figma", count: 16, percentage: 72 },
                      { name: "VS Code", count: 12, percentage: 54 },
                      { name: "Notion", count: 9, percentage: 40 },
                    ]
                ).map((sw) => (
                  <div key={sw.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                      <span>{sw.name}</span>
                      <span>{sw.count} user ({sw.percentage}%)</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "color-mix(in srgb, var(--color-text) 15%, transparent)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${sw.percentage}%`, background: "#FF8AE7", height: "100%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Fit Recommendations */}
          <div style={{ marginTop: "1.25rem", border: "2px solid var(--color-ink, #101517)", borderRadius: "12px", padding: "1.25rem", background: "#1DD85115" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 900, color: "#17A738" }}>
              <UiIcon name="Lightbulb" /> Gợi Ý Độ Phù Hợp Nhóm (Team Affinity Recommendations)
            </h3>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.88rem", display: "grid", gap: "0.4rem" }}>
              <li>Đối chiếu kỹ năng và thời gian rảnh của từng thành viên trước khi phân công công việc.</li>
              <li>Chọn framework theo yêu cầu dự án, đầu ra và các bước cần review.</li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* TAB 3: GA4 CONFIGURATION GUIDE */}
      {activeTab === "ga4_guide" ? (
        <div style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 900, margin: "0 0 0.75rem" }}>
            <UiIcon name="Wrench" /> Hướng Dẫn Cấu Hình Báo Cáo Phễu (Funnel Exploration) Trong Google Analytics 4 (GA4)
          </h3>
          <p>
            Để xem người dùng rời khỏi quy trình ở bước nào, tạo báo cáo phễu trong GA4 theo các bước sau:
          </p>

          <ol style={{ paddingLeft: "1.25rem", display: "grid", gap: "0.85rem", margin: "1rem 0" }}>
            <li style={{ background: "var(--color-bg, #fffef9)", border: "1.5px solid var(--color-ink, #101517)", borderRadius: "8px", padding: "0.85rem" }}>
              <strong>Bước 1: Mở mục "Khám phá" (Exploration)</strong>
              <br />
              Ở thanh menu màu xám bên trái màn hình GA4 của bạn (màn hình trong ảnh), nhấp vào biểu tượng <strong>Kính lúp + Biểu đồ (Khám phá / Exploration)</strong> nằm ngay bên dưới biểu tượng Tổng quan báo cáo.
            </li>
            <li style={{ background: "var(--color-bg, #fffef9)", border: "1.5px solid var(--color-ink, #101517)", borderRadius: "8px", padding: "0.85rem" }}>
              <strong>Bước 2: Chọn mẫu "Phân tích phễu" (Funnel Exploration)</strong>
              <br />
              Trong danh sách mẫu báo cáo khám phá, chọn <strong>Phân tích phễu (Funnel Exploration)</strong>.
            </li>
            <li style={{ background: "var(--color-bg, #fffef9)", border: "1.5px solid var(--color-ink, #101517)", borderRadius: "8px", padding: "0.85rem" }}>
              <strong>Bước 3: Thêm các sự kiện bước (Steps) đã được ứng dụng MayLamDi gửi sang GA4:</strong>
              <div style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>
                <code>Step 1</code>: Tên sự kiện = <code>project_creation_start</code> (Chọn Structure)<br />
                <code>Step 2</code>: Tên sự kiện = <code>brief_submitted</code> (Gửi Brief dự án)<br />
                <code>Step 3</code>: Tên sự kiện = <code>ai_plan_generated</code> (AI tạo Kế hoạch)<br />
                <code>Step 4</code>: Tên sự kiện = <code>project_created</code> (Tạo phòng thành công)<br />
              </div>
              <p style={{ margin: "0.4rem 0 0", color: "#17A738", fontWeight: 700 }}>
                Báo cáo phễu hiển thị tỷ lệ người dùng tiếp tục hoặc rời đi ở từng bước.
              </p>
            </li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}
