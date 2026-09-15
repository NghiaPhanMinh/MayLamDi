import { UiIcon } from "../components/common/UiIcon";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, CheckCircle2, Sparkles } from "lucide-react";

import { BrandLogo } from "../components/brand/BrandLogo";
import { SubscriptionComparisonValue } from "../components/subscription/SubscriptionComparisonValue";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { hasActiveFeatureBodies, stepFeatureBodies, wakeFeatureBodyForDrag, type FeatureBodyMap } from "../lib/featureTagPhysics";
import {
  SUBSCRIPTION_COMPARISON_ROWS,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "../lib/subscription";

type LandingPageProps = {
  isAuthenticated?: boolean;
  currentPlan?: SubscriptionPlan;
};

type BurstWord = {
  id: string;
  style: CSSProperties;
};

type PurposeCharacterHover = {
  lineIndex: number;
  characterIndex: number;
};

const PURPOSE_MARQUEE_COPY = "LESS GUESSING. LESS GÁNH TEAM. MORE SHARED RESPONSIBILITY.";
const PURPOSE_REVEAL_THRESHOLDS = [0.04, 0.15, 0.26, 0.37, 0.48, 0.59, 0.70] as const;
const PIXEL_COLOR_SEQUENCES = [
  ["#FF8AE7", "#FFF73F", "#101517", "#4CA0FE"],
  ["#FFF73F", "#FF8AE7", "#101517", "#4CA0FE"],
  ["#101517", "#FF8AE7", "#FFF73F", "#4CA0FE"],
  ["#FF8AE7", "#101517", "#FFF73F", "#4CA0FE"],
] as const;

const BURST_COLORS = ["#fff73f", "#ff8ae7", "#4ca0fe", "#1dd851", "#feaa01"];

const PURPOSE_PHRASES = [
  "Share the work on group projects.",
  "Give each task an owner.",
  "MayLamDi helps university teams",
  "plan tasks around skills and capacity,",
  "track deadlines and progress,",
  "and review evidence of the work",
  "before marking tasks complete.",
] as const;

const PURPOSE_PIXEL_CELLS = Array.from({ length: 16 }, (_, columnIndex) => {
  const rowCount = 9 + ((columnIndex * 5) % 4);
  const weights = Array.from({ length: rowCount }, (_, rowIndex) => (
    0.78 + (((columnIndex * 7) + (rowIndex * 5)) % 6) * 0.09
  ));
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  let top = 0;

  return weights.map((weight, rowIndex) => {
    const height = (weight / totalWeight) * 100;
    const verticalCenter = (top + (height / 2)) / 100;
    const jitter = (((columnIndex * 11) + (rowIndex * 13)) % 9) / 100;
    const threshold = Math.min(0.66, 0.02 + ((1 - verticalCenter) * 0.52) + jitter);
    const cell = {
      id: `${columnIndex}-${rowIndex}`,
      left: `${columnIndex * 6.25}%`,
      top: `${top}%`,
      width: "6.25%",
      height: `${height}%`,
      threshold,
      variant: (columnIndex + rowIndex) % PIXEL_COLOR_SEQUENCES.length,
    };
    top += height;
    return cell;
  });
}).flat();

const FEATURE_TAGS = [
  {
    id: "ai-assistant",
    label: "AI ASSISTANT",
    description: "Draft tasks and owner suggestions from your assignment brief, then review and edit them.",
  },
  {
    id: "team-tracking",
    label: "TEAM TRACKING",
    description: "Check task owners, deadlines and progress in the project room.",
  },
  {
    id: "fair-task-allocation",
    label: "FAIR TASK ALLOCATION",
    description: "AI suggests task owners based on skills, workload and weekly capacity.",
  },
  {
    id: "gamification",
    label: "GAMIFICATION",
    description: "Reviewed tasks damage the dragon. Daily evidence helps defend the village.",
  },
  {
    id: "real-time-workspace",
    label: "REAL-TIME WORKSPACE",
    description: "Teammates see task updates in the project room as you save them.",
  },
  {
    id: "contribution-evidence",
    label: "CONTRIBUTION EVIDENCE",
    description: "Upload notes, links, images or PDFs for teammates to review.",
  },
  {
    id: "workload-visibility",
    label: "WORKLOAD VISIBILITY",
    description: "Compare assigned task hours with each teammate's weekly capacity.",
  },
  {
    id: "project-planning",
    label: "PROJECT PLANNING",
    description: "Organise your brief into project phases, tasks, deadlines and owners.",
  },
  {
    id: "peer-review",
    label: "PEER REVIEW",
    description: "Review evidence and recommend completion or changes.",
  },
  {
    id: "human-control",
    label: "HUMAN CONTROL",
    description: "The room creator reviews the AI draft before saving tasks or assigning owners.",
  },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "SET UP\nTHE PROJECT",
    description: "Add your brief, deadline, framework, team skills, availability and capacity.",
    visual: "setup",
    visualLabel: "Project setup interface",
  },
  {
    number: "02",
    title: "BUILD A\nFAIR PLAN",
    description: "Review the AI's task and owner suggestions, edit what you need, then save the plan.",
    visual: "plan",
    visualLabel: "Editable AI task plan interface",
  },
  {
    number: "03",
    title: "SUBMIT &\nREVIEW WORK",
    description: "Upload evidence for finished tasks. Teammates review it before the room creator marks the task complete.",
    visual: "work",
    visualLabel: "Shared task board with visible ownership",
  },
  {
    number: "04",
    title: "DEFEND THE\nVILLAGE",
    description: "Reviewed tasks damage the dragon. Post daily evidence to defend the village until the deadline.",
    visual: "together",
    visualLabel: "Shared team game progress interface",
  },
] as const;

const HOW_IT_WORKS_STRIPES = ["#fff73f", "#fff73f", "#fff73f", "#fff73f", "#fff73f", "#fff73f"] as const;

// Use a dense field so the wipe continues covering gaps before the final
// orange fill takes over the viewport.
const HOW_IT_WORKS_DOTS = Array.from({ length: 240 }, (_, index) => {
  const randomPosition = (seed: number) => {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  };

  return {
    left: `${(randomPosition(index + 1) * 96 + 2).toFixed(2)}%`,
    top: `${(randomPosition(index + 101) * 96 + 2).toFixed(2)}%`,
  } as const;
});

type FeatureTagPosition = {
  left: number;
  top: number;
  rotation: number;
  delay: number;
};

type FeatureDrag = {
  id: string;
  offsetX: number;
  offsetY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
};

const INITIAL_FEATURE_TAG_POSITIONS: Record<string, FeatureTagPosition> = {
  "ai-assistant": { left: 8, top: 20, rotation: -4, delay: 60 },
  "team-tracking": { left: 29, top: 14, rotation: 3, delay: 150 },
  "fair-task-allocation": { left: 56, top: 21, rotation: -2, delay: 240 },
  gamification: { left: 78, top: 13, rotation: 4, delay: 330 },
  "real-time-workspace": { left: 15, top: 42, rotation: 2, delay: 420 },
  "contribution-evidence": { left: 43, top: 38, rotation: -3, delay: 510 },
  "workload-visibility": { left: 72, top: 43, rotation: 3, delay: 600 },
  "project-planning": { left: 4, top: 66, rotation: -2, delay: 690 },
  "peer-review": { left: 31, top: 60, rotation: 4, delay: 780 },
  "human-control": { left: 63, top: 66, rotation: -3, delay: 870 },
};

