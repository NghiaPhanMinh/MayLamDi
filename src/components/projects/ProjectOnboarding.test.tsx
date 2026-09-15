import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Id } from "../../../convex/_generated/dataModel";
import { PENDING_PROJECT_DRAFT_KEY } from "../../lib/pendingProjectDraft";
import { ProjectOnboarding } from "./ProjectOnboarding";

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
}));

describe("ProjectOnboarding", () => {
  afterEach(cleanup);

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("uses the new structure-to-create flow and retains earlier input", () => {
    render(
      <ProjectOnboarding
        mode="create"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: /choose your project structure/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "1Structure",
      "2Brief",
      "3Plan",
      "4Allocate",
      "5Create",
    ]);

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    const projectName = screen.getByLabelText(/project name/i);
    fireEvent.change(projectName, { target: { value: "Studio launch" } });
    fireEvent.change(screen.getByLabelText(/project brief/i), { target: { value: "Create and test a campaign prototype." } });
    fireEvent.click(screen.getByRole("button", { name: /continue to project plan/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue to allocation/i }));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByLabelText(/project name/i)).toHaveValue("Studio launch");
  });

  it("offers a one-person room during project setup", () => {
    render(
      <ProjectOnboarding
        mode="create"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    const teamSize = screen.getByRole("combobox", { name: /team size/i });

    expect(screen.getByRole("option", { name: "1 person" })).toHaveValue("1");
    fireEvent.change(teamSize, { target: { value: "1" } });
    expect(teamSize).toHaveValue("1");
  });

  it("keeps guest planning available and requests Google authentication only at creation", async () => {
    const onAuthenticationRequired = vi.fn().mockResolvedValue(undefined);
    render(
      <ProjectOnboarding
        mode="create"
        onAuthenticationRequired={onAuthenticationRequired}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    fireEvent.change(screen.getByLabelText(/project brief/i), {
      target: { value: "Create and test a clear project prototype for university students." },
    });
    fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: "Guest project" } });
    fireEvent.click(screen.getByRole("button", { name: /continue to project plan/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue to allocation/i }));
    fireEvent.click(screen.getByRole("button", { name: /review project/i }));

    expect(onAuthenticationRequired).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => expect(onAuthenticationRequired).toHaveBeenCalledTimes(1));
    expect(onAuthenticationRequired).toHaveBeenCalledWith(expect.objectContaining({
      version: 1,
      title: "Guest project",
      brief: "Create and test a clear project prototype for university students.",
    }));
  });

  it("resumes a saved guest draft after Google authentication", async () => {
    window.sessionStorage.setItem(PENDING_PROJECT_DRAFT_KEY, JSON.stringify({
      version: 1,
      frameworkChoice: "design-nonlinear",
      customFrameworkName: "My framework",
      customPhaseNames: "Discover, Make, Review, Deliver",
      title: "Saved guest project",
      brief: "Continue this project after authentication.",
      deadline: "2026-09-30",
      targetMemberCount: "3",
      taskCreationMode: "manual",
      allocationMode: "self_selection",
      draftTasks: [],
    }));
    const onRoomReady = vi.fn();

    render(
      <ProjectOnboarding
        mode="create"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={onRoomReady}
        resumePendingDraft
      />,
    );

    expect(screen.getByRole("heading", { name: /review your project/i })).toBeInTheDocument();
    expect(screen.getByText("Saved guest project")).toBeInTheDocument();
    await waitFor(() => expect(onRoomReady).toHaveBeenCalledTimes(1));
    expect(window.sessionStorage.getItem(PENDING_PROJECT_DRAFT_KEY)).toBeNull();
  });

  it("keeps the member flow to one code screen and reuses the saved profile", () => {
    render(
      <ProjectOnboarding
        mode="join"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: /enter the room code/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^room code$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join room/i })).toBeInTheDocument();
  });

  it("keeps every framework colourful while selection stays independently visible", () => {
    const { container } = render(
      <ProjectOnboarding
        mode="create"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={vi.fn()}
      />,
    );

    const choices = [...container.querySelectorAll<HTMLElement>(".framework-choice")];

    expect(choices).toHaveLength(9);
    expect(choices.map((choice) => choice.style.getPropertyValue("--mld-framework-color"))).toEqual([
      "#FF8AE7", "#FFF73F", "#FEAA01", "#1DD851", "#FD39E4", "#4CA0FE", "#17A738", "#FF8AE7", "#FFF73F",
    ]);
    expect(choices[0]).toHaveClass("is-selected");
    expect(choices[0].querySelector(".framework-selected-mark")).toHaveTextContent("✓");
  });
});
