import { cn } from "@/lib/utils"

export type ProgressTone = "accent" | "good" | "warn" | "danger"

interface ProgressBarProps {
    /** Filled fraction, 0–1. Clamped. */
    value: number
    tone?: ProgressTone
    /** Use the thicker 6px track instead of the default 3px hairline. */
    thick?: boolean
    className?: string
}

const FILL: Record<ProgressTone, string> = {
    accent: "bg-[var(--accent)]",
    good: "bg-[var(--status-good)]",
    warn: "bg-[var(--status-warn)]",
    danger: "bg-[var(--status-danger)]",
}

/**
 * ProgressBar — slim rounded meter on a tinted track. The shared primitive
 * behind usage meters, credit estimates and the trial banner's elapsed bar.
 * Track is `--ink-100`; the fill is tinted by `tone`.
 */
export function ProgressBar({ value, tone = "accent", thick = false, className }: ProgressBarProps) {
    const pct = Math.min(100, Math.max(0, value * 100))
    return (
        <div
            className={cn(
                "overflow-hidden rounded-full bg-[var(--ink-100)]",
                thick ? "h-1.5" : "h-[3px]",
                className,
            )}
        >
            <div className={cn("h-full rounded-full", FILL[tone])} style={{ width: `${pct}%` }} />
        </div>
    )
}
