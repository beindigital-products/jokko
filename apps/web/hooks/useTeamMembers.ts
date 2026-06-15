import { useMemo } from "react"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import type { MentionMember } from "@/components/dashboard/inbox"
import type { ChipTone } from "@/components/dashboard/primitives/Chip"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"

function roleTone(role: string): ChipTone {
    const r = role.toLowerCase()
    if (r === "owner") return "dark"
    if (r === "admin") return "accent"
    return "neutral"
}

/**
 * useTeamMembers — org teammates shaped for the @ MentionPicker.
 * Wraps team.listMembers and maps to MentionMember (id, name, initials,
 * color, role chip, online status). Also exposes a userId → name map for
 * resolving note authors + mention chips.
 */
export function useTeamMembers() {
    const data = useQuery(api.team.listMembers, {})

    const members = useMemo<MentionMember[]>(() => {
        if (!data?.members) return []
        return data.members.flatMap((m) => {
            if (!m) return []
            return [{
                id: m.userId,
                name: m.user.name || m.user.email || "Coéquipier",
                initials: initialsFromName(m.user.name, m.user.email),
                color: avatarColorFromString(m.user.name || m.user.email || m.userId),
                role: m.role?.toUpperCase(),
                roleTone: roleTone(m.role ?? "agent"),
                online: m.status === "ONLINE",
            }]
        })
    }, [data])

    const nameByUserId = useMemo(() => {
        const map = new Map<string, string>()
        for (const m of members) map.set(m.id, m.name)
        return map
    }, [members])

    return { members, nameByUserId, isLoading: data === undefined }
}
