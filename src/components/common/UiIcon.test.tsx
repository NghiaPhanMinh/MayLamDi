import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { SpellType } from "../../lib/character";
import funnelSource from "../analytics/UserFunnelTab.tsx?raw";
import planningSource from "../projects/AIPlanningAssistant.tsx?raw";
import { SpellIcon, UiIcon } from "./UiIcon";

describe("shared UI icons and factual copy", () => {
  afterEach(cleanup);

  it("uses the existing Lucide set without changing a control's text label", () => {
    const { container, getByRole } = render(<button><UiIcon name="Gamepad2" /> Game Mode</button>);
    expect(getByRole("button", { name: "Game Mode" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveClass("lucide-gamepad2");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.textContent).toBe(" Game Mode");
  });

  it("renders every character spell as an icon rather than an emoji", () => {
    const spells: (SpellType | undefined)[] = [undefined, "spark", "shield", "focus", "bloom", "fire", "lightning", "water", "nature", "star"];
    const { container } = render(<>{spells.map((spell) => <SpellIcon key={spell ?? "none"} spellType={spell} />)}</>);
    expect(container.querySelectorAll('svg.lucide[aria-hidden="true"]')).toHaveLength(spells.length);
    expect(container.textContent).toBe("");
  });

  it("keeps built-in interface decoration free of emoji characters", () => {
    const sources = import.meta.glob<string>("../../**/*.tsx", { query: "?raw", import: "default", eager: true });
    for (const [path, source] of Object.entries(sources)) {
      if (path.endsWith(".test.tsx")) continue;
      expect(source, path).not.toMatch(/[\p{Extended_Pictographic}\uFE0F\u20E3]/u);
    }
  });

  it("does not promise unlimited AI or invented completion improvements", () => {
    expect(funnelSource).not.toContain("2.4x");
    expect(planningSource).not.toContain("unlimited");
    expect(planningSource).toContain("30 AI actions");
  });
});