function PurposePhrase({
  blend,
  hoveredCharacter,
  lineIndex,
  onCharacterHover,
  phrase,
}: {
  blend: boolean;
  hoveredCharacter: PurposeCharacterHover | null;
  lineIndex: number;
  onCharacterHover?: (hover: PurposeCharacterHover | null) => void;
  phrase: string;
}) {
  let characterCursor = 0;

  return phrase.split(" ").map((word, wordIndex) => {
    const wordStart = characterCursor;
    characterCursor += word.length + 1;

    return (
      <span className="marketing-purpose-word" key={`${word}-${wordIndex}`}>
        {Array.from(word).map((character, localIndex) => {
          const characterIndex = wordStart + localIndex;
          const distance = hoveredCharacter?.lineIndex === lineIndex
            ? Math.abs(characterIndex - hoveredCharacter.characterIndex)
            : Number.POSITIVE_INFINITY;
          const lift = Number.isFinite(distance)
            ? 18 * Math.exp(-((distance * distance) / 3.2))
            : 0;
          const rotation = distance <= 3 && hoveredCharacter
            ? Math.max(-1, Math.min(1, (characterIndex - hoveredCharacter.characterIndex) * 0.35))
            : 0;

          return (
            <span
              className="marketing-purpose-character"
              data-character-index={characterIndex}
              key={`${character}-${characterIndex}`}
              onMouseEnter={blend ? undefined : () => onCharacterHover?.({ lineIndex, characterIndex })}
              style={{
                "--wave-lift": `${lift.toFixed(2)}px`,
                "--wave-rotation": `${rotation.toFixed(2)}deg`,
              } as CSSProperties}
            >
              {character}
            </span>
          );
        })}
      </span>
    );
  });
}

function PurposeStatement({
  blend = false,
  hoveredCharacter,
  onCharacterHover,
  revealedLines,
}: {
  blend?: boolean;
  hoveredCharacter: PurposeCharacterHover | null;
  onCharacterHover?: (hover: PurposeCharacterHover | null) => void;
  revealedLines: readonly boolean[];
}) {
  return (
    <h2
      className={`marketing-purpose-statement${blend ? " marketing-purpose-statement--blend" : ""}`}
      id={blend ? undefined : "why-maylamdi-title"}
      aria-hidden={blend ? "true" : undefined}
      aria-label={blend ? undefined : PURPOSE_PHRASES.join(" ")}
      data-purpose-blend={blend ? "true" : undefined}
    >
      {PURPOSE_PHRASES.map((phrase, index) => (
        <span
          className={`${index === 2 ? "marketing-purpose-phrase marketing-purpose-phrase--new-thought" : "marketing-purpose-phrase"}${revealedLines[index] ? " is-revealed" : ""}${hoveredCharacter?.lineIndex === index ? " is-waved" : ""}`}
          data-purpose-phrase={blend ? undefined : "true"}
          key={phrase}
          onMouseLeave={blend ? undefined : () => onCharacterHover?.(null)}
        >
          <PurposePhrase
            blend={blend}
            hoveredCharacter={hoveredCharacter}
            lineIndex={index}
            onCharacterHover={onCharacterHover}
            phrase={phrase}
          />
        </span>
      ))}
    </h2>
  );
}

