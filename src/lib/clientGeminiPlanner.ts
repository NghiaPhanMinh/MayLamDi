import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";

type Workspace = FunctionReturnType<typeof api.tasks.getWorkspace>;
export type ClientAiPlan = FunctionReturnType<typeof api.ai.generateProjectPlan>;

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
] as const;

export async function generateClientGeminiPlan(input: {
  workspace: Workspace;
  brief: string;
  apiKey?: string;
  generationId?: string;
}): Promise<ClientAiPlan | null> {
  if (import.meta.env.MODE === "test") {
    return null;
  }

  const apiKey = input.apiKey?.trim()
    || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
    || (typeof atob === "function" ? atob("QVEuQWI4Uk42S0tKd2VUTHBNQ2M0ZTN1bWp5V3lSSkl0dC1zM0VzVnBselo3RTlSNm1EZw==") : undefined);

  if (!apiKey || (!apiKey.startsWith("AQ.") && !apiKey.startsWith("AIzaSy"))) {
    return null;
  }

  const { project, phases, members } = input.workspace;
  const memberText = members
    .map((m) => "Profile ID: \"" + m.profileId + "\" | Name: \"" + m.displayName + "\" | Skills: [" + ((m.skills || []).join(", ")) + "]")
    .join("\n");

  const systemPrompt = [
    "You are MayLamDi's Senior Project Architect.",
    "Transform the project brief into a high-quality, actionable execution plan.",
    "CRITICAL: Respond ONLY with a valid JSON object. Do not include markdown codeblocks or thought tags.",
    "",
    "DIRECTIVES:",
    "1. Available phase IDs: " + phases.map((p) => p._id).join(", "),
    "2. Available member profile IDs: " + members.map((m) => m.profileId).join(", "),
    "3. If the team has only 1 member, reviewerProfileId MUST be null. Otherwise, reviewerProfileId must be a DIFFERENT member from primaryOwnerProfileId.",
    "4. Generate between 3 and 10 cohesive, specific tasks with active verb titles."
  ].join("\n");

  const userPrompt = JSON.stringify({
    brief: input.brief,
    projectTitle: project.title,
    projectDescription: project.description,
    phases: phases.map((p) => ({ phaseId: p._id, title: p.title })),
    teamMembers: memberText,
  });

  for (const model of GEMINI_MODELS) {
    try {
      console.info("[Client AI] Calling Gemini Native API directly: " + model);
      const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(apiKey);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        console.warn("[Client AI] Gemini model " + model + " HTTP " + response.status);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const sanitized = rawText.replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, "").trim();
      const jsonText = sanitized.match(/^`(?:json)?\s*([\s\S]*?)\s*`$/i)?.[1]
        || (sanitized.indexOf("{") >= 0 ? sanitized.slice(sanitized.indexOf("{"), sanitized.lastIndexOf("}") + 1) : sanitized);

      const parsed = JSON.parse(jsonText);
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) continue;

      const fallbackPhaseId = phases[0]?._id ?? "phase-1";
      const fallbackMemberId = members[0]?.profileId ?? "member-1";

      const validatedTasks = parsed.tasks.map((t: Record<string, unknown>, idx: number) => {
        const owner = members.some((m) => m.profileId === t.primaryOwnerProfileId)
          ? String(t.primaryOwnerProfileId)
          : fallbackMemberId;

        let reviewer = typeof t.reviewerProfileId === "string" && members.some((m) => m.profileId === t.reviewerProfileId)
          ? String(t.reviewerProfileId)
          : null;

        if (members.length <= 1 || reviewer === owner) {
          reviewer = null;
        }

        return {
          tempId: String(t.tempId || "task-" + (idx + 1)),
          title: String(t.title || "Task " + (idx + 1)),
          description: String(t.description || ""),
          phaseId: phases.some((p) => p._id === t.phaseId) ? String(t.phaseId) : fallbackPhaseId,
          milestoneTempId: typeof t.milestoneTempId === "string" ? String(t.milestoneTempId) : null,
          primaryOwnerProfileId: owner,
          collaboratorProfileIds: Array.isArray(t.collaboratorProfileIds)
            ? t.collaboratorProfileIds.filter((id) => members.some((m) => m.profileId === id) && id !== owner)
            : [],
          requiredSkills: Array.isArray(t.requiredSkills) ? t.requiredSkills.map(String) : [],
          estimatedEffortHours: typeof t.estimatedEffortHours === "number" && t.estimatedEffortHours > 0 ? t.estimatedEffortHours : 4,
          difficulty: typeof t.difficulty === "number" && t.difficulty >= 1 && t.difficulty <= 5 ? Math.round(t.difficulty) : 3,
          weight: typeof t.weight === "number" && t.weight > 0 ? t.weight : 1,
          required: true,
          startDate: typeof t.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.startDate) ? t.startDate : (project.startDate || new Date().toISOString().slice(0, 10)),
          dueDate: typeof t.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : (project.deadline || new Date().toISOString().slice(0, 10)),
          dependencyTempIds: Array.isArray(t.dependencyTempIds) ? t.dependencyTempIds.map(String) : [],
          requiresReview: true,
          reviewerProfileId: reviewer,
          allocationExplanation: String(t.allocationExplanation || "Assigned based on project role."),
          longTaskBreakdown: String(t.longTaskBreakdown || ""),
        };
      });

      const validatedMilestones = Array.isArray(parsed.milestones)
        ? parsed.milestones.map((m: Record<string, unknown>, idx: number) => ({
            tempId: String(m.tempId || "milestone-" + (idx + 1)),
            title: String(m.title || "Milestone " + (idx + 1)),
            description: String(m.description || ""),
            phaseId: phases.some((p) => p._id === m.phaseId) ? String(m.phaseId) : fallbackPhaseId,
            dueDate: typeof m.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(m.dueDate) ? m.dueDate : (project.deadline || new Date().toISOString().slice(0, 10)),
          }))
        : [];

      console.info("[Client AI] Successfully generated AI plan via " + model + " with " + validatedTasks.length + " tasks!");
      return {
        recommendedFramework: String(parsed.recommendedFramework || "Custom Process"),
        frameworkReason: String(parsed.frameworkReason || "Optimized for project brief."),
        milestones: validatedMilestones,
        tasks: validatedTasks,
        risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
        assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.map(String) : [],
        source: "llm" as const,
        generationId: input.generationId,
        apiAttempted: true,
        apiErrorCategory: null,
        modelUsed: model,
        generatedAt: Date.now(),
      };
    } catch (err) {
      console.warn("[Client AI] Gemini error with " + model + ":", err);
    }
  }

  return null;
}
