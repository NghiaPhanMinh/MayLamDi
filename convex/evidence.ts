import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireTeamMember } from "./lib/auth";
import {
  validateEvidenceMetadata,
  validateReviewComment,
} from "./lib/evidenceValidation";
import { refreshProjectProgress } from "./lib/projectProgress";

type TaskContext = {
  task: Doc<"tasks">;
  project: Doc<"projects">;
  profile: Doc<"userProfiles">;
  canWrite: boolean;
};

async function getTaskContext(
  ctx: QueryCtx | MutationCtx,
  taskId: Id<"tasks">,
): Promise<TaskContext> {
  const task = await ctx.db.get(taskId);

  if (task === null) {
    throw new Error("This task no longer exists.");
  }

  const project = await ctx.db.get(task.projectId);

  if (project === null) {
    throw new Error("This project no longer exists.");
  }

  const { profile } = await requireTeamMember(ctx, project.teamId);
  let projectMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_and_user", (indexQuery) =>
      indexQuery.eq("projectId", project._id).eq("profileId", profile._id),
    )
    .unique();

  if (projectMembership === null && "insert" in ctx.db) {
    const now = Date.now();
    const id = await (ctx as MutationCtx).db.insert("projectMembers", {
      projectId: project._id,
      profileId: profile._id,
      skills: [...(profile.skills ?? []), ...(profile.softwareSkills ?? [])],
      availability: "",
      currentWorkload: "medium",
      preferences: "",
      weeklyCapacity: profile.weeklyCapacity,
      availabilityMode: "busy",
      joinedAt: now,
    });
    projectMembership = (await ctx.db.get(id))!;
  }

  return {
    task,
    project,
    profile,
    canWrite: project.status !== "archived",
  };
}

function requireEvidenceWriteAccess(context: TaskContext) {
  if (context.project.status === "archived") {
    throw new Error("Restore this archived project before adding evidence.");
  }

  const isOwner = context.task.primaryOwnerProfileId === context.profile._id;
  if (context.task.acceptanceStatus === "pending") {
    throw new Error("Accept this task before adding evidence.");
  }
  if (!context.canWrite || context.task.isOpenForClaiming || !isOwner) {
    throw new Error("Only the assigned task owner can submit evidence.");
  }
}

function taskDamage(task: Doc<"tasks">) {
  return task.damage ?? ((task.difficulty ?? 1) <= 1 ? 10 : task.difficulty === 2 ? 20 : 30);
}

