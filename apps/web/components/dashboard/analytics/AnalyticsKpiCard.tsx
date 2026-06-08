import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { AnalyticsCard, AnalyticsEyebrow } from "./AnalyticsCard"
import type { AnalyticsKpi } from "./types"

/**
 * One analytics KPI card: label + big value + an optional "↗ delta" line.
 * When the metric has no prior-period comparison, the delta is omitted and a
 * plain `sub` caption shows instead (no fabricated trend).
 */
export function AnalyticsKpiCard({ kpi }: { kpi: AnalyticsKpi }) {
    const down = kpi.trend === "down"
    return (
        <AnalyticsCard>
            <AnalyticsEyebrow>{kpi.label}</AnalyticsEyebrow>
            <div className="mt-4 font-display text-[34px] font-bold leading-none tabular-nums tracking-tight text-[var(--ink-900)]">
                {kpi.value}
            </div>
            {kpi.delta ? (
                <div
                    className={cn(
                        "mt-2.5 flex items-center gap-1.5 text-[12px]",
                        down ? "text-[var(--status-danger)]" : "text-[var(--status-good)]",
                    )}
                >
                    {down ? (
                        <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
                    ) : (
                        <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                    )}
                    <span className="font-mono tabular-nums">{kpi.delta}</span>
                    <span className="text-[var(--ink-soft)]">{kpi.sub ?? "vs période préc."}</span>
                </div>
            ) : kpi.sub ? (
                <div className="mt-2.5 text-[12px] text-[var(--ink-soft)]">{kpi.sub}</div>
            ) : null}
        </AnalyticsCard>
    )
}
