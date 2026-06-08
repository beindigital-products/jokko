import type { ReactNode } from "react"
import { MoreHorizontal } from "lucide-react"

import { Avatar } from "../primitives/Avatar"
import { Chip } from "../primitives/Chip"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import { RolePill } from "./RolePill"
import { MEMBERS_COLS, type MemberStatus, type TeamMember } from "./types"

const STATUS: Record<MemberStatus, { label: string; color: string }> = {
    online: { label: "En ligne", color: "var(--status-good)" },
    busy: { label: "Occupé", color: "var(--status-warn)" },
    away: { label: "Absent", color: "var(--ink-soft)" },
    offline: { label: "Hors ligne", color: "var(--ink-400)" },
}

/**
 * A single member row in the team table. `menu` overrides the trailing ⋮
 * cell — the page passes a wired dropdown; without it a static glyph shows.
 */
export function MemberRow({ member, menu }: { member: TeamMember; menu?: ReactNode }) {
    const s = STATUS[member.status]
    return (
        <div
            className="grid items-center gap-x-5 border-b border-[var(--ink-100)] px-8 transition-colors hover:bg-[var(--paper-warm)]/50"
            style={{ gridTemplateColumns: MEMBERS_COLS, height: 60 }}
        >
            <div className="flex min-w-0 items-center gap-3">
                <Avatar
                    initials={initialsFromName(member.name)}
                    color={avatarColorFromString(member.name)}
                    size="md"
                    status={member.status === "online" ? "online" : undefined}
                />
                <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-medium tracking-tight text-[var(--ink-900)]">
                        {member.name}
                    </div>
                    <div className="truncate text-[11.5px] text-[var(--ink-soft)]">{member.email}</div>
                </div>
            </div>
            <div>
                <RolePill role={member.role} />
            </div>
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: s.color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                {s.label}
            </div>
            <div className="flex flex-wrap gap-1">
                {member.poles.map((p) => (
                    <Chip key={p} tone="neutral">
                        {p}
                    </Chip>
                ))}
            </div>
            <div className="text-right text-[13px] font-medium tabular-nums text-[var(--ink-900)]">
                {member.conv}
            </div>
            <div className="text-[11.5px] text-[var(--ink-soft)]">{member.joined}</div>
            {menu ?? (
                <button
                    type="button"
                    aria-label="Plus"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-400)] hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
