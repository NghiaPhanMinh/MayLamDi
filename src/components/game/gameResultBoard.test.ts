import { describe, expect, it } from "vitest";

import battleSource from "./BattleScene.tsx?raw";
import styles from "../../styles/index.css?raw";

describe("shared end-of-game result board", () => {
  it("uses one component system for success and failure without changing the result gate", () => {
    expect(battleSource).toContain("function BattleResultBoard");
    expect(battleSource).toContain('variant: "success" | "failed"');
    expect(battleSource).toContain('const isVillageDefended = effectiveVillageHp >= 50;');
    expect(battleSource).toContain('const resultVariant = isVillageDefended ? "success" : "failed";');
    expect(battleSource).toContain('<BattleResultBoard');
    expect(battleSource).toContain('data-result-variant={variant}');
  });

  it("keeps the result content and actions while replacing result-board emoji with Lucide icons", () => {
    expect(battleSource).toContain("Project completed");
    expect(battleSource).toContain("YOU FAILED TO PROTECT THE VILLAGE!");
    expect(battleSource).not.toContain("<dt>Village Status</dt>");
    expect(battleSource).not.toContain("<dt>Boss Remaining</dt>");
    expect(battleSource).not.toContain("<dt>Verified Quests</dt>");
    expect(battleSource).toContain("Download personal contribution");
    expect(battleSource).toContain("View Battle Canvas");
    expect(battleSource).toContain("Remove from my account");
    expect(battleSource).not.toContain("Delete Party Room");
    expect(battleSource).toContain("ShieldCheck");
    expect(battleSource).toContain("ShieldX");
    expect(battleSource).toContain("FileDown");
    expect(battleSource).toContain("Gamepad2");
    expect(battleSource).not.toContain('"🏰 🎉"');
    expect(battleSource).not.toContain('"🏚️ 💔"');
  });

  it("uses the MayLamDi palette, responsive layouts, and light/dark treatments", () => {
    expect(styles).toContain(".battle-result-board.is-failed");
    expect(styles).toContain("--result-accent: var(--color-green)");
    expect(styles).toContain("--result-accent: var(--color-orange)");
    expect(styles).toContain("background: var(--color-yellow)");
    expect(styles).toContain("background: var(--color-pink)");
    expect(styles).toContain("background: var(--color-blue)");
    expect(styles).toContain(':root[data-theme="dark"] .battle-result-board');
    expect(styles).toContain(".battle-result-stats,");
    expect(styles).toContain("grid-template-columns: 1fr;");
  });

  it("keeps dark-mode result text readable on state-tinted light surfaces", () => {
    expect(styles).toContain("--result-board-bg: color-mix(in srgb, var(--green) 22%, #fffdec)");
    expect(styles).toContain("--result-board-bg: color-mix(in srgb, var(--orange) 28%, #fffdec)");
    expect(styles).toContain("--result-board-text: #101517");
    expect(styles).toContain("background: var(--result-board-bg)");
    expect(styles).toContain("color: var(--result-board-text)");
    expect(styles).toContain(':root[data-theme="dark"] .battle-result-stat');
  });
});
