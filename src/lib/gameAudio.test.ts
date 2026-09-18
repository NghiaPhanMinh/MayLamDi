import { describe, expect, it } from "vitest";

import { gameAudio } from "./gameAudio";

describe("game audio defaults", () => {
  it("starts new users with the requested game mix", () => {
    expect(gameAudio.getMuted()).toBe(false);
    expect(gameAudio.getVolume()).toBe(0.98);
    expect(gameAudio.getSpellVolume()).toBe(0.97);
    expect(gameAudio.getBgmVolume()).toBe(1);
  });
});
