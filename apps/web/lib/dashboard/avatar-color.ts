import type { AvatarColor } from "@/components/dashboard/primitives/Avatar"

const PALETTE: AvatarColor[] = [
    "violet",
    "emerald",
    "rose",
    "amber",
    "sky",
    "indigo",
    "crimson",
    "teal",
]

/**
 * Deterministically maps an arbitrary string (contact name, phone, user id)
 * to one of the 8 avatar gradient colors. Same input always yields the same
 * color across sessions — no schema field needed (Q2=a).
 */
export function avatarColorFromString(input: string | null | undefined): AvatarColor {
    const s = (input ?? "").trim()
    if (!s) return PALETTE[0]
    let hash = 0
    for (let i = 0; i < s.length; i++) {
        // djb2-ish — cheap, stable, good enough spread for 8 buckets
        hash = (hash * 31 + s.charCodeAt(i)) | 0
    }
    return PALETTE[Math.abs(hash) % PALETTE.length]
}

/**
 * Builds 1-2 letter initials from a display name, falling back to a phone
 * number's last 2 digits or "?" when empty.
 */
export function initialsFromName(
    name: string | null | undefined,
    fallback?: string | null,
): string {
    const n = (name ?? "").trim()
    if (n) {
        const parts = n.split(/\s+/).filter(Boolean)
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    const f = (fallback ?? "").replace(/\D/g, "")
    if (f) return f.slice(-2)
    return "?"
}
