import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Id } from "../../../convex/_generated/dataModel";
import { ProjectWorkspace } from "./ProjectWorkspace";

const workspace = {
  project: {
    _id: "project-1" as Id<"projects">,
    teamId: "team-1" as Id<"teams">,
    creatorProfileId: "profile-1" as Id<"userProfiles">,
    title: "Campaign",
    description: "Launch the campaign.",
    frameworkName: "Nonlinear Design Process",
    setupMode: "manual" as const,
    startDate: "2026-08-10",
    deadline: "2026-08-20",
    status: "active" as const,
    tasksLocked: false,
  },
  currentProfileId: "profile-1" as Id<"userProfiles">,
  canManageProject: true,
  canWrite: true,
  isTeamOwner: true,
  isLaunched: true,
  fairReviewCapacity: 1,
  reviewerLoads: [{ profileId: "profile-2" as Id<"userProfiles">, reviewCount: 1 }],
  phases: [{
    _id: "phase-1" as Id<"phases">,
    frameworkPhaseKey: "production",
    title: "Production",
    description: "Make the work.",
    order: 1,
    status: "active" as const,
  }],
  milestones: [],
  members: [
    { profileId: "profile-1" as Id<"userProfiles">, displayName: "Anh" },
    { profileId: "profile-2" as Id<"userProfiles">, displayName: "Quinn" },
  ],
  tasks: [{
    _id: "task-1" as Id<"tasks">,
    projectId: "project-1" as Id<"projects">,
    phaseId: "phase-1" as Id<"phases">,
    title: "Final illustration",
    description: "Finish and export the artwork.",
    primaryOwnerProfileId: "profile-1" as Id<"userProfiles">,
    collaboratorProfileIds: [],
    requiredSkills: ["Illustration"],
    estimatedEffortHours: 4,
    difficulty: 2,
    weight: 2,
    damage: 20,
    required: true,
    startDate: "2026-08-10",
    dueDate: "2026-08-16",
    dependencyTaskIds: [],
    requiresReview: true,
    reviewerProfileId: "profile-2" as Id<"userProfiles">,
    isOpenForClaiming: false,
    acceptanceStatus: "accepted" as const,
    assignmentState: "assigned" as const,
    collaboratorCanSubmit: false,
    status: "in_progress" as const,
    createdAt: 1,
    updatedAt: 1,
  }],
};

vi.mock("convex/react", () => ({
  useQuery: () => workspace,
  useMutation: () => vi.fn(),
}));

vi.mock("../game/BattleScene", () => ({
  BattleScene: () => <div aria-label="Shared Battle Scene">Realtime Battle</div>,
}));
vi.mock("./TaskEvidencePanel", () => ({
  TaskEvidencePanel: () => <div>Existing evidence workflow</div>,
}));
vi.mock("./TaskTradePanel", () => ({
  TaskTradePanel: () => <details><summary>Task trades</summary></details>,
}));
vi.mock("./AllocationWorkbench", () => ({
  AllocationWorkbench: () => <div>Workload snapshot</div>,
}));
vi.mock("./ProjectTeamMembers", () => ({ ProjectTeamMembers: () => <div>Members</div> }));
vi.mock("./DailyEvidenceFeed", () => ({ DailyEvidenceFeed: () => <div>Daily feed</div> }));
vi.mock("./AIPlanningAssistant", () => ({ AIPlanningAssistant: () => null }));

describe("ProjectWorkspace information hierarchy", () => {
  afterEach(cleanup);

  it("renders Progress as default tab with Brief Summary, BattleScene, and Action Deck (My Tasks and Peer Review)", () => {
    render(<ProjectWorkspace projectId={"project-1" as Id<"projects">} onClose={vi.fn()} initialTab="progress" />);

    expect(screen.getByRole("button", { name: "Progress" })).toHaveClass("is-active");
    expect(screen.getByRole("heading", { name: "Campaign" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Project Brief" })).toBeInTheDocument();
    expect(screen.getByText("Realtime Battle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My Tasks/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Peer Review/i })).toBeInTheDocument();
  });

  it("switches smoothly between tabs", () => {
    render(<ProjectWorkspace projectId={"project-1" as Id<"projects">} onClose={vi.fn()} initialTab="progress" />);

    fireEvent.click(screen.getByRole("button", { name: "Project Plan" }));
    expect(screen.getByRole("button", { name: "Project Plan" })).toHaveClass("is-active");
    expect(screen.getByRole("heading", { name: "Allocated Tasks" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Team" }));
    expect(screen.getByRole("button", { name: "Team" })).toHaveClass("is-active");
    expect(screen.getByText("Members")).toBeInTheDocument();
  });
});
