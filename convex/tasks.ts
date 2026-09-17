import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireTeamMember, requireUserProfile } from "./lib/auth";
import { validateTaskInput } from "./lib/taskValidation";
import { refreshProjectProgress } from "./lib/projectProgress";

const taskStatusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("blocked"),
  v.literal("review"),
  v.literal("completed"),
  v.literal("submitted"),
  v.literal("changes_requested"),
  v.literal("verified"),
  v.literal("awaiting_creator"),
);
const phaseStatusValidator = v.union(
  v.literal("not_started"),
  v.literal("active"),
  v.literal("completed"),
);

async function ensureProjectMember(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  profileId: Id<"userProfiles">,
) {
  const existing = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_and_user", (indexQuery) =>
      indexQuery.eq("projectId", projectId).eq("profileId", profileId),
    )
    .unique();

  if (existing !== null) {
    return existing;
  }

  const profile = await ctx.db.get(profileId);
  const now = Date.now();
  const id = await ctx.db.insert("projectMembers", {
    projectId,
    profileId,
    skills: [...(profile?.skills ?? []), ...(profile?.softwareSkills ?? [])],
    availability: "",
    currentWorkload: "medium",
    preferences: "",
    weeklyCapacity: profile?.weeklyCapacity,
    availabilityMode: "busy",
    joinedAt: now,
  });

  return (await ctx.db.get(id))!;
}

const DEFAULT_CHARACTER_FILL = "#FFD54F";
const DEFAULT_CHARACTER_OUTLINE = "#1A1A1A";

async function ensureTeamMember(
  ctx: MutationCtx,
  teamId: Id<"teams">,
  profileId: Id<"userProfiles">,
) {
  const existing = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (query) =>
      query.eq("teamId", teamId).eq("profileId", profileId),
    )
    .unique();

  if (existing !== null) {
    return existing;
  }

  const now = Date.now();
  const id = await ctx.db.insert("teamMembers", {
    teamId,
    profileId,
    role: "member",
    joinedAt: now,
    characterFill: DEFAULT_CHARACTER_FILL,
    characterOutline: DEFAULT_CHARACTER_OUTLINE,
  });

  return (await ctx.db.get(id))!;
}

async function requireProjectWriteAccess(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  const project = await ctx.db.get(projectId);

  if (project === null) {
    throw new Error("This project no longer exists.");
  }

  if (project.status === "archived") {
    throw new Error("Restore this archived project before changing its plan.");
  }

  const { membership, profile } = await requireTeamMember(ctx, project.teamId);
  const projectMembership = await ensureProjectMember(ctx, projectId, profile._id);

  return { project, profile, membership, projectMembership };
}

async function requireProjectCreatorAccess(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  const access = await requireProjectWriteAccess(ctx, projectId);
  if (access.project.creatorProfileId !== access.profile._id) {
    throw new Error("Only the room creator can change phases or task definitions.");
  }
  return access;
}

async function assertBalancedReviewer(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  ownerProfileId: Id<"userProfiles">,
  reviewerProfileId: Id<"userProfiles">,
  editedTaskId?: Id<"tasks">,
) {
  const [members, tasks] = await Promise.all([
    ctx.db.query("projectMembers").withIndex("by_project", (query) =>
      query.eq("projectId", projectId),
    ).collect(),
    ctx.db.query("tasks").withIndex("by_project", (query) =>
      query.eq("projectId", projectId),
    ).collect(),
  ]);
  if (members.length <= 1) return;
  if (ownerProfileId === reviewerProfileId) {
    throw new Error("A task owner cannot review their own task.");
  }
  const eligible = members.filter((member) => member.profileId !== ownerProfileId);
  if (!eligible.some((member) => member.profileId === reviewerProfileId)) {
    throw new Error("Choose a current project member who is not the task owner.");
  }

  const otherTasks = tasks.filter((task) => task._id !== editedTaskId);
  const reviewCounts = new Map<Id<"userProfiles">, number>();
  for (const task of otherTasks) {
    if (task.reviewerProfileId) {
      reviewCounts.set(
        task.reviewerProfileId,
        (reviewCounts.get(task.reviewerProfileId) ?? 0) + 1,
      );
    }
  }
  const totalReviewTasks = otherTasks.filter((task) => task.requiresReview).length + 1;
  let capacity = Math.max(1, Math.ceil(totalReviewTasks / Math.max(1, members.length)));
  const eligibleCounts = eligible.map((member) => reviewCounts.get(member.profileId) ?? 0);
  if (eligibleCounts.every((count) => count >= capacity)) {
    capacity = Math.min(...eligibleCounts) + 1;
  }
  const selectedCount = reviewCounts.get(reviewerProfileId) ?? 0;
  const someoneHasRoom = eligible.some(
    (member) => (reviewCounts.get(member.profileId) ?? 0) < capacity,
  );
  if (selectedCount >= capacity && someoneHasRoom) {
    throw new Error("Reviewer capacity reached. Choose a teammate with fewer reviews.");
  }
}

