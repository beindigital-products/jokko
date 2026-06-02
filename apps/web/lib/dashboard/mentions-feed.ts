import { formatDistance } from "date-fns"
import { fr } from "date-fns/locale"

import type { MentionItem, MentionsData } from "@/components/dashboard/mentions/types"

/**
 * Shape returned by the `mentions.feed` Convex query (mirrored here so the
 * mapper stays pure + unit-testable without importing the backend). Keep in
 * sync with `convex/mentions.ts → MentionFeedRow`.
 */
export interface MentionFeedRow {
    id: string
    kind: "mention" | "assignment"
    actorName: string | null
    conversationName: string | null
    note: string
    link: string | null
    isRead: boolean
    createdAt: number
}

/** Relative French time label ("il y a 8 minutes"). Pure given `now`. */
export function relativeTimeFr(ts: number, now: number): string {
    return formatDistance(ts, now, { addSuffix: true, locale: fr })
}

/**
 * Maps one feed row to a presentational {@link MentionItem}. Mentions read
 * "<author> vous a mentionné·e sur <conversation>"; assignments read
 * "<conversation> vous est assignée" (no actor is stored, so the conversation
 * contact carries the avatar).
 */
export function mapMentionItem(row: MentionFeedRow, now: number): MentionItem {
    const base = {
        id: row.id,
        note: row.note,
        time: relativeTimeFr(row.createdAt, now),
        kind: row.kind,
        href: row.link ?? undefined,
        unread: !row.isRead,
        notificationId: row.id,
    }

    if (row.kind === "assignment") {
        return {
            ...base,
            who: row.conversationName ?? "Une conversation",
            text: "vous est assignée",
            conv: "",
        }
    }

    return {
        ...base,
        who: row.actorName ?? "Un coéquipier",
        text: "vous a mentionné·e sur",
        conv: row.conversationName ?? "une conversation",
    }
}

/** Maps the whole feed (order preserved — the query already sorts desc). */
export function mapMentionsFeed(rows: MentionFeedRow[], now: number): MentionsData {
    return { items: rows.map((row) => mapMentionItem(row, now)) }
}
