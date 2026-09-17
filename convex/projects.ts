import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireCompleteUserProfile, requireTeamMember, requireUserProfile } from "./lib/auth";
import { deriveProjectStatus } from "./lib/projectProgress";
import {
  validateBuiltInFramework,
  validateMemberPlanning,
  validateProjectDetails,
  validateProjectPhases,
  validateTargetMemberCount,
} from "./lib/projectValidation";

const projectPhaseValidator = v.object({
  key: v.string(),
  name: v.string(),
  description: v.string(),
  canOverlap: v.boolean(),
  dependencyKeys: v.array(v.string()),
  reviewCheckpoint: v.boolean(),
});

const projectMemberValidator = v.object({
  profileId: v.id("userProfiles"),
  skills: v.array(v.string()),
  availability: v.string(),
  currentWorkload: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
  ),
  preferences: v.string(),
  weeklyCapacity: v.optional(v.number()),
});

export const listMineAcrossRooms = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUserProfile(ctx);
    const [memberships, dismissals] = await Promise.all([
      ctx.db
        .query("teamMembers")
        .withIndex("by_user", (indexQuery) =>
          indexQuery.eq("profileId", profile._id),
        )
        .collect(),
      ctx.db
        .query("projectDismissals")
        .withIndex("by_user", (indexQuery) =>
          indexQuery.eq("profileId", profile._id),
        )
        .collect(),
    ]);
    const dismissedProjectIds = new Set(dismissals.map((dismissal) => dismissal.projectId));

    const groupedProjects = await Promise.all(
      memberships.map(async (membership) => {
        const [team, members, projects] = await Promise.all([
          ctx.db.get(membership.teamId),
          ctx.db
            .query("teamMembers")
            .withIndex("by_team", (indexQuery) =>
              indexQuery.eq("teamId", membership.teamId),
            )
            .collect(),
          ctx.db
            .query("projects")
            .withIndex("by_team_and_updated", (indexQuery) =>
              indexQuery.eq("teamId", membership.teamId),
            )
            .order("desc")
            .take(50),
        ]);

        if (team === null) {
          return [];
        }

        return projects
          .filter((project) => !dismissedProjectIds.has(project._id))
          .map((project) => ({
            _id: project._id,
            teamId: team._id,
            roomName: team.name,
            title: project.title,
            description: project.description,
            frameworkName: project.frameworkName,
            status: project.status,
            deadline: project.deadline,
            memberCount: members.length,
            updatedAt: project.updatedAt,
          }));
      }),
    );

    return groupedProjects
      .flat()
      .sort((first, second) => second.updatedAt - first.updatedAt);
  },
});

export const removeFromMine = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("This project no longer exists.");
    const { profile } = await requireTeamMember(ctx, project.teamId);
    const existing = await ctx.db
      .query("projectDismissals")
      .withIndex("by_project_and_user", (query) =>
        query.eq("projectId", project._id).eq("profileId", profile._id),
      )
      .unique();

    if (existing === null) {
      await ctx.db.insert("projectDismissals", {
        projectId: project._id,
        profileId: profile._id,
        createdAt: Date.now(),
      });
    }

    return project._id;
  },
});

