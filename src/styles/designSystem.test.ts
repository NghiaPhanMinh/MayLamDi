import { describe, expect, it } from "vitest";
import css from "./design-tokens.css?raw";
import appCss from "./index.css?raw";

describe("MayLamDi design-system contract", () => {
  it("uses the supplied light and dark surface tokens", () => {
    expect(css).toContain("--mld-bg: #fffdec");
    expect(css).toContain("--mld-surface-01: #fffef9");
    expect(css).toContain("--mld-bg: #071216");
    expect(css).toContain("--mld-surface-01: #0b181c");
  });

  it("uses Inter and the supplied spacing, radius, and control scales", () => {
    expect(css).toContain("--mld-font-ui: Inter");
    expect(css).toContain("--mld-space-9: 96px");
    expect(css).toContain("--mld-radius-card: 14px");
    expect(css).toContain("min-height: 44px");
  });

  it("includes the specified mobile bottom navigation treatment", () => {
    expect(css).toContain(".mobile-bottom-nav");
    expect(css).toContain("grid-template-columns: repeat(5, 1fr)");
  });

  it("keeps the landing Features composition interactive and motion-sensitive", () => {
    expect(css).toContain(".marketing-features-transition");
    expect(css).toContain(".marketing-features-curtain");
    expect(css).toContain("--curtain-progress");
    expect(css).toContain(".marketing-feature-tag");
    expect(css).toContain("@keyframes marketing-feature-tag-mobile-drop");
    expect(css).toContain("translate3d(var(--tag-x), var(--tag-y), 0) rotate(var(--tag-rotation))");
    expect(css).toContain("cursor: grab");
    expect(css).toContain("cursor: grabbing");
    expect(css).toContain("touch-action: none");
    expect(css).toContain("box-shadow: 6px 6px 0 #101517");
    expect(css).toContain("background: #fff73f");
    expect(css).toContain(".marketing-features-title-mask");
    expect(css).toContain("overflow: hidden");
    expect(css).toContain("color: #fffdec");
    expect(css).toContain("transform: translateY(60%)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".marketing-features-description");
  });

  it("includes the yellow horizontal How It Works sequence", () => {
    expect(css).toContain(".marketing-how-it-works-transition");
    expect(css).toContain("position: fixed");
    expect(css).toContain("[data-active=\"true\"]");
    expect(css).toContain("background: transparent");
    expect(css).toContain("padding-bottom: 100vh");
    expect(css).toContain("translateY(var(--features-scene-lock-offset, 0px))");
    expect(css).toContain(".marketing-how-it-works-stripe.is-from-left");
    expect(css).toContain(".marketing-how-it-works-stripe.is-from-right");
    expect(css).toContain(".marketing-how-it-works-scroll-stage");
    expect(css).toContain("min-height: calc(400vh + 18vh)");
    expect(css).toContain(".marketing-how-it-works-dot-transition");
    expect(css).toContain(".marketing-how-it-works-dot");
    expect(css).toContain("background: #feaa01");
    expect(css).toContain(".marketing-how-it-works-rail::before");
    expect(css).toContain(".marketing-how-it-works-step.is-before");
    expect(css).toContain("translateX(120px)");
    expect(css).toContain(".how-works-visual--setup");
    expect(css).toContain(".how-works-visual--plan");
    expect(css).toContain(".how-works-visual--work");
    expect(css).toContain(".how-works-visual--together");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("includes the scroll-led Subscription scene and polka-dot handoff", () => {
    expect(css).toContain(".marketing-subscription");
    expect(css).toContain("background: #feaa01");
    expect(css).toContain(".marketing-subscription-scroll-stage");
    expect(css).toContain("min-height: 260vh");
    expect(css).toContain("position: sticky");
    expect(css).toContain("justify-content: center");
    expect(css).toContain(".marketing-subscription-comparison");
    expect(css).toContain(".marketing-subscription-comparison-plan--free");
    expect(css).toContain(".marketing-subscription-comparison-plan--plus");
    expect(css).toContain("color: #fff73f");
  });

  it("centers the visible final MayLamDi wordmark including its trailing negative tracking", () => {
    expect(css).toContain(".marketing-final-cta-title-frame");
    expect(css).toContain("padding-right: clamp(11.2px, 2.38vw, 95.5px)");
    expect(css).toContain("letter-spacing: -0.1em");
  });

  it("uses the selected local display font without the removed hero preview", () => {
    expect(css).toContain('font-family: "Paytone One"');
    expect(css).toContain('/fonts/PaytoneOne-Regular.ttf');
    expect(css).toContain('font-family: "Anton"');
    expect(css).toContain('/fonts/Anton-Regular.ttf');
    expect(css).not.toContain('font-family: "Chaco"');
    expect(css).not.toContain("Blodestarkly");
    expect(css).not.toContain(".marketing-preview-card");
  });

  it("keeps landing polish responsive and reduced-motion safe", () => {
    expect(css).toContain("margin: 0 0 var(--mld-space-5)");
    expect(css).toContain(".marketing-title-sketch path");
    expect(css).toContain("@keyframes marketing-sketch-draw");
    expect(css).toContain("stroke-width: 3");
    expect(css).toContain("stroke-width: 1.5");
    expect(css).toContain(".marketing-hero-logo-stage");
    expect(css).toContain("min-height: 0");
    expect(css).toContain("font-size: clamp(86px, 12vw, 190px)");
    expect(css).toContain("stroke-dashoffset: 0");
  });

  it("keeps the scoped About scene scroll-led, layered, and mobile-safe", () => {
    expect(css).toContain(".marketing-about-transition-scene > .marketing-hero");
    expect(css).toContain(".marketing-pixel-transition-cell");
    expect(css).toContain("background: #4ca0fe");
    expect(css).toContain(".marketing-purpose");
    expect(css).toContain(".marketing-purpose-scroll-stage");
    expect(css).toContain("min-height: calc(320vh + var(--mld-space-8))");
    expect(css).toContain(".marketing-purpose-sticky");
    expect(css).toContain("position: sticky");
    expect(css).toContain("transform: translateX(-150px)");
    expect(css).toContain(".marketing-purpose-phrase.is-revealed");
    expect(css).toContain(".marketing-purpose-statement--blend");
    expect(css).toContain("mix-blend-mode: screen");
    expect(css).toContain("translateY(calc(var(--wave-lift) * -1)) rotate(var(--wave-rotation))");
    expect(css).toContain(".marketing-purpose-character");
    expect(css).toContain("@keyframes marketing-purpose-marquee-forward");
    expect(css).toContain("@keyframes marketing-purpose-marquee-reverse");
    expect(css).toContain(".marketing-purpose-marquee-row");
    expect(css).toContain("overflow: visible");
    expect(css).toContain("margin-top: var(--mld-space-8)");
    expect(css).toContain('font-family: "Anton", "Arial Narrow", sans-serif');
    expect(css).toContain("-webkit-text-stroke: 2px #fff73f");
    expect(css).toContain("@media (max-width: 760px)");
    expect(css).toContain("min-height: auto");
    expect(css).toContain("display: none");
    expect(css).toContain("opacity: 1");
    expect(css).not.toContain(".marketing-purpose-workspace-overlap");
  });

  it("keeps project identity, settings accordions, and sticky tabs theme-safe", () => {
    expect(css).toContain(".room-index-card.room-index-card-colored");
    expect(css).toContain("background: var(--group-color)");
    expect(css).toContain(".project-color-marker");
    expect(css).toContain(".profile-secondary-settings[open] > summary");
    expect(css).toContain("background: var(--mld-info)");
    expect(css).toContain("position: sticky");
    expect(css).toContain("background: var(--mld-surface-01)");
    expect(css).toContain("z-index: 40");
  });

  it("keeps framework cards colourful, aligned, and readable", () => {
    expect(css).toContain("background: var(--framework-card-color)");
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(css).toContain("grid-template-rows: auto minmax(6rem, auto) minmax(3.75rem, auto)");
    expect(css).toContain(".framework-preview-note");
    expect(css).toContain("background: #fff73f");
    expect(css).toContain("color: #101517");
  });

  it("keeps bright team and task surfaces readable and motion-safe", () => {
    expect(css).toContain(".member-profile-card .member-skill-chip");
    expect(css).toContain("background: var(--mld-chip-color");
    expect(css).toContain("translateY(-2px) scale(1.06)");
    expect(css).toContain(".availability-calendar > strong");
    expect(css).toContain(".battle-task-note.task-in_progress");
    expect(css).toContain(".project-next-action .next-action-cta");
  });

  it("keeps light form inputs dark and phases colour-coded in both themes", () => {
    expect(css).toContain(".task-evidence-panel textarea");
    expect(css).toContain("caret-color: #101517");
    expect(css).toContain(".daily-post-form");
    expect(css).toContain(".daily-image-url-input");
    expect(css).toContain(".empty-feed-notice");
    expect(css).toContain(".phase-chip-editor > div");
    expect(css).toContain("background: var(--mld-phase-color");
    expect(css).toContain(".phase-rename-button");
    expect(css).toContain(".phase-manager .inline-phase-form .secondary-button");
  });

  it("uses the shared spacing scale for task sections and task-board internals", () => {
    expect(css).toContain(".tasks-room-tab");
    expect(css).toContain("gap: var(--mld-space-6)");
    expect(css).toContain(".battle-task-board-heading > div");
    expect(css).toContain("gap: var(--mld-space-5)");
    expect(css).toContain(".battle-task-strip");
  });

  it("keeps framework disciplines and reviewer waiting states readable", () => {
    expect(css).toContain(".framework-preview .discipline-tags span");
    expect(css).toContain("background: #101517");
    expect(css).toContain("color: #fffdec");
    expect(css).toContain(".battle-task-waiting");
    expect(css).toContain("line-height: 1.4");
    expect(css).toContain("padding: var(--mld-space-3) var(--mld-space-4)");
  });

  it("keeps project setup frameworks colourful with a separate selected state", () => {
    expect(css).toContain("background: var(--mld-framework-color");
    expect(css).toContain(".framework-choice.is-selected");
    expect(css).toContain("outline: 3px solid #101517");
    expect(css).toContain("box-shadow: 6px 6px 0 #4ca0fe");
  });

  it("keeps AI plan hierarchy, milestones, and task sequencing readable", () => {
    expect(css).toContain(".ai-draft > header.ai-brief-interpretation h4");
    expect(css).toContain("line-height: 1.03");
    expect(css).toContain(".ai-task-sequence");
    expect(css).toContain("--ai-plan-surface: #fffbd0");
    expect(css).toContain(".ai-milestone-heading");
  });

  it("contains long framework names and groups brief metadata responsively", () => {
    expect(css).toContain("grid-template-rows: auto minmax(6rem, auto) minmax(3.75rem, auto)");
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).toContain("overflow-wrap: normal");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain(".project-brief-details");
    expect(css).toContain(".project-brief-summary-meta");
    expect(css).toContain("grid-template-columns: 1fr");
  });

  it("keeps the required profile setup page vertically scrollable", () => {
    expect(appCss).toContain(".profile-gate-shell");
    expect(appCss).toContain("height: 100dvh");
    expect(appCss).toContain("overflow-y: auto");
  });
});
