import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { PENDING_PROJECT_DRAFT_KEY } from "../lib/pendingProjectDraft";
import { GuestProjectCreationPage } from "./GuestProjectCreationPage";

const signIn = vi.fn().mockResolvedValue(undefined);

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn }),
}));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
}));

describe("GuestProjectCreationPage", () => {
  afterEach(() => {
    cleanup();
    signIn.mockClear();
    window.sessionStorage.clear();
  });

  it("shows the five-step project planner with a compact guest header", () => {
    render(<MemoryRouter><GuestProjectCreationPage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: /select your project domain specialization/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByAltText("MayLamDi logo")).toHaveAttribute("width", "48");
    expect(screen.getByText("Plan first. Sign in when you create.")).toBeInTheDocument();
  });

  it("keeps the guest draft and starts Google sign-in only from Step 5", async () => {
    render(<MemoryRouter><GuestProjectCreationPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    fireEvent.change(screen.getByLabelText(/project brief/i), {
      target: { value: "Create and test a clear project prototype for university students." },
    });
    fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: "Guest project" } });
    fireEvent.click(screen.getByRole("button", { name: /continue to project plan/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue to allocation/i }));
    fireEvent.click(screen.getByRole("button", { name: /review project/i }));

    expect(signIn).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith("google", {
      redirectTo: `${window.location.origin}/projects/create?resume=1`,
    }));
    expect(window.sessionStorage.getItem(PENDING_PROJECT_DRAFT_KEY)).toContain("Guest project");
  });
});
