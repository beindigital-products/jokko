import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import type { ContactsTableEntry } from "@/components/dashboard/contacts"

/** Minimal contact shape the page already maps from Convex. */
export interface ContactInput {
    id: string
    phone: string
    name?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    tags?: { id: string; name: string; color?: string }[]
    createdAt: number
}

/** Best display name: explicit name → first+last → phone → fallback. */
export function contactDisplayName(c: Pick<ContactInput, "name" | "firstName" | "lastName" | "phone">): string {
    return (
        c.name ||
        [c.firstName, c.lastName].filter(Boolean).join(" ") ||
        c.phone ||
        "Sans nom"
    )
}

/** Relative French "added" label from a timestamp ("il y a 3 j", or a date). */
export function relativeAdded(ts: number, now: number): string {
    const diff = Math.max(0, now - ts)
    const min = Math.floor(diff / 60_000)
    const hours = Math.floor(min / 60)
    const days = Math.floor(hours / 24)
    if (min < 1) return "à l'instant"
    if (min < 60) return `il y a ${min} min`
    if (hours < 24) return `il y a ${hours} h`
    if (days < 7) return `il y a ${days} j`
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

/** Maps a real contact to the v3 ContactsTable/Grid entry shape. */
export function mapContactToEntry(c: ContactInput, now: number): ContactsTableEntry {
    const name = contactDisplayName(c)
    return {
        id: c.id,
        name,
        initials: initialsFromName(c.name ?? undefined, c.phone),
        color: avatarColorFromString(name),
        phone: c.phone,
        email: c.email ?? undefined,
        tags: (c.tags ?? []).slice(0, 3).map((t) => ({ label: t.name.toUpperCase() })),
        lastExchange: relativeAdded(c.createdAt, now),
    }
}
