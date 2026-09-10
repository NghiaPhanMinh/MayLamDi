import { describe, expect, it } from "vitest";

import battleSource from "./BattleScene.tsx?raw";
import styles from "../../styles/index.css?raw";

describe("approved partial game theme", () => {
  it("applies the MayLamDi palette through scoped game controls and admin classes", () => {
    expect(battleSource).toContain('className="rpg-btn-leaderboard rpg-btn-layout-admin"');
    expect(battleSource).toContain('aria-label="Sound and music settings"');

    expect(styles).toContain(".rpg-btn-layout-admin");
    expect(styles).toContain("background: #4ca0fe");
    expect(styles).toContain("background: #fff73f");
  });

  it("uses the approved boss HP treatment and keeps it accessible", () => {
    expect(battleSource).toContain('aria-label="Boss health"');
    expect(styles).toContain(".boss-hp-mob-fill");
    expect(styles).toContain("linear-gradient(90deg, #fd39e4, #feaa01)");
    expect(styles).toContain(".boss-hp-mob-style");
  });
});