export const listForTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const context = await getTaskContext(ctx, args.taskId);
    const [evidenceItems, reviews] = await Promise.all([
      ctx.db
        .query("taskEvidence")
        .withIndex("by_task", (indexQuery) =>
          indexQuery.eq("taskId", args.taskId),
        )
        .order("desc")
        .collect(),
      ctx.db
        .query("taskReviews")
        .withIndex("by_task_and_time", (indexQuery) =>
          indexQuery.eq("taskId", args.taskId),
        )
        .order("desc")
        .collect(),
    ]);
    const evidence = await Promise.all(
      evidenceItems.map(async (item) => {
        const submitter = await ctx.db.get(item.submitterProfileId);
        const fileUrl = item.storageId
          ? await ctx.storage.getUrl(item.storageId)
          : null;

        return {
          ...item,
          submitterName: submitter?.displayName ?? "Former team member",
          fileUrl,
        };
      }),
    );
    const decoratedReviews = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = review.reviewerProfileId
          ? await ctx.db.get(review.reviewerProfileId)
          : null;
        return {
          ...review,
          reviewerName: reviewer?.displayName ?? "Waiting for reviewer",
        };
      }),
    );
    const [projectMembers, projectTasks] = await Promise.all([
      ctx.db.query("projectMembers").withIndex("by_project", (query) =>
        query.eq("projectId", context.project._id),
      ).collect(),
      ctx.db.query("tasks").withIndex("by_project", (query) =>
        query.eq("projectId", context.project._id),
      ).collect(),
    ]);
    const reviewCounts = new Map<Id<"userProfiles">, number>();
    for (const task of projectTasks) {
      if (task.reviewerProfileId && task._id !== context.task._id) {
        reviewCounts.set(task.reviewerProfileId, (reviewCounts.get(task.reviewerProfileId) ?? 0) + 1);
      }
    }
    const totalReviewTasks = projectTasks.filter((task) => task.requiresReview).length;
    let fairCapacity = Math.max(1, Math.ceil(totalReviewTasks / Math.max(1, projectMembers.length)));
    const eligibleMembers = projectMembers.filter(
      (member) => member.profileId !== context.task.primaryOwnerProfileId,
    );
    if (eligibleMembers.length && eligibleMembers.every(
      (member) => (reviewCounts.get(member.profileId) ?? 0) >= fairCapacity,
    )) {
      fairCapacity = Math.min(...eligibleMembers.map(
        (member) => reviewCounts.get(member.profileId) ?? 0,
      )) + 1;
    }
    const eligibleReviewers = await Promise.all(eligibleMembers.map(async (member) => {
      const memberProfile = await ctx.db.get(member.profileId);
      const reviewCount = reviewCounts.get(member.profileId) ?? 0;
      return {
        profileId: member.profileId,
        displayName: memberProfile?.displayName ?? "Team member",
        reviewCount,
        atCapacity: reviewCount >= fairCapacity && eligibleMembers.some(
          (candidate) => (reviewCounts.get(candidate.profileId) ?? 0) < fairCapacity,
        ),
      };
    }));

    return {
      evidence,
      reviews: decoratedReviews,
      latestReview: decoratedReviews[0] ?? null,
      currentProfileId: context.profile._id,
      isSoloProject: projectMembers.length <= 1 || context.project.targetMemberCount === 1,
      canSubmit:
        context.canWrite &&
        context.task.assignmentState !== "unassigned" &&
        !context.task.isOpenForClaiming &&
        context.task.acceptanceStatus !== "pending" &&
        context.task.primaryOwnerProfileId === context.profile._id &&
        ["todo", "in_progress", "changes_requested"].includes(context.task.status),
      isAssignedReviewer:
        context.task.reviewerProfileId === context.profile._id,
      canReview:
        context.canWrite &&
        context.task.reviewerProfileId === context.profile._id &&
        context.task.primaryOwnerProfileId !== context.profile._id &&
        ["review", "submitted"].includes(context.task.status) &&
        reviews[0]?.status === "pending",
      isTaskOwner: context.task.primaryOwnerProfileId === context.profile._id,
      eligibleReviewers,
      fairReviewCapacity: fairCapacity,
    };
  },
});

export const generateUploadUrl = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const context = await getTaskContext(ctx, args.taskId);
    requireEvidenceWriteAccess(context);
    return await ctx.storage.generateUploadUrl();
  },
});

export const add = mutation({
  args: {
    taskId: v.id("tasks"),
    type: v.union(
      v.literal("note"),
      v.literal("link"),
      v.literal("image"),
      v.literal("pdf"),
    ),
    note: v.optional(v.string()),
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const context = await getTaskContext(ctx, args.taskId);
    requireEvidenceWriteAccess(context);
    let actualContentType = args.contentType;
    let actualFileSize = args.fileSize;

    if (args.storageId) {
      const storedFile = await ctx.db.system.get(args.storageId);

      if (storedFile === null) {
        throw new Error("The uploaded evidence file could not be found.");
      }

      actualContentType = storedFile.contentType ?? args.contentType;
      actualFileSize = storedFile.size;
    }

    const validated = validateEvidenceMetadata({
      type: args.type,
      note: args.note,
      url: args.url,
      hasStorageId: args.storageId !== undefined,
      fileName: args.fileName,
      contentType: actualContentType,
      fileSize: actualFileSize,
    });

    if ((args.type === "note" || args.type === "link") && args.storageId) {
      throw new Error("Notes and links cannot include an uploaded file.");
    }

    const now = Date.now();
    const evidenceId = await ctx.db.insert("taskEvidence", {
      taskId: context.task._id,
      submitterProfileId: context.profile._id,
      type: args.type,
      note: validated.note,
      url: "url" in validated ? validated.url : undefined,
      storageId: args.storageId,
      fileName: "fileName" in validated ? validated.fileName : undefined,
      contentType:
        "contentType" in validated ? validated.contentType : undefined,
      fileSize: "fileSize" in validated ? validated.fileSize : undefined,
      submittedAt: now,
    });
    await ctx.db.insert("activityLogs", {
      teamId: context.project.teamId,
      projectId: context.project._id,
      actorProfileId: context.profile._id,
      action: "evidence_submitted",
      metadata: {
        projectId: context.project._id,
        taskId: context.task._id,
        taskTitle: context.task.title,
        evidenceId,
        evidenceType: args.type,
      },
      createdAt: now,
    });

    return evidenceId;
  },
});

