import { cn } from "@/lib/utils"
import { Avatar } from "../primitives/Avatar"
import { Chip } from "../primitives/Chip"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import { Card, CardTitle, Eyebrow } from "./OverviewCard"
import type { TeamActivityRow } from "./types"

const AGENT_STATUS = (a: TeamActivityRow): "online" | "busy" | "away" | undefined => {
    if (a.state === "online" || a.state === "typing") return "online"
    if (a.state === "busy") return "busy"
    if (a.state === "away") return "away"
    return undefined
}

/** Live team activity: who is online, busy, typing, and their current load. */
export function TeamActivityCard({ rows }: { rows: TeamActivityRow[] }) {
    return (
        <Card>
            <div className="border-b border-[var(--ink-200)] px-[18px] py-3.5">
                <Eyebrow>Équipe en activité</Eyebrow>
                <CardTitle className="mt-1">Qui prend la main</CardTitle>
            </div>
            {rows.length === 0 ? (
                <p className="px-[18px] py-8 text-center text-[12.5px] text-[var(--ink-soft)]">
                    Aucun coéquipier en ligne.
                </p>
            ) : (
                <div>
                    {rows.map((a, i) => (
                        <div
                            key={a.id}
                            className={cn(
                                "flex items-center gap-3 px-[18px] py-2.5",
                                i < rows.length - 1 && "border-b border-[var(--ink-100)]",
                            )}
                        >
                            <Avatar
                                initials={initialsFromName(a.name)}
                                color={avatarColorFromString(a.name)}
                                size="sm"
                                status={AGENT_STATUS(a)}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] font-medium tracking-tight text-[var(--ink-900)]">
                                    {a.name}
                                </div>
                                <div
                                    className={cn(
                                        "truncate text-[11.5px]",
                                        a.state === "typing" ? "text-[var(--accent)]" : "text-[var(--ink-soft)]",
                                    )}
                                >
                                    {a.state === "typing" ? (
                                        <span className="font-mono">écrit · </span>
                                    ) : null}
                                    {a.busy !== "—"
                                        ? a.busy
                                        : a.state === "away"
                                          ? "absent"
                                          : "disponible"}
                                </div>
                            </div>
                            <Chip tone="neutral">{a.pole}</Chip>
                            <span className="w-7 text-right font-mono text-[11px] tabular-nums text-[var(--ink-500)]">
                                {a.load}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
