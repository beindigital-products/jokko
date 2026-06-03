import { describe, expect, it } from "vitest"

import { contactDisplayName, mapContactToEntry, relativeAdded, type ContactInput } from "../contacts-data"

const NOW = 1_700_000_000_000

describe("contactDisplayName", () => {
    it("prefers the explicit name", () => {
        expect(contactDisplayName({ name: "Léa Marchand", firstName: null, lastName: null, phone: "+33" })).toBe(
            "Léa Marchand",
        )
    })
    it("falls back to first + last, then phone", () => {
        expect(contactDisplayName({ name: null, firstName: "Léa", lastName: "Marchand", phone: "+33" })).toBe(
            "Léa Marchand",
        )
        expect(contactDisplayName({ name: null, firstName: null, lastName: null, phone: "+221 77" })).toBe("+221 77")
    })
})

describe("relativeAdded", () => {
    it("formats minutes / hours / days", () => {
        expect(relativeAdded(NOW - 5 * 60_000, NOW)).toBe("il y a 5 min")
        expect(relativeAdded(NOW - 3 * 3_600_000, NOW)).toBe("il y a 3 h")
        expect(relativeAdded(NOW - 2 * 86_400_000, NOW)).toBe("il y a 2 j")
    })
    it("falls back to a date past a week", () => {
        expect(relativeAdded(NOW - 30 * 86_400_000, NOW)).toMatch(/\d/)
    })
})

describe("mapContactToEntry", () => {
    const contact: ContactInput = {
        id: "c1",
        phone: "+33 6 12 34 56 78",
        name: "Léa Marchand",
        email: "lea@x.fr",
        tags: [
            { id: "t1", name: "client" },
            { id: "t2", name: "vip" },
        ],
        createdAt: NOW - 2 * 3_600_000,
    }

    it("maps name, initials, phone, email, uppercased tags and added time", () => {
        const e = mapContactToEntry(contact, NOW)
        expect(e).toMatchObject({
            id: "c1",
            name: "Léa Marchand",
            initials: "LM",
            phone: "+33 6 12 34 56 78",
            email: "lea@x.fr",
            lastExchange: "il y a 2 h",
        })
        expect(e.tags).toEqual([{ label: "CLIENT" }, { label: "VIP" }])
        expect(e.color).toBeTruthy()
    })

    it("caps tags at 3 and tolerates a contact with no name/email/tags", () => {
        const bare = mapContactToEntry(
            { id: "c2", phone: "+221 77 614 02 11", createdAt: NOW },
            NOW,
        )
        expect(bare.name).toBe("+221 77 614 02 11")
        expect(bare.tags).toEqual([])
        expect(bare.email).toBeUndefined()

        const many = mapContactToEntry(
            { ...contact, tags: [1, 2, 3, 4, 5].map((n) => ({ id: `t${n}`, name: `tag${n}` })) },
            NOW,
        )
        expect(many.tags).toHaveLength(3)
    })
})