export const submitReview = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(v.literal("approved"), v.literal("changes_requested")),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const context = await getTaskContext(ctx, args.taskId);

    if (context.project.status === "archived") {
      throw new Error("Restore this archived project before reviewing its tasks.");
    }

    if (context.task.status !== "review" && context.task.status !== "submitted") {
      throw new Error("This task is not currently waiting for review.");
    }

    const latestReviews = await ctx.db
      .query("taskReviews")
      .withIndex("by_task_and_time", (indexQuery) =>
        indexQuery.eq("taskId", context.task._id),
      )
      .order("desc")
      .take(1);
    const review = latestReviews[0];

    if (!review || review.status !== "pending") {
      throw new Error("This task does not have a pending review request.");
    }

    if (context.task.primaryOwnerProfileId === context.profile._id) {
      throw new Error("A task owner cannot review their own task.");
    }
    if (!context.canWrite || context.task.reviewerProfileId !== context.profile._id) {
      throw new Error("Only the assigned reviewer can review this task.");
    }

    const comment = validateReviewComment(args.status, args.comment);
    const now = Date.now();
    await ctx.db.patch(review._id, {
      reviewerProfileId: context.profile._id,
      status: args.status,
      comment,
      evidenceIds: (await ctx.db
        .query("taskEvidence")
        .withIndex("by_task", (query) => query.eq("taskId", context.task._id))
        .collect()).map((evidence) => evidence._id),
      updatedAt: now,
      reviewedAt: now,
    });

    if (args.status === "approved") {
      const existingCombatEvent = await ctx.db
        .query("combatEvents")
        .withIndex("by_task", (query) => query.eq("taskId", context.task._id))
        .unique();

      let combatEventId = existingCombatEvent?._id;
      if (!existingCombatEvent) {
        const attackerMembership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (query) =>
            query.eq("teamId", context.project.teamId).eq("profileId", context.task.primaryOwnerProfileId),
          )
          .unique();

        combatEventId = await ctx.db.insert("combatEvents", {
          projectId: context.project._id,
          taskId: context.task._id,
          attackerProfileId: context.task.primaryOwnerProfileId,
          reviewerProfileId: context.profile._id,
          damage: taskDamage(context.task),
          spellType: attackerMembership?.spellType ?? "spark",
          createdAt: now,
        });
      }

      await ctx.db.patch(context.task._id, {
        status: "completed",
        completedAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("activityLogs", {
        teamId: context.project.teamId,
        projectId: context.project._id,
        actorProfileId: context.profile._id,
        action: "review_approved",
        metadata: {
          projectId: context.project._id,
          taskId: context.task._id,
          taskTitle: context.task.title,
          reviewId: review._id,
          reviewStatus: args.status,
          taskStatus: "completed",
          combatEventId,
          damage: taskDamage(context.task),
        },
        createdAt: now,
      });

      await refreshProjectProgress(ctx, context.project, context.profile._id);
    } else {
      await ctx.db.patch(context.task._id, {
        status: "in_progress",
        completedAt: undefined,
        updatedAt: now,
      });

      await ctx.db.insert("activityLogs", {
        teamId: context.project.teamId,
        projectId: context.project._id,
        actorProfileId: context.profile._id,
        action: "review_changes_requested",
        metadata: {
          projectId: context.project._id,
          taskId: context.task._id,
          taskTitle: context.task.title,
          reviewId: review._id,
          reviewStatus: args.status,
          taskStatus: "in_progress",
        },
        createdAt: now,
      });

      await refreshProjectProgress(ctx, context.project, context.profile._id);
    }

    return review._id;
  },
});

