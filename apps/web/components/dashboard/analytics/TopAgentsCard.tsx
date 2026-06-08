import { Avatar } from "../primitives/Avatar"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import { AnalyticsCard, AnalyticsEyebrow } from "./AnalyticsCard"
import type { AgentRow } from "./types"

/** Top agents leaderboard (rank + avatar + conv/time/csat). */
export function TopAgentsCard({ agents }: { agents: AgentRow[] }) {
    return (
        <AnalyticsCard>
            <AnalyticsEyebrow>Top agents · 30j</AnalyticsEyebrow>
            <div className="mt-5 flex flex-col gap-3">
                {agents.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3">
                        <span className="w-4 font-mono text-[11px] text-[var(--ink-soft)]">{i + 1}</span>
                        <Avatar
                            initials={initialsFromName(a.name)}
                            color={avatarColorFromString(a.name)}
                            size="sm"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium tracking-tight text-[var(--ink-900)]">
                                {a.name}
                            </div>
                            <div className="font-mono text-[11px] text-[var(--ink-soft)]">
                                {a.conv} conv · {a.time}
                                {a.csat ? ` · ${a.csat}★` : ""}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AnalyticsCard>
    )
}
