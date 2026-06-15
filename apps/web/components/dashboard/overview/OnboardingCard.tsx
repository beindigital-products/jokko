import { Check, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardTitle, Eyebrow } from "./OverviewCard"
import type { OnboardingStep } from "./types"

/** Mise en route checklist with completion ticks + progress label. */
export function OnboardingCard({
    steps,
    progressLabel,
    headline,
}: {
    steps: OnboardingStep[]
    progressLabel?: string
    headline?: string
}) {
    return (
        <Card className="bg-gradient-to-b from-[var(--accent)]/[0.04] to-transparent px-[18px] py-4">
            <div className="flex items-baseline justify-between">
                <Eyebrow>Mise en route</Eyebrow>
                {progressLabel ? (
                    <span className="font-mono text-[10.5px] font-semibold text-[var(--accent)]">
                        {progressLabel}
                    </span>
                ) : null}
            </div>
            {headline ? <CardTitle className="mt-1 text-[18px]">{headline}</CardTitle> : null}
            <div className="mt-3.5 flex flex-col gap-2">
                {steps.map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                        <span
                            className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                                s.done
                                    ? "border-[var(--status-good)] bg-[var(--status-good)]"
                                    : "border-[var(--ink-300)] bg-transparent",
                            )}
                        >
                            {s.done ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
                        </span>
                        <span
                            className={cn(
                                "flex-1 text-[12.5px] tracking-tight",
                                s.done
                                    ? "text-[var(--ink-soft)] line-through"
                                    : "text-[var(--ink-900)]",
                            )}
                        >
                            {s.label}
                        </span>
                        {!s.done ? <ChevronRight className="h-3.5 w-3.5 text-[var(--accent)]" /> : null}
                    </div>
                ))}
            </div>
        </Card>
    )
}
