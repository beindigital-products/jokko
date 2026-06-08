import { AnalyticsCard, AnalyticsEyebrow } from "./AnalyticsCard"
import { VolumeChart, type VolumePoint } from "./AnalyticsCharts"
import type { ChannelLegend } from "./types"

/** Conversation volume card: title + channel legend + 30-day stacked bars. */
export function VolumeCard({
    volume,
    channels,
}: {
    volume: VolumePoint[]
    channels: ChannelLegend[]
}) {
    return (
        <AnalyticsCard className="lg:col-span-2">
            <div className="mb-6 flex items-baseline justify-between gap-3">
                <div>
                    <AnalyticsEyebrow>Volume de messages</AnalyticsEyebrow>
                    <div className="mt-1 font-editorial text-[20px] tracking-tight text-[var(--ink-900)]">
                        Sur la période · par type
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[11.5px] text-[var(--ink-700)]">
                    {channels.map((c) => (
                        <span key={c.key} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                            {c.label}
                        </span>
                    ))}
                </div>
            </div>
            <VolumeChart data={volume} channels={channels} />
        </AnalyticsCard>
    )
}
