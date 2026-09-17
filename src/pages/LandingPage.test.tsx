import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { LandingPage } from "./LandingPage";
import * as featurePhysics from "../lib/featureTagPhysics";

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn() }),
}));

describe("MayLamDi landing page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps authentication actions out of the hero and introduces a quiet scroll cue", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);

    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/create or join a project room/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /go to projects/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see what maylamdi does/i })).toHaveAttribute(
      "href",
      "#why-maylamdi",
    );
  });

  it("keeps the hero free of authentication CTAs for authenticated visitors too", () => {
    const { container } = render(<MemoryRouter><LandingPage isAuthenticated /></MemoryRouter>);
    const hero = container.querySelector(".marketing-hero");

    expect(hero?.querySelector("a[href=\"/projects\"]")).not.toBeInTheDocument();
    expect(hero).not.toHaveTextContent("Continue with Google");
  });

  it("adds the scoped product-purpose section before the new Features section", () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);

    const purpose = container.querySelector<HTMLElement>("#why-maylamdi");
    const transition = container.querySelector<HTMLElement>(".marketing-features-transition");
    const features = container.querySelector<HTMLElement>("#features");

    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /share the work on group projects.*give each task an owner/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /simplified maylamdi project workspace/i })).toBeInTheDocument();
    expect(purpose?.parentElement?.nextElementSibling).toBe(transition);
    expect(transition?.nextElementSibling).toBe(features);
    expect(purpose?.querySelectorAll("[data-purpose-phrase]")).toHaveLength(7);
  });

  it("reveals About lines from scroll progress and never hides a revealed line", () => {
    let purposeTop = 900;
    let queuedFrame: FrameRequestCallback | undefined;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      queuedFrame = callback;
      return 1;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function getRect(this: HTMLElement) {
      if (this.classList.contains("marketing-purpose")) {
        return { top: purposeTop, bottom: purposeTop + 2100, left: 0, right: 1200, width: 1200, height: 2100, x: 0, y: purposeTop, toJSON: vi.fn() };
      }
      if (this.classList.contains("marketing-pixel-transition")) {
        return { top: 760, bottom: 960, left: 0, right: 1200, width: 1200, height: 200, x: 0, y: 760, toJSON: vi.fn() };
      }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: vi.fn() };
    });

    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const purpose = container.querySelector<HTMLElement>(".marketing-purpose");
    const phrases = Array.from(container.querySelectorAll<HTMLElement>("[data-purpose-phrase]"));

    expect(phrases.every((phrase) => !phrase.classList.contains("is-revealed"))).toBe(true);
    purposeTop = -2100;
    act(() => {
      fireEvent.scroll(window);
      queuedFrame?.(0);
    });
    expect(phrases.every((phrase) => phrase.classList.contains("is-revealed"))).toBe(true);
    expect(purpose).toHaveClass("is-visual-revealed");

    purposeTop = 900;
    act(() => {
      fireEvent.scroll(window);
      queuedFrame?.(0);
    });
    expect(phrases.every((phrase) => phrase.classList.contains("is-revealed"))).toBe(true);
  });

  it("shows a static completed scene when reduced motion is preferred", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);

    expect(container.querySelector(".marketing-purpose")).toHaveClass("is-visual-revealed");
    expect(container.querySelectorAll("[data-purpose-phrase].is-revealed")).toHaveLength(7);
    expect(container.querySelector(".marketing-pixel-transition")).toHaveAttribute("data-progress", "1.00");
  });

  it("renders the interactive feature composition and replays the branded title burst", () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);

    expect(screen.getAllByAltText("MayLamDi logo")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "OUR FEATURES" })).toBeInTheDocument();
    expect(container.querySelectorAll(".marketing-feature-tag")).toHaveLength(10);
    expect(screen.getByRole("button", { name: "AI ASSISTANT" })).toBeInTheDocument();
    expect(screen.queryByText("Selected feature")).not.toBeInTheDocument();
    expect(screen.queryByText("Start with the brief.")).not.toBeInTheDocument();
    expect(container.querySelector(".marketing-marquee")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /make teamwork.*feel shared/i }));
    expect(container.querySelectorAll(".maylamdi-burst-word")).toHaveLength(42);
  });

  it("shows the hovered feature description beside the current tag", () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const aiTag = screen.getByRole("button", { name: "AI ASSISTANT" });

    expect(container.querySelector(".marketing-features-description")).not.toBeInTheDocument();
    fireEvent.mouseEnter(aiTag);

    const description = container.querySelector<HTMLElement>(".marketing-features-description");
    expect(description).toHaveClass("is-visible");
    expect(screen.getByText("Feature info")).toBeInTheDocument();
    expect(screen.getByText("Draft tasks and owner suggestions from your assignment brief, then review and edit them.")).toBeInTheDocument();

    fireEvent.mouseLeave(aiTag);
    expect(description).toHaveClass("is-visible");
  });

  it("stops desktop physics at rest, leaves hover and offscreen return still, and sleeps again after dragging", () => {
    let frameId = 0;
    let time = performance.now();
    let canvasTop = 0;
    const frames = new Map<number, FrameRequestCallback>();
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
    vi.stubGlobal("PointerEvent", MouseEvent);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function getRect(this: HTMLElement) {
      const canvas = this.classList.contains("marketing-features-tag-canvas");
      const title = this.id === "features-title";
      const section = this.id === "features";
      const tag = this.classList.contains("marketing-feature-tag");
      const top = canvas || section ? canvasTop : title ? canvasTop + 522 : tag ? 100 : 10000;
      const height = canvas || section ? 680 : 44;
      return { top, bottom: top + height, left: 0, right: 1000, width: 1000, height, x: 0, y: top, toJSON: vi.fn() };
    });
    const step = vi.spyOn(featurePhysics, "stepFeatureBodies");
    const consoleError = vi.spyOn(console, "error");
    const advance = (count: number) => {
      for (let i = 0; i < count; i += 1) {
        time += 1000 / 60;
        act(() => {
          const current = Array.from(frames.values());
          frames.clear();
          current.forEach((callback) => callback(time));
        });
      }
    };
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const tags = Array.from(container.querySelectorAll<HTMLElement>(".marketing-feature-tag"));
    const transforms = () => tags.map((tag) => ["--tag-x", "--tag-y", "--tag-rotation"].map((key) => tag.style.getPropertyValue(key)));
    advance(600);
    expect(tags.every((tag) => tag.dataset.physicsState === "sleeping")).toBe(true);
    const resting = transforms();
    const callsAtRest = step.mock.calls.length;
    advance(600);
    expect(transforms()).toEqual(resting);
    expect(step).toHaveBeenCalledTimes(callsAtRest);

    for (const tag of tags.slice(0, 3)) {
      fireEvent.mouseEnter(tag);
      advance(2);
      expect(container.querySelector(".marketing-features-description strong")).toHaveTextContent(tag.textContent!);
      expect(transforms()).toEqual(resting);
      fireEvent.mouseLeave(tag);
    }
    expect(step).toHaveBeenCalledTimes(callsAtRest);
    canvasTop = -9000;
    fireEvent.scroll(window);
    advance(2);
    canvasTop = 0;
    fireEvent.scroll(window);
    advance(2);
    expect(transforms()).toEqual(resting);
    expect(step).toHaveBeenCalledTimes(callsAtRest);

    fireEvent.pointerDown(tags[0], { clientX: 100, clientY: 110 });
    expect(tags[0]).toHaveAttribute("data-physics-state", "awake");
    fireEvent.pointerMove(tags[0], { clientX: 600, clientY: 210 });
    fireEvent.pointerUp(tags[0], { clientX: 600, clientY: 210 });
    advance(600);
    expect(step.mock.calls.length).toBeGreaterThan(callsAtRest);
    expect(tags.every((tag) => tag.dataset.physicsState === "sleeping")).toBe(true);
    const afterDrop = transforms();
    const callsAfterDrop = step.mock.calls.length;
    advance(600);
    expect(transforms()).toEqual(afterDrop);
    expect(step).toHaveBeenCalledTimes(callsAfterDrop);
    expect(consoleError).not.toHaveBeenCalled();
    step.mockRestore();
  }, 30000);

  it.each(["mobile", "reduced-motion"])("preserves the %s fallback without starting physics", (mode) => {
    vi.stubGlobal("innerWidth", mode === "mobile" ? 375 : 1200);
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: mode === "reduced-motion", addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
    const frames = new Map<number, FrameRequestCallback>();
    let id = 0;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frames.set(++id, callback);
      return id;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((frame: number) => frames.delete(frame)));
    const step = vi.spyOn(featurePhysics, "stepFeatureBodies");
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);
    for (let i = 0; i < 4; i += 1) {
      act(() => {
        const current = Array.from(frames.values());
        frames.clear();
        current.forEach((callback) => callback(performance.now() + i * 16));
      });
    }
    const tags = container.querySelectorAll<HTMLElement>(".marketing-feature-tag");
    expect(tags).toHaveLength(mode === "mobile" ? 7 : 10);
    expect(Array.from(tags).every((tag) => tag.dataset.physicsState === "sleeping")).toBe(true);
    expect(step).not.toHaveBeenCalled();
  });

  it("marks feel shared with a responsive hand-drawn annotation", () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);

    expect(screen.getByText("feel shared.").parentElement).toHaveClass("marketing-title-hook");
    expect(container.querySelectorAll(".marketing-title-sketch path")).toHaveLength(2);
  });

  it("removes the Project at a Glance preview without replacing it", () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);

    expect(screen.queryByText(/project at a glance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/live workspace/i)).not.toBeInTheDocument();
    expect(container.querySelector(".marketing-preview")).not.toBeInTheDocument();
    expect(container.querySelector(".marketing-hero-visual")).toBeInTheDocument();
  });

  it("renders the full pixel field, aligned overlap layer, wave hooks, and two-row About marquee", () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);

    expect(container.querySelectorAll(".marketing-pixel-transition-cell").length).toBeGreaterThanOrEqual(144);
    expect(container.querySelectorAll(".marketing-pixel-transition-cell[data-threshold][data-variant]").length).toBeGreaterThanOrEqual(144);
    expect(container.querySelectorAll(".marketing-purpose-character").length).toBeGreaterThan(100);
    expect(container.querySelector(".marketing-purpose-workspace-overlap")).not.toBeInTheDocument();
    expect(container.querySelector("[data-purpose-blend]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".marketing-purpose-marquee-row")).toHaveLength(2);
    expect(container.querySelectorAll(".marketing-purpose-marquee-group")).toHaveLength(4);
    expect(container.querySelector(".marketing-features-transition")).toBeInTheDocument();
    expect(container.querySelectorAll(".marketing-feature-tag")).toHaveLength(10);
    expect(container.querySelector(".marketing-purpose-scroll-stage")?.nextElementSibling).toBe(
      container.querySelector(".marketing-purpose-marquee"),
    );
  });

  it("places the subscription section after How It Works and reflects the current plan", () => {
    const { container } = render(<MemoryRouter><LandingPage isAuthenticated currentPlan="plus" /></MemoryRouter>);

    const howItWorks = container.querySelector("#how-it-works");
    const subscription = container.querySelector("#subscription");

    expect(howItWorks?.nextElementSibling).toBe(subscription);
    expect(screen.getByRole("heading", { name: "Compare Free and MayLamDi+." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "FREE PLAN" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "CURRENT PLAN" })).toBeDisabled();
    const dotTransition = container.querySelector(".marketing-how-it-works-dot-transition");
    expect(dotTransition?.querySelectorAll(".marketing-how-it-works-dot")).toHaveLength(240);
    expect(howItWorks?.previousElementSibling).toBe(dotTransition);
    expect(subscription?.querySelector(".marketing-subscription-comparison")).toBeInTheDocument();
    expect(subscription?.querySelectorAll(".marketing-subscription-comparison-symbol--included")).toHaveLength(3);
    expect(subscription?.querySelectorAll(".marketing-subscription-comparison-symbol--not-included")).toHaveLength(1);
  });

  it("offers the existing visitor sign-in action from the Free plan", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);

    expect(screen.getByRole("button", { name: "START FREE" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "UPGRADE TO PLUS" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "MayLamDi subscription plan comparison" })).toBeInTheDocument();
  });

  it("adds the final green CTA and radial handoff after Subscription", () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);

    const subscription = container.querySelector("#subscription");
    const transitionStage = container.querySelector(".marketing-final-reveal-stage");
    const finalCta = container.querySelector("#final-cta");
    const finalLockup = finalCta?.querySelector(".marketing-final-cta-lockup");

    expect(subscription?.nextElementSibling).toBe(transitionStage);
    expect(transitionStage?.nextElementSibling).toBe(finalCta);
    expect(transitionStage?.querySelector(".marketing-final-reveal-circle")).toBeInTheDocument();
    expect(container.querySelector(".marketing-final-word-transition-word")).not.toBeInTheDocument();
    expect(finalLockup?.querySelector(".marketing-final-cta-action-row")).toBeInTheDocument();
    expect(finalLockup?.querySelector(".marketing-final-cta-title-frame > #marketing-final-title")).toHaveTextContent("MayLamDi");
    expect(finalCta).toHaveTextContent("Sign up");
    expect(finalCta).toHaveTextContent("Log in");
    expect(finalCta).toHaveTextContent("Explore");
    expect(finalCta).toHaveTextContent("MayLamDi");
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute("href", "/projects/create");
  });

  it("keeps the mobile final CTA entered when iOS reports a reverse scroll delta", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("max-width: 760px"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    let scrollY = 100;
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function getRect(this: HTMLElement) {
      if (this.id === "final-cta") {
        return { top: 0, bottom: 800, left: 0, right: 390, width: 390, height: 800, x: 0, y: 0, toJSON: vi.fn() };
      }
      if (this.classList.contains("marketing-final-reveal-stage")) {
        return { top: -800, bottom: 0, left: 0, right: 390, width: 390, height: 800, x: 0, y: -800, toJSON: vi.fn() };
      }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: vi.fn() };
    });

    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const finalCta = container.querySelector("#final-cta");
    expect(finalCta).toHaveClass("is-entered");

    scrollY = 96;
    fireEvent.scroll(window);

    expect(finalCta).toHaveClass("is-entered");
    expect(finalCta).not.toHaveClass("is-reversing");
  });

  it("preserves the final CTA reverse animation on desktop", () => {
    let scrollY = 100;
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function getRect(this: HTMLElement) {
      if (this.id === "final-cta") {
        return { top: 0, bottom: 900, left: 0, right: 1440, width: 1440, height: 900, x: 0, y: 0, toJSON: vi.fn() };
      }
      if (this.classList.contains("marketing-final-reveal-stage")) {
        return { top: -900, bottom: 0, left: 0, right: 1440, width: 1440, height: 900, x: 0, y: -900, toJSON: vi.fn() };
      }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: vi.fn() };
    });

    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const finalCta = container.querySelector("#final-cta");
    expect(finalCta).toHaveClass("is-entered");

    scrollY = 96;
    fireEvent.scroll(window);

    expect(finalCta).toHaveClass("is-reversing");
  });

  it("uses the existing authenticated actions in the final CTA", () => {
    const { container } = render(<MemoryRouter><LandingPage isAuthenticated /></MemoryRouter>);
    const finalCta = container.querySelector("#final-cta");

    expect(finalCta).toHaveTextContent("Switch account");
    expect(finalCta).toHaveTextContent("Sign out");
    expect(screen.getByRole("link", { name: "Go to Projects" })).toHaveAttribute("href", "/home");
    expect(finalCta).not.toHaveTextContent("Sign up");
  });

  it("raises the hovered letter highest and tapers adjacent letters into a smooth wave", () => {
    const { container } = render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const firstPhrase = container.querySelector<HTMLElement>("[data-purpose-phrase]:first-child");
    const firstPhraseCharacters = Array.from(
      firstPhrase?.querySelectorAll<HTMLElement>(".marketing-purpose-character") ?? [],
    );
    const hoveredIndex = Math.floor(firstPhraseCharacters.length / 2);

    fireEvent.mouseEnter(firstPhraseCharacters[hoveredIndex]);

    const updatedCharacters = Array.from(
      firstPhrase?.querySelectorAll<HTMLElement>(".marketing-purpose-character") ?? [],
    );
    const liftAt = (index: number) => Number.parseFloat(
      updatedCharacters[index].style.getPropertyValue("--wave-lift"),
    );

    expect(liftAt(hoveredIndex)).toBe(18);
    expect(liftAt(hoveredIndex - 1)).toBeLessThan(liftAt(hoveredIndex));
    expect(liftAt(hoveredIndex - 1)).toBeGreaterThan(liftAt(hoveredIndex - 2));
    expect(liftAt(hoveredIndex - 2)).toBeGreaterThan(liftAt(0));

    fireEvent.mouseLeave(firstPhrase as HTMLElement);
    expect(firstPhraseCharacters[hoveredIndex].style.getPropertyValue("--wave-lift")).toBe("0.00px");
  });
});
