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

  it("uses the new specialization-to-create flow and retains earlier input", () => {
    render(
      <ProjectOnboarding
        mode="create"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: /project specialization/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "1Specialization",
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

  it("inserts an editable example for the selected specialization without submitting", () => {
    render(
      <ProjectOnboarding
        mode="create"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /software & web\/app engineering/i }));
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    const exampleButton = screen.getByRole("button", { name: "Try example prompt" });
    expect(exampleButton).toHaveAttribute("type", "button");
    fireEvent.click(exampleButton);

    const briefField = screen.getByLabelText(/project brief/i);
    expect(screen.getByRole("heading", { name: /tell us about your project/i })).toBeInTheDocument();
    expect((briefField as HTMLTextAreaElement).value).toContain("responsive web application");
    expect((briefField as HTMLTextAreaElement).value).toContain("DEPENDENCIES AND PLANNING:");
    expect(screen.getByText(/\/ 8,000 chars/)).toHaveTextContent("1977 / 8,000 chars");

    fireEvent.change(briefField, { target: { value: "My edited detailed project brief." } });
    expect(briefField).toHaveValue("My edited detailed project brief.");
  });

  it("protects existing brief text until replacement is confirmed", () => {
    render(
      <ProjectOnboarding
        mode="create"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    const briefField = screen.getByLabelText(/project brief/i);
    fireEvent.change(briefField, { target: { value: "Keep this original project brief." } });
    fireEvent.click(screen.getByRole("button", { name: "Try example prompt" }));

    expect(screen.getByRole("dialog", { name: /replace your current brief/i })).toBeInTheDocument();
    expect(briefField).toHaveValue("Keep this original project brief.");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(briefField).toHaveValue("Keep this original project brief.");

    fireEvent.click(screen.getByRole("button", { name: "Try example prompt" }));
    fireEvent.click(screen.getByRole("button", { name: "Use example" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((briefField as HTMLTextAreaElement).value).toContain("responsive web application");
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
      frameworkChoice: "ui-ux-product-strategy",
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

  it("keeps every specialization colourful while selection stays independently visible", () => {
    const { container } = render(
      <ProjectOnboarding
        mode="create"
        currentProfileId={"profile-1" as Id<"userProfiles">}
        onCancel={vi.fn()}
        onRoomReady={vi.fn()}
      />,
    );

    const choices = [...container.querySelectorAll<HTMLElement>(".framework-choice")];

    expect(choices).toHaveLength(10);
    expect(choices[0]).toHaveClass("is-selected");
    expect(choices[0].querySelector(".framework-selected-mark")).toHaveTextContent("✓");
  });
});
