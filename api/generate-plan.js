// Vercel Serverless Function: POST /api/generate-plan
// Securely proxies AI Plan generation requests to Google Gemini and OpenRouter server-side

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
];

const OPENROUTER_MODELS = [
  "openrouter/free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "cohere/north-mini-code:free",
  "nex-agi/nex-n2.5-pro:free",
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = req.body || {};
    const rawBrief = typeof body.brief === "string" ? body.brief.trim() : "";
    const project = body.project && typeof body.project === "object" ? body.project : {};
    const phases = Array.isArray(body.phases) ? body.phases : [];
    const members = Array.isArray(body.members) ? body.members : [];
    const generationId = typeof body.generationId === "string" ? body.generationId : undefined;

    if (!rawBrief || rawBrief.length < 10) {
      return res.status(400).json({ error: "Project brief is required (minimum 10 characters)." });
    }
    if (rawBrief.length > 8000) {
      return res.status(400).json({ error: "Project brief is too long (maximum 8000 characters)." });
    }

    const geminiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      (process.env.AIASSISTANT && (process.env.AIASSISTANT.startsWith("AQ.") || process.env.AIASSISTANT.startsWith("AIzaSy")) ? process.env.AIASSISTANT : undefined)
    )?.trim();

    const openRouterKey = (
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_KEY ||
      (process.env.AIASSISTANT && process.env.AIASSISTANT.startsWith("sk-") ? process.env.AIASSISTANT : undefined) ||
      process.env.AI_ASSISTANT
    )?.trim();

    if (!geminiKey && !openRouterKey) {
      return res.status(503).json({
        error: "AI generation keys are not configured on Vercel. Please set GEMINI_API_KEY or OPENROUTER_API_KEY in Vercel Environment Variables.",
      });
    }

    const memberText = members
      .map((m) => `Profile ID: "${m.profileId || m._id}" | Name: "${m.displayName || "Member"}" | Skills: [${(m.skills || []).join(", ")}]`)
      .join("\n");

    const availablePhaseIds = phases.map((p) => String(p.phaseId || p._id || "phase-1"));
    const availableMemberIds = members.map((m) => String(m.profileId || m._id || "member-1"));

    const systemPrompt = [
      "You are MayLamDi's Senior Project Architect.",
      "Transform the project brief into a cohesive, actionable, and grounded project execution plan.",
      "CRITICAL: Respond ONLY with a valid JSON object matching the required schema with no markdown codeblocks, no thought tags, and no surrounding text.",
      "",
      "PLANNING DIRECTIVES:",
      "1. Available process phase IDs: " + availablePhaseIds.join(", "),
      "2. Available team member profile IDs: " + availableMemberIds.join(", "),
      "3. Every task title MUST start with an active verb and state what is being produced.",
      "4. Assign each task to the team member whose skills/role best match the work.",
      "5. If the team has only 1 member, reviewerProfileId MUST be null. If multiple members, reviewerProfileId must be a DIFFERENT member from primaryOwnerProfileId.",
      "6. Task dates must be within project bounds: " + (project.startDate || new Date().toISOString().slice(0, 10)) + " to " + (project.deadline || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)) + ".",
      "7. Generate between 3 and 10 cohesive tasks and up to 5 milestones."
    ].join("\n");

    const schemaDefinition = {
      type: "object",
      properties: {
        recommendedFramework: { type: "string" },
        frameworkReason: { type: "string" },
        milestones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tempId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              phaseId: { type: "string" },
              dueDate: { type: "string" },
            },
          },
        },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tempId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              phaseId: { type: "string" },
              milestoneTempId: { type: ["string", "null"] },
              primaryOwnerProfileId: { type: "string" },
              collaboratorProfileIds: { type: "array", items: { type: "string" } },
              requiredSkills: { type: "array", items: { type: "string" } },
              estimatedEffortHours: { type: "number" },
              difficulty: { type: "integer" },
              weight: { type: "number" },
              required: { type: "boolean" },
              startDate: { type: "string" },
              dueDate: { type: "string" },
              dependencyTempIds: { type: "array", items: { type: "string" } },
              requiresReview: { type: "boolean" },
              reviewerProfileId: { type: ["string", "null"] },
              allocationExplanation: { type: "string" },
              longTaskBreakdown: { type: "string" },
            },
          },
        },
        risks: { type: "array", items: { type: "string" } },
        assumptions: { type: "array", items: { type: "string" } },
      },
    };

    const userPrompt = JSON.stringify({
      request: "Generate a context-aware project plan.",
      brief: rawBrief,
      projectMetadata: {
        title: project.title,
        description: project.description,
        frameworkName: project.frameworkName,
        startDate: project.startDate,
        deadline: project.deadline,
      },
      phases: phases.map((p) => ({ phaseId: p.phaseId || p._id, title: p.title })),
      teamMembers: memberText,
    });

    const sanitizeResult = (parsed, modelUsed) => {
      const fallbackPhaseId = availablePhaseIds[0] || "phase-1";
      const fallbackMemberId = availableMemberIds[0] || "member-1";

      const validatedTasks = parsed.tasks.map((t, idx) => {
        const owner = availableMemberIds.includes(t.primaryOwnerProfileId)
          ? String(t.primaryOwnerProfileId)
          : fallbackMemberId;

        let reviewer =
          typeof t.reviewerProfileId === "string" && availableMemberIds.includes(t.reviewerProfileId)
            ? String(t.reviewerProfileId)
            : null;

        if (availableMemberIds.length <= 1 || reviewer === owner) {
          reviewer = null;
        }

        return {
          tempId: String(t.tempId || `task-${idx + 1}`),
          title: String(t.title || `Task ${idx + 1}`),
          description: String(t.description || "Labor and deliverables described in brief."),
          phaseId: availablePhaseIds.includes(t.phaseId) ? String(t.phaseId) : fallbackPhaseId,
          milestoneTempId: typeof t.milestoneTempId === "string" ? String(t.milestoneTempId) : null,
          primaryOwnerProfileId: owner,
          collaboratorProfileIds: Array.isArray(t.collaboratorProfileIds)
            ? t.collaboratorProfileIds.filter((id) => availableMemberIds.includes(id) && id !== owner)
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
          allocationExplanation: String(t.allocationExplanation || "Assigned based on project role and capacity."),
          longTaskBreakdown: String(t.longTaskBreakdown || ""),
        };
      });

      const validatedMilestones = Array.isArray(parsed.milestones)
        ? parsed.milestones.map((m, idx) => ({
            tempId: String(m.tempId || `milestone-${idx + 1}`),
            title: String(m.title || `Milestone ${idx + 1}`),
            description: String(m.description || ""),
            phaseId: availablePhaseIds.includes(m.phaseId) ? String(m.phaseId) : fallbackPhaseId,
            dueDate: typeof m.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(m.dueDate) ? m.dueDate : (project.deadline || new Date().toISOString().slice(0, 10)),
          }))
        : [];

      return {
        recommendedFramework: String(parsed.recommendedFramework || project.frameworkName || "Custom Process"),
        frameworkReason: String(parsed.frameworkReason || "Structure optimized for project scope."),
        milestones: validatedMilestones,
        tasks: validatedTasks,
        risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
        assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.map(String) : [],
        source: "llm",
        generationId,
        apiAttempted: true,
        apiErrorCategory: null,
        modelUsed,
        generatedAt: Date.now(),
      };
    };

    // STEP 1: Try Gemini Native
    if (geminiKey) {
      for (const model of GEMINI_MODELS) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
          const response = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: `${systemPrompt}\n\nSTRICT JSON SCHEMA:\n${JSON.stringify(schemaDefinition)}` }],
              },
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
                maxOutputTokens: 8192,
              },
            }),
          });

          clearTimeout(timeout);

          if (!response.ok) continue;

          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) continue;

          const sanitized = rawText.replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, "").trim();
          const jsonText =
            sanitized.match(/^\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`$/i)?.[1] ||
            (sanitized.indexOf("{") >= 0 ? sanitized.slice(sanitized.indexOf("{"), sanitized.lastIndexOf("}") + 1) : sanitized);

          const parsed = JSON.parse(jsonText);
          if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
            return res.status(200).json(sanitizeResult(parsed, model));
          }
        } catch (err) {
          clearTimeout(timeout);
        }
      }
    }

    // STEP 2: Try OpenRouter Backup
    if (openRouterKey) {
      for (const model of OPENROUTER_MODELS) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 35000);

        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://maylamdi.vercel.app",
              "X-Title": "MayLamDi AI Planning",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content: `${systemPrompt}\n\nRespond ONLY with valid JSON matching:\n${JSON.stringify(schemaDefinition)}`,
                },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
              max_tokens: 4000,
            }),
          });

          clearTimeout(timeout);

          if (!response.ok) continue;

          const data = await response.json();
          const rawText = data.choices?.[0]?.message?.content;
          if (!rawText) continue;

          const sanitized = rawText.replace(/<(think|thought)>[\s\S]*?<\/\1>/gi, "").trim();
          const jsonText =
            sanitized.match(/^\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`$/i)?.[1] ||
            (sanitized.indexOf("{") >= 0 ? sanitized.slice(sanitized.indexOf("{"), sanitized.lastIndexOf("}") + 1) : sanitized);

          const parsed = JSON.parse(jsonText);
          if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
            return res.status(200).json(sanitizeResult(parsed, model));
          }
        } catch (err) {
          clearTimeout(timeout);
        }
      }
    }

    return res.status(502).json({
      error: "AI models (Gemini & OpenRouter) are currently busy. Please try again or use manual planning.",
    });
  } catch (globalErr) {
    return res.status(500).json({
      error: "An unexpected server error occurred during AI plan generation.",
    });
  }
}
