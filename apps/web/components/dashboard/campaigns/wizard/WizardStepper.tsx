import { cn } from "@/lib/utils"
import { CAMPAIGN_STEPS, type WizardStepId } from "./types"

interface WizardStepperProps {
    current: WizardStepId
    /** Highest step reached — steps up to this are clickable. */
    maxStep?: WizardStepId
    /** Jump to a reachable step. */
    onStepClick?: (id: WizardStepId) => void
}

/**
 * WizardStepper — the 6-step progress header for the campaign wizard.
 * Done steps show a green ✓, the current step is ink, future steps are muted.
 * Steps up to `maxStep` (the furthest reached) are clickable. Recreates the
 * design's `CwStepper`.
 */
export function WizardStepper({ current, maxStep = current, onStepClick }: WizardStepperProps) {
    return (
        <div className="flex items-center gap-1.5 border-b border-[var(--ink-200)] px-6 py-3.5">
            {CAMPAIGN_STEPS.map((s, i) => {
                const done = s.id < current
                const active = s.id === current
                const reachable = s.id <= maxStep
                const clickable = Boolean(onStepClick) && reachable
                return (
                    <div key={s.id} className="flex flex-1 items-center gap-1.5">
                        <button
                            type="button"
                            disabled={!clickable}
                            onClick={clickable ? () => onStepClick?.(s.id) : undefined}
                            className={cn(
                                "flex items-center gap-1.5",
                                clickable ? "cursor-pointer" : "cursor-default",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold",
                                    done && "border-transparent bg-[var(--status-good)] text-white",
                                    active && "border-transparent bg-[var(--ink-900)] text-white",
                                    !done && !active && "border-[var(--ink-200)] bg-[var(--paper-warm)] text-[var(--ink-soft)]",
                                )}
                            >
                                {done ? "✓" : s.id}
                            </span>
                            <span
                                className={cn(
                                    "whitespace-nowrap text-[11.5px]",
                                    active && "font-semibold text-[var(--ink-900)]",
                                    !active && reachable && "font-medium text-[var(--ink-500)]",
                                    !active && !reachable && "font-medium text-[var(--ink-soft)]",
                                )}
                            >
                                {s.label}
                            </span>
                        </button>
                        {i < CAMPAIGN_STEPS.length - 1 ? (
                            <span
                                className="h-px flex-1"
                                style={{ background: done ? "var(--status-good)" : "var(--ink-200)" }}
                            />
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}
