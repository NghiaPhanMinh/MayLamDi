/// <reference types="vite/client" />

import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import { validateEvidenceMetadata } from "./lib/evidenceValidation";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
type EvidenceTestDatabase = TestConvex<typeof schema>;

async function addProfile(
  testDatabase: EvidenceTestDatabase,
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

async function setupReviewTask(testDatabase: EvidenceTestDatabase) {
  const reviewer = await addProfile(testDatabase, "Reviewer", "reviewer@example.com");
  const owner = await addProfile(testDatabase, "Task Owner", "owner@example.com");
  const collaborator = await addProfile(testDatabase, "Collaborator", "collaborator@example.com");
  const outsider = await addProfile(testDatabase, "Outsider", "outsider@example.com");
  const teamId = await reviewer.asUser.mutation(api.teams.create, { name: "Evidence Team" });
  const team = await reviewer.asUser.query(api.teams.getWorkspace, { teamId });
  await owner.asUser.mutation(api.teams.joinByCode, { code: team.team.joinCode });
  await collaborator.asUser.mutation(api.teams.joinByCode, { code: team.team.joinCode });
  const projectId = await reviewer.asUser.mutation(api.projects.create, {
    teamId,
    title: "Evidence Project",
    description: "Test flexible contribution evidence.",
    startDate: "2026-08-01",
    deadline: "2026-12-01",
    frameworkType: "built_in",
    builtInFrameworkId: "design-nonlinear",
    frameworkName: "Nonlinear Design Process",
    phases: [{
      key: "make",
      name: "Make",
      description: "Create and review the work.",
      canOverlap: false,
      dependencyKeys: [],
      reviewCheckpoint: true,
    }],
    members: [
      { profileId: reviewer.profileId, skills: ["Review"], availability: "", currentWorkload: "low", preferences: "" },
      { profileId: owner.profileId, skills: ["Design"], availability: "", currentWorkload: "medium", preferences: "" },
      { profileId: collaborator.profileId, skills: ["Writing"], availability: "", currentWorkload: "low", preferences: "" },
    ],
  });
  const workspace = await reviewer.asUser.query(api.tasks.getWorkspace, { projectId });
  const taskId = await reviewer.asUser.mutation(api.tasks.createTask, {
    projectId,
    phaseId: workspace.phases[0]._id,
    title: "Prepare design evidence",
    description: "Attach the design work for review.",
    primaryOwnerProfileId: owner.profileId,
    collaboratorProfileIds: [],
    requiredSkills: ["Design"],
    estimatedEffortHours: 8,
    difficulty: 3,
    weight: 3,
    required: true,
    startDate: "2026-08-05",
    dueDate: "2026-09-01",
    dependencyTaskIds: [],
    requiresReview: true,
    reviewerProfileId: reviewer.profileId,
  });
  await owner.asUser.mutation(api.tasks.acceptTask, { taskId });

  return { reviewer, owner, collaborator, outsider, projectId, taskId };
}

describe("task evidence and review", () => {
  it("stores notes and links for authorised members only", async () => {
    const testDatabase = convexTest(schema, modules);
    const { owner, outsider, taskId } = await setupReviewTask(testDatabase);
    await owner.asUser.mutation(api.evidence.add, {
      taskId,
      type: "note",
      note: "Completed the first design iteration and documented decisions.",
    });
    await owner.asUser.mutation(api.evidence.add, {
      taskId,
      type: "link",
      url: "https://www.figma.com/file/example",
      note: "Figma working file",
    });

    const details = await owner.asUser.query(api.evidence.listForTask, { taskId });
    expect(details.evidence).toHaveLength(2);
    expect(details.evidence.map((item) => item.type)).toEqual(["link", "note"]);
    await expect(
      outsider.asUser.query(api.evidence.listForTask, { taskId }),
    ).rejects.toThrow(/do not have access/i);
    await expect(
      owner.asUser.mutation(api.evidence.add, {
        taskId,
        type: "link",
        url: "javascript:alert(1)",
      }),
    ).rejects.toThrow(/http or https/i);
  });

  it("enforces assigned review, changes requested, and approval completion", async () => {
    const testDatabase = convexTest(schema, modules);
    const { reviewer, owner, taskId, projectId } = await setupReviewTask(testDatabase);
    await expect(
      owner.asUser.mutation(api.tasks.updateTaskStatus, {
        taskId,
        status: "completed",
      }),
    ).rejects.toThrow(/review and creator approval/i);

    await owner.asUser.mutation(api.evidence.add, {
      taskId,
      type: "note",
      note: "Ready for the assigned reviewer.",
    });
    await owner.asUser.mutation(api.evidence.submitForReview, {
      taskId,
    });
    await expect(
      owner.asUser.mutation(api.evidence.submitReview, {
        taskId,
        status: "approved",
        comment: "Looks good.",
      }),
    ).rejects.toThrow(/cannot review their own/i);
    await reviewer.asUser.mutation(api.evidence.submitReview, {
      taskId,
      status: "changes_requested",
      comment: "Please label the final interaction state.",
    });
    let workspace = await owner.asUser.query(api.tasks.getWorkspace, { projectId });
    expect(workspace.tasks[0].status).toBe("in_progress");

    await owner.asUser.mutation(api.evidence.submitForReview, {
      taskId,
    });
    await reviewer.asUser.mutation(api.evidence.submitReview, {
      taskId,
      status: "approved",
      comment: "The requested label is now clear.",
    });
    workspace = await owner.asUser.query(api.tasks.getWorkspace, { projectId });
    const details = await reviewer.asUser.query(api.evidence.listForTask, { taskId });
    expect(workspace.tasks[0].status).toBe("completed");
    expect(workspace.project.status).toBe("completed");
    expect(details.reviews.map((review) => review.status)).toEqual([
      "approved",
      "changes_requested",
    ]);
    const battle = await reviewer.asUser.query(api.battle.getState, { projectId });
    expect(battle.events).toHaveLength(1);
    expect(battle).toMatchObject({ maximumHp: 50, damageDealt: 30, remainingHp: 20 });
    await expect(reviewer.asUser.mutation(api.evidence.submitReview, { taskId, status: "approved", comment: "Duplicate" })).rejects.toThrow(/not currently waiting/i);
  });

  it("allows only the assigned reviewer to make the atomic review decision", async () => {
    const testDatabase = convexTest(schema, modules);
    const { reviewer, owner, collaborator, taskId } = await setupReviewTask(testDatabase);
    await owner.asUser.mutation(api.evidence.add, { taskId, type: "note", note: "Ready for any teammate to verify." });
    await owner.asUser.mutation(api.evidence.submitForReview, { taskId });
    await expect(collaborator.asUser.mutation(api.evidence.submitReview, { taskId, status: "approved", comment: "Evidence is complete." })).rejects.toThrow(/assigned reviewer/i);
    await reviewer.asUser.mutation(api.evidence.submitReview, { taskId, status: "approved", comment: "Assigned decision" });
    const details = await collaborator.asUser.query(api.evidence.listForTask, { taskId });
    expect(details.latestReview).toMatchObject({ reviewerProfileId: reviewer.profileId, status: "approved" });
  });

  it("prevents other members and unpermitted collaborators from submitting owner evidence", async () => {
    const testDatabase = convexTest(schema, modules);
    const { reviewer, owner, collaborator, taskId, projectId } = await setupReviewTask(testDatabase);
    await expect(reviewer.asUser.mutation(api.evidence.add, { taskId, type: "note", note: "Admin cannot submit for the owner." })).rejects.toThrow(/assigned task owner/i);
    await expect(collaborator.asUser.mutation(api.evidence.add, { taskId, type: "note", note: "Not explicitly permitted." })).rejects.toThrow(/assigned task owner/i);

    const workspace = await reviewer.asUser.query(api.tasks.getWorkspace, { projectId });
    const task = workspace.tasks[0];
    await reviewer.asUser.mutation(api.tasks.updateTask, {
      taskId,
      phaseId: task.phaseId,
      title: task.title,
      description: task.description,
      primaryOwnerProfileId: owner.profileId,
      collaboratorProfileIds: [collaborator.profileId],
      collaboratorCanSubmit: true,
      requiredSkills: task.requiredSkills,
      estimatedEffortHours: task.estimatedEffortHours,
      difficulty: task.difficulty,
      damage: 30,
      weight: task.weight,
      required: task.required,
      startDate: task.startDate,
      dueDate: task.dueDate,
      dependencyTaskIds: [],
      requiresReview: true,
      reviewerProfileId: reviewer.profileId,
    });
    await expect(collaborator.asUser.mutation(api.evidence.add, { taskId, type: "note", note: "Explicit collaborator contribution." })).rejects.toThrow(/assigned task owner/i);
    await expect(collaborator.asUser.mutation(api.evidence.submitForReview, { taskId })).rejects.toThrow(/assigned task owner/i);
  });

  it("validates image and PDF metadata without accepting oversized files", () => {
    expect(() =>
      validateEvidenceMetadata({
        type: "image",
        hasStorageId: true,
        fileName: "evidence.png",
        contentType: "image/png",
        fileSize: 5 * 1024 * 1024 + 1,
      }),
    ).toThrow(/5 MB or smaller/i);
    expect(() =>
      validateEvidenceMetadata({
        type: "pdf",
        hasStorageId: true,
        fileName: "evidence.pdf",
        contentType: "application/pdf",
        fileSize: 10 * 1024 * 1024 + 1,
      }),
    ).toThrow(/10 MB or smaller/i);
    expect(
      validateEvidenceMetadata({
        type: "pdf",
        hasStorageId: true,
        fileName: "evidence.pdf",
        contentType: "application/pdf",
        fileSize: 1024,
      }),
    ).toMatchObject({ fileName: "evidence.pdf", fileSize: 1024 });
  });
});
