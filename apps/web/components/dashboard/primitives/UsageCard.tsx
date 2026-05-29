import { cn } from "@/lib/utils"

export type UsageCardTone = "accent" | "good" | "warn" | "danger"

interface UsageCardProps {
    label: string
    value: string
    total: string
    sub?: string
    /** 0-100, optional — auto-computed from value/total if both are parseable. */
    percent?: number
    tone?: UsageCardTone
    className?: string
}

const BAR: Record<UsageCardTone, string> = {
    accent: "bg-[var(--accent)]",
    good: "bg-[var(--status-good)]",
    warn: "bg-[var(--status-warn)]",
    danger: "bg-[var(--status-danger)]",
}

function parseNum(s: string): number {
    const n = parseFloat(s.replace(/[\s,€$%]/g, ""))
    return Number.isFinite(n) ? n : NaN
}

export function UsageCard({
    label,
    value,
    total,
    sub,
    percent,
    tone = "accent",
    className,
}: UsageCardProps) {
    const computedPct =
        percent ??
        (() => {
            const v = parseNum(value)
            const t = parseNum(total)
            if (!Number.isFinite(v) || !Number.isFinite(t) || t === 0) return 0
            return Math.min(100, Math.max(0, (v / t) * 100))
        })()

    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-4",
                className,
            )}
        >
            <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {label}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-[26px] font-bold tabular-nums text-[var(--ink-900)]">
                    {value}
                </span>
                <span className="text-[11px] text-[var(--ink-soft)]">/ {total}</span>
            </div>
            <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ink-100)]"
                role="progressbar"
                aria-valuenow={computedPct}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className={cn("h-full rounded-full", BAR[tone])}
                    style={{ width: `${computedPct}%` }}
                />
            </div>
            {sub ? <p className="mt-2 text-[11px] text-[var(--ink-soft)]">{sub}</p> : null}
        </div>
    )
}