export const listForTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const { profile } = await requireTeamMember(ctx, args.teamId);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_team_and_updated", (indexQuery) =>
        indexQuery.eq("teamId", args.teamId),
      )
      .order("desc")
      .take(50);

    return await Promise.all(
      projects.map(async (project) => {
        const phases = await ctx.db
          .query("phases")
          .withIndex("by_project_and_order", (indexQuery) =>
            indexQuery.eq("projectId", project._id),
          )
          .collect();
        const projectMembers = await ctx.db
          .query("projectMembers")
          .withIndex("by_project", (indexQuery) =>
            indexQuery.eq("projectId", project._id),
          )
          .collect();

        return {
          ...project,
          phaseCount: phases.length,
          memberCount: projectMembers.length,
          phases: phases.map((phase) => ({
            _id: phase._id,
            title: phase.title,
            order: phase.order,
            canOverlap: phase.canOverlap,
            reviewCheckpoint: phase.reviewCheckpoint,
          })),
          canManageProject: project.creatorProfileId === profile._id,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.string(),
    startDate: v.optional(v.string()),
    deadline: v.string(),
    frameworkType: v.union(
      v.literal("none"),
      v.literal("built_in"),
      v.literal("custom"),
    ),
    builtInFrameworkId: v.optional(v.string()),
    customFrameworkId: v.optional(v.id("customFrameworks")),
    frameworkName: v.string(),
    phases: v.array(projectPhaseValidator),
    members: v.optional(v.array(projectMemberValidator)),
    setupMode: v.optional(v.union(v.literal("manual"), v.literal("ai"))),
    taskCreationMode: v.optional(v.union(v.literal("manual"), v.literal("ai"))),
    allocationStrategy: v.optional(v.union(v.literal("ai"), v.literal("manual"), v.literal("self_selection"))),
    targetMemberCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireTeamMember(ctx, args.teamId);
    await requireCompleteUserProfile(ctx);
    const details = validateProjectDetails(args);
    const targetMemberCount = validateTargetMemberCount(args.targetMemberCount);
    let frameworkName: string;
    let phases;
    let builtInFrameworkId: string | undefined;
    let customFrameworkId: typeof args.customFrameworkId;

    if (args.frameworkType === "none") {
      if (args.builtInFrameworkId || args.customFrameworkId) {
        throw new Error("A framework-free project cannot include a framework ID.");
      }
      frameworkName = "Flexible project";
      phases = validateProjectPhases([
        {
          key: "project-work",
          name: "Project work",
          description: "A flexible workspace for tasks and checkpoints.",
          canOverlap: true,
          dependencyKeys: [],
          reviewCheckpoint: false,
        },
      ]);
    } else if (args.frameworkType === "built_in") {
      if (!args.builtInFrameworkId || args.customFrameworkId) {
        throw new Error("Choose a built-in framework.");
      }

      const validated = validateBuiltInFramework(
        args.builtInFrameworkId,
        args.frameworkName,
        args.phases,
      );
      frameworkName = validated.frameworkName;
      phases = validated.phases;
      builtInFrameworkId = args.builtInFrameworkId;
    } else {
      if (!args.customFrameworkId || args.builtInFrameworkId) {
        throw new Error("Choose a custom framework.");
      }

      const customFramework = await ctx.db.get(args.customFrameworkId);

      if (
        customFramework === null ||
        customFramework.teamId !== args.teamId
      ) {
        throw new Error("That custom framework does not belong to this team.");
      }

      frameworkName = customFramework.name;
      phases = validateProjectPhases(
        customFramework.phases.map((phase) => ({
          key: phase.key,
          name: phase.name,
          description: phase.description,
          canOverlap: phase.canOverlap,
          dependencyKeys: phase.defaultDependencyKeys,
          reviewCheckpoint: phase.reviewCheckpoint,
        })),
      );
      customFrameworkId = customFramework._id;
    }

    const requestedMembers = args.members ?? [{
      profileId: profile._id,
      skills: [...(profile.skills ?? []), ...(profile.softwareSkills ?? [])],
      availability: "",
      currentWorkload: "medium" as const,
      preferences: "",
      weeklyCapacity: profile.weeklyCapacity,
    }];

    if (requestedMembers.length < 1) {
      throw new Error("Choose at least one project member.");
    }

    const uniqueProfileIds = new Set(
      requestedMembers.map((member) => member.profileId),
    );

    if (uniqueProfileIds.size !== requestedMembers.length) {
      throw new Error("Each project member can only be added once.");
    }

    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (indexQuery) =>
        indexQuery.eq("teamId", args.teamId),
      )
      .collect();
    const teamProfileIds = new Set(
      teamMemberships.map((membership) => membership.profileId),
    );

    if (
      requestedMembers.some((member) => !teamProfileIds.has(member.profileId))
    ) {
      throw new Error("Every project member must belong to the team.");
    }

    const now = Date.now();
    const projectId = await ctx.db.insert("projects", {
      teamId: args.teamId,
      ...details,
      frameworkType: args.frameworkType,
      frameworkName,
      builtInFrameworkId,
      customFrameworkId,
      status: "active",
      setupMode: args.setupMode,
      taskCreationMode: args.taskCreationMode ?? args.setupMode,
      allocationStrategy: args.allocationStrategy ?? (args.setupMode === "ai" ? "ai" : "manual"),
      targetMemberCount,
      launchedAt: now,
      creatorProfileId: profile._id,
      createdAt: now,
      updatedAt: now,
    });

    for (const [order, phase] of phases.entries()) {
      await ctx.db.insert("phases", {
        projectId,
        frameworkPhaseKey: phase.key,
        title: phase.name,
        description: phase.description,
        order,
        status: "not_started",
        canOverlap: phase.canOverlap,
        reviewCheckpoint: phase.reviewCheckpoint,
        dependencyKeys: phase.dependencyKeys,
      });
    }

    for (const member of requestedMembers) {
      await ctx.db.insert("projectMembers", {
        projectId,
        profileId: member.profileId,
        ...validateMemberPlanning(member),
        availabilityMode: "busy",
        joinedAt: now,
      });
    }

    await ctx.db.insert("activityLogs", {
      teamId: args.teamId,
      actorProfileId: profile._id,
      action: "project_created",
      metadata: { projectId, projectTitle: details.title },
      createdAt: now,
    });
    await ctx.db.patch(args.teamId, { updatedAt: now });

    return projectId;
  },
});

