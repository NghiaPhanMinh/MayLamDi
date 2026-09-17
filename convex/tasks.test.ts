/// <reference types="vite/client" />

import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
type TaskTestDatabase = TestConvex<typeof schema>;

async function addProfile(
  testDatabase: TaskTestDatabase,
  displayName: string,
  email: string,
) {
  const seeded = await testDatabase.run(async (ctx) => {
    const authUserId = await ctx.db.insert("users", { name: displayName, email });
    const now = Date.now();
    const profileId = await ctx.db.insert("userProfiles", {
      authUserId,
      displayName,
      email,
      skills: ["Communication"],
      softwareSkills: [],
      weeklyCapacity: 8,
      profileCompletedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { authUserId, profileId };
  });

  return {
    ...seeded,
    asUser: testDatabase.withIdentity({
      subject: `${seeded.authUserId}|test-session`,
      name: displayName,
      email,
    }),
  };
}

async function setupProject(testDatabase: TaskTestDatabase) {
  const owner = await addProfile(testDatabase, "Owner", "owner@example.com");
  const member = await addProfile(testDatabase, "Member", "member@example.com");
  const other = await addProfile(testDatabase, "Other Member", "other@example.com");
  const outsider = await addProfile(testDatabase, "Outsider", "outsider@example.com");
  const teamId = await owner.asUser.mutation(api.teams.create, { name: "Task Team" });
  const team = await owner.asUser.query(api.teams.getWorkspace, { teamId });
  await member.asUser.mutation(api.teams.joinByCode, { code: team.team.joinCode });
  await other.asUser.mutation(api.teams.joinByCode, { code: team.team.joinCode });
  const projectId = await owner.asUser.mutation(api.projects.create, {
    teamId,
    title: "Semester Project",
    description: "A real task planning test.",
    startDate: "2026-08-01",
    deadline: "2026-12-15",
    frameworkType: "built_in",
    builtInFrameworkId: "design-nonlinear",
    frameworkName: "Nonlinear Design Process",
    phases: [
      {
        key: "discover",
        name: "Discover",
        description: "Research the context.",
        canOverlap: true,
        dependencyKeys: [],
        reviewCheckpoint: false,
      },
      {
        key: "deliver",
        name: "Deliver",
        description: "Finish the outcome.",
        canOverlap: false,
        dependencyKeys: ["discover"],
        reviewCheckpoint: true,
      },
    ],
    members: [
      {
        profileId: owner.profileId,
        skills: ["Planning"],
        availability: "Weekdays",
        currentWorkload: "medium",
        preferences: "Coordination",
      },
      {
        profileId: member.profileId,
        skills: ["Design"],
        availability: "Weekends",
        currentWorkload: "low",
        preferences: "Production",
      },
      {
        profileId: other.profileId,
        skills: ["Writing"],
        availability: "Evenings",
        currentWorkload: "low",
        preferences: "Documentation",
      },
    ],
  });
  const workspace = await owner.asUser.query(api.tasks.getWorkspace, { projectId });

  return { owner, member, other, outsider, teamId, projectId, workspace };
}

describe("phase and task backend", () => {
  it("creates required phase tasks and completes them only after creator approval", async () => {
    const testDatabase = convexTest(schema, modules);
    const { owner, member, projectId, workspace } = await setupProject(testDatabase);
    const taskId = await owner.asUser.mutation(api.tasks.createTask, {
      projectId,
      phaseId: workspace.phases[0]._id,
      title: "Complete audience research",
      description: "Interview and synthesise the intended audience.",
      primaryOwnerProfileId: member.profileId,
      collaboratorProfileIds: [owner.profileId],
      requiredSkills: ["Interviewing", "Synthesis"],
      estimatedEffortHours: 16,
      difficulty: 3,
      weight: 4,
      required: true,
      startDate: "2026-08-05",
      dueDate: "2026-12-01",
      dependencyTaskIds: [],
      requiresReview: true,
      reviewerProfileId: owner.profileId,
    });

    const liveWorkspace = await owner.asUser.query(api.tasks.getWorkspace, { projectId });
    expect(liveWorkspace.project.status).toBe("active");
    expect(liveWorkspace.tasks[0]).toMatchObject({
      _id: taskId,
      source: "manual",
      status: "todo",
      weight: 4,
    });
    await member.asUser.mutation(api.tasks.acceptTask, { taskId });
    await member.asUser.mutation(api.evidence.add, {
      taskId,
      type: "note",
      note: "Research synthesis is attached for review.",
    });
    await member.asUser.mutation(api.evidence.submitForReview, {
      taskId,
    });
    await owner.asUser.mutation(api.evidence.submitReview, {
      taskId,
      status: "approved",
      comment: "The research evidence is ready to use.",
    });
    const completedWorkspace = await member.asUser.query(api.tasks.getWorkspace, { projectId });
    expect(completedWorkspace.project.status).toBe("completed");
    expect(completedWorkspace.tasks[0].status).toBe("completed");
    const lifecycleEvents = await testDatabase.run(async (ctx) =>
      ctx.db
        .query("activityLogs")
        .withIndex("by_project_and_time", (query) =>
          query.eq("projectId", projectId),
        )
        .collect(),
    );
    expect(
      lifecycleEvents.some(
        (event) =>
          event.action === "project_status_changed" &&
          event.metadata.projectStatus === "completed",
      ),
    ).toBe(true);
  });

  it("updates phase status and archives or restores a project safely", async () => {
    const testDatabase = convexTest(schema, modules);
    const { owner, outsider, projectId, workspace, teamId } =
      await setupProject(testDatabase);

    await owner.asUser.mutation(api.tasks.updatePhaseStatus, {
      phaseId: workspace.phases[0]._id,
      status: "active",
    });
    await expect(
      outsider.asUser.mutation(api.projects.setArchived, {
        projectId,
        archived: true,
      }),
    ).rejects.toThrow(/do not have access/i);
    await owner.asUser.mutation(api.projects.setArchived, {
      projectId,
      archived: true,
    });

    const archived = await owner.asUser.query(api.tasks.getWorkspace, {
      projectId,
    });
    expect(archived.project.status).toBe("archived");
    expect(archived.canWrite).toBe(false);
    expect(archived.canManageProject).toBe(true);
    await expect(
      owner.asUser.mutation(api.tasks.updatePhaseStatus, {
        phaseId: workspace.phases[0]._id,
        status: "completed",
      }),
    ).rejects.toThrow(/restore this archived project/i);

    await owner.asUser.mutation(api.projects.setArchived, {
      projectId,
      archived: false,
    });
    const restored = await owner.asUser.query(api.tasks.getWorkspace, {
      projectId,
    });
    const activity = await testDatabase.run(async (ctx) =>
      ctx.db
        .query("activityLogs")
        .withIndex("by_team_and_time", (query) => query.eq("teamId", teamId))
        .collect(),
    );

    expect(restored.project.status).toBe("planning");
    expect(restored.canWrite).toBe(true);
    expect(restored.phases[0].status).toBe("active");
    expect(activity.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "phase_status_changed",
        "project_archived",
        "project_restored",
      ]),
    );
  });

  it("enforces project membership, assignment, dates, and no self-review", async () => {
    const testDatabase = convexTest(schema, modules);
    const { owner, outsider, projectId, workspace } = await setupProject(testDatabase);

    await expect(
      outsider.asUser.mutation(api.tasks.createMilestone, {
        projectId,
        title: "Private milestone",
        description: "",
        dueDate: "2026-09-01",
      }),
    ).rejects.toThrow(/do not have access/i);

    await expect(
      owner.asUser.mutation(api.tasks.createTask, {
        projectId,
        phaseId: workspace.phases[0]._id,
        title: "Invalid review",
        description: "",
        primaryOwnerProfileId: owner.profileId,
        collaboratorProfileIds: [],
        requiredSkills: [],
        estimatedEffortHours: 2,
        difficulty: 2,
        weight: 1,
        required: true,
        startDate: "2026-08-05",
        dueDate: "2026-08-06",
        dependencyTaskIds: [],
        requiresReview: true,
        reviewerProfileId: owner.profileId,
      }),
    ).rejects.toThrow(/cannot review their own/i);

    await expect(
      owner.asUser.mutation(api.tasks.createTask, {
        projectId,
        phaseId: workspace.phases[0]._id,
        title: "Invalid dates",
        description: "",
        primaryOwnerProfileId: outsider.profileId,
        collaboratorProfileIds: [],
        requiredSkills: [],
        estimatedEffortHours: 2,
        difficulty: 2,
        weight: 1,
        required: true,
        startDate: "2026-07-01",
        dueDate: "2026-08-06",
        dependencyTaskIds: [],
        requiresReview: false,
      }),
    ).rejects.toThrow(/within the project dates/i);
  });

  it("edits, reassigns, protects dependency chains, and deletes safely", async () => {
    const testDatabase = convexTest(schema, modules);
    const { owner, member, projectId, workspace, teamId } =
      await setupProject(testDatabase);
    const firstTaskId = await owner.asUser.mutation(api.tasks.createTask, {
      projectId,
      phaseId: workspace.phases[0]._id,
      title: "Research draft",
      description: "Initial research.",
      primaryOwnerProfileId: owner.profileId,
      collaboratorProfileIds: [],
      requiredSkills: ["Research"],
      estimatedEffortHours: 5,
      difficulty: 2,
      weight: 2,
      required: true,
      startDate: "2026-08-03",
      dueDate: "2026-08-20",
      dependencyTaskIds: [],
      requiresReview: false,
    });
    const secondTaskId = await owner.asUser.mutation(api.tasks.createTask, {
      projectId,
      phaseId: workspace.phases[1]._id,
      title: "Build prototype",
      description: "Use the research draft.",
      primaryOwnerProfileId: member.profileId,
      collaboratorProfileIds: [],
      requiredSkills: ["Prototyping"],
      estimatedEffortHours: 10,
      difficulty: 3,
      weight: 4,
      required: true,
      startDate: "2026-08-21",
      dueDate: "2026-09-15",
      dependencyTaskIds: [firstTaskId],
      requiresReview: false,
    });

    await expect(
      owner.asUser.mutation(api.tasks.updateTask, {
        taskId: firstTaskId,
        phaseId: workspace.phases[0]._id,
        title: "Research draft updated",
        description: "Updated research.",
        primaryOwnerProfileId: member.profileId,
        collaboratorProfileIds: [],
        requiredSkills: ["Research"],
        estimatedEffortHours: 6,
        difficulty: 2,
        weight: 3,
        required: true,
        startDate: "2026-08-03",
        dueDate: "2026-08-20",
        dependencyTaskIds: [secondTaskId],
        requiresReview: true,
        reviewerProfileId: owner.profileId,
      }),
    ).rejects.toThrow(/circular chain/i);

    await owner.asUser.mutation(api.tasks.updateTask, {
      taskId: firstTaskId,
      phaseId: workspace.phases[0]._id,
      title: "Research draft updated",
      description: "Updated research.",
      primaryOwnerProfileId: member.profileId,
      collaboratorProfileIds: [],
      requiredSkills: ["Research", "Synthesis"],
      estimatedEffortHours: 6,
      difficulty: 2,
      weight: 3,
      required: true,
      startDate: "2026-08-03",
      dueDate: "2026-08-20",
      dependencyTaskIds: [],
      requiresReview: true,
      reviewerProfileId: owner.profileId,
    });
    const updated = await member.asUser.query(api.tasks.getWorkspace, {
      projectId,
    });
    expect(updated.tasks.find((task) => task._id === firstTaskId)).toMatchObject({
      title: "Research draft updated",
      primaryOwnerProfileId: member.profileId,
      reviewerProfileId: owner.profileId,
      weight: 3,
    });

    await expect(
      owner.asUser.mutation(api.tasks.deleteTask, { taskId: firstTaskId }),
    ).rejects.toThrow(/remove this task/i);

    const secondTask = updated.tasks.find((task) => task._id === secondTaskId)!;
    await owner.asUser.mutation(api.tasks.updateTask, {
      taskId: secondTask._id,
      phaseId: secondTask.phaseId,
      title: secondTask.title,
      description: secondTask.description,
      primaryOwnerProfileId: secondTask.primaryOwnerProfileId,
      collaboratorProfileIds: secondTask.collaboratorProfileIds,
      requiredSkills: secondTask.requiredSkills,
      estimatedEffortHours: secondTask.estimatedEffortHours,
      difficulty: secondTask.difficulty,
      weight: secondTask.weight,
      required: secondTask.required,
      startDate: secondTask.startDate,
      dueDate: secondTask.dueDate,
      dependencyTaskIds: [],
      requiresReview: false,
    });
    await owner.asUser.mutation(api.tasks.deleteTask, { taskId: firstTaskId });

    const afterDelete = await owner.asUser.query(api.tasks.getWorkspace, {
      projectId,
    });
    const activity = await testDatabase.run(async (ctx) =>
      ctx.db
        .query("activityLogs")
        .withIndex("by_team_and_time", (query) => query.eq("teamId", teamId))
        .collect(),
    );
    expect(afterDelete.tasks.map((task) => task._id)).toEqual([secondTaskId]);
    expect(afterDelete.milestones).toEqual([]);
    expect(activity.map((event) => event.action)).toContain("task_reassigned");
    expect(activity.map((event) => event.action)).toContain("task_deleted");
  });

  it("enforces creator, owner, and admin task permissions before and after launch", async () => {
    const testDatabase = convexTest(schema, modules);
    const { owner, member, other, projectId, workspace } = await setupProject(testDatabase);
    const taskInput = {
      projectId,
      phaseId: workspace.phases[0]._id,
      title: "Member-owned draft",
      description: "Created by Member.",
      primaryOwnerProfileId: member.profileId,
      collaboratorProfileIds: [],
      requiredSkills: [],
      estimatedEffortHours: 3,
      difficulty: 1,
      damage: 10,
      weight: 1,
      required: false,
      startDate: "2026-08-03",
      dueDate: "2026-08-20",
      dependencyTaskIds: [],
      requiresReview: false,
    };

    await expect(member.asUser.mutation(api.tasks.createTask, taskInput)).rejects.toThrow(/room creator/i);
    const taskId = await owner.asUser.mutation(api.tasks.createTask, taskInput);

    await expect(other.asUser.mutation(api.tasks.deleteTask, { taskId })).rejects.toThrow(/room creator/i);
    await expect(other.asUser.mutation(api.tasks.updateTaskStatus, { taskId, status: "in_progress" })).rejects.toThrow(/assigned owner/i);
    await expect(member.asUser.mutation(api.tasks.deleteTask, { taskId })).rejects.toThrow(/room creator/i);
    await owner.asUser.mutation(api.tasks.deleteTask, { taskId });
  });

  it("allows an open task to be claimed once and then restricts progress to its owner", async () => {
    const testDatabase = convexTest(schema, modules);
    const { owner, member, other, projectId, workspace } = await setupProject(testDatabase);
    const taskId = await owner.asUser.mutation(api.tasks.createTask, {
      projectId,
      phaseId: workspace.phases[0]._id,
      title: "Open production task",
      description: "Anyone on the project may claim it.",
      primaryOwnerProfileId: owner.profileId,
      isOpenForClaiming: true,
      collaboratorProfileIds: [],
      requiredSkills: [],
      estimatedEffortHours: 3,
      difficulty: 2,
      damage: 20,
      weight: 2,
      required: true,
      startDate: "2026-08-03",
      dueDate: "2026-08-20",
      dependencyTaskIds: [],
      requiresReview: false,
    });

    await other.asUser.mutation(api.tasks.claimTask, { taskId });
    await expect(member.asUser.mutation(api.tasks.claimTask, { taskId })).rejects.toThrow(/not open/i);
    await expect(member.asUser.mutation(api.tasks.updateTaskStatus, { taskId, status: "in_progress" })).rejects.toThrow(/assigned owner/i);
    await other.asUser.mutation(api.tasks.updateTaskStatus, { taskId, status: "in_progress" });
    const live = await other.asUser.query(api.tasks.getWorkspace, { projectId });
    expect(live.tasks[0]).toMatchObject({ primaryOwnerProfileId: other.profileId, isOpenForClaiming: false, status: "in_progress" });
  });

  it("requires proposed owners to accept or decline an assignment", async () => {
    const testDatabase = convexTest(schema, modules);
    const { owner, member, other, projectId, workspace } = await setupProject(testDatabase);
    const acceptedTaskId = await owner.asUser.mutation(api.tasks.createTask, {
      projectId,
      phaseId: workspace.phases[0]._id,
      title: "Proposed research task",
      description: "Member decides whether to own it.",
      primaryOwnerProfileId: member.profileId,
      collaboratorProfileIds: [],
      requiredSkills: ["Research"],
      estimatedEffortHours: 4,
      difficulty: 2,
      damage: 20,
      weight: 2,
      required: true,
      startDate: "2026-08-03",
      dueDate: "2026-08-20",
      dependencyTaskIds: [],
      requiresReview: true,
      reviewerProfileId: owner.profileId,
    });

    await expect(member.asUser.mutation(api.tasks.updateTaskStatus, { taskId: acceptedTaskId, status: "in_progress" })).rejects.toThrow(/accept this task/i);
    await expect(other.asUser.mutation(api.tasks.acceptTask, { taskId: acceptedTaskId })).rejects.toThrow(/proposed task owner/i);
    await member.asUser.mutation(api.tasks.acceptTask, { taskId: acceptedTaskId });
    await member.asUser.mutation(api.tasks.updateTaskStatus, { taskId: acceptedTaskId, status: "in_progress" });

    const declinedTaskId = await owner.asUser.mutation(api.tasks.createTask, {
      projectId,
      phaseId: workspace.phases[0]._id,
      title: "Proposed writing task",
      description: "Declining returns it to the open pool.",
      primaryOwnerProfileId: member.profileId,
      collaboratorProfileIds: [],
      requiredSkills: ["Writing"],
      estimatedEffortHours: 3,
      difficulty: 1,
      damage: 10,
      weight: 1,
      required: false,
      startDate: "2026-08-03",
      dueDate: "2026-08-21",
      dependencyTaskIds: [],
      requiresReview: false,
    });
    await member.asUser.mutation(api.tasks.declineTask, { taskId: declinedTaskId });
    await other.asUser.mutation(api.tasks.claimTask, { taskId: declinedTaskId });

    const live = await owner.asUser.query(api.tasks.getWorkspace, { projectId });
    expect(live.tasks.find((task) => task._id === acceptedTaskId)).toMatchObject({ acceptanceStatus: "accepted", status: "in_progress" });
    expect(live.tasks.find((task) => task._id === declinedTaskId)).toMatchObject({ acceptanceStatus: "accepted", isOpenForClaiming: false, primaryOwnerProfileId: other.profileId });
  });
});