export const submitForReview = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const context = await getTaskContext(ctx, args.taskId);
    requireEvidenceWriteAccess(context);
    if (context.task.primaryOwnerProfileId !== context.profile._id) {
      throw new Error("Only the assigned task owner can submit this task for review.");
    }
    if (context.task.acceptanceStatus === "pending") {
      throw new Error("Accept this task before submitting it for review.");
    }
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (query) => query.eq("projectId", context.project._id))
      .collect();
    const isSoloProject = projectMembers.length <= 1 || context.project.targetMemberCount === 1;

    if (!isSoloProject) {
      if (!context.task.requiresReview) {
        throw new Error("Every task must use peer review before completion.");
      }
      if (!context.task.reviewerProfileId) {
        throw new Error("Choose an eligible reviewer before submitting this task.");
      }
    }
    if (!["todo", "in_progress", "changes_requested"].includes(context.task.status)) {
      throw new Error("This task cannot be submitted from its current state.");
    }
    const evidence = await ctx.db
      .query("taskEvidence")
      .withIndex("by_task", (query) => query.eq("taskId", context.task._id))
      .take(1);
    if (evidence.length === 0) throw new Error("Add evidence before submitting for review.");

    const now = Date.now();

    if (isSoloProject) {
      const existingCombatEvent = await ctx.db
        .query("combatEvents")
        .withIndex("by_task", (query) => query.eq("taskId", context.task._id))
        .unique();

      let combatEventId = existingCombatEvent?._id;
      if (!existingCombatEvent) {
        const attackerMembership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (query) =>
            query.eq("teamId", context.project.teamId).eq("profileId", context.task.primaryOwnerProfileId),
          )
          .unique();

        combatEventId = await ctx.db.insert("combatEvents", {
          projectId: context.project._id,
          taskId: context.task._id,
          attackerProfileId: context.task.primaryOwnerProfileId,
          reviewerProfileId: context.profile._id,
          damage: taskDamage(context.task),
          spellType: attackerMembership?.spellType ?? "spark",
          createdAt: now,
        });
      }

      await ctx.db.patch(context.task._id, {
        status: "completed",
        completedAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("activityLogs", {
        teamId: context.project.teamId,
        projectId: context.project._id,
        actorProfileId: context.profile._id,
        action: "creator_approved_task",
        metadata: {
          projectId: context.project._id,
          taskId: context.task._id,
          taskTitle: context.task.title,
          taskStatus: "completed",
          combatEventId,
          damage: taskDamage(context.task),
        },
        createdAt: now,
      });

      await refreshProjectProgress(ctx, context.project, context.profile._id);
      return null;
    }

    const reviewId = await ctx.db.insert("taskReviews", {
      taskId: context.task._id,
      reviewerProfileId: context.task.reviewerProfileId!,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(context.task._id, { status: "submitted", updatedAt: now, completedAt: undefined });
    await ctx.db.insert("activityLogs", {
      teamId: context.project.teamId,
      projectId: context.project._id,
      actorProfileId: context.profile._id,
      action: "review_requested",
      metadata: {
        projectId: context.project._id,
        taskId: context.task._id,
        taskTitle: context.task.title,
        reviewId,
        reviewStatus: "pending",
      },
      createdAt: now,
    });
    return reviewId;
  },
});

