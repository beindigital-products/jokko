import { describe, expect, it } from "vitest"
import { resolveMentions, detectMentionQuery, insertMention } from "../mentions"

const PICKED = [
    { userId: "u1", name: "Inès Caron" },
    { userId: "u2", name: "Tom Roussel" },
]

describe("resolveMentions", () => {
    it("keeps only mentions whose @Name is still in the text", () => {
        const text = "Salut @Inès Caron peux-tu regarder ?"
        expect(resolveMentions(text, PICKED)).toEqual([{ userId: "u1", name: "Inès Caron" }])
    })

    it("returns multiple when several tokens are present", () => {
        const text = "@Inès Caron et @Tom Roussel on s'en occupe"
        expect(resolveMentions(text, PICKED)).toHaveLength(2)
    })

    it("drops a picked mention the user deleted", () => {
        expect(resolveMentions("plus de mention ici", PICKED)).toEqual([])
    })

    it("dedupes by userId when the same teammate is picked twice", () => {
        const text = "@Inès Caron et @Tom Roussel"
        const dupes = [...PICKED, { userId: "u1", name: "Inès Caron" }]
        const res = resolveMentions(text, dupes)
        expect(res).toHaveLength(2)
        expect(res.filter((m) => m.userId === "u1")).toHaveLength(1)
    })
})

describe("detectMentionQuery", () => {
    it("detects @ at start", () => {
        expect(detectMentionQuery("@In")).toEqual({ query: "In", start: 0 })
    })

    it("detects @ after a space", () => {
        const res = detectMentionQuery("Salut @Tom")
        expect(res?.query).toBe("Tom")
        expect(res?.start).toBe(6)
    })

    it("detects an empty @ token", () => {
        expect(detectMentionQuery("note @")).toEqual({ query: "", start: 5 })
    })

    it("returns null when @ is mid-word (email-like)", () => {
        expect(detectMentionQuery("mail@domain")).toBeNull()
    })

    it("returns null when there is no @", () => {
        expect(detectMentionQuery("juste du texte")).toBeNull()
    })
})

describe("insertMention", () => {
    it("replaces the @query token with @Name + space", () => {
        const text = "Salut @In"
        const detected = detectMentionQuery(text)!
        const res = insertMention(text, text.length, detected.start, "Inès Caron")
        expect(res.text).toBe("Salut @Inès Caron ")
        expect(res.caret).toBe(res.text.length)
    })

    it("preserves text after the caret", () => {
        const text = "@In fin"
        // caret right after "@In" (position 3)
        const res = insertMention(text, 3, 0, "Inès Caron")
        expect(res.text).toBe("@Inès Caron  fin")
    })
})
