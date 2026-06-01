import { cn } from "@/lib/utils"
import { Card, Eyebrow } from "./OverviewCard"
import type { DeltaTone, OverviewKpi } from "./types"

const DELTA_COLOR: Record<DeltaTone, string> = {
    good: "text-[var(--status-good)]",
    warn: "text-[var(--status-warn)]",
    mute: "text-[var(--ink-soft)]",
}

/** Top KPI row — 4 metrics (value + delta + sub) in a responsive grid. */
export function OverviewKpis({ kpis }: { kpis: OverviewKpi[] }) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k) => (
                <Card key={k.label} className="px-4 py-3.5">
                    <Eyebrow className="text-[9.5px]">{k.label}</Eyebrow>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-[30px] font-bold leading-none tabular-nums tracking-tight text-[var(--ink-900)]">
                            {k.value}
                        </span>
                        {k.delta ? (
                            <span
                                className={cn(
                                    "font-mono text-[11px] font-semibold tabular-nums",
                                    DELTA_COLOR[k.deltaTone ?? "good"],
                                )}
                            >
                                {k.delta}
                            </span>
                        ) : null}
                    </div>
                    <div className="mt-1.5 truncate text-[11px] text-[var(--ink-soft)]">{k.sub}</div>
                </Card>
            ))}
        </div>
    )
}
