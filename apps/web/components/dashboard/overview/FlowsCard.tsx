import { Zap } from "lucide-react"

import { Card, Eyebrow } from "./OverviewCard"
import type { FlowRow } from "./types"

/** Active automation flows with run counts + 24h total. */
export function FlowsCard({
    items,
    activeLabel,
    total24h,
}: {
    items: FlowRow[]
    activeLabel?: string
    total24h?: string
}) {
    return (
        <Card className="px-[18px] py-4">
            <div className="flex items-baseline justify-between">
                <Eyebrow>Flows actifs</Eyebrow>
                {activeLabel ? (
                    <span className="font-mono text-[10.5px] text-[var(--ink-soft)]">{activeLabel}</span>
                ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
                {items.map((f) => (
                    <div key={f.id} className="flex items-center gap-2.5">
                        <Zap className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                        <span className="flex-1 truncate text-[12.5px] font-medium tracking-tight text-[var(--ink-900)]">
                            {f.name}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-500)]">
                            {f.runs}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--ink-soft)]">/{f.period}</span>
                    </div>
                ))}
            </div>
            {total24h ? (
                <div className="mt-3.5 flex justify-between border-t border-[var(--ink-100)] pt-3 text-[11px] text-[var(--ink-500)]">
                    <span>Total 24h</span>
                    <span className="font-mono font-semibold text-[var(--ink-900)]">{total24h}</span>
                </div>
            ) : null}
        </Card>
    )
}
