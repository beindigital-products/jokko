"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type {
  OnboardingStep,
  OnboardingStepKey,
} from "@/lib/onboarding/steps"

/**
 * OnboardingProgress — v3 stepper.
 *
 * Per onboarding v3 design spec :
 *   - 4 numbered circles (all `rounded-full`, uniform shape) connected by a line.
 *   - Current = violet filled circle, white mono number.
 *   - Completed = violet filled circle + white check icon.
 *   - Future = paper-white circle, `ink-200` border, ink-400 number.
 *
 * Click-back interactivity preserved : completed steps are clickable with
 * a violet hover affordance. Future steps are not (no skip-ahead).
 *
 * a11y :
 *   - source text in natural case ; CSS handles uppercase for the
 *     step labels (mono tracker style) so screen readers pronounce words.
 *   - `aria-current="step"` on the active step.
 *   - Buttons that aren't clickable use `aria-disabled` + visual cue.
 */
interface OnboardingProgressProps {
  steps: OnboardingStep[]
  currentStepKey: OnboardingStepKey
  onStepClick: (stepKey: string) => void
}

export function OnboardingProgress({
  steps,
  currentStepKey,
  onStepClick,
}: OnboardingProgressProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStepKey)

  return (
    <nav
      aria-label="Progression de l'onboarding"
      className="mb-8 sm:mb-10"
    >
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = step.key === currentStepKey
          const isClickable = isCompleted

          return (
            <li
              key={step.key}
              className="relative flex flex-1 flex-col items-center"
            >
              {/* Connecting line LEFT of the marker (not on first step) */}
              {index > 0 ? (
                <div
                  aria-hidden
                  className={cn(
                    "absolute right-1/2 top-5 h-px w-1/2 -translate-y-1/2 transition-colors duration-300 sm:top-6",
                    index <= currentIndex
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--ink-200)]"
                  )}
                />
              ) : null}

              {/* Connecting line RIGHT of the marker (not on last step) */}
              {index < steps.length - 1 ? (
                <div
                  aria-hidden
                  className={cn(
                    "absolute left-1/2 top-5 h-px w-1/2 -translate-y-1/2 transition-colors duration-300 sm:top-6",
                    index < currentIndex
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--ink-200)]"
                  )}
                />
              ) : null}

              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.key)}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={!isClickable}
                aria-label={`Étape ${step.order} sur ${steps.length}: ${step.title}${isCompleted ? " (complété)" : ""}${isCurrent ? " (étape actuelle)" : ""}`}
                data-state={
                  isCurrent
                    ? "current"
                    : isCompleted
                      ? "completed"
                      : "future"
                }
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-mono font-semibold transition-all duration-300 sm:h-12 sm:w-12",
                  // Current = violet filled circle (uniform shape with completed)
                  isCurrent &&
                    "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_8px_20px_-8px_var(--accent-glow)]",
                  // Completed = violet filled circle with check
                  isCompleted &&
                    "bg-[var(--accent)] text-[var(--accent-foreground)]",
                  // Future = outlined circle, dim ink-400
                  !isCurrent &&
                    !isCompleted &&
                    "border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-400)]",
                  // Interactivity affordance
                  isClickable &&
                    "cursor-pointer hover:bg-[var(--accent-hover)]",
                  !isClickable && "cursor-default"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} aria-hidden />
                ) : (
                  String(step.order)
                )}
              </button>

              <span
                className={cn(
                  "mt-2.5 hidden max-w-[110px] text-center font-mono text-[10px] uppercase tracking-[0.15em] transition-colors sm:mt-3 sm:block",
                  isCurrent && "text-[var(--ink-900)]",
                  isCompleted && "text-[var(--ink-700)]",
                  !isCompleted && !isCurrent && "text-[var(--ink-400)]"
                )}
              >
                {step.title}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