function isProjectLaunched(project: Doc<"projects">) {
  return project.launchedAt !== undefined || project.status !== "planning";
}

function defaultDamage(difficulty: number) {
  if (difficulty <= 1) return 10;
  if (difficulty === 2) return 20;
  return 30;
}

function validateDamage(value: number | undefined, difficulty: number) {
  const damage = value ?? defaultDamage(difficulty);
  if (!Number.isInteger(damage) || damage < 1 || damage > 999) {
    throw new Error("Task damage must be a whole number from 1 to 999.");
  }
  return damage;
}

async function getProjectMemberIds(ctx: MutationCtx, projectId: Id<"projects">) {
  const projectMembers = await ctx.db
    .query("projectMembers")
    .withIndex("by_project", (indexQuery) =>
      indexQuery.eq("projectId", projectId),
    )
    .collect();

  return new Set(projectMembers.map((member) => member.profileId));
}

function assertDateWithinProject(
  date: string,
  project: Doc<"projects">,
  label: string,
) {
  if (date < project.startDate || date > project.deadline) {
    throw new Error(`${label} must fall within the project dates.`);
  }
}

function assertNoDependencyCycle(
  tasks: Doc<"tasks">[],
  editedTaskId: Id<"tasks">,
  proposedDependencyIds: Id<"tasks">[],
) {
  const graph = new Map(
    tasks.map((task) => [
      task._id as string,
      (task._id === editedTaskId
        ? proposedDependencyIds
        : task.dependencyTaskIds ?? []
      ).map((taskId) => taskId as string),
    ]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(taskId: string): boolean {
    if (visiting.has(taskId)) {
      return true;
    }

    if (visited.has(taskId)) {
      return false;
    }

    visiting.add(taskId);

    for (const dependencyId of graph.get(taskId) ?? []) {
      if (visit(dependencyId)) {
        return true;
      }
    }

    visiting.delete(taskId);
    visited.add(taskId);
    return false;
  }

  if ([...graph.keys()].some((taskId) => visit(taskId))) {
    throw new Error("Task dependencies cannot contain a circular chain.");
  }
}

async function syncTaskMilestone(
  ctx: MutationCtx,
  task: Doc<"tasks">,
  nextMilestone: Doc<"milestones"> | null,
) {
  if (task.milestoneId === nextMilestone?._id) {
    return;
  }

  const now = Date.now();

  if (task.milestoneId) {
    const previousMilestone = await ctx.db.get(task.milestoneId);

    if (previousMilestone) {
      await ctx.db.patch(previousMilestone._id, {
        requiredTaskIds: previousMilestone.requiredTaskIds.filter(
          (taskId) => taskId !== task._id,
        ),
        updatedAt: now,
      });
    }
  }

  if (nextMilestone) {
    await ctx.db.patch(nextMilestone._id, {
      requiredTaskIds: [
        ...new Set([...nextMilestone.requiredTaskIds, task._id]),
      ],
      updatedAt: now,
    });
  }
}

export const getWorkspace = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);

    if (project === null) {
      throw new Error("This project no longer exists.");
    }

    const { membership, profile } = await requireTeamMember(ctx, project.teamId);
    const [phases, milestones, tasks, projectMembers] = await Promise.all([
      ctx.db
        .query("phases")
        .withIndex("by_project_and_order", (indexQuery) =>
          indexQuery.eq("projectId", project._id),
        )
        .collect(),
      ctx.db
        .query("milestones")
        .withIndex("by_project_and_due_date", (indexQuery) =>
          indexQuery.eq("projectId", project._id),
        )
        .collect(),
      ctx.db
        .query("tasks")
        .withIndex("by_project", (indexQuery) =>
          indexQuery.eq("projectId", project._id),
        )
        .collect(),
      ctx.db
        .query("projectMembers")
        .withIndex("by_project", (indexQuery) =>
          indexQuery.eq("projectId", project._id),
        )
        .collect(),
    ]);
    const members = await Promise.all(
      projectMembers.map(async (member) => {
        const profile = await ctx.db.get(member.profileId);
        const teamMember = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (query) =>
            query.eq("teamId", project.teamId).eq("profileId", member.profileId),
          )
          .unique();

        return profile === null
          ? null
          : {
              ...member,
              displayName: profile.displayName,
              imageUrl: profile.imageUrl,
              characterFill: teamMember?.characterFill ?? profile.characterFill ?? "#FFF73F",
              characterOutline: teamMember?.characterOutline ?? profile.characterOutline ?? "#4CA0FE",
              spellType: teamMember?.spellType ?? profile.spellType,
              profileSkills: profile.skills ?? [],
              softwareSkills: profile.softwareSkills ?? [],
              profileWeeklyCapacity: profile.weeklyCapacity,
            };
      }),
    );

    const isProjectMember = projectMembers.some((member) => member.profileId === profile._id);
    const canManageProject = project.creatorProfileId === profile._id;
    const launched = isProjectLaunched(project);
    const reviewCounts = new Map<Id<"userProfiles">, number>();
    for (const task of tasks) {
      if (task.reviewerProfileId) {
        reviewCounts.set(task.reviewerProfileId, (reviewCounts.get(task.reviewerProfileId) ?? 0) + 1);
      }
    }
    const reviewTaskCount = tasks.filter((task) => task.requiresReview).length;
    const fairReviewCapacity = Math.max(1, Math.ceil(reviewTaskCount / Math.max(1, projectMembers.length)));

    return {
      project,
      currentProfileId: profile._id,
      canManageProject,
      canWrite: project.status !== "archived" && isProjectMember,
      isTeamOwner: membership.role === "owner",
      isLaunched: launched,
      fairReviewCapacity,
      reviewerLoads: projectMembers.map((member) => ({
        profileId: member.profileId,
        reviewCount: reviewCounts.get(member.profileId) ?? 0,
      })),
      phases,
      milestones,
      tasks: tasks.sort((first, second) => first.createdAt - second.createdAt),
      members: members.filter((member) => member !== null),
    };
  },
});

