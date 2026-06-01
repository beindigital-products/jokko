import { cn } from "@/lib/utils"
import { Card, Eyebrow } from "./OverviewCard"
import type { CampaignRow, CampaignStatus } from "./types"

const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; mark: string; color: string }> = {
    sending: { label: "en cours", mark: "●", color: "text-[var(--accent)]" },
    completed: { label: "terminée", mark: "✓", color: "text-[var(--status-good)]" },
    paused: { label: "pause", mark: "‖", color: "text-[var(--status-warn)]" },
}

/** Recent broadcast campaigns with a delivery progress bar each. */
export function CampaignsCard({ rows, total }: { rows: CampaignRow[]; total?: string }) {
    return (
        <Card className="px-[18px] py-4">
            <div className="flex items-baseline justify-between">
                <Eyebrow>Campagnes récentes</Eyebrow>
                {total ? (
                    <span className="font-mono text-[10.5px] text-[var(--ink-soft)]">{total}</span>
                ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-3">
                {rows.map((c) => {
                    const s = CAMPAIGN_STATUS[c.status]
                    return (
                        <div key={c.id}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                <span className="truncate text-[12.5px] font-medium tracking-tight text-[var(--ink-900)]">
                                    {c.name}
                                </span>
                                <span className={cn("shrink-0 font-mono text-[10.5px]", s.color)}>
                                    {s.mark} {s.label}
                                </span>
                            </div>
                            <div className="h-[3px] overflow-hidden rounded-full bg-[var(--ink-100)]">
                                <div
                                    className={cn(
                                        "h-full rounded-full",
                                        c.status === "paused"
                                            ? "bg-[var(--status-warn)]"
                                            : "bg-[var(--accent)]",
                                    )}
                                    style={{ width: `${c.deliveredPct}%` }}
                                />
                            </div>
                            <div className="mt-1.5 font-mono text-[11px] text-[var(--ink-soft)]">
                                {c.delivered} livrés · {c.read} lus
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}
