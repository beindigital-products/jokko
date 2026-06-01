import { cn } from "@/lib/utils"
import { Avatar } from "../primitives/Avatar"
import { Chip } from "../primitives/Chip"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import { Card, CardTitle, Eyebrow, MiniBtn } from "./OverviewCard"
import type { AttentionRow, AttentionState } from "./types"

const WAIT_COLOR: Record<AttentionState, string> = {
    unassigned: "text-[var(--ink-500)]",
    stale: "text-[var(--status-warn)]",
    breach: "text-[var(--status-danger)]",
}
const WAIT_PREFIX: Record<AttentionState, string> = {
    unassigned: "Sans assigné · ",
    stale: "En attente · ",
    breach: "SLA dépassé · ",
}

/** Operational triage list: conversations that need attention right now. */
export function AttentionCard({
    title,
    slaLabel,
    rows,
    seeAllHref,
}: {
    title: string
    slaLabel?: string
    rows: AttentionRow[]
    seeAllHref?: string
}) {
    return (
        <Card>
            <div className="flex items-center gap-3 border-b border-[var(--ink-200)] px-[18px] py-3.5">
                <div className="min-w-0 flex-1">
                    <Eyebrow>Demande votre attention</Eyebrow>
                    <CardTitle className="mt-1">{title}</CardTitle>
                </div>
                {slaLabel ? <Chip tone="warn">{slaLabel}</Chip> : null}
                <MiniBtn href={seeAllHref}>Voir tout</MiniBtn>
            </div>
            {rows.length === 0 ? (
                <p className="px-[18px] py-8 text-center text-[12.5px] text-[var(--ink-soft)]">
                    Rien à traiter. Tout est à jour 🎉
                </p>
            ) : (
                <div>
                    {rows.map((c, i) => (
                        <div
                            key={c.id}
                            className={cn(
                                "grid items-center gap-3 px-[18px] py-3",
                                i < rows.length - 1 && "border-b border-[var(--ink-100)]",
                            )}
                            style={{ gridTemplateColumns: "32px 1.4fr 1fr 1fr auto" }}
                        >
                            <Avatar
                                initials={initialsFromName(c.who)}
                                color={avatarColorFromString(c.who)}
                                size="md"
                            />
                            <div className="min-w-0">
                                <div className="truncate text-[13px] font-medium tracking-tight text-[var(--ink-900)]">
                                    {c.who}
                                </div>
                                <div className="truncate text-[12px] text-[var(--ink-soft)]">{c.last}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Chip tone="neutral">{c.channel}</Chip>
                                {c.tags.map((t) => (
                                    <Chip key={t} tone="neutral">
                                        {t}
                                    </Chip>
                                ))}
                            </div>
                            <div
                                className={cn(
                                    "font-mono text-[11.5px] tabular-nums",
                                    WAIT_COLOR[c.state],
                                )}
                            >
                                {WAIT_PREFIX[c.state]}
                                {c.wait}
                            </div>
                            <div className="flex gap-1">
                                <MiniBtn>Assigner</MiniBtn>
                                <MiniBtn tone="primary">Ouvrir</MiniBtn>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
