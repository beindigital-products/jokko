import { cn } from "@/lib/utils"

interface MetricProps {
    eyebrow: string
    value: string
    trend?: string
    trendDirection?: "up" | "down" | "neutral"
    className?: string
}

/**
 * Metric — KPI card content. Eyebrow mono uppercase + display bold value
 * + optional trend line. Trend direction colours :
 *   - up   → status-good
 *   - down → status-good (same — context decides whether a decrease is good)
 *   - neutral → ink-soft (use this when the value is just informational)
 */
export function Metric({
    eyebrow,
    value,
    trend,
    trendDirection = "up",
    className,
}: MetricProps) {
    return (
        <div className={className}>
            <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {eyebrow}
            </p>
            <div className="mt-1 font-display text-[28px] font-bold tracking-tight tabular-nums text-[var(--ink-900)]">
                {value}
            </div>
            {trend ? (
                <div
                    className={cn(
                        "mt-0.5 text-[11px]",
                        trendDirection === "neutral"
                            ? "text-[var(--ink-soft)]"
                            : "text-[var(--status-good)]",
                    )}
                >
                    {trend}
                </div>
            ) : null}
        </div>
    )
}
