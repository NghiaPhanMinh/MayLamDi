import { useEffect, useState, useCallback, useRef } from "react";
import "./onboardingTutorial.css";

export interface TutorialStep {
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export interface OnboardingTutorialProps {
  steps: TutorialStep[];
  isOpen: boolean;
  storageKey?: string;
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
  onComplete,
  onSkip,
}: OnboardingTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const retryRef = useRef<number | null>(null);

  const step = steps[currentStepIndex];

  const updatePosition = useCallback(() => {
    if (!isOpen || !step) return;

    const element = document.querySelector(`[data-tour="${step.target}"]`);
    if (!element) {
      // Element may be rendering or mounting asynchronously; retry after a frame
      retryRef.current = window.requestAnimationFrame(updatePosition);
      return;
    }

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

    const cardWidth = Math.min(340, window.innerWidth - 32);
    const cardHeight = 220; // Estimated height for clamping
    const margin = 14;

    let top = 0;
    let left = 0;
    const preferredPlacement = step.placement || "bottom";

    if (preferredPlacement === "bottom") {
      top = rect.bottom + margin;
      left = Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 16));
      if (top + cardHeight > window.innerHeight - 16 && rect.top - cardHeight - margin > 16) {
        top = rect.top - cardHeight - margin;
      }
    } else if (preferredPlacement === "top") {
      top = rect.top - cardHeight - margin;
      left = Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 16));
      if (top < 16) {
        top = rect.bottom + margin;
      }
    } else if (preferredPlacement === "right") {
      left = rect.right + margin;
      top = Math.max(16, Math.min(rect.top, window.innerHeight - cardHeight - 16));
      if (left + cardWidth > window.innerWidth - 16) {
        // Fallback to bottom or top if no space on right
        top = rect.bottom + margin;
        left = Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 16));
      }
    } else if (preferredPlacement === "left") {
      left = rect.left - cardWidth - margin;
      top = Math.max(16, Math.min(rect.top, window.innerHeight - cardHeight - 16));
      if (left < 16) {
        top = rect.bottom + margin;
        left = Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 16));
      }
    }

    // Viewport safety boundary clamping
    top = Math.max(16, Math.min(top, window.innerHeight - cardHeight - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));

    setCardPosition({ top, left });
  }, [isOpen, step]);

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
