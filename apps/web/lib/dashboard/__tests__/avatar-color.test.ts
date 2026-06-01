import { describe, expect, it } from "vitest"
import { avatarColorFromString, initialsFromName } from "../avatar-color"
import { formatListTime, formatDaySeparator } from "../format-time"

describe("avatarColorFromString", () => {
    it("is deterministic — same input → same color", () => {
        const a = avatarColorFromString("Mehdi Sané")
        const b = avatarColorFromString("Mehdi Sané")
        expect(a).toBe(b)
    })

    it("returns a valid palette color", () => {
        const palette = ["violet", "emerald", "rose", "amber", "sky", "indigo", "crimson", "teal"]
        expect(palette).toContain(avatarColorFromString("anything"))
    })

    it("falls back to first color for empty input", () => {
        expect(avatarColorFromString("")).toBe("violet")
        expect(avatarColorFromString(null)).toBe("violet")
        expect(avatarColorFromString(undefined)).toBe("violet")
    })

    it("spreads different names across buckets", () => {
        const names = ["Léa", "Mehdi", "Coralie", "Sébastien", "Aurélien", "Naomi", "Pierre", "Camille"]
        const colors = new Set(names.map(avatarColorFromString))
        // Not all identical — expect at least a few distinct buckets
        expect(colors.size).toBeGreaterThan(2)
    })
})

describe("initialsFromName", () => {
    it("takes first+last initial of a full name", () => {
        expect(initialsFromName("Mehdi Sané")).toBe("MS")
    })

    it("takes first 2 letters of a single name", () => {
        expect(initialsFromName("Mehdi")).toBe("ME")
    })

    it("falls back to last 2 phone digits", () => {
        expect(initialsFromName(null, "+221 77 614 02 11")).toBe("11")
    })

    it("falls back to ? when nothing usable", () => {
        expect(initialsFromName(null, null)).toBe("?")
    })
})

describe("formatListTime", () => {
    const now = new Date("2026-05-24T14:30:00").getTime()

    it("shows à l'instant for < 1 min", () => {
        expect(formatListTime(now - 30_000, now)).toBe("à l'instant")
    })

    it("shows HH:mm for same day", () => {
        expect(formatListTime(new Date("2026-05-24T09:05:00").getTime(), now)).toMatch(/09:05/)
    })

    it("shows hier for yesterday", () => {
        expect(formatListTime(new Date("2026-05-23T18:00:00").getTime(), now)).toBe("hier")
    })

    it("shows a day+month for old dates", () => {
        expect(formatListTime(new Date("2026-05-01T10:00:00").getTime(), now)).toMatch(/1 mai|1 mai\./)
    })
})

describe("formatDaySeparator", () => {
    const now = new Date("2026-05-24T14:30:00").getTime()

    it("shows Aujourd'hui for same day", () => {
        expect(formatDaySeparator(new Date("2026-05-24T09:00:00").getTime(), now)).toMatch(/Aujourd'hui/)
    })

    it("shows Hier for yesterday", () => {
        expect(formatDaySeparator(new Date("2026-05-23T09:00:00").getTime(), now)).toBe("Hier")
    })
})