export const listMineAcrossRooms = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUserProfile(ctx);
    const [roomMemberships, dismissals] = await Promise.all([
      ctx.db
        .query("teamMembers")
        .withIndex("by_user", (query) => query.eq("profileId", profile._id))
        .collect(),
      ctx.db
        .query("projectDismissals")
        .withIndex("by_user", (query) => query.eq("profileId", profile._id))
        .collect(),
    ]);
    const dismissedProjectIds = new Set(dismissals.map((dismissal) => dismissal.projectId));
    const groups = [];

    for (const membership of roomMemberships) {
      const room = await ctx.db.get(membership.teamId);
      if (!room) continue;
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_team_and_updated", (query) => query.eq("teamId", room._id))
        .order("desc")
        .take(50);

      for (const project of projects) {
        if (dismissedProjectIds.has(project._id)) continue;
        if (project.status === "archived") continue;
        const projectMembership = await ctx.db
          .query("projectMembers")
          .withIndex("by_project_and_user", (query) =>
            query.eq("projectId", project._id).eq("profileId", profile._id),
          )
          .unique();
        if (!projectMembership && membership.role !== "owner") continue;
        const [ownedTasks, phases] = await Promise.all([
          ctx.db
            .query("tasks")
            .withIndex("by_project_and_owner", (query) =>
              query.eq("projectId", project._id).eq("primaryOwnerProfileId", profile._id),
            )
            .collect(),
          ctx.db
            .query("phases")
            .withIndex("by_project_and_order", (query) => query.eq("projectId", project._id))
            .collect(),
        ]);
        const allTasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (query) => query.eq("projectId", project._id))
          .collect();
        const tasks = [
          ...ownedTasks.filter((task) => task.assignmentState !== "unassigned"),
          ...allTasks.filter((task) => task.isOpenForClaiming),
          ...allTasks.filter((task) => task.reviewerProfileId === profile._id),
        ].filter((task, index, collection) =>
          collection.findIndex((candidate) => candidate._id === task._id) === index,
        );
        if (tasks.length === 0) continue;
        const phaseNames = new Map(phases.map((phase) => [phase._id, phase.title]));
        const projectMembers = await ctx.db
          .query("projectMembers")
          .withIndex("by_project", (query) => query.eq("projectId", project._id))
          .collect();
        const memberProfiles = await Promise.all(
          projectMembers.map((member) => ctx.db.get(member.profileId)),
        );
        const memberNames = new Map(
          memberProfiles.filter((item) => item !== null).map((item) => [item._id, item.displayName]),
        );
        groups.push({
          roomId: room._id,
          roomName: room.name,
          projectId: project._id,
          projectTitle: project.title,
          tasks: tasks
            .sort((first, second) => first.dueDate.localeCompare(second.dueDate))
            .map((task) => ({
              ...task,
              phaseName: phaseNames.get(task.phaseId) ?? "Project work",
              isMine: task.primaryOwnerProfileId === profile._id,
              isReviewer: task.reviewerProfileId === profile._id,
              reviewerName: task.reviewerProfileId
                ? (memberNames.get(task.reviewerProfileId) ?? "Reviewer")
                : "Owner chooses later",
            })),
        });
      }
    }

    return groups;
  },
});

