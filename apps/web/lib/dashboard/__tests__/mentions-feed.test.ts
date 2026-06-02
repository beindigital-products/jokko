import { describe, expect, it } from "vitest"

import {
    mapMentionItem,
    mapMentionsFeed,
    relativeTimeFr,
    type MentionFeedRow,
} from "../mentions-feed"

const NOW = 1_700_000_000_000

const MENTION: MentionFeedRow = {
    id: "n1",
    kind: "mention",
    actorName: "Tom R.",
    conversationName: "Mehdi Sané",
    note: "@Inès tu peux vérifier le stock Tessier noir M ?",
    link: "/dashboard/conversations/c1",
    isRead: false,
    createdAt: NOW - 8 * 60_000,
}

const ASSIGNMENT: MentionFeedRow = {
    id: "n2",
    kind: "assignment",
    actorName: null,
    conversationName: "Coralie Vidal",
    note: "Une conversation vous a été assignée manuellement.",
    link: "/dashboard/conversations/c2",
    isRead: true,
    createdAt: NOW - 32 * 60_000,
}

describe("relativeTimeFr", () => {
    it("formats minutes in French with a suffix", () => {
        expect(relativeTimeFr(NOW - 8 * 60_000, NOW)).toBe("il y a 8 minutes")
    })

    it("formats hours in French", () => {
        expect(relativeTimeFr(NOW - 60 * 60_000, NOW)).toContain("heure")
    })
})

describe("mapMentionItem — mention", () => {
    const item = mapMentionItem(MENTION, NOW)

    it("uses the actor as the headline subject + the mention verb", () => {
        expect(item.who).toBe("Tom R.")
        expect(item.text).toBe("vous a mentionné·e sur")
        expect(item.conv).toBe("Mehdi Sané")
    })

    it("carries the note, link, kind and unread flag", () => {
        expect(item.note).toBe(MENTION.note)
        expect(item.href).toBe("/dashboard/conversations/c1")
        expect(item.kind).toBe("mention")
        expect(item.unread).toBe(true)
        expect(item.notificationId).toBe("n1")
        expect(item.time).toBe("il y a 8 minutes")
    })

    it("falls back to a neutral actor when none is known", () => {
        expect(mapMentionItem({ ...MENTION, actorName: null }, NOW).who).toBe("Un coéquipier")
    })

    it("falls back to a neutral conversation when none resolves", () => {
        expect(mapMentionItem({ ...MENTION, conversationName: null }, NOW).conv).toBe(
            "une conversation",
        )
    })
})

describe("mapMentionItem — assignment", () => {
    const item = mapMentionItem(ASSIGNMENT, NOW)

    it("puts the conversation as the subject + the assignment verb (no actor stored)", () => {
        expect(item.who).toBe("Coralie Vidal")
        expect(item.text).toBe("vous est assignée")
        expect(item.conv).toBe("")
        expect(item.kind).toBe("assignment")
    })

    it("is read (unread flag false) and keeps the deep link", () => {
        expect(item.unread).toBe(false)
        expect(item.href).toBe("/dashboard/conversations/c2")
    })

    it("falls back to a neutral subject when the conversation is unknown", () => {
        expect(mapMentionItem({ ...ASSIGNMENT, conversationName: null }, NOW).who).toBe(
            "Une conversation",
        )
    })
})

describe("mapMentionsFeed", () => {
    it("maps every row and preserves order", () => {
        const { items } = mapMentionsFeed([MENTION, ASSIGNMENT], NOW)
        expect(items).toHaveLength(2)
        expect(items.map((i) => i.id)).toEqual(["n1", "n2"])
        expect(items[0].kind).toBe("mention")
        expect(items[1].kind).toBe("assignment")
    })

    it("returns an empty feed for no rows", () => {
        expect(mapMentionsFeed([], NOW)).toEqual({ items: [] })
    })
})
