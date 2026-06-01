import { cn } from "@/lib/utils"
import { CampaignStatusPill } from "./CampaignStatusPill"
import { CAMPAIGNS_COLS, type CampaignRow as CampaignRowData } from "./types"

/** A single broadcast row: name + progress/hint, status, template, stats. */
export function CampaignRow({ campaign: c }: { campaign: CampaignRowData }) {
    return (
        <div
            className="grid items-start gap-x-5 border-b border-[var(--ink-100)] px-8 py-3.5 transition-colors hover:bg-[var(--paper-warm)]/50"
            style={{ gridTemplateColumns: CAMPAIGNS_COLS, minHeight: 72 }}
        >
            <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium tracking-tight text-[var(--ink-900)]">
                    {c.name}
                </div>
                {c.progress != null && c.progress > 0 && c.progress < 1 ? (
                    <div className="mt-1.5 h-[3px] max-w-[240px] overflow-hidden rounded-full bg-[var(--ink-100)]">
                        <div
                            className={cn(
                                "h-full rounded-full",
                                c.status === "paused" ? "bg-[var(--status-warn)]" : "bg-[var(--accent)]",
                            )}
                            style={{ width: `${c.progress * 100}%` }}
                        />
                    </div>
                ) : c.hint ? (
                    <div
                        className={cn(
                            "mt-1 text-[11.5px]",
                            c.hintTone === "accent"
                                ? "font-mono text-[var(--accent)]"
                                : "text-[var(--ink-soft)]",
                        )}
                    >
                        {c.hint}
                    </div>
                ) : null}
            </div>
            <div>
                <CampaignStatusPill status={c.status} />
                <div className="mt-1 text-[11.5px] text-[var(--ink-soft)]">{c.start}</div>
            </div>
            <div className="truncate text-[12.5px] text-[var(--ink-500)]">{c.tpl}</div>
            <div className="text-right text-[13px] font-medium tabular-nums text-[var(--ink-900)]">
                {c.audience}
            </div>
            <div className="text-right text-[13px] tabular-nums text-[var(--ink-500)]">{c.delivered}</div>
            <div className="text-right text-[13px] tabular-nums text-[var(--ink-900)]">{c.read}</div>
            <div className="text-right font-mono text-[12px] tabular-nums text-[var(--ink-500)]">
                {c.cost}
            </div>
        </div>
    )
}