export const updatePhaseStatus = mutation({
  args: {
    phaseId: v.id("phases"),
    status: phaseStatusValidator,
  },
  handler: async (ctx, args) => {
    const phase = await ctx.db.get(args.phaseId);

    if (phase === null) {
      throw new Error("This phase no longer exists.");
    }

    const { project, profile } = await requireProjectCreatorAccess(
      ctx,
      phase.projectId,
    );

    if (phase.status === args.status) return phase._id;

    const now = Date.now();
    await ctx.db.patch(phase._id, { status: args.status });
    await ctx.db.patch(project._id, { updatedAt: now });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "phase_status_changed",
      metadata: {
        projectId: project._id,
        projectTitle: project.title,
        phaseId: phase._id,
        phaseTitle: phase.title,
        previousPhaseStatus: phase.status,
        phaseStatus: args.status,
      },
      createdAt: now,
    });

    return phase._id;
  },
});

export const createPhase = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { project, profile } = await requireProjectCreatorAccess(ctx, args.projectId);
    const title = args.title.trim().replace(/\s+/g, " ");
    const description = args.description?.trim().replace(/\s+/g, " ") ?? "";
    if (title.length < 2 || title.length > 100) {
      throw new Error("Phase name must contain 2–100 characters.");
    }
    if (description.length > 800) {
      throw new Error("Phase description must be 800 characters or fewer.");
    }
    const phases = await ctx.db
      .query("phases")
      .withIndex("by_project_and_order", (query) => query.eq("projectId", project._id))
      .collect();
    if (phases.length >= 20) throw new Error("A project can contain at most 20 phases.");
    if (phases.some((phase) => phase.title.toLowerCase() === title.toLowerCase())) {
      throw new Error("Use a unique phase name.");
    }
    const now = Date.now();
    const phaseId = await ctx.db.insert("phases", {
      projectId: project._id,
      frameworkPhaseKey: `custom-${now}`,
      title,
      description,
      order: phases.length,
      status: "not_started",
      canOverlap: true,
      reviewCheckpoint: true,
      dependencyKeys: [],
    });
    await ctx.db.patch(project._id, { updatedAt: now });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "phase_status_changed",
      metadata: { projectId: project._id, phaseId, phaseTitle: title, phaseStatus: "not_started" },
      createdAt: now,
    });
    return phaseId;
  },
});

export const renamePhase = mutation({
  args: { phaseId: v.id("phases"), title: v.string() },
  handler: async (ctx, args) => {
    const phase = await ctx.db.get(args.phaseId);
    if (!phase) throw new Error("This phase no longer exists.");
    const { project } = await requireProjectCreatorAccess(ctx, phase.projectId);
    const title = args.title.trim().replace(/\s+/g, " ");
    if (title.length < 2 || title.length > 100) {
      throw new Error("Phase name must contain 2–100 characters.");
    }
    await ctx.db.patch(phase._id, { title });
    await ctx.db.patch(project._id, { updatedAt: Date.now() });
    return phase._id;
  },
});

export const createMilestone = mutation({
  args: {
    projectId: v.id("projects"),
    phaseId: v.optional(v.id("phases")),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireProjectCreatorAccess(ctx, args.projectId);
    throw new Error("Milestones are read-only legacy data. Add a phase checkpoint instead.");
  },
});

