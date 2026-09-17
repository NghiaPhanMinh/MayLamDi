import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";

type Workspace = FunctionReturnType<typeof api.tasks.getWorkspace>;
export type ClientAiPlan = FunctionReturnType<typeof api.ai.generateProjectPlan>;

export async function generateClientGeminiPlan(input: {
  workspace: Workspace;
  brief: string;
  generationId?: string;
}): Promise<ClientAiPlan | null> {
  if (import.meta.env.MODE === "test") {
    return null;
  }

  try {
    const { project, phases, members } = input.workspace;

    const response = await fetch("/api/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brief: input.brief,
        project: {
          title: project.title,
          description: project.description,
          frameworkName: project.frameworkName,
          startDate: project.startDate,
          deadline: project.deadline,
        },
        phases: phases.map((p) => ({
          phaseId: p._id,
          title: p.title,
        })),
        members: members.map((m) => ({
          profileId: m.profileId,
          displayName: m.displayName,
          skills: m.skills || [],
        })),
        generationId: input.generationId,
      }),
    });

    if (!response.ok) {
      console.warn(`[Proxy AI] /api/generate-plan returned status ${response.status}`);
      return null;
    }

    const plan = (await response.json()) as ClientAiPlan;
    if (plan && plan.tasks && Array.isArray(plan.tasks) && plan.tasks.length > 0) {
      console.info(`[Proxy AI] Generated plan successfully via /api/generate-plan (${plan.tasks.length} tasks)`);
      return plan;
    }

    return null;
  } catch (err) {
    console.warn("[Proxy AI] /api/generate-plan network or parse failure:", err);
    return null;
  }
}
