import type { SlaMetric } from "./types"

interface SlaMetricTileProps {
    metric: SlaMetric
}

/**
 * SlaMetricTile — small surface with a label, a big editorial value
 * (e.g. "3 min") and a mono stat line coloured by tone.
 */
export function SlaMetricTile({ metric }: SlaMetricTileProps) {
    const statColor =
        metric.statTone === "good" ? "var(--status-good)" : "var(--status-warn)"

    return (
        <div
            className="border border-[var(--ink-200)] px-4 py-[14px]"
            style={{ background: "var(--paper-warm)" }}
        >
            <div className="text-[12px] text-[var(--ink-500)]">{metric.label}</div>

            <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-editorial text-[28px] leading-none tracking-[-0.01em] text-[var(--ink-900)]">
                    {metric.value}
                </span>
                <span className="text-[11px] text-[var(--ink-soft)]">cible</span>
            </div>

            <div
                className="mt-2 font-mono text-[11.5px]"
                style={{ color: statColor }}
            >
                {metric.stat}
            </div>
        </div>
    )
}
