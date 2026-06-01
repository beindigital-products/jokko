import { ArrowUpRight } from "lucide-react"

import { AnalyticsCard, AnalyticsEyebrow } from "./AnalyticsCard"
import type { AnalyticsKpi } from "./types"

/** One analytics KPI card: label + big value + "↗ delta vs prev." line. */
export function AnalyticsKpiCard({ kpi }: { kpi: AnalyticsKpi }) {
    return (
        <AnalyticsCard>
            <AnalyticsEyebrow>{kpi.label}</AnalyticsEyebrow>
            <div className="mt-4 font-display text-[34px] font-bold leading-none tabular-nums tracking-tight text-[var(--ink-900)]">
                {kpi.value}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[var(--status-good)]">
                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                <span className="font-mono tabular-nums">{kpi.delta}</span>
                <span className="text-[var(--ink-soft)]">{kpi.sub ?? "vs mois préc."}</span>
            </div>
        </AnalyticsCard>
    )
}
