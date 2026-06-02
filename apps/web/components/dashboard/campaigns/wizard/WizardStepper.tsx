import { cn } from "@/lib/utils"
import { CAMPAIGN_STEPS, type WizardStepId } from "./types"

interface WizardStepperProps {
    current: WizardStepId
    /** Click a completed/visited step to jump back. */
    onStepClick?: (id: WizardStepId) => void
}

/**
 * WizardStepper — the 6-step progress header for the campaign wizard.
 * Done steps show a green ✓, the current step is ink, future steps are muted.
 * Recreates the `CampaignWizard` stepper from the design.
 */
export function WizardStepper({ current, onStepClick }: WizardStepperProps) {
    return (
        <div className="flex items-center gap-2 border-b border-[var(--ink-200)] px-8 py-3.5">
            {CAMPAIGN_STEPS.map((s, i) => {
                const done = s.id < current
                const active = s.id === current
                const clickable = onStepClick && s.id <= current
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
                                    active
                                        ? "font-semibold text-[var(--ink-900)]"
                                        : "font-medium text-[var(--ink-500)]",
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