export const joinLatestWithPreferences = mutation({
  args: {
    teamId: v.id("teams"),
    skills: v.array(v.string()),
    availability: v.string(),
    currentWorkload: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    preferences: v.string(),
    weeklyCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireTeamMember(ctx, args.teamId);
    await requireCompleteUserProfile(ctx);
    const planning = validateMemberPlanning({
      profileId: profile._id,
      skills: [...(profile.skills ?? []), ...(profile.softwareSkills ?? [])],
      availability: "",
      currentWorkload: args.currentWorkload,
      preferences: "",
      weeklyCapacity: profile.weeklyCapacity,
    });
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_team_and_updated", (query) => query.eq("teamId", args.teamId))
      .order("desc")
      .take(50);
    const project = projects.find((candidate) => candidate.status !== "archived");

    if (!project) {
      return null;
    }

    const existing = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_and_user", (query) =>
        query.eq("projectId", project._id).eq("profileId", profile._id),
      )
      .unique();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { ...planning, availabilityMode: "busy" });
    } else {
      await ctx.db.insert("projectMembers", {
        projectId: project._id,
        profileId: profile._id,
        ...planning,
        availabilityMode: "busy",
        joinedAt: now,
      });
    }

    await ctx.db.patch(project._id, { updatedAt: now });
    return project._id;
  },
});

export const launch = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (project === null) throw new Error("This project no longer exists.");

    const { profile } = await requireTeamMember(ctx, project.teamId);
    if (project.creatorProfileId !== profile._id) {
      throw new Error("Only the room creator can launch this project.");
    }
    if (project.status === "archived") {
      throw new Error("Restore this project before launching it.");
    }
    if (project.launchedAt) return project._id;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (query) => query.eq("projectId", project._id))
      .collect();
    if (tasks.length === 0) throw new Error("Add at least one task before launch.");
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (query) => query.eq("projectId", project._id))
      .collect();
    const otherMembers = projectMembers.filter((m) => m.profileId !== profile._id);
    const isSoloProject = projectMembers.length <= 1 || otherMembers.length === 0 || project.targetMemberCount === 1;

    if (!isSoloProject && tasks.some((task) => task.required && (!task.requiresReview || !task.reviewerProfileId))) {
      throw new Error("Every required task needs an assigned reviewer before launch.");
    }

    const now = Date.now();
    await ctx.db.patch(project._id, { launchedAt: now, status: "active", updatedAt: now });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "project_launched",
      metadata: { projectId: project._id, projectTitle: project.title },
      createdAt: now,
    });
    return project._id;
  },
});

export const setArchived = mutation({
  args: {
    projectId: v.id("projects"),
    archived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);

    if (project === null) {
      throw new Error("This project no longer exists.");
    }

    const { profile } = await requireTeamMember(ctx, project.teamId);
    if (project.creatorProfileId !== profile._id) {
      throw new Error("Only the room creator can archive this project.");
    }

    if ((project.status === "archived") === args.archived) {
      return project._id;
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (indexQuery) =>
        indexQuery.eq("projectId", project._id),
      )
      .collect();
    const status = args.archived
      ? "archived" as const
      : deriveProjectStatus({ ...project, status: "planning" }, tasks);
    const now = Date.now();

    await ctx.db.patch(project._id, {
      status,
      updatedAt: now,
      completedAt: status === "completed" ? (project.completedAt ?? now) : undefined,
    });
    await ctx.db.patch(project.teamId, { updatedAt: now });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: args.archived ? "project_archived" : "project_restored",
      metadata: {
        projectId: project._id,
        projectTitle: project.title,
        previousProjectStatus: project.status,
        projectStatus: status,
      },
      createdAt: now,
    });

    return project._id;
  },
});