function PurposeWorkspaceVisual({ visualRef }: { visualRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      className="marketing-purpose-workspace"
      role="img"
      aria-label="Simplified MayLamDi project workspace showing shared tasks and visible ownership"
      data-purpose-visual
      ref={visualRef}
    >
      <div className="marketing-purpose-workspace-bar">
        <div aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <strong>Project room</strong>
        <span className="live-badge">Live</span>
      </div>
      <div className="marketing-purpose-workspace-body">
        <div className="marketing-purpose-workspace-nav">
          <span className="is-active">Project</span>
          <span>Tasks</span>
          <span>Team</span>
        </div>
        <div className="marketing-purpose-workspace-content">
          <span className="card-eyebrow">Launch week · Shared plan</span>
          <div className="marketing-purpose-progress-heading">
            <strong>72% complete</strong>
            <span>3 teammates</span>
          </div>
          <div className="progress-track"><span style={{ width: "72%" }} /></div>
          <div className="marketing-purpose-task-list">
            <div><span>Research findings</span><strong>Team</strong></div>
            <div><span>Prototype review</span><strong>You</strong></div>
            <div><span>Final handoff</span><strong>Shared</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function createFeatureBodies(): FeatureBodyMap {
  return FEATURE_TAGS.reduce<FeatureBodyMap>((bodies, tag) => {
    bodies[tag.id] = {
      x: 0,
      y: -120,
      vx: 0,
      vy: 0,
      angle: INITIAL_FEATURE_TAG_POSITIONS[tag.id].rotation,
      angularVelocity: 0,
      width: Math.max(130, tag.label.length * 9 + 36),
      height: 44,
      spawnDelay: INITIAL_FEATURE_TAG_POSITIONS[tag.id].delay,
      spawned: false,
      opacity: 0,
      sleeping: false,
      quietTime: 0,
    };
    return bodies;
  }, {});
}

function FeatureTagComposition({ tagsDropped }: { tagsDropped: boolean }) {
  const interactionRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const tagRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dragState = useRef<FeatureDrag | null>(null);
  const hideInfoTimer = useRef<number | null>(null);
  const [bodies, setBodies] = useState<FeatureBodyMap>(() => createFeatureBodies());
  const bodiesRef = useRef<FeatureBodyMap>(bodies);
  const [draggingTagId, setDraggingTagId] = useState<string | null>(null);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);
  const [infoPosition, setInfoPosition] = useState({ left: 16, top: 80 });
  const [isInView, setIsInView] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 760);
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ));

  const visibleTags = isMobile ? FEATURE_TAGS.slice(0, 7) : FEATURE_TAGS;

  const commitBodies = (next: FeatureBodyMap) => {
    bodiesRef.current = next;
    setBodies(next);
  };

  const getCanvasGeometry = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const canvasRect = canvas.getBoundingClientRect();
    const width = canvasRect.width || 900;
    const height = canvasRect.height || 680;
    const title = canvas.querySelector<HTMLElement>("#features-title");
    const titleRect = title?.getBoundingClientRect();
    const floorY = titleRect
      ? Math.min(height - 16, Math.max(120, titleRect.top - canvasRect.top + 8))
      : height - 150;
    return { canvasRect, width, height, floorY };
  };

  const measureBody = (tagId: string) => {
    const element = tagRefs.current[tagId];
    const current = bodiesRef.current[tagId];
    return {
      width: element?.offsetWidth || current.width,
      height: element?.offsetHeight || current.height,
    };
  };

  useEffect(() => {
    const media = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    const updateMotion = () => setReducedMotion(Boolean(media?.matches));
    media?.addEventListener("change", updateMotion);
    return () => media?.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth <= 760);
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateVisibility = () => {
      const rect = canvas.getBoundingClientRect();
      setIsInView(rect.bottom > 0 && rect.top < window.innerHeight);
    };
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0 });
    observer?.observe(canvas);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    const initialFrame = window.requestAnimationFrame(updateVisibility);
    const handleVisibility = () => setIsInView(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
      window.cancelAnimationFrame(initialFrame);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!tagsDropped) return;
    const frame = window.requestAnimationFrame(() => {
      const geometry = getCanvasGeometry();
      if (!geometry) return;
      const next = createFeatureBodies();
      FEATURE_TAGS.forEach((tag, index) => {
        const measured = measureBody(tag.id);
        const position = INITIAL_FEATURE_TAG_POSITIONS[tag.id];
        const maxX = Math.max(0, geometry.width - measured.width);
        const floorY = geometry.floorY;
        const settledRow = Math.floor(index / 4);
        next[tag.id] = {
          ...next[tag.id],
          width: measured.width,
          height: measured.height,
          x: reducedMotion
            ? Math.min(maxX, (index % 4) * (maxX / 3))
            : Math.min(maxX, (position.left / 100) * maxX),
          y: reducedMotion
            ? Math.max(0, floorY - measured.height - settledRow * measured.height * 0.82)
            : -measured.height - (index % 3) * 26,
          vx: reducedMotion || isMobile ? 0 : -26 + (index % 5) * 13,
          vy: 0,
          angle: position.rotation,
          angularVelocity: reducedMotion || isMobile ? 0 : -0.55 + (index % 4) * 0.33,
          spawnDelay: reducedMotion || isMobile ? 0 : position.delay,
          spawned: reducedMotion || isMobile,
          opacity: reducedMotion || isMobile ? 1 : 0,
          sleeping: reducedMotion || isMobile,
        };
      });
      commitBodies(next);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isMobile, reducedMotion, tagsDropped]);

  useEffect(() => {
    if (!tagsDropped || reducedMotion || isMobile || !isInView) return;
    let animationFrame = 0;
    let previousTime = performance.now();
    const animate = (time: number) => {
      if (document.hidden || !isInView) return;
      if (!draggingTagId && !hasActiveFeatureBodies(bodiesRef.current)) return;
      const geometry = getCanvasGeometry();
      if (!geometry) return;
      const deltaSeconds = Math.min(0.034, Math.max(0.001, (time - previousTime) / 1000));
      previousTime = time;
      const next = stepFeatureBodies(
        bodiesRef.current,
        geometry.width,
        geometry.height,
        geometry.floorY,
        deltaSeconds,
        draggingTagId,
      );
      commitBodies(next);
      if (draggingTagId || hasActiveFeatureBodies(next)) animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [draggingTagId, isInView, isMobile, reducedMotion, tagsDropped]);

  useEffect(() => {
    if (!hoveredTagId) return;
    const updateInfoPosition = () => {
      const interaction = interactionRef.current;
      const tag = tagRefs.current[hoveredTagId];
      const info = infoRef.current;
      if (!interaction || !tag) return;
      const interactionRect = interaction.getBoundingClientRect();
      const tagRect = tag.getBoundingClientRect();
      const infoWidth = info?.offsetWidth || Math.min(320, Math.max(220, window.innerWidth - 32));
      const infoHeight = info?.offsetHeight || 136;
      const gap = 14;
      let left = tagRect.right - interactionRect.left + gap;
      if (left + infoWidth > interactionRect.width - 12) {
        left = tagRect.left - interactionRect.left - infoWidth - gap;
      }
      left = Math.min(Math.max(12, left), Math.max(12, interactionRect.width - infoWidth - 12));
      const top = Math.min(
        Math.max(12, tagRect.top - interactionRect.top - 8),
        Math.max(12, interactionRect.height - infoHeight - 12),
      );
      setInfoPosition({ left, top });
    };
    const frame = window.requestAnimationFrame(updateInfoPosition);
    window.addEventListener("resize", updateInfoPosition);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateInfoPosition);
    };
  }, [bodies, hoveredTagId]);

  useEffect(() => () => {
    if (hideInfoTimer.current !== null) window.clearTimeout(hideInfoTimer.current);
  }, []);

  const clearHideInfoTimer = () => {
    if (hideInfoTimer.current !== null) {
      window.clearTimeout(hideInfoTimer.current);
      hideInfoTimer.current = null;
    }
  };

  const showFeatureInfo = (tagId: string) => {
    clearHideInfoTimer();
    setHoveredTagId(tagId);
  };

  const scheduleInfoHide = () => {
    clearHideInfoTimer();
    hideInfoTimer.current = window.setTimeout(() => setHoveredTagId(null), 190);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, tagId: string) => {
    showFeatureInfo(tagId);
    if (!tagsDropped || reducedMotion || isMobile) return;
    const geometry = getCanvasGeometry();
    const tagRect = event.currentTarget.getBoundingClientRect();
    if (!geometry) return;
    dragState.current = {
      id: tagId,
      offsetX: event.clientX - tagRect.left,
      offsetY: event.clientY - tagRect.top,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp || 0,
    };
    commitBodies(wakeFeatureBodyForDrag(bodiesRef.current, tagId));
    setDraggingTagId(tagId);
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    const geometry = getCanvasGeometry();
    if (!drag || !geometry) return;
    const now = event.timeStamp || drag.lastTime + 16;
    const elapsed = Math.max(16, now - drag.lastTime);
    const body = bodiesRef.current[drag.id];
    const measured = measureBody(drag.id);
    const maxX = Math.max(0, geometry.width - measured.width);
    const maxY = Math.max(0, geometry.floorY - measured.height);
    const x = Math.min(maxX, Math.max(0, event.clientX - geometry.canvasRect.left - drag.offsetX));
    const y = Math.min(maxY, Math.max(0, event.clientY - geometry.canvasRect.top - drag.offsetY));
    const next = Object.fromEntries(Object.entries(bodiesRef.current).map(([id, current]) => [id, { ...current }])) as FeatureBodyMap;
    next[drag.id] = {
      ...body,
      x,
      y,
      width: measured.width,
      height: measured.height,
      vx: ((event.clientX - drag.lastX) / elapsed) * 1000,
      vy: ((event.clientY - drag.lastY) / elapsed) * 1000,
      opacity: 1,
      spawned: true,
      sleeping: false,
      quietTime: 0,
    };
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    commitBodies(next);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (typeof event.currentTarget.hasPointerCapture === "function" && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const drag = dragState.current;
    if (drag) {
      const body = bodiesRef.current[drag.id];
      const next = Object.fromEntries(Object.entries(bodiesRef.current).map(([id, current]) => [id, { ...current }])) as FeatureBodyMap;
      next[drag.id] = { ...body, vy: body.vy + 80, sleeping: false, quietTime: 0 };
      commitBodies(next);
    }
    dragState.current = null;
    setDraggingTagId(null);
  };

  const activeTag = FEATURE_TAGS.find((tag) => tag.id === hoveredTagId);

  return (
    <div className="marketing-features-interaction" ref={interactionRef}>
      <div className={`marketing-features-tag-canvas${isMobile ? " is-simple" : ""}`} ref={canvasRef}>
        {visibleTags.map((tag) => {
          const body = bodies[tag.id] ?? bodiesRef.current[tag.id];
          const position = INITIAL_FEATURE_TAG_POSITIONS[tag.id];
          return (
            <button
              aria-label={tag.label}
              className={`marketing-feature-tag${tagsDropped ? " is-dropped" : ""}${body.spawned ? " is-visible" : ""}${reducedMotion ? " is-reduced" : ""}${draggingTagId === tag.id ? " is-dragging" : ""}`}
              key={tag.id}
              data-physics-state={body.sleeping ? "sleeping" : "awake"}
              onClick={() => showFeatureInfo(tag.id)}
              onFocus={() => showFeatureInfo(tag.id)}
              onBlur={scheduleInfoHide}
              onMouseEnter={() => showFeatureInfo(tag.id)}
              onMouseLeave={scheduleInfoHide}
              onPointerCancel={handlePointerUp}
              onPointerDown={(event) => handlePointerDown(event, tag.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              ref={(element) => { tagRefs.current[tag.id] = element; }}
              style={{
                "--tag-delay": `${position.delay}ms`,
                "--tag-opacity": body.opacity,
                "--tag-rotation": `${body.angle}deg`,
                "--tag-x": `${body.x}px`,
                "--tag-y": `${body.y}px`,
              } as CSSProperties}
              type="button"
            >
              {tag.label}
            </button>
          );
        })}
        <div className="marketing-features-title-mask">
          <h2 id="features-title">OUR FEATURES</h2>
        </div>
      </div>

      {activeTag ? (
        <div
          aria-live="polite"
          className="marketing-features-description is-visible"
          onMouseEnter={clearHideInfoTimer}
          onMouseLeave={scheduleInfoHide}
          ref={infoRef}
          style={{ "--feature-info-left": `${infoPosition.left}px`, "--feature-info-top": `${infoPosition.top}px` } as CSSProperties}
        >
          <span>Feature info</span>
          <strong>{activeTag.label}</strong>
          <p>{activeTag.description}</p>
        </div>
      ) : null}
    </div>
  );
}

function HowItWorksVisual({ step }: { step: typeof HOW_IT_WORKS_STEPS[number] }) {
  return (
    <div
      aria-label={step.visualLabel}
      className={`how-works-visual how-works-visual--${step.visual}`}
      role="img"
    >
      <div className="how-works-visual-window-bar">
        <div aria-hidden="true"><span /><span /><span /></div>
        <strong>{step.visual === "plan" ? "Fair plan" : step.visual === "work" ? "Project room" : step.visual === "together" ? "Team quest" : "New project"}</strong>
        <b>{step.number}</b>
      </div>

      {step.visual === "setup" ? (
        <div className="how-works-visual-setup">
          <div className="how-works-visual-sidebar"><span className="is-active">Brief</span><span>Framework</span><span>Team</span><span>Capacity</span></div>
          <div className="how-works-visual-form">
            <span className="how-works-visual-kicker">Project brief</span>
            <strong>Launch week</strong>
            <div className="how-works-visual-input"><span>Deadline</span><b>14 AUG</b></div>
            <div className="how-works-visual-input"><span>Framework</span><b>Design process</b></div>
            <div className="how-works-visual-form-footer"><span>Team capacity</span><b>Balanced</b></div>
          </div>
        </div>
      ) : null}

      {step.visual === "plan" ? (
        <div className="how-works-visual-plan">
          <div className="how-works-visual-plan-banner"><span>AI DRAFT</span><b>EDITABLE</b></div>
          <div className="how-works-visual-plan-row"><strong>01</strong><span>Research findings</span><b>Team</b></div>
          <div className="how-works-visual-plan-row"><strong>02</strong><span>Prototype review</span><b>You</b></div>
          <div className="how-works-visual-plan-row"><strong>03</strong><span>Final handoff</span><b>Shared</b></div>
          <div className="how-works-visual-plan-footer"><span>Review suggestion</span><b>Keep plan</b></div>
        </div>
      ) : null}

      {step.visual === "work" ? (
        <div className="how-works-visual-board">
          {[
            ["TO DO", "Brief notes", "Open questions"],
            ["IN PROGRESS", "Prototype review", "Evidence upload"],
            ["DONE", "Research findings", "Team check-in"],
          ].map(([heading, first, second]) => (
            <div className="how-works-visual-board-column" key={heading}>
              <strong>{heading}</strong>
              <div><span>{first}</span><b>2</b></div>
              <div><span>{second}</span><b><UiIcon name="Check" /></b></div>
            </div>
          ))}
        </div>
      ) : null}

      {step.visual === "together" ? (
        <div className="how-works-visual-game">
          <div className="how-works-visual-game-status"><span>SHARED QUEST</span><b>LIVE</b></div>
          <div className="how-works-visual-shield"><span><UiIcon name="Check" /></span></div>
          <strong className="how-works-visual-boss">PROJECT GOAL</strong>
          <div className="how-works-visual-hp"><span style={{ width: "72%" }} /></div>
          <div className="how-works-visual-players"><b>Q</b><b>N</b><b>T</b><span>72% complete</span></div>
        </div>
      ) : null}
    </div>
  );
}

function buildBurstWords(): BurstWord[] {
  return Array.from({ length: 42 }, (_, index) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 38 + Math.random() * 68;
    const style = {
      "--burst-x": `${6 + Math.random() * 88}vw`,
      "--burst-y": `${8 + Math.random() * 84}vh`,
      "--burst-size": `${20 + Math.random() * 42}px`,
      "--burst-rotation": `${-18 + Math.random() * 36}deg`,
      "--burst-end-rotation": `${-36 + Math.random() * 72}deg`,
      "--burst-dx": `${Math.cos(angle) * distance}vw`,
      "--burst-dy": `${Math.sin(angle) * distance}vh`,
      "--burst-delay": `${Math.random() * 140}ms`,
      "--burst-color": BURST_COLORS[index % BURST_COLORS.length],
    } as CSSProperties;

    return { id: `${Date.now()}-${index}`, style };
  });
}

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function progressBetween(progress: number, start: number, end: number) {
  return clampProgress((progress - start) / Math.max(end - start, 0.001));
}

function SubscriptionPlanAction({
  currentPlan,
  isAuthenticated,
  onStartFree,
  plan,
}: {
  currentPlan?: SubscriptionPlan;
  isAuthenticated: boolean;
  onStartFree: (label: string) => void;
  plan: SubscriptionPlan;
}) {
  const isCurrent = currentPlan === plan;

  if (plan === "free" && !isAuthenticated) {
    return <button type="button" onClick={() => onStartFree("START FREE")}>START FREE</button>;
  }

  if (plan === "plus" && !isAuthenticated) {
    return <button type="button" onClick={() => onStartFree("UPGRADE TO PLUS")}>UPGRADE TO PLUS</button>;
  }

  if (plan === "plus" && !isCurrent) {
    return <Link to="/subscription">UPGRADE TO PLUS</Link>;
  }

  return <button type="button" disabled>{isCurrent ? "CURRENT PLAN" : "FREE PLAN"}</button>;
}

function SubscriptionComparisonChart({
  cardProgress,
  freeContentProgress,
  plusContentProgress,
  currentPlan,
  isAuthenticated,
  onStartFree,
}: {
  cardProgress: number;
  freeContentProgress: number;
  plusContentProgress: number;
  currentPlan?: SubscriptionPlan;
  isAuthenticated: boolean;
  onStartFree: (label: string) => void;
}) {
  const lineCount = SUBSCRIPTION_COMPARISON_ROWS.length + 1;
  const lineStyle = (progress: number, index: number) => ({
    "--subscription-line-progress": progressBetween(
      progress,
      (index / Math.max(lineCount - 1, 1)) * 0.8,
      (index / Math.max(lineCount - 1, 1)) * 0.8 + 0.2,
    ),
  } as CSSProperties);

  return (
    <div
      aria-label="MayLamDi subscription plan comparison"
      className="marketing-subscription-comparison"
      role="table"
      style={{ "--subscription-card-progress": cardProgress } as CSSProperties}
    >
      <div className="marketing-subscription-comparison-row marketing-subscription-comparison-head" role="row">
        <div className="marketing-subscription-comparison-feature" role="columnheader">
          <span>Compare plans</span>
          <small>Project limits and AI access.</small>
        </div>
        <div className="marketing-subscription-comparison-plan marketing-subscription-comparison-plan--free" role="columnheader">
          <strong>{SUBSCRIPTION_PLANS.free.name}</strong>
          {currentPlan === "free" ? <span>Current plan</span> : null}
          <small>{SUBSCRIPTION_PLANS.free.price}</small>
        </div>
        <div className="marketing-subscription-comparison-plan marketing-subscription-comparison-plan--plus" role="columnheader">
          <strong>{SUBSCRIPTION_PLANS.plus.name}<Sparkles size={16} aria-hidden="true" /></strong>
          {currentPlan === "plus" ? <span>Current plan</span> : null}
          <small>{SUBSCRIPTION_PLANS.plus.price} / month</small>
        </div>
      </div>

      {SUBSCRIPTION_COMPARISON_ROWS.map((row, index) => (
        <div className="marketing-subscription-comparison-row" key={row.label} role="row">
          <div className="marketing-subscription-comparison-feature" role="rowheader" style={lineStyle(freeContentProgress, index)}>
            <strong>{row.label}</strong>
            <small>{row.detail}</small>
          </div>
          <div className="marketing-subscription-comparison-value marketing-subscription-comparison-value--free" role="cell" style={lineStyle(freeContentProgress, index)}>
            <span className="marketing-subscription-comparison-value-label">Free</span>
            <strong><SubscriptionComparisonValue className="marketing-subscription-comparison-symbol" value={row.free} /></strong>
          </div>
          <div className="marketing-subscription-comparison-value marketing-subscription-comparison-value--plus" role="cell" style={lineStyle(plusContentProgress, index)}>
            <span className="marketing-subscription-comparison-value-label">MayLamDi+</span>
            <strong><SubscriptionComparisonValue className="marketing-subscription-comparison-symbol" value={row.plus} /></strong>
          </div>
        </div>
      ))}

      <div className="marketing-subscription-comparison-row marketing-subscription-comparison-actions" role="row">
        <div className="marketing-subscription-comparison-feature" role="rowheader" style={lineStyle(freeContentProgress, lineCount - 1)}>
          <strong>Choose your starting point</strong>
          <small>Both plans include task management and evidence tracking.</small>
        </div>
        <div className="marketing-subscription-comparison-value marketing-subscription-comparison-value--free" role="cell" style={lineStyle(freeContentProgress, lineCount - 1)}>
          <span className="marketing-subscription-comparison-value-label">Free</span>
          <SubscriptionPlanAction
            currentPlan={currentPlan}
            isAuthenticated={isAuthenticated}
            onStartFree={onStartFree}
            plan="free"
          />
        </div>
        <div className="marketing-subscription-comparison-value marketing-subscription-comparison-value--plus" role="cell" style={lineStyle(plusContentProgress, lineCount - 1)}>
          <span className="marketing-subscription-comparison-value-label">MayLamDi+</span>
          <SubscriptionPlanAction
            currentPlan={currentPlan}
            isAuthenticated={isAuthenticated}
            onStartFree={onStartFree}
            plan="plus"
          />
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ currentPlan, isAuthenticated = false }: LandingPageProps) {
  const { signIn, signOut } = useAuthActions();
  const [burstWords, setBurstWords] = useState<BurstWord[]>([]);
  const [revealedPurposeLines, setRevealedPurposeLines] = useState<boolean[]>(() => {
    if (typeof window === "undefined") return PURPOSE_PHRASES.map(() => false);
    const shouldReduceMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return PURPOSE_PHRASES.map(() => shouldReduceMotion);
  });
  const [purposeVisualRevealed, setPurposeVisualRevealed] = useState(() => (
    typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ));
  const [hoveredPurposeCharacter, setHoveredPurposeCharacter] = useState<PurposeCharacterHover | null>(null);
  const cleanupTimer = useRef<number | null>(null);
  const purposeSection = useRef<HTMLElement | null>(null);
  const pixelTransition = useRef<HTMLDivElement | null>(null);
  const purposeStatementStack = useRef<HTMLDivElement | null>(null);
  const purposeVisual = useRef<HTMLDivElement | null>(null);
  const featuresTransition = useRef<HTMLDivElement | null>(null);
  const featuresSection = useRef<HTMLElement | null>(null);
  const howItWorksTransition = useRef<HTMLDivElement | null>(null);
  const howItWorksSection = useRef<HTMLElement | null>(null);
  const howItWorksDotTransition = useRef<HTMLDivElement | null>(null);
  const subscriptionSection = useRef<HTMLElement | null>(null);
  const finalTransitionStage = useRef<HTMLDivElement | null>(null);
  const finalTransition = useRef<HTMLDivElement | null>(null);
  const finalSection = useRef<HTMLElement | null>(null);
  const [howItWorksProgress, setHowItWorksProgress] = useState(0);
  const [subscriptionProgress, setSubscriptionProgress] = useState(0);
  const [featureTagsDropped, setFeatureTagsDropped] = useState(false);
  const [subscriptionAuthError, setSubscriptionAuthError] = useState<string | null>(null);
  const [finalEntered, setFinalEntered] = useState(false);
  const [finalScrollDirection, setFinalScrollDirection] = useState<"forward" | "reverse">("forward");
  const previousFinalScrollY = useRef<number | null>(null);

  useEffect(() => () => {
    if (cleanupTimer.current !== null) {
      window.clearTimeout(cleanupTimer.current);
    }
  }, []);

  useEffect(() => {
    const section = purposeSection.current;
    const transition = pixelTransition.current;
    if (!section || !transition) return;

    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    const cells = Array.from(transition.querySelectorAll<HTMLElement>(".marketing-pixel-transition-cell"));
    const blendLayer = purposeStatementStack.current?.querySelector<HTMLElement>("[data-purpose-blend]");
    let animationFrame = 0;

    const setPixelProgress = (progress: number) => {
      const clamped = Math.min(1, Math.max(0, progress));
      transition.dataset.progress = clamped.toFixed(2);
      transition.dataset.complete = clamped >= 0.999 ? "true" : "false";
      cells.forEach((cell) => {
        const threshold = Number(cell.dataset.threshold ?? 0);
        const variant = Number(cell.dataset.variant ?? 0);
        const localProgress = Math.min(1, Math.max(0, (clamped - threshold) / 0.34));
        const sequence = PIXEL_COLOR_SEQUENCES[variant] ?? PIXEL_COLOR_SEQUENCES[0];
        const colorIndex = Math.min(sequence.length - 1, Math.floor(localProgress * sequence.length));

        cell.style.opacity = localProgress > 0 ? "1" : "0";
        cell.style.backgroundColor = clamped >= 0.999 ? "#4CA0FE" : sequence[colorIndex];
        cell.style.transform = localProgress >= 1
          ? "translateY(0) scale(1)"
          : `translateY(${(1 - localProgress) * 18}%) scale(${0.82 + (localProgress * 0.18)})`;
      });
    };

    const alignBlendLayer = () => {
      const stack = purposeStatementStack.current;
      const visual = purposeVisual.current;
      if (!stack || !visual || !blendLayer) return;

      const stackRect = stack.getBoundingClientRect();
      const visualRect = visual.getBoundingClientRect();
      const overlapLeft = Math.max(stackRect.left, visualRect.left);
      const overlapTop = Math.max(stackRect.top, visualRect.top);
      const overlapRight = Math.min(stackRect.right, visualRect.right);
      const overlapBottom = Math.min(stackRect.bottom, visualRect.bottom);

      if (overlapRight <= overlapLeft || overlapBottom <= overlapTop) {
        blendLayer.style.clipPath = "inset(100% 0 0 0)";
        return;
      }

      blendLayer.style.clipPath = `inset(${overlapTop - stackRect.top}px ${stackRect.right - overlapRight}px ${stackRect.bottom - overlapBottom}px ${overlapLeft - stackRect.left}px)`;
    };

    const updateScene = () => {
      animationFrame = 0;
      if (reducedMotion?.matches) {
        setPixelProgress(1);
        setRevealedPurposeLines(PURPOSE_PHRASES.map(() => true));
        setPurposeVisualRevealed(true);
        alignBlendLayer();
        return;
      }

      const viewportHeight = Math.max(window.innerHeight, 1);
      const transitionRect = transition.getBoundingClientRect();
      setPixelProgress((viewportHeight - transitionRect.top) / viewportHeight);

      const sectionRect = section.getBoundingClientRect();
      if (sectionRect.height <= 0) return;
      const revealStart = viewportHeight * 0.72;
      const revealEnd = -Math.max(sectionRect.height - viewportHeight * 0.35, viewportHeight);
      const progress = Math.min(1, Math.max(0, (revealStart - sectionRect.top) / (revealStart - revealEnd)));

      setRevealedPurposeLines((current) => {
        const next = current.map((isRevealed, index) => (
          isRevealed || progress >= PURPOSE_REVEAL_THRESHOLDS[index]
        ));
        return next.some((value, index) => value !== current[index]) ? next : current;
      });
      if (progress >= 0.22) setPurposeVisualRevealed(true);
      alignBlendLayer();
    };

    const requestUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateScene);
    };

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(requestUpdate);
    if (purposeStatementStack.current) resizeObserver?.observe(purposeStatementStack.current);
    if (purposeVisual.current) resizeObserver?.observe(purposeVisual.current);

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateScene();

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      resizeObserver?.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const section = subscriptionSection.current;
    if (!section) return;

    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    const updateScene = () => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const sectionRect = section.getBoundingClientRect();
      const progress = reducedMotion?.matches
        ? 1
        : clampProgress((viewportHeight - sectionRect.top) / Math.max(section.offsetHeight, 1));
      setSubscriptionProgress(progress);
    };

    window.addEventListener("scroll", updateScene, { passive: true });
    window.addEventListener("resize", updateScene);
    reducedMotion?.addEventListener("change", updateScene);
    updateScene();

    return () => {
      window.removeEventListener("scroll", updateScene);
      window.removeEventListener("resize", updateScene);
      reducedMotion?.removeEventListener("change", updateScene);
    };
  }, []);

  useEffect(() => {
    const stage = finalTransitionStage.current;
    const transition = finalTransition.current;
    const section = finalSection.current;
    if (!stage || !transition || !section) return;

    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    const updateScene = () => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const stageRect = stage.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const rawProgress = -stageRect.top / Math.max(stage.offsetHeight, 1);
      const progress = reducedMotion?.matches ? 1 : clampProgress(rawProgress);
      const currentScrollY = window.scrollY;
      const previousScrollY = previousFinalScrollY.current;
      const scrollDirection = previousScrollY === null || currentScrollY === previousScrollY
        ? null
        : currentScrollY < previousScrollY
          ? "reverse"
          : "forward";
      previousFinalScrollY.current = currentScrollY;
      const isBeforeFinal = !reducedMotion?.matches
        && sectionRect.top > viewportHeight
        && rawProgress <= 0;
      const isTransitioning = !reducedMotion?.matches
        && stageRect.top <= 0
        && stageRect.bottom > 1;

      transition.style.setProperty("--final-reveal-radius", `${(progress * 150).toFixed(1)}%`);
      transition.dataset.active = isTransitioning ? "true" : "false";
      transition.dataset.reducedMotion = reducedMotion?.matches ? "true" : "false";
      if (isBeforeFinal) {
        setFinalScrollDirection("forward");
      } else if (scrollDirection) {
        setFinalScrollDirection(scrollDirection);
      }
      setFinalEntered((current) => {
        if (reducedMotion?.matches || sectionRect.top <= 1) return true;
        if (isBeforeFinal) return false;
        return current;
      });
    };

    window.addEventListener("scroll", updateScene, { passive: true });
    window.addEventListener("resize", updateScene);
    reducedMotion?.addEventListener("change", updateScene);
    updateScene();

    return () => {
      window.removeEventListener("scroll", updateScene);
      window.removeEventListener("resize", updateScene);
      reducedMotion?.removeEventListener("change", updateScene);
    };
  }, []);

  const subscriptionStoryProgress = progressBetween(subscriptionProgress, 0.08, 1);
  const subscriptionTitleProgress = progressBetween(subscriptionStoryProgress, 0, 0.18);
  const subscriptionCardProgress = progressBetween(subscriptionStoryProgress, 0.24, 0.4);
  const freeContentProgress = progressBetween(subscriptionStoryProgress, 0.4, 0.72);
  const plusContentProgress = progressBetween(subscriptionStoryProgress, 0.62, 0.94);

  const handleStartFree = async (label: string) => {
    setSubscriptionAuthError(null);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/home` : "/home";
      await signIn("google", { redirectTo });
    } catch {
      setSubscriptionAuthError(`${label} could not start. Check the Google sign-in setup and try again.`);
    }
  };

  const handleSwitchAccount = async () => {
    setSubscriptionAuthError(null);
    try {
      await signOut();
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/home` : "/home";
      await signIn("google", { redirectTo });
    } catch {
      setSubscriptionAuthError("Switching accounts could not start. Check the Google sign-in setup and try again.");
    }
  };

  useEffect(() => {
    const section = howItWorksSection.current;
    const stage = section?.querySelector<HTMLElement>(".marketing-how-it-works-scroll-stage");
    const transition = howItWorksDotTransition.current;
    if (!section || !stage || !transition) return;

    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    const dots = Array.from(transition.querySelectorAll<HTMLElement>(".marketing-how-it-works-dot"));

    const updateScene = () => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const howStageRect = stage.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const distanceTravelled = viewportHeight - howStageRect.top;
      const transitionHoldDistance = viewportHeight * 0.18;
      const sceneDistance = Math.max(stage.offsetHeight - transitionHoldDistance, 1);
      const transitionDistance = Math.max(stage.offsetHeight - sceneDistance, 1);
      // Start the reveal when the sticky scene reaches the top of the viewport,
      // so Step 1 animates in while it is visible instead of finishing early.
      const sceneStartDistance = viewportHeight;
      const contentDistance = Math.max(sceneDistance - sceneStartDistance, 1);
      const progress = reducedMotion?.matches
        ? 1
        : clampProgress((distanceTravelled - sceneStartDistance) / contentDistance);
      const transitionProgress = reducedMotion?.matches
        ? 1
        : progressBetween(distanceTravelled, sceneDistance, sceneDistance + transitionDistance);

      setHowItWorksProgress(progress);
      transition.style.setProperty("--how-dots-transition-progress", transitionProgress.toFixed(3));
      dots.forEach((dot, index) => {
        const localStart = (index / Math.max(dots.length - 1, 1)) * 0.62;
        const localProgress = reducedMotion?.matches
          ? 1
          : transitionProgress >= localStart ? 1 : 0;
        dot.style.setProperty("--how-dot-progress", localProgress.toFixed(3));
      });
      const transitionVisible = !reducedMotion?.matches
        && transitionProgress > 0
        && sectionRect.bottom >= 0;
      transition.dataset.active = transitionVisible ? "true" : "false";
      transition.dataset.complete = !reducedMotion?.matches && transitionProgress >= 0.999 ? "true" : "false";
    };

    window.addEventListener("scroll", updateScene, { passive: true });
    window.addEventListener("resize", updateScene);
    reducedMotion?.addEventListener("change", updateScene);
    updateScene();

    return () => {
      window.removeEventListener("scroll", updateScene);
      window.removeEventListener("resize", updateScene);
      reducedMotion?.removeEventListener("change", updateScene);
    };
  }, []);

  useEffect(() => {
    const transition = howItWorksTransition.current;
    const section = featuresSection.current;
    if (!transition || !section) return;

    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    const updateScene = () => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const sectionRect = section.getBoundingClientRect();
      const paddingBottom = Number.parseFloat(getComputedStyle(section).paddingBottom) || 0;
      const contentBottom = sectionRect.bottom - paddingBottom;
      const transitionRunway = viewportHeight;
      const transitionHold = viewportHeight * 0.24;
      const scrollPastFeaturesContent = transitionRunway - contentBottom;
      const transitionDistance = transitionRunway - transitionHold;
      const transitionProgress = reducedMotion?.matches
        ? 1
        : Math.min(1, Math.max(0, (scrollPastFeaturesContent - transitionHold) / transitionDistance));
      const transitionActive = !reducedMotion?.matches
        && scrollPastFeaturesContent >= transitionHold
        && sectionRect.bottom >= 0;
      const sceneLockOffset = reducedMotion?.matches
        ? 0
        : Math.min(transitionRunway, Math.max(0, scrollPastFeaturesContent));
      transition.style.setProperty("--how-transition-progress", transitionProgress.toFixed(3));
      section.style.setProperty("--features-scene-lock-offset", `${sceneLockOffset}px`);
      transition.dataset.active = transitionActive ? "true" : "false";
      transition.dataset.complete = transitionProgress >= 0.999 ? "true" : "false";
    };

    window.addEventListener("scroll", updateScene, { passive: true });
    window.addEventListener("resize", updateScene);
    reducedMotion?.addEventListener("change", updateScene);
    updateScene();

    return () => {
      window.removeEventListener("scroll", updateScene);
      window.removeEventListener("resize", updateScene);
      reducedMotion?.removeEventListener("change", updateScene);
    };
  }, []);

  useEffect(() => {
    const transition = featuresTransition.current;
    const section = featuresSection.current;
    if (!transition || !section) return;

    const reducedMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

    const updateFeaturesEntrance = () => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const transitionRect = transition.getBoundingClientRect();
      const progress = reducedMotion?.matches
        ? 1
        : Math.min(1, Math.max(0, (viewportHeight - transitionRect.top) / (viewportHeight + transitionRect.height)));

      transition.style.setProperty("--curtain-progress", progress.toFixed(3));
      const title = section.querySelector<HTMLElement>("#features-title");
      const titleRect = title?.getBoundingClientRect();
      if (reducedMotion?.matches || (titleRect && titleRect.top < viewportHeight * 0.98)) {
        setFeatureTagsDropped(true);
      }
    };

    window.addEventListener("scroll", updateFeaturesEntrance, { passive: true });
    window.addEventListener("resize", updateFeaturesEntrance);
    updateFeaturesEntrance();

    return () => {
      window.removeEventListener("scroll", updateFeaturesEntrance);
      window.removeEventListener("resize", updateFeaturesEntrance);
    };
  }, []);

  function triggerTextBurst() {
    if (cleanupTimer.current !== null) {
      window.clearTimeout(cleanupTimer.current);
    }

    setBurstWords(buildBurstWords());
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cleanupTimer.current = window.setTimeout(
      () => setBurstWords([]),
      reducedMotion ? 400 : 1800,
    );
  }

  return (
    <main
      className="marketing-shell"
      data-authenticated={isAuthenticated ? "true" : "false"}
    >
      <header className="marketing-header">
        <Link className="nav-brand" to="/" aria-label="MayLamDi landing page">
          <BrandLogo compact />
          <span>MayLamDi</span>
        </Link>
        <div className="marketing-header-actions">
          <ThemeToggle />
        </div>
      </header>

      <div className="marketing-about-transition-scene">
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div>
          <p className="kicker">Teamwork tracking &amp; task allocation</p>
          <h1 id="marketing-title" className="marketing-title">
            <button
              className="marketing-title-trigger"
              type="button"
              onClick={triggerTextBurst}
            >
              <span>Make teamwork </span>
              <span className="marketing-title-hook">
                <em>feel shared.</em>
                <svg
                  className="marketing-title-sketch"
                  viewBox="0 0 340 126"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M22 64C13 31 57 9 154 7C255 3 326 25 329 59C332 93 277 105 174 106C82 107 29 94 22 64" />
                  <path d="M13 60C18 24 77 4 171 10C267 15 334 35 321 73C311 101 247 109 152 101C67 94 9 84 13 60" />
                </svg>
              </span>
            </button>
          </h1>
          <a className="marketing-scroll-cue" href="#why-maylamdi">
            See what MayLamDi does <ArrowDown aria-hidden="true" />
          </a>
          <div className="marketing-proof" aria-label="MayLamDi principles">
            <span><CheckCircle2 aria-hidden="true" /> Editable task plans</span>
            <span><CheckCircle2 aria-hidden="true" /> Skills-based owner suggestions</span>
            <span><CheckCircle2 aria-hidden="true" /> Task and evidence tracking</span>
          </div>
        </div>

        <div className="marketing-hero-visual">
          <div className="marketing-hero-logo-stage">
            <span className="marketing-logo-orbit marketing-logo-orbit--outer" aria-hidden="true" />
            <span className="marketing-logo-orbit marketing-logo-orbit--inner" aria-hidden="true" />
            <BrandLogo className="marketing-hero-logo" />
          </div>
        </div>

      </section>

      <div
        className="marketing-pixel-transition"
        aria-hidden="true"
        ref={pixelTransition}
      >
        <div className="marketing-pixel-transition-canvas">
        {PURPOSE_PIXEL_CELLS.map((cell) => (
          <span
            className="marketing-pixel-transition-cell"
            data-threshold={cell.threshold.toFixed(3)}
            data-variant={cell.variant}
            key={cell.id}
            style={{
              "--pixel-left": cell.left,
              "--pixel-top": cell.top,
              "--pixel-width": cell.width,
              "--pixel-height": cell.height,
            } as CSSProperties}
          />
        ))}
        </div>
      </div>

      <section
        className={`marketing-purpose${purposeVisualRevealed ? " is-visual-revealed" : ""}`}
        id="why-maylamdi"
        aria-labelledby="why-maylamdi-title"
        ref={purposeSection}
      >
        <div className="marketing-purpose-scroll-stage">
          <div className="marketing-purpose-sticky">
            <div className="marketing-purpose-copy">
              <p className="marketing-purpose-label">About Us</p>
              <div className="marketing-purpose-statement-stack" ref={purposeStatementStack}>
                <PurposeStatement
                  hoveredCharacter={hoveredPurposeCharacter}
                  onCharacterHover={setHoveredPurposeCharacter}
                  revealedLines={revealedPurposeLines}
                />
                <PurposeStatement blend hoveredCharacter={hoveredPurposeCharacter} revealedLines={revealedPurposeLines} />
              </div>
            </div>
            <PurposeWorkspaceVisual visualRef={purposeVisual} />
          </div>
        </div>
        <div className="marketing-purpose-marquee" aria-label={PURPOSE_MARQUEE_COPY}>
          {["forward", "reverse"].map((direction) => (
            <div className={`marketing-purpose-marquee-row marketing-purpose-marquee-row--${direction}`} key={direction}>
              <div className="marketing-purpose-marquee-track">
                {Array.from({ length: 2 }, (_, groupIndex) => (
                  <div className="marketing-purpose-marquee-group" aria-hidden={groupIndex > 0 ? "true" : undefined} key={groupIndex}>
                    {Array.from({ length: 3 }, (_, copyIndex) => (
                      <span key={copyIndex}>{PURPOSE_MARQUEE_COPY}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      <div className="marketing-features-transition" ref={featuresTransition} aria-hidden="true">
        <div className="marketing-features-curtain" />
      </div>

      <section
        className="marketing-features"
        id="features"
        aria-labelledby="features-title"
        ref={featuresSection}
      >
        <div className="marketing-features-intro">
          <p>What MayLamDi offers</p>
          <span>Plan tasks, assign owners and review completed work in one project room.</span>
        </div>
        <FeatureTagComposition tagsDropped={featureTagsDropped} />
        <div className="marketing-how-it-works-transition" ref={howItWorksTransition} aria-hidden="true">
          {HOW_IT_WORKS_STRIPES.map((color, index) => (
            <span
              className={`marketing-how-it-works-stripe${index % 2 === 0 ? " is-from-left" : " is-from-right"}`}
              key={`${color}-${index}`}
              style={{ "--stripe-color": color, "--stripe-index": index } as CSSProperties}
            />
          ))}
        </div>
      </section>

      <div className="marketing-how-it-works-dot-transition" ref={howItWorksDotTransition} aria-hidden="true">
        {HOW_IT_WORKS_DOTS.map((dot, index) => (
          <span
            className="marketing-how-it-works-dot"
            key={`how-dot-${index}`}
            style={{
              "--how-dot-left": dot.left,
              "--how-dot-top": dot.top,
            } as CSSProperties}
          />
        ))}
      </div>

      <section
        aria-labelledby="how-it-works-title"
        className="marketing-how-it-works"
        id="how-it-works"
        ref={howItWorksSection}
      >
        <div className="marketing-how-it-works-scroll-stage">
          <div className="marketing-how-it-works-sticky">
            <div className="marketing-how-it-works-heading">
              <p id="how-it-works-title">How it works</p>
              <div
                aria-label="How it works steps"
                className="marketing-how-it-works-rail"
                style={{ "--how-active-index": Math.min(HOW_IT_WORKS_STEPS.length - 1, Math.floor(howItWorksProgress * HOW_IT_WORKS_STEPS.length)) } as CSSProperties}
              >
                {HOW_IT_WORKS_STEPS.map((step, index) => (
                  <span
                    className={`marketing-how-it-works-rail-step${index === Math.min(HOW_IT_WORKS_STEPS.length - 1, Math.floor(howItWorksProgress * HOW_IT_WORKS_STEPS.length)) ? " is-active" : ""}`}
                    key={step.number}
                  >
                    {step.number.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            <div className="marketing-how-it-works-track">
              {HOW_IT_WORKS_STEPS.map((step, index) => {
                const activeIndex = Math.min(HOW_IT_WORKS_STEPS.length - 1, Math.floor(howItWorksProgress * HOW_IT_WORKS_STEPS.length));
                const localProgress = index === activeIndex
                  ? Math.min(1, Math.max(0, (howItWorksProgress * HOW_IT_WORKS_STEPS.length) - activeIndex))
                  : index < activeIndex ? 1 : 0;
                const titleProgress = Math.min(1, localProgress / 0.25);
                const imageProgress = Math.min(1, Math.max(0, (localProgress - 0.2) / 0.3));
                const descriptionProgress = Math.min(1, Math.max(0, (localProgress - 0.5) / 0.2));
                return (
                  <article
                    aria-hidden={index !== activeIndex}
                    className={`marketing-how-it-works-step${index === activeIndex ? " is-active" : index < activeIndex ? " is-before" : " is-after"}`}
                    key={step.number}
                    style={{
                      "--how-title-progress": titleProgress,
                      "--how-image-progress": imageProgress,
                      "--how-description-progress": descriptionProgress,
                    } as CSSProperties}
                  >
                    <div className="marketing-how-it-works-copy">
                      <span className="marketing-how-it-works-step-number">Step {step.number}</span>
                      <h2>{step.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>
                      <p>{step.description}</p>
                    </div>
                    <HowItWorksVisual step={step} />
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="marketing-subscription-title"
        className="marketing-subscription"
        id="subscription"
        ref={subscriptionSection}
      >
        <div className="marketing-subscription-scroll-stage">
          <div className="marketing-subscription-sticky">
            <header className="marketing-subscription-heading" style={{ "--subscription-title-progress": subscriptionTitleProgress } as CSSProperties}>
              <p className="marketing-subscription-kicker">Subscription</p>
              <h2 id="marketing-subscription-title">Compare Free and MayLamDi+.</h2>
              <p>Free includes two active projects and one AI plan per project. Plus includes 30 AI actions a month.</p>
            </header>
            <SubscriptionComparisonChart
              cardProgress={subscriptionCardProgress}
              freeContentProgress={freeContentProgress}
              plusContentProgress={plusContentProgress}
              currentPlan={currentPlan}
              isAuthenticated={isAuthenticated}
              onStartFree={handleStartFree}
            />
            {subscriptionAuthError ? <p className="marketing-subscription-auth-error" role="alert">{subscriptionAuthError}</p> : null}
          </div>
        </div>
      </section>

      <div className="marketing-final-reveal-stage" ref={finalTransitionStage}>
        <div className="marketing-final-reveal" ref={finalTransition} aria-hidden="true">
          <span className="marketing-final-reveal-circle" />
        </div>
      </div>

      <section
        aria-labelledby="marketing-final-title"
        className={`marketing-final-cta${finalEntered ? " is-entered" : ""}${finalEntered && finalScrollDirection === "reverse" ? " is-reversing" : ""}`}
        id="final-cta"
        ref={finalSection}
      >
        <div className="marketing-final-cta-inner">
          <nav className="marketing-final-cta-nav" aria-label="MayLamDi account actions">
            {isAuthenticated ? (
              <>
                <button type="button" onClick={() => void handleSwitchAccount()}>Switch account</button>
                <button type="button" onClick={() => void signOut()}>Sign out</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => void handleStartFree("SIGN UP")}>Sign up</button>
                <button type="button" onClick={() => void handleStartFree("LOG IN")}>Log in</button>
              </>
            )}
          </nav>

          <div className="marketing-final-cta-lockup">
            <div className="marketing-final-cta-action-row">
              <div className="marketing-final-cta-arrow" aria-hidden="true">
                <span className="marketing-final-cta-arrow-line" />
                <span className="marketing-final-cta-arrow-head">→</span>
              </div>
              {isAuthenticated ? (
                <Link className="marketing-final-cta-explore" to="/home">Go to Projects</Link>
              ) : (
                <Link className="marketing-final-cta-explore" to="/projects/create">Explore</Link>
              )}
            </div>

            <div className="marketing-final-cta-title-frame">
              <h2 id="marketing-final-title">MayLamDi</h2>
            </div>
          </div>
        </div>
      </section>

      {burstWords.length > 0 ? (
        <div className="maylamdi-burst" aria-hidden="true">
          {burstWords.map((word) => (
            <span className="maylamdi-burst-word" key={word.id} style={word.style}>MAYLAMDI</span>
          ))}
        </div>
      ) : null}
    </main>
  );
}
