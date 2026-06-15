import { Fragment } from "react"

import { AnalyticsCard, AnalyticsEyebrow } from "./AnalyticsCard"
import type { HeatPoint } from "./types"

/** Peak hours heatmap (7 days × hours) + peak summary. */
export function PeakHoursCard({ data }: { data: HeatPoint }) {
    return (
        <AnalyticsCard>
            <AnalyticsEyebrow>Heures de pointe</AnalyticsEyebrow>
            <div className="mt-5">
                <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `20px repeat(${data.hours.length}, 1fr)` }}
                >
                    <div />
                    {data.hours.map((h) => (
                        <div key={h} className="text-center font-mono text-[10px] text-[var(--ink-soft)]">
                            {h}
                        </div>
                    ))}
                    {data.days.map((d, di) => (
                        <Fragment key={di}>
                            <div className="flex items-center justify-end font-mono text-[10px] text-[var(--ink-soft)]">
                                {d}
                            </div>
                            {data.rows[di].map((v, hi) => (
                                <div
                                    key={hi}
                                    className="h-[22px] rounded"
                                    style={{ background: `rgba(105, 56, 239, ${0.08 + v * 0.8})` }}
                                />
                            ))}
                        </Fragment>
                    ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11.5px] text-[var(--ink-500)]">
                    <span>
                        Peak : <b className="text-[var(--ink-900)]">{data.peakLabel}</b>
                    </span>
                    {data.hint ? (
                        <>
                            <span className="text-[var(--ink-400)]">·</span>
                            <span>{data.hint}</span>
                        </>
                    ) : null}
                </div>
            </div>
        </AnalyticsCard>
    )
}
