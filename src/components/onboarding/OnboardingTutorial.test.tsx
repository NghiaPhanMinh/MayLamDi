import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { OnboardingTutorial, type TutorialStep } from "./OnboardingTutorial";

const mockSteps: TutorialStep[] = [
  {
    target: "test-step-1",
    title: "Step 1 Title",
    description: "Step 1 Description text.",
    placement: "bottom",
  },
  {
    target: "test-step-2",
    title: "Step 2 Title",
    description: "Step 2 Description text.",
    placement: "top",
  },
  {
    target: "test-step-3",
    title: "Step 3 Title",
    description: "Step 3 Description text.",
    placement: "right",
  },
];

describe("OnboardingTutorial Component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div data-tour="test-step-1" style="width: 100px; height: 40px;">Step 1 Target</div>
      <div data-tour="test-step-2" style="width: 100px; height: 40px;">Step 2 Target</div>
      <div data-tour="test-step-3" style="width: 100px; height: 40px;">Step 3 Target</div>
    `;
  });

  it("renders step 1 when opened", () => {
    render(
      <OnboardingTutorial
        steps={mockSteps}
        isOpen={true}
        storageKey="test_tour"
      />
    );

    expect(screen.getByText("Step 1 Title")).toBeInTheDocument();
    expect(screen.getByText("Step 1 Description text.")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
  });

  it("navigates forward on Next click and backward on Previous click", () => {
    render(
      <OnboardingTutorial
        steps={mockSteps}
        isOpen={true}
        storageKey="test_tour"
      />
    );

    // Step 1 -> Click Next
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Step 2 Title")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();

    // Step 2 -> Click Previous
    fireEvent.click(screen.getByText("Previous"));
    expect(screen.getByText("Step 1 Title")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("shows Finish on the last step and triggers onComplete while saving to localStorage", () => {
    const onComplete = vi.fn();
    render(
      <OnboardingTutorial
        steps={mockSteps}
        isOpen={true}
        storageKey="test_tour"
        onComplete={onComplete}
      />
    );

    // Navigate to step 3
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));

    expect(screen.getByText("Step 3 Title")).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    const finishBtn = screen.getByText("Finish");
    expect(finishBtn).toBeInTheDocument();

    fireEvent.click(finishBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("test_tour")).toBe("true");
  });

  it("skips and triggers onSkip on Skip button click", () => {
    const onSkip = vi.fn();
    render(
      <OnboardingTutorial
        steps={mockSteps}
        isOpen={true}
        storageKey="test_tour_skip"
        onSkip={onSkip}
      />
    );

    fireEvent.click(screen.getByText("Skip"));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("test_tour_skip")).toBe("true");
  });

  it("handles keyboard navigation (ArrowRight, ArrowLeft, Escape)", () => {
    const onSkip = vi.fn();
    render(
      <OnboardingTutorial
        steps={mockSteps}
        isOpen={true}
        storageKey="test_tour_kbd"
        onSkip={onSkip}
      />
    );

    // ArrowRight -> Next
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Step 2 Title")).toBeInTheDocument();

    // ArrowLeft -> Prev
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("Step 1 Title")).toBeInTheDocument();

    // Escape -> Skip
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