export const rename = mutation({
  args: { projectId: v.id("projects"), title: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("This project no longer exists.");
    const { profile } = await requireTeamMember(ctx, project.teamId);
    if (project.creatorProfileId !== profile._id) {
      throw new Error("Only the room creator can rename this project.");
    }
    const title = args.title.trim();
    if (!title || title.length > 100) throw new Error("Use a project name from 1–100 characters.");
    await ctx.db.patch(project._id, { title, updatedAt: Date.now() });
    return project._id;
  },
});

export const updateBrief = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    deadline: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("This project no longer exists.");
    const { profile } = await requireTeamMember(ctx, project.teamId);
    if (project.creatorProfileId !== profile._id) {
      throw new Error("Only the room creator can edit the project brief.");
    }
    const details = validateProjectDetails({
      title: args.title,
      description: args.description,
      startDate: project.startDate,
      deadline: args.deadline,
    });
    const now = Date.now();
    await ctx.db.patch(project._id, {
      title: details.title,
      description: details.description,
      deadline: details.deadline,
      updatedAt: now,
    });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "project_updated",
      metadata: { projectId: project._id, projectTitle: details.title },
      createdAt: now,
    });
    return project._id;
  },
});

export const deletePermanently = mutation({
  args: { projectId: v.id("projects"), confirmationName: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("This project no longer exists.");
    const { profile } = await requireTeamMember(ctx, project.teamId);
    if (project.creatorProfileId !== profile._id) {
      throw new Error("Only the room creator can permanently delete this project.");
    }
    if (args.confirmationName.trim() !== project.title) {
      throw new Error("Type the exact project name to confirm permanent deletion.");
    }
    const [tasks, milestones, phases, members, blocks, plans, votes, trades, usage, activity, combat, dailyFeed, dismissals] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("milestones").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("phases").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("projectMembers").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("availabilityBlocks").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("meetingPlans").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("meetingVotes").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("taskTrades").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("aiUsage").withIndex("by_project_and_source", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("activityLogs").withIndex("by_project_and_time", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("combatEvents").withIndex("by_project_and_time", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("dailyFeed").withIndex("by_project_and_time", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("projectDismissals").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
    ]);
    for (const task of tasks) {
      const [evidence, reviews] = await Promise.all([
        ctx.db.query("taskEvidence").withIndex("by_task", (q) => q.eq("taskId", task._id)).collect(),
        ctx.db.query("taskReviews").withIndex("by_task_and_time", (q) => q.eq("taskId", task._id)).collect(),
      ]);
      for (const item of evidence) {
        if (item.storageId) await ctx.storage.delete(item.storageId);
        await ctx.db.delete(item._id);
      }
      for (const review of reviews) await ctx.db.delete(review._id);
      await ctx.db.delete(task._id);
    }
    for (const docs of [milestones, phases, members, blocks, votes, plans, trades, usage, activity, combat, dailyFeed, dismissals]) {
      for (const doc of docs) await ctx.db.delete(doc._id);
    }
    await ctx.db.delete(project._id);
    return project._id;
  },
});

export const lockTasks = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (project === null) throw new Error("This project no longer exists.");
    const { membership, profile } = await requireTeamMember(ctx, project.teamId);

    if (membership.role !== "owner" && project.creatorProfileId !== profile._id) {
      throw new Error("Only the project leader or team owner can lock tasks.");
    }

    if (project.tasksLocked) {
      return project._id;
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    const requiredTasks = tasks.filter((task) => task.required);
    const tasksTotal = requiredTasks.length;

    if (tasksTotal === 0) {
      throw new Error("Add at least 1 required task before locking tasks to reveal Boss Health.");
    }

    const now = Date.now();
    await ctx.db.patch(project._id, {
      tasksLocked: true,
      tasksTotal,
      updatedAt: now,
    });

    return project._id;
  },
});