export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    phaseId: v.id("phases"),
    milestoneId: v.optional(v.id("milestones")),
    title: v.string(),
    description: v.string(),
    primaryOwnerProfileId: v.id("userProfiles"),
    collaboratorProfileIds: v.array(v.id("userProfiles")),
    requiredSkills: v.optional(v.array(v.string())),
    estimatedEffortHours: v.optional(v.number()),
    difficulty: v.optional(v.number()),
    weight: v.number(),
    required: v.boolean(),
    startDate: v.string(),
    dueDate: v.string(),
    dependencyTaskIds: v.optional(v.array(v.id("tasks"))),
    requiresReview: v.boolean(),
    reviewerProfileId: v.optional(v.id("userProfiles")),
    damage: v.optional(v.number()),
    isOpenForClaiming: v.optional(v.boolean()),
    collaboratorCanSubmit: v.optional(v.boolean()),
    assignmentState: v.optional(v.union(
      v.literal("assigned"),
      v.literal("proposed"),
      v.literal("open"),
      v.literal("unassigned"),
    )),
  },
  handler: async (ctx, args) => {
    const { project, profile } = await requireProjectCreatorAccess(
      ctx,
      args.projectId,
    );
    const task = validateTaskInput(args);
    const damage = validateDamage(args.damage, task.difficulty);
    assertDateWithinProject(task.startDate, project, "Task start date");
    assertDateWithinProject(task.dueDate, project, "Task due date");
    const phase = await ctx.db.get(args.phaseId);

    if (phase === null || phase.projectId !== project._id) {
      throw new Error("Choose a phase from this project.");
    }

    if (args.milestoneId) {
      throw new Error("New tasks belong directly to phases, not milestones.");
    }

    const projectMemberIds = await getProjectMemberIds(ctx, project._id);
    const collaboratorProfileIds = [...new Set(args.collaboratorProfileIds)].filter(
      (profileId) => profileId !== args.primaryOwnerProfileId,
    );
    const assignedProfileIds = [
      args.primaryOwnerProfileId,
      ...collaboratorProfileIds,
      ...(args.reviewerProfileId ? [args.reviewerProfileId] : []),
    ];

    if (assignedProfileIds.some((profileId) => !projectMemberIds.has(profileId))) {
      throw new Error("Every task owner, collaborator, and reviewer must be a project member.");
    }

    if (args.reviewerProfileId) {
      await assertBalancedReviewer(
        ctx,
        project._id,
        args.primaryOwnerProfileId,
        args.reviewerProfileId,
      );
    }

    const dependencyTaskIds = [...new Set(args.dependencyTaskIds ?? [])];
    const dependencies = await Promise.all(
      dependencyTaskIds.map((taskId) => ctx.db.get(taskId)),
    );

    if (
      dependencies.some(
        (dependency) =>
          dependency === null || dependency.projectId !== project._id,
      )
    ) {
      throw new Error("Every dependency must be another task in this project.");
    }

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      projectId: project._id,
      phaseId: phase._id,
      milestoneId: undefined,
      ...task,
      damage,
      primaryOwnerProfileId: args.primaryOwnerProfileId,
      collaboratorProfileIds,
      required: true,
      status: "todo",
      acceptanceStatus:
        args.assignmentState === "unassigned" || args.isOpenForClaiming || args.primaryOwnerProfileId === profile._id
          ? "accepted"
          : "pending",
      assignmentState:
        args.assignmentState === "unassigned"
          ? "unassigned"
          : args.isOpenForClaiming
            ? "open"
            : args.primaryOwnerProfileId === profile._id
              ? "assigned"
              : "proposed",
      dependencyTaskIds,
      source: "manual",
      requiresReview: true,
      reviewerProfileId: args.reviewerProfileId,
      isOpenForClaiming: args.isOpenForClaiming ?? false,
      collaboratorCanSubmit: false,
      createdByProfileId: profile._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "task_created",
      metadata: {
        projectId: project._id,
        taskId,
        taskTitle: task.title,
        taskStatus: "todo",
      },
      createdAt: now,
    });
    await refreshProjectProgress(ctx, project, profile._id);

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    phaseId: v.id("phases"),
    milestoneId: v.optional(v.id("milestones")),
    title: v.string(),
    description: v.string(),
    primaryOwnerProfileId: v.id("userProfiles"),
    collaboratorProfileIds: v.array(v.id("userProfiles")),
    requiredSkills: v.optional(v.array(v.string())),
    estimatedEffortHours: v.optional(v.number()),
    difficulty: v.optional(v.number()),
    weight: v.number(),
    required: v.boolean(),
    startDate: v.string(),
    dueDate: v.string(),
    dependencyTaskIds: v.optional(v.array(v.id("tasks"))),
    requiresReview: v.boolean(),
    reviewerProfileId: v.optional(v.id("userProfiles")),
    damage: v.optional(v.number()),
    isOpenForClaiming: v.optional(v.boolean()),
    collaboratorCanSubmit: v.optional(v.boolean()),
    assignmentState: v.optional(v.union(
      v.literal("assigned"),
      v.literal("proposed"),
      v.literal("open"),
      v.literal("unassigned"),
    )),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.taskId);

    if (existing === null) {
      throw new Error("This task no longer exists.");
    }

    const { project, profile } = await requireProjectCreatorAccess(
      ctx,
      existing.projectId,
    );
    const task = validateTaskInput(args);
    const damage = validateDamage(args.damage, task.difficulty);
    assertDateWithinProject(task.startDate, project, "Task start date");
    assertDateWithinProject(task.dueDate, project, "Task due date");
    const phase = await ctx.db.get(args.phaseId);

    if (phase === null || phase.projectId !== project._id) {
      throw new Error("Choose a phase from this project.");
    }

    if (args.milestoneId) {
      throw new Error("New task edits use phases instead of milestones.");
    }

    const projectMemberIds = await getProjectMemberIds(ctx, project._id);
    const collaboratorProfileIds = [...new Set(args.collaboratorProfileIds)].filter(
      (profileId) => profileId !== args.primaryOwnerProfileId,
    );
    const assignedProfileIds = [
      args.primaryOwnerProfileId,
      ...collaboratorProfileIds,
      ...(args.reviewerProfileId ? [args.reviewerProfileId] : []),
    ];

    if (assignedProfileIds.some((profileId) => !projectMemberIds.has(profileId))) {
      throw new Error("Every task owner, collaborator, and reviewer must be a project member.");
    }

    if (args.reviewerProfileId) {
      await assertBalancedReviewer(
        ctx,
        project._id,
        args.primaryOwnerProfileId,
        args.reviewerProfileId,
        existing._id,
      );
    }

    const dependencyTaskIds = [...new Set(args.dependencyTaskIds ?? [])];

    if (dependencyTaskIds.includes(existing._id)) {
      throw new Error("A task cannot depend on itself.");
    }

    const projectTasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (indexQuery) =>
        indexQuery.eq("projectId", project._id),
      )
      .collect();
    const projectTaskIds = new Set(projectTasks.map((projectTask) => projectTask._id));

    if (dependencyTaskIds.some((taskId) => !projectTaskIds.has(taskId))) {
      throw new Error("Every dependency must be another task in this project.");
    }

    assertNoDependencyCycle(projectTasks, existing._id, dependencyTaskIds);
    await syncTaskMilestone(ctx, existing, null);
    const now = Date.now();
    await ctx.db.patch(existing._id, {
      phaseId: phase._id,
      milestoneId: undefined,
      ...task,
      damage,
      primaryOwnerProfileId: args.primaryOwnerProfileId,
      collaboratorProfileIds,
      required: true,
      dependencyTaskIds,
      requiresReview: true,
      reviewerProfileId: args.reviewerProfileId,
      isOpenForClaiming: args.isOpenForClaiming ?? false,
      collaboratorCanSubmit: false,
      acceptanceStatus:
        args.assignmentState === "unassigned" || args.isOpenForClaiming || args.primaryOwnerProfileId === profile._id
          ? "accepted"
          : existing.primaryOwnerProfileId !== args.primaryOwnerProfileId
            ? "pending"
            : (existing.acceptanceStatus ?? "accepted"),
      assignmentState:
        args.assignmentState === "unassigned"
          ? "unassigned"
          : args.isOpenForClaiming
            ? "open"
            : existing.primaryOwnerProfileId !== args.primaryOwnerProfileId
              ? "proposed"
              : "assigned",
      status: existing.status,
      updatedAt: now,
    });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action:
        (existing.damage ?? defaultDamage(existing.difficulty ?? 1)) !== damage
          ? "task_damage_changed"
          : "task_updated",
      metadata: {
        projectId: project._id,
        taskId: existing._id,
        taskTitle: task.title,
        taskStatus: existing.status,
        previousDamage: existing.damage ?? defaultDamage(existing.difficulty ?? 1),
        damage,
      },
      createdAt: now,
    });

    if (existing.primaryOwnerProfileId !== args.primaryOwnerProfileId) {
      await ctx.db.insert("activityLogs", {
        teamId: project.teamId,
        projectId: project._id,
        actorProfileId: profile._id,
        action: "task_reassigned",
        metadata: {
          projectId: project._id,
          taskId: existing._id,
          taskTitle: task.title,
          previousOwnerProfileId: existing.primaryOwnerProfileId,
          ownerProfileId: args.primaryOwnerProfileId,
        },
        createdAt: now,
      });
    }

    await refreshProjectProgress(ctx, project, profile._id);
    return existing._id;
  },
});

