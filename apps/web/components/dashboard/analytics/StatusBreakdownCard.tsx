import { AnalyticsCard, AnalyticsEyebrow } from "./AnalyticsCard"
import { StatusDonut, type StatusSlice } from "./AnalyticsCharts"

/** Conversation status split: donut + legend with percentages. */
export function StatusBreakdownCard({ status }: { status: StatusSlice[] }) {
    return (
        <AnalyticsCard>
            <AnalyticsEyebrow>Répartition par statut</AnalyticsEyebrow>
            <div className="mt-5 flex items-center gap-6">
                <StatusDonut data={status} />
                <ul className="flex-1 space-y-2.5">
                    {status.map((s) => (
                        <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                            <span className="flex-1 tracking-tight text-[var(--ink-900)]">{s.label}</span>
                            <span className="font-mono text-[12px] font-medium tabular-nums text-[var(--ink-700)]">
                                {s.value}%
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </AnalyticsCard>
    )
}
