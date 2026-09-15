export type FeatureBody = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  width: number;
  height: number;
  spawnDelay: number;
  spawned: boolean;
  opacity: number;
  sleeping: boolean;
  quietTime: number;
};

export type FeatureBodyMap = Record<string, FeatureBody>;

const REST_SECONDS = 1.25;
// Above even the largest gravity increment in the capped 34ms frame: resting
// pressure must not be mistaken for a new impact.
const WAKE_IMPACT_SPEED = 60;
const CONTACT_SLOP = 0.4;

export function hasActiveFeatureBodies(bodies: FeatureBodyMap): boolean {
  return Object.values(bodies).some((body) => !body.spawned || !body.sleeping);
}

function wake(body: FeatureBody) {
  body.sleeping = false;
  body.quietTime = 0;
}

export function wakeFeatureBodyForDrag(bodies: FeatureBodyMap, tagId: string): FeatureBodyMap {
  const next = Object.fromEntries(Object.entries(bodies).map(([id, body]) => [id, { ...body }])) as FeatureBodyMap;
  const pending = [tagId];
  const visited = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const support = next[id];
    wake(support);
    support.vx = 0;
    support.vy = 0;
    // Picking up a supporting tag should let the tags resting on it fall,
    // without waking unrelated members of the pile.
    Object.entries(next).forEach(([otherId, other]) => {
      if (other.spawned && other.sleeping && other.y < support.y
        && Math.abs(other.y + other.height - support.y) <= 1.5
        && Math.min(other.x + other.width, support.x + support.width) - Math.max(other.x, support.x) > 1) {
        pending.push(otherId);
      }
    });
  }
  return next;
}

function isSupported(body: FeatureBody, bodies: FeatureBodyMap, floorY: number): boolean {
  const bottom = body.y + body.height;
  if (Math.abs(bottom - floorY) <= 1.5) return true;
  return Object.values(bodies).some((other) => other !== body && other.spawned
    && other.y > body.y
    && Math.abs(bottom - other.y) <= 1.5
    && Math.min(body.x + body.width, other.x + other.width) - Math.max(body.x, other.x) > 1);
}

