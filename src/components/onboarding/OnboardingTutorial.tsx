import { useEffect, useState, useCallback, useRef } from "react";
import "./onboardingTutorial.css";

export interface TutorialStep {
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  onEnter?: () => void;
}

export interface OnboardingTutorialProps {
  steps: TutorialStep[];
  isOpen: boolean;
  storageKey?: string;
  onStepChange?: (stepIndex: number, step: TutorialStep) => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OnboardingTutorial({
  steps,
  isOpen,
  storageKey,
  onStepChange,
  onComplete,
  onSkip,
}: OnboardingTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const retryRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const step = steps[currentStepIndex];

  const updatePosition = useCallback(() => {
    if (!isOpen || !step) return;

    // Find all matching elements and choose the one currently visible in the viewport
    const candidates = Array.from(document.querySelectorAll(`[data-tour="${step.target}"]`));
    if (candidates.length === 0) {
      // Element may be rendering or mounting asynchronously; retry after a frame
      retryRef.current = window.requestAnimationFrame(updatePosition);
      return;
    }

    const element = candidates.find((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const htmlEl = el instanceof HTMLElement ? el : null;
      const isHidden = style.display === "none" || htmlEl?.style.display === "none" ||
                       style.visibility === "hidden" || htmlEl?.style.visibility === "hidden" ||
                       parseFloat(style.opacity || "1") === 0;
      if (isHidden) return false;

      // In real browser where layout engine computes rects
      if (rect.width > 0 && rect.height > 0) {
        return (
          rect.bottom > 0 &&
          rect.top < window.innerHeight &&
          rect.right > 0 &&
          rect.left < window.innerWidth
        );
      }
      return true;
    }) || candidates[0];

    // Ensure active element is marked for elevated z-index and high contrast
    document.querySelectorAll(".mld-tour-active-target").forEach((el) => {
      if (el !== element) {
        el.classList.remove("mld-tour-active-target");
      }
    });
    element.classList.add("mld-tour-active-target");

    const rect = element.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    const isMobile = window.innerWidth <= 768;
    const isBottomNav = rect.bottom > window.innerHeight - 120;
    const cardWidth = Math.min(340, window.innerWidth - 32);
    const cardHeight = cardRef.current?.offsetHeight || 210;
    const margin = 12;

    let top = 0;
    let left = 0;
    let preferredPlacement = step.placement || "bottom";

    // On mobile or when target is in bottom navigation bar, force placement to top
    if (isBottomNav || (isMobile && (preferredPlacement === "right" || preferredPlacement === "left"))) {
      preferredPlacement = "top";
    }

    if (preferredPlacement === "top") {
      top = rect.top - cardHeight - margin;
      left = rect.left + (rect.width - cardWidth) / 2;
    } else if (preferredPlacement === "bottom") {
      top = rect.bottom + margin;
      left = rect.left + (rect.width - cardWidth) / 2;
    } else if (preferredPlacement === "right") {
      left = rect.right + margin;
      top = rect.top + (rect.height - cardHeight) / 2;
      if (left + cardWidth > window.innerWidth - 16) {
        top = isBottomNav ? rect.top - cardHeight - margin : rect.bottom + margin;
        left = rect.left + (rect.width - cardWidth) / 2;
      }
    } else if (preferredPlacement === "left") {
      left = rect.left - cardWidth - margin;
      top = rect.top + (rect.height - cardHeight) / 2;
      if (left < 16) {
        top = isBottomNav ? rect.top - cardHeight - margin : rect.bottom + margin;
        left = rect.left + (rect.width - cardWidth) / 2;
      }
    }

    // Viewport safety boundary clamping
    top = Math.max(16, Math.min(top, window.innerHeight - cardHeight - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));

    setCardPosition({ top, left });
  }, [isOpen, step]);

  const prevStepIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !step) return;
    if (prevStepIndexRef.current !== currentStepIndex) {
      prevStepIndexRef.current = currentStepIndex;
      if (step.onEnter) {
        step.onEnter();
      }
      if (onStepChange) {
        onStepChange(currentStepIndex, step);
      }

      // Smoothly scroll target element into comfortable view
      setTimeout(() => {
        const candidates = Array.from(document.querySelectorAll(`[data-tour="${step.target}"]`));
        const targetEl = candidates.find((el) => {
          const style = window.getComputedStyle(el);
          const htmlEl = el instanceof HTMLElement ? el : null;
          return !(style.display === "none" || htmlEl?.style.display === "none" || style.visibility === "hidden");
        }) || candidates[0];

        if (targetEl && !targetEl.closest(".mobile-bottom-nav, .app-header")) {
          try {
            targetEl.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          } catch {}
        }
      }, 30);
    }

    const timer1 = setTimeout(() => updatePosition(), 60);
    const timer2 = setTimeout(() => updatePosition(), 220);
    const timer3 = setTimeout(() => updatePosition(), 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, currentStepIndex, step, onStepChange, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      if (retryRef.current !== null) {
        window.cancelAnimationFrame(retryRef.current);
      }
    };
  }, [isOpen, updatePosition]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    return () => {
      document.querySelectorAll(".mld-tour-active-target").forEach((el) => {
        el.classList.remove("mld-tour-active-target");
      });
    };
  }, []);

  const handleFinish = () => {
    document.querySelectorAll(".mld-tour-active-target").forEach((el) => {
      el.classList.remove("mld-tour-active-target");
    });
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "true");
      } catch {}
    }
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    document.querySelectorAll(".mld-tour-active-target").forEach((el) => {
      el.classList.remove("mld-tour-active-target");
    });
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "true");
      } catch {}
    }
    if (onSkip) onSkip();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length]);

  if (!isOpen || !step) return null;

  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="mld-tutorial-overlay" role="dialog" aria-modal="true" aria-label="Interactive Onboarding Tutorial">
      <div className="mld-tutorial-scrim" onClick={handleSkip} />

      {targetRect && (
        <div
          className="mld-tutorial-spotlight"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}

      <div
        ref={cardRef}
        className="mld-tutorial-card"
        style={{
          top: `${cardPosition.top}px`,
          left: `${cardPosition.left}px`,
        }}
      >
        <div className="mld-tutorial-header">
          <span className="mld-tutorial-step-indicator">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        <h3 className="mld-tutorial-title">{step.title}</h3>
        <p className="mld-tutorial-description">{step.description}</p>

        <div className="mld-tutorial-actions">
          <button
            type="button"
            className="mld-tutorial-btn-skip"
            onClick={handleSkip}
          >
            Skip
          </button>

          <div className="mld-tutorial-actions-right">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                className="mld-tutorial-btn-prev"
                onClick={handlePrev}
              >
                Previous
              </button>
            ) : null}
            <button
              type="button"
              className="mld-tutorial-btn-next"
              onClick={handleNext}
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