export const decideCompletion = mutation({
  args: {
    taskId: v.id("tasks"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const context = await getTaskContext(ctx, args.taskId);
    const isCreator = context.project.creatorProfileId === context.profile._id;
    const isReviewer = context.task.reviewerProfileId === context.profile._id;
    if (!isCreator && !isReviewer) {
      throw new Error("Only the room creator or assigned reviewer can approve final task completion.");
    }
    if (context.task.status !== "awaiting_creator") {
      throw new Error("This task is not awaiting creator approval.");
    }
    const now = Date.now();

    if (args.decision === "reject") {
      await ctx.db.patch(context.task._id, {
        status: "in_progress",
        completedAt: undefined,
        updatedAt: now,
      });
      await ctx.db.insert("activityLogs", {
        teamId: context.project.teamId,
        projectId: context.project._id,
        actorProfileId: context.profile._id,
        action: "creator_rejected_task",
        metadata: {
          projectId: context.project._id,
          taskId: context.task._id,
          taskTitle: context.task.title,
          taskStatus: "in_progress",
        },
        createdAt: now,
      });
      await refreshProjectProgress(ctx, context.project, context.profile._id);
      return context.task._id;
    }

    const existingCombatEvent = await ctx.db
      .query("combatEvents")
      .withIndex("by_task", (query) => query.eq("taskId", context.task._id))
      .unique();
    let combatEventId = existingCombatEvent?._id;
    if (!existingCombatEvent) {
      const latestApprovedReview = (await ctx.db
        .query("taskReviews")
        .withIndex("by_task_and_time", (query) => query.eq("taskId", context.task._id))
        .order("desc")
        .collect()).find((review) => review.status === "approved");
      if (!latestApprovedReview?.reviewerProfileId) {
        throw new Error("An approved peer review is required before final completion.");
      }
      const attackerMembership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (query) =>
          query.eq("teamId", context.project.teamId).eq("profileId", context.task.primaryOwnerProfileId),
        )
        .unique();
      combatEventId = await ctx.db.insert("combatEvents", {
        projectId: context.project._id,
        taskId: context.task._id,
        attackerProfileId: context.task.primaryOwnerProfileId,
        reviewerProfileId: latestApprovedReview.reviewerProfileId,
        damage: taskDamage(context.task),
        spellType: attackerMembership?.spellType ?? "spark",
        createdAt: now,
      });
      await ctx.db.insert("activityLogs", {
        teamId: context.project.teamId,
        projectId: context.project._id,
        actorProfileId: context.profile._id,
        action: "combat_event_created",
        metadata: {
          projectId: context.project._id,
          taskId: context.task._id,
          taskTitle: context.task.title,
          combatEventId,
          damage: taskDamage(context.task),
        },
        createdAt: now,
      });
    }
    await ctx.db.patch(context.task._id, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activityLogs", {
      teamId: context.project.teamId,
      projectId: context.project._id,
      actorProfileId: context.profile._id,
      action: "creator_approved_task",
      metadata: {
        projectId: context.project._id,
        taskId: context.task._id,
        taskTitle: context.task.title,
        taskStatus: "completed",
        combatEventId,
        damage: taskDamage(context.task),
      },
      createdAt: now,
    });
    await refreshProjectProgress(ctx, context.project, context.profile._id);
    return context.task._id;
  },
});

export const selfCompleteSoloTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const context = await getTaskContext(ctx, args.taskId);
    requireEvidenceWriteAccess(context);

    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (query) => query.eq("projectId", context.project._id))
      .collect();

    const isSoloProject = projectMembers.length <= 1 || context.project.targetMemberCount === 1;
    const isOwner = context.task.primaryOwnerProfileId === context.profile._id;
    const isCreator = context.project.creatorProfileId === context.profile._id;

    if (!isSoloProject && !isCreator && !isOwner) {
      throw new Error("Self-completion is available for solo projects or room creators.");
    }

    const evidence = await ctx.db
      .query("taskEvidence")
      .withIndex("by_task", (query) => query.eq("taskId", context.task._id))
      .take(1);

    if (evidence.length === 0) {
      throw new Error("Add evidence before completing this task.");
    }

    const now = Date.now();

    const existingCombatEvent = await ctx.db
      .query("combatEvents")
      .withIndex("by_task", (query) => query.eq("taskId", context.task._id))
      .unique();

    let combatEventId = existingCombatEvent?._id;
    if (!existingCombatEvent) {
      const attackerMembership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (query) =>
          query.eq("teamId", context.project.teamId).eq("profileId", context.task.primaryOwnerProfileId),
        )
        .unique();

      combatEventId = await ctx.db.insert("combatEvents", {
        projectId: context.project._id,
        taskId: context.task._id,
        attackerProfileId: context.task.primaryOwnerProfileId,
        reviewerProfileId: context.profile._id,
        damage: taskDamage(context.task),
        spellType: attackerMembership?.spellType ?? "spark",
        createdAt: now,
      });
    }

    await ctx.db.patch(context.task._id, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityLogs", {
      teamId: context.project.teamId,
      projectId: context.project._id,
      actorProfileId: context.profile._id,
      action: "creator_approved_task",
      metadata: {
        projectId: context.project._id,
        taskId: context.task._id,
        taskTitle: context.task.title,
        taskStatus: "completed",
        combatEventId,
        damage: taskDamage(context.task),
      },
      createdAt: now,
    });

    await refreshProjectProgress(ctx, context.project, context.profile._id);
    return context.task._id;
  },
});