// Keep the original lightweight gravity/AABB simulation. Sleeping bodies are
// static colliders: neither gravity nor solver corrections may move them.
export function stepFeatureBodies(
  bodies: FeatureBodyMap,
  width: number,
  height: number,
  floorY: number,
  deltaSeconds: number,
  draggingTagId: string | null,
): FeatureBodyMap {
  floorY = Math.min(height, floorY);
  const next = Object.fromEntries(Object.entries(bodies).map(([id, body]) => [id, { ...body }])) as FeatureBodyMap;
  const gravity = 1180;
  const restitution = 0.18;
  const friction = 0.84;
  const airFriction = Math.pow(0.992, deltaSeconds * 60);

  Object.entries(next).forEach(([id, body]) => {
    if (!body.spawned) {
      body.spawnDelay = Math.max(0, body.spawnDelay - deltaSeconds * 1000);
      if (body.spawnDelay <= 0) {
        body.spawned = true;
        body.opacity = 1;
      }
    }
    if (!body.spawned || id === draggingTagId || body.sleeping) return;

    body.vy += gravity * deltaSeconds;
    body.vx *= airFriction;
    body.vy *= airFriction;
    body.angularVelocity *= airFriction;
    body.x += body.vx * deltaSeconds;
    body.y += body.vy * deltaSeconds;
    body.angle += body.angularVelocity * deltaSeconds;

    const maxX = Math.max(0, width - body.width);
    if (body.x < 0 || body.x > maxX) {
      const direction = body.x < 0 ? 1 : -1;
      const impact = Math.abs(body.vx);
      body.x = Math.min(maxX, Math.max(0, body.x));
      body.vx = direction * impact * restitution;
      if (impact > WAKE_IMPACT_SPEED) body.angularVelocity += direction * 0.5;
    }

    const maxY = Math.max(0, floorY - body.height);
    if (body.y > maxY) {
      body.y = maxY;
      if (body.vy > 0) body.vy *= -restitution;
      body.vx *= friction;
      body.angularVelocity *= 0.82;
      if (Math.abs(body.vy) < 14) body.vy = 0;
      if (Math.abs(body.vx) < 2) body.vx = 0;
      if (Math.abs(body.angularVelocity) < 0.04) body.angularVelocity = 0;
    }
  });

  const ids = Object.keys(next);
  for (let iteration = 0; iteration < 8; iteration += 1) {
    for (let index = 0; index < ids.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < ids.length; otherIndex += 1) {
        const first = next[ids[index]];
        const second = next[ids[otherIndex]];
        if (!first.spawned || !second.spawned) continue;

        const overlapX = Math.min(first.x + first.width, second.x + second.width) - Math.max(first.x, second.x);
        const overlapY = Math.min(first.y + first.height, second.y + second.height) - Math.max(first.y, second.y);
        if (overlapX <= 0 || overlapY <= 0) continue;

        const firstDragging = ids[index] === draggingTagId;
        const secondDragging = ids[otherIndex] === draggingTagId;
        if (first.sleeping && second.sleeping && !firstDragging && !secondDragging) continue;
        const horizontal = overlapX < overlapY;
        const normal = horizontal ? (first.x < second.x ? 1 : -1) : (first.y < second.y ? 1 : -1);
        const relativeVelocity = (horizontal ? second.vx - first.vx : second.vy - first.vy) * normal;
        const meaningfulImpact = relativeVelocity < -WAKE_IMPACT_SPEED;
        // Drag contact can wake a neighbour, but micro resting contacts cannot.
        if (first.sleeping && (meaningfulImpact || secondDragging)) wake(first);
        if (second.sleeping && (meaningfulImpact || firstDragging)) wake(second);
        const firstMass = firstDragging || first.sleeping ? 0 : 1;
        const secondMass = secondDragging || second.sleeping ? 0 : 1;
        const mass = firstMass + secondMass;
        if (!mass) continue;
        const amount = Math.max(0, (horizontal ? overlapX : overlapY) - CONTACT_SLOP);
        if (horizontal) {
          first.x -= amount * normal * firstMass / mass;
          second.x += amount * normal * secondMass / mass;
        } else {
          first.y -= amount * normal * firstMass / mass;
          second.y += amount * normal * secondMass / mass;
        }

        if (relativeVelocity < 0) {
          const impulse = -relativeVelocity * (1 + restitution) / mass;
          if (horizontal) {
            first.vx -= impulse * normal * firstMass;
            second.vx += impulse * normal * secondMass;
            if (firstMass) first.vx *= friction;
            if (secondMass) second.vx *= friction;
            if (meaningfulImpact) {
              const spin = Math.min(0.2, impulse * 0.001) * normal;
              if (firstMass) first.angularVelocity += spin;
              if (secondMass) second.angularVelocity -= spin;
            }
          } else {
            first.vy -= impulse * normal * firstMass;
            second.vy += impulse * normal * secondMass;
            if (firstMass) first.vy *= 0.94;
            if (secondMass) second.vy *= 0.94;
          }
        }
      }
    }

    Object.entries(next).forEach(([id, body]) => {
      if (!body.spawned || body.sleeping || id === draggingTagId) return;
      body.x = Math.min(Math.max(body.x, 0), Math.max(0, width - body.width));
      const maxY = Math.max(0, floorY - body.height);
      body.y = Math.min(Math.max(body.y, 0), maxY);
      // Pair impulses can push the bottom body downward after integration.
      // Resolve the floor's velocity constraint too, not just its position.
      if (body.y === maxY && body.vy > 0) body.vy = 0;
    });
  }

  Object.entries(next).forEach(([id, body]) => {
    if (!body.spawned || body.sleeping || id === draggingTagId) return;
    const previous = bodies[id];
    const supported = isSupported(body, next, floorY);
    if (supported) {
      // Contact friction also damps roll on top of other tags, not just floor.
      body.vx *= Math.pow(0.9, deltaSeconds * 60);
      body.angularVelocity *= Math.pow(0.85, deltaSeconds * 60);
    }
    const quiet = supported && Math.abs(body.vx) < 4 && Math.abs(body.vy) < 30
      && Math.abs(body.angularVelocity) < 0.1
      && Math.hypot(body.x - previous.x, body.y - previous.y) < 1.5;
    body.quietTime = quiet ? body.quietTime + deltaSeconds : 0;
    if (quiet) {
      body.vx = 0;
      body.vy = 0;
      body.angularVelocity = 0;
    }
    if (body.quietTime >= REST_SECONDS) body.sleeping = true;
  });
  return next;
}
