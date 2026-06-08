import type {
    MemberRole,
    MemberStatus,
    Pole,
    TeamData,
    TeamMember,
} from "@/components/dashboard/team"

/**
 * team-data — pure mapper turning real Convex team data
 * (`team.listMembers` + `poles.list`) into the v3 `TeamData` consumed by
 * `TeamScreen`. Side-effect free → unit-testable.
 *
 * Honest reconciliation with the design:
 *  - "sièges" = nonOwnerCount / agent limit (owner is free, like the backend).
 *  - per-pole "conv. ouvertes" is summed client-side from each member's
 *    `activeConversations` (the backend has no per-pole counter), matched by
 *    poleId — real data, no fabrication.
 *  - a member carries a single pole today, surfaced as a one-item array to fit
 *    the design's multi-pole chip row.
 */

export interface TeamMemberDoc {
    id: string
    userId?: string
    role: string
    poleId?: string | null
    poleName?: string | null
    status?: string | null
    activeConversations?: number | null
    joinedAt?: string | null
    user: { name?: string | null; email: string }
}

export interface PoleDoc {
    id: string
    name: string
    color?: string | null
    memberCount?: number | null
}

export interface MembersData {
    members: TeamMemberDoc[]
    nonOwnerCount?: number
    limit?: number
}

export interface PolesData {
    poles: PoleDoc[]
}

/** Fallback bar colors when a pole has no stored color. */
const POLE_FALLBACK_COLORS = [
    "var(--accent)",
    "#7A4FD9",
    "var(--status-good)",
    "var(--status-warn)",
    "#1F6E5A",
    "#B8860B",
]

export function mapRole(role: string): MemberRole {
    const r = (role || "").toLowerCase()
    if (r === "owner") return "OWNER"
    if (r === "admin") return "ADMIN"
    return "AGENT"
}

export function mapStatus(status?: string | null): MemberStatus {
    switch ((status || "").toUpperCase()) {
        case "ONLINE":
            return "online"
        case "BUSY":
            return "busy"
        case "AWAY":
            return "away"
        default:
            return "offline"
    }
}

/** ISO timestamp → "8 mars 2026" (fr). Empty string when missing/invalid. */
export function formatJoined(iso?: string | null): string {
    if (!iso) return "—"
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "—"
    return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

export function mapTeam(membersData: MembersData, polesData: PolesData): TeamData {
    const members = membersData.members ?? []

    // Sum open conversations per pole from member workloads (matched by id).
    const convByPoleId = new Map<string, number>()
    for (const m of members) {
        if (!m.poleId) continue
        const key = String(m.poleId)
        convByPoleId.set(key, (convByPoleId.get(key) ?? 0) + (m.activeConversations ?? 0))
    }

    const poles: Pole[] = (polesData.poles ?? []).map((p, i) => ({
        id: String(p.id),
        name: p.name,
        members: p.memberCount ?? 0,
        conv: convByPoleId.get(String(p.id)) ?? 0,
        color: p.color || POLE_FALLBACK_COLORS[i % POLE_FALLBACK_COLORS.length],
    }))

    const mappedMembers: TeamMember[] = members.map((m) => ({
        id: String(m.id),
        name: m.user.name || m.user.email,
        email: m.user.email,
        role: mapRole(m.role),
        status: mapStatus(m.status),
        conv: m.activeConversations ?? 0,
        poles: m.poleName ? [m.poleName] : [],
        joined: formatJoined(m.joinedAt),
    }))

    const limit = membersData.limit ?? 1
    const used = membersData.nonOwnerCount ?? 0

    return {
        seats: `${used} / ${limit} sièges`,
        poles,
        members: mappedMembers,
    }
}