export const editQuestTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    description: v.string(),
    dueDate: v.optional(v.string()),
    primaryOwnerProfileId: v.optional(v.id("userProfiles")),
    damage: v.optional(v.number()),
    isOpenForClaiming: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found.");
    const { project, profile } = await requireProjectCreatorAccess(ctx, task.projectId);

    const title = args.title.trim().replace(/\s+/g, " ");
    if (title.length < 2 || title.length > 140) {
      throw new Error("Task title must be between 2 and 140 characters.");
    }
    const description = args.description.trim();
    if (description.length > 2000) {
      throw new Error("Task description must be 2000 characters or fewer.");
    }

    const now = Date.now();
    const patch: any = {
      title,
      description,
      updatedAt: now,
    };

    if (args.dueDate) {
      assertDateWithinProject(args.dueDate, project, "Task due date");
      patch.dueDate = args.dueDate;
    }
    if (args.damage !== undefined) {
      patch.damage = Math.max(10, Math.min(500, Math.round(args.damage)));
    }
    if (args.isOpenForClaiming !== undefined) {
      patch.isOpenForClaiming = args.isOpenForClaiming;
      if (args.isOpenForClaiming) {
        patch.assignmentState = "open";
      }
    }
    if (args.primaryOwnerProfileId) {
      patch.primaryOwnerProfileId = args.primaryOwnerProfileId;
      patch.assignmentState = "assigned";
      patch.isOpenForClaiming = false;
    }

    await ctx.db.patch(task._id, patch);
    await ctx.db.patch(project._id, { updatedAt: now });

    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "task_updated",
      metadata: {
        projectId: project._id,
        taskId: task._id,
        taskTitle: title,
        taskStatus: task.status,
      },
      createdAt: now,
    });

    await refreshProjectProgress(ctx, project, profile._id);
    return task._id;
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);

    if (task === null) {
      throw new Error("This task no longer exists.");
    }

    const { project, profile } = await requireProjectCreatorAccess(
      ctx,
      task.projectId,
    );
    const projectTasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (indexQuery) =>
        indexQuery.eq("projectId", project._id),
      )
      .collect();
    const dependentTask = projectTasks.find((candidate) =>
      (candidate.dependencyTaskIds ?? []).includes(task._id),
    );

    if (dependentTask) {
      throw new Error(
        `Remove this task from “${dependentTask.title}” dependencies before deleting it.`,
      );
    }

    if (task.milestoneId) {
      const milestone = await ctx.db.get(task.milestoneId);

      if (milestone) {
        await ctx.db.patch(milestone._id, {
          requiredTaskIds: milestone.requiredTaskIds.filter(
            (taskId) => taskId !== task._id,
          ),
          updatedAt: Date.now(),
        });
      }
    }

    const now = Date.now();
    await ctx.db.delete(task._id);
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "task_deleted",
      metadata: {
        projectId: project._id,
        taskId: task._id,
        taskTitle: task.title,
      },
      createdAt: now,
    });
    await refreshProjectProgress(ctx, project, profile._id);

    return task._id;
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: taskStatusValidator,
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);

    if (task === null) {
      throw new Error("This task no longer exists.");
    }

    const { project, profile } = await requireProjectWriteAccess(
      ctx,
      task.projectId,
    );

    if (task.primaryOwnerProfileId !== profile._id) {
      throw new Error("Only the assigned owner can update this task's progress.");
    }
    if (task.isOpenForClaiming) {
      throw new Error("Claim this task before updating its progress.");
    }
    if (task.acceptanceStatus === "pending") {
      throw new Error("Accept this task before updating its progress.");
    }

    if (task.status === args.status) {
      return task._id;
    }

    if (args.status === "review" || args.status === "submitted") {
      throw new Error("Use Submit for Review after adding evidence.");
    }
    if (["changes_requested", "verified", "awaiting_creator", "completed"].includes(args.status)) {
      throw new Error("Review and creator approval controls manage this task status.");
    }

    const now = Date.now();
    await ctx.db.patch(task._id, {
      status: args.status,
      updatedAt: now,
      completedAt: undefined,
    });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "task_status_changed",
      metadata: {
        projectId: project._id,
        taskId: task._id,
        taskTitle: task.title,
        previousTaskStatus: task.status,
        taskStatus: args.status,
      },
      createdAt: now,
    });
    await refreshProjectProgress(ctx, project, profile._id);

    return task._id;
  },
});

