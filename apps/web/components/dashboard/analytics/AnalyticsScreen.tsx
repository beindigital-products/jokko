"use client"

import type { ReactNode } from "react"
import { Download, SlidersHorizontal } from "lucide-react"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { AnalyticsKpiCard } from "./AnalyticsKpiCard"
import { VolumeCard } from "./VolumeCard"
import { TopAgentsCard } from "./TopAgentsCard"
import { StatusBreakdownCard } from "./StatusBreakdownCard"
import { PeakHoursCard } from "./PeakHoursCard"
import type { AnalyticsData } from "./types"

/**
 * AnalyticsScreen — v3 "Analytics" page (Insights). Composes KPI cards +
 * volume chart + top agents + status donut + peak-hours heatmap. Recreates
 * `Jokko Desktop.html` ScreenAnalytics.
 *
 * `eyebrow`/`actions` default to the static design, but the dashboard page
 * overrides them with the live period label + real date-picker / CSV export.
 */
export function AnalyticsScreen({
    data,
    eyebrow = "Insights · 30 derniers jours",
    actions,
}: {
    data: AnalyticsData
    eyebrow?: string
    actions?: ReactNode
}) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={eyebrow}
                title="Analytics"
                description="Volume, temps de réponse, taux de réponse et performance des agents."
                actions={
                    actions ?? (
                        <>
                            <HeaderButton icon={SlidersHorizontal}>30 derniers jours</HeaderButton>
                            <HeaderButton icon={Download}>Exporter</HeaderButton>
                        </>
                    )
                }
            />

            <div className="flex-1 space-y-5 overflow-y-auto bg-[var(--paper-warm)]/30 px-7 pb-8 pt-10">
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                    {data.kpis.map((k) => (
                        <AnalyticsKpiCard key={k.label} kpi={k} />
                    ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <VolumeCard volume={data.volume} channels={data.channels} />
                    <TopAgentsCard agents={data.topAgents} />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <StatusBreakdownCard status={data.status} />
                    <PeakHoursCard data={data.heatmap} />
                </div>
            </div>
        </div>
    )
}
