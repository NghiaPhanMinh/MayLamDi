import { describe, expect, it } from "vitest";

import { hasActiveFeatureBodies, stepFeatureBodies, wakeFeatureBodyForDrag, type FeatureBody, type FeatureBodyMap } from "./featureTagPhysics";

function body(overrides: Partial<FeatureBody> = {}): FeatureBody {
  return {
    x: 100, y: 0, vx: 0, vy: 0, angle: -3, angularVelocity: 0.3,
    width: 160, height: 44, spawned: true, spawnDelay: 0, opacity: 1,
    sleeping: false, quietTime: 0, ...overrides,
  };
}

function simulate(bodies: FeatureBodyMap, seconds: number, dt = 1 / 60, dragging: string | null = null, width = 1000) {
  let next = bodies;
  for (let i = 0; i < Math.ceil(seconds / dt); i += 1) {
    next = stepFeatureBodies(next, width, 680, 530, dt, dragging);
  }
  return next;
}

describe("feature tag sleeping physics", () => {
  it("retains falling and a small bounce, then sleeps after sustained rest", () => {
    let next: FeatureBodyMap = { tag: body() };
    let bounced = false;
    for (let i = 0; i < 300; i += 1) {
      next = stepFeatureBodies(next, 1000, 680, 530, 1 / 60, null);
      if (next.tag.vy < -14) bounced = true;
    }
    expect(bounced).toBe(true);
    expect(next.tag.sleeping).toBe(true);
    expect(next.tag.quietTime).toBeGreaterThanOrEqual(1.25);
    expect(next.tag.y).toBe(486);
    expect(hasActiveFeatureBodies(next)).toBe(false);
  });

  it.each([780, 1000, 1600].flatMap((width) => [1 / 30, 1 / 60, 1 / 120].map((dt) => ({ width, dt }))))("settles a ten-tag pile at width $width / timestep $dt and holds it exactly still for ten seconds", ({ width, dt }) => {
    const positions = [8, 29, 56, 78, 15, 43, 72, 4, 31, 63];
    const initial = Object.fromEntries(positions.map((left, i) => [String(i), body({
      x: left / 100 * (width - (150 + (i % 4) * 30)), y: -44 - (i % 3) * 26,
      width: 150 + (i % 4) * 30,
      vx: -26 + (i % 5) * 13, angularVelocity: -0.55 + (i % 4) * 0.33,
      spawnDelay: 60 + i * 90, spawned: false, opacity: 0,
    })]));
    const settled = simulate(initial, 10, dt, null, width);
    expect(Object.values(settled).map((tag) => tag.sleeping)).toEqual(Array(10).fill(true));
    expect(simulate(settled, 10, dt, null, width)).toEqual(settled);
  });

  it.each([1 / 60, 0.034])("does not wake or shift a sleeping pile for tiny contact impulses at timestep %s", (dt) => {
    const sleeping = body({ y: 486, sleeping: true, quietTime: 1.25, vx: 0, vy: 0, angularVelocity: 0 });
    const next = stepFeatureBodies({ resting: sleeping, tiny: body({ y: 442.2, vy: 1, angularVelocity: 0 }) }, 1000, 680, 530, dt, null);
    expect(next.resting).toEqual(sleeping);
  });

  it("wakes only the dragged tag and tags it supports, then settles after release", () => {
    const initial = {
      bottom: body({ y: 486, sleeping: true, vx: 0, vy: 0, angularVelocity: 0 }),
      top: body({ y: 442.4, sleeping: true, vx: 0, vy: 0, angularVelocity: 0 }),
      unrelated: body({ x: 700, y: 486, sleeping: true, vx: 0, vy: 0, angularVelocity: 0 }),
    };
    const next = wakeFeatureBodyForDrag(initial, "bottom");
    expect(next.top.sleeping).toBe(false);
    expect(next.bottom.sleeping).toBe(false);
    expect(next.unrelated).toEqual(initial.unrelated);
    next.bottom.x = 400;
    next.bottom.vy = 80;
    const released = simulate(next, 6);
    expect(released.top.y).toBe(486);
    expect(hasActiveFeatureBodies(released)).toBe(false);
    expect(simulate(released, 10)).toEqual(released);
  });

  it("wakes a sleeper on a meaningful moving-body impact", () => {
    const next = stepFeatureBodies({
      resting: body({ x: 300, y: 486, sleeping: true, quietTime: 1.25, vx: 0, vy: 0, angularVelocity: 0 }),
      moving: body({ x: 143, y: 486, vx: 250 }),
    }, 1000, 680, 530, 1 / 60, null);
    expect(next.resting.sleeping).toBe(false);
    expect(next.resting.vx).toBeGreaterThan(0);
    expect(simulate(next, 6).resting.sleeping).toBe(true);
  });

  it("treats a dragged tag as kinematic and wakes the tag it pushes", () => {
    const dragged = body({ x: 250, y: 486, vx: 0, angularVelocity: 0 });
    const next = stepFeatureBodies({
      dragged,
      resting: body({ x: 400, y: 486, sleeping: true, vx: 0, vy: 0, angularVelocity: 0 }),
    }, 1000, 680, 530, 1 / 60, "dragged");
    expect(next.dragged).toEqual(dragged);
    expect(next.resting.sleeping).toBe(false);
    expect(next.resting.x).toBeGreaterThan(400);
    expect(simulate(next, 6).resting.sleeping).toBe(true);
  });

  it("keeps delayed spawns active and does not sleep at the airborne apex", () => {
    expect(hasActiveFeatureBodies({ delayed: body({ spawned: false, sleeping: true }) })).toBe(true);
    const next = simulate({ airborne: body({ y: 100, vy: -19.5, quietTime: 1.24 }) }, 1 / 60);
    expect(next.airborne.sleeping).toBe(false);
    expect(next.airborne.quietTime).toBe(0);
  });

  it.each([0, 1, 84, 96])("settles real desktop tag widths with uneven frame timing (seed %s)", (seed) => {
    const widths = [151, 178, 235, 165, 237, 260, 226, 208, 151, 192];
    const width = seed === 1 ? 1280 : 780;
    let next = Object.fromEntries([8, 29, 56, 78, 15, 43, 72, 4, 31, 63].map((left, i) => [String(i), body({
      x: left / 100 * (width - widths[i]), y: -44 - (i % 3) * 26, width: widths[i],
      vx: -26 + (i % 5) * 13, angularVelocity: -0.55 + (i % 4) * 0.33,
      spawnDelay: 60 + i * 90, spawned: false, opacity: 0,
    })]));
    let time = 0;
    let frame = 0;
    while (time < 10) {
      const dt = 0.001 + ((Math.sin((frame++ + seed) * 12.9898) * 43758.5453 % 1 + 1) / 2) * 0.033;
      time += dt;
      next = stepFeatureBodies(next, width, 900, 684, dt, null);
    }
    expect(hasActiveFeatureBodies(next)).toBe(false);
    for (let i = 0; i < 600; i += 1) {
      expect(stepFeatureBodies(next, width, 900, 684, 1 / 60, null)).toEqual(next);
    }
  });

  it("keeps a near-rest bridge still throughout its sleep countdown at changing frame rates", () => {
    let next = {
      left: body({ x: 100, y: 486, sleeping: true, vx: 0, vy: 0, angularVelocity: 0 }),
      right: body({ x: 265, y: 486, sleeping: true, vx: 0, vy: 0, angularVelocity: 0 }),
      bridge: body({ x: 200, y: 442.4, quietTime: 0.01, vx: 0, vy: 0, angularVelocity: 0 }),
    } as FeatureBodyMap;
    const resting = { x: next.bridge.x, y: next.bridge.y, angle: next.bridge.angle };
    for (let i = 0; i < 120; i += 1) {
      next = stepFeatureBodies(next, 1000, 680, 530, [0.034, 0.001, 1 / 60][i % 3], null);
      expect({ x: next.bridge.x, y: next.bridge.y, angle: next.bridge.angle }).toEqual(resting);
    }
    expect(next.bridge.sleeping).toBe(true);
  });
});