export const acceptTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("This task no longer exists.");
    const { project, profile } = await requireProjectWriteAccess(ctx, task.projectId);
    if (task.primaryOwnerProfileId !== profile._id) {
      throw new Error("Only the proposed task owner can accept this task.");
    }
    if (task.isOpenForClaiming) throw new Error("Claim this open task instead.");
    if (task.acceptanceStatus !== "pending") return task._id;
    const now = Date.now();
    await ctx.db.patch(task._id, {
      acceptanceStatus: "accepted",
      assignmentState: "assigned",
      updatedAt: now,
    });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "task_accepted",
      metadata: { projectId: project._id, taskId: task._id, taskTitle: task.title },
      createdAt: now,
    });
    return task._id;
  },
});

export const declineTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("This task no longer exists.");
    const { project, profile } = await requireProjectWriteAccess(ctx, task.projectId);
    if (task.primaryOwnerProfileId !== profile._id) {
      throw new Error("Only the proposed task owner can decline this task.");
    }
    if (task.acceptanceStatus !== "pending") {
      throw new Error("Only a pending assignment can be declined.");
    }
    const now = Date.now();
    await ctx.db.patch(task._id, {
      isOpenForClaiming: true,
      acceptanceStatus: "declined",
      assignmentState: "open",
      updatedAt: now,
    });
    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "task_declined",
      metadata: { projectId: project._id, taskId: task._id, taskTitle: task.title, taskStatus: task.status },
      createdAt: now,
    });
    return task._id;
  },
});

export const claimTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (task === null) throw new Error("This task no longer exists.");
    const { project, profile } = await requireProjectWriteAccess(ctx, task.projectId);

    // If current user is already the assigned owner and not open for claiming, return idempotently
    if (task.primaryOwnerProfileId === profile._id && !task.isOpenForClaiming && task.assignmentState === "assigned") {
      return task._id;
    }

    // If task is not open for claiming and already assigned to another member, throw clean error
    if (!task.isOpenForClaiming && task.assignmentState === "assigned" && task.primaryOwnerProfileId !== profile._id) {
      throw new Error("This task is not open for claiming or has already been claimed by another team member.");
    }

    const now = Date.now();
    let reviewerId = task.reviewerProfileId === profile._id ? undefined : task.reviewerProfileId;

    // If reviewer is unassigned or invalid (owner == reviewer), pick a balanced reviewer if team members > 1
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    const eligibleReviewers = projectMembers.filter((m) => m.profileId !== profile._id);
    if (!reviewerId && eligibleReviewers.length > 0) {
      reviewerId = eligibleReviewers[0].profileId;
    }

    await ctx.db.patch(task._id, {
      primaryOwnerProfileId: profile._id,
      isOpenForClaiming: false,
      acceptanceStatus: "accepted",
      assignmentState: "assigned",
      reviewerProfileId: reviewerId,
      status: task.status === "todo" ? "in_progress" : task.status,
      updatedAt: now,
    });

    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "task_claimed",
      metadata: {
        projectId: project._id,
        taskId: task._id,
        taskTitle: task.title,
        previousOwnerProfileId: task.primaryOwnerProfileId,
        ownerProfileId: profile._id,
      },
      createdAt: now,
    });
    return task._id;
  },
});

export const chooseReviewer = mutation({
  args: {
    taskId: v.id("tasks"),
    reviewerProfileId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("This task no longer exists.");
    const { project, profile } = await requireProjectWriteAccess(ctx, task.projectId);
    if (task.primaryOwnerProfileId !== profile._id) {
      throw new Error("Only the task owner can choose a reviewer later.");
    }
    if (["submitted", "review", "awaiting_creator", "completed", "verified"].includes(task.status)) {
      throw new Error("Choose the reviewer before submitting evidence for review.");
    }
    await assertBalancedReviewer(
      ctx,
      project._id,
      task.primaryOwnerProfileId,
      args.reviewerProfileId,
      task._id,
    );
    await ctx.db.patch(task._id, {
      reviewerProfileId: args.reviewerProfileId,
      requiresReview: true,
      updatedAt: Date.now(),
    });
    return task._id;
  },
});

export const releaseOverdueTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("This task no longer exists.");
    const { project, profile } = await requireProjectWriteAccess(ctx, task.projectId);

    if (project.creatorProfileId !== profile._id) {
      throw new Error("Only the room creator can release an overdue task back to the team.");
    }

    if (task.status === "completed" || task.status === "verified") {
      throw new Error("Completed tasks cannot be released.");
    }

    const now = Date.now();
    await ctx.db.patch(task._id, {
      isOpenForClaiming: true,
      assignmentState: "open",
      acceptanceStatus: "accepted",
      reviewerProfileId: undefined,
      updatedAt: now,
    });

    await ctx.db.insert("activityLogs", {
      teamId: project.teamId,
      projectId: project._id,
      actorProfileId: profile._id,
      action: "task_reassigned",
      metadata: {
        projectId: project._id,
        taskId: task._id,
        taskTitle: task.title,
        previousOwnerProfileId: task.primaryOwnerProfileId,
      },
      createdAt: now,
    });

    return task._id;
  },
});
