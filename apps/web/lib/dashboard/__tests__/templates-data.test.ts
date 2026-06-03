import { describe, expect, it } from "vitest"

import {
    buildCategoryFilters,
    headerToMedia,
    isSimpleTemplateType,
    mapTemplateCategory,
    mapTemplateRow,
    mapTemplateStatus,
    mapTemplatesData,
    type TemplateDoc,
} from "../templates-data"

describe("mapTemplateStatus", () => {
    it("maps the Convex lifecycle into the v3 pill buckets", () => {
        expect(mapTemplateStatus("APPROVED")).toBe("approved")
        expect(mapTemplateStatus("PENDING")).toBe("pending")
        expect(mapTemplateStatus("IN_APPEAL")).toBe("pending")
        expect(mapTemplateStatus("REJECTED")).toBe("rejected")
        expect(mapTemplateStatus("PAUSED")).toBe("rejected")
        expect(mapTemplateStatus("DRAFT")).toBe("draft")
        expect(mapTemplateStatus(undefined)).toBe("draft")
    })
})

describe("mapTemplateCategory", () => {
    it("title-cases the WhatsApp category, defaulting to Utility", () => {
        expect(mapTemplateCategory("MARKETING")).toBe("Marketing")
        expect(mapTemplateCategory("UTILITY")).toBe("Utility")
        expect(mapTemplateCategory("AUTHENTICATION")).toBe("Authentication")
        expect(mapTemplateCategory("weird")).toBe("Utility")
        expect(mapTemplateCategory(undefined)).toBe("Utility")
    })
})

describe("isSimpleTemplateType", () => {
    it("flags the types the v3 modal can fully build", () => {
        expect(isSimpleTemplateType("TEXT")).toBe(true)
        expect(isSimpleTemplateType("CALL_TO_ACTION")).toBe(true)
        expect(isSimpleTemplateType("AUTHENTICATION")).toBe(true)
        expect(isSimpleTemplateType("CAROUSEL")).toBe(false)
        expect(isSimpleTemplateType("MEDIA")).toBe(false)
        expect(isSimpleTemplateType("LIST")).toBe(false)
    })
})

describe("headerToMedia", () => {
    it("maps media headers and ignores text/none", () => {
        expect(headerToMedia({ type: "IMAGE", mediaUrl: "/x.jpg" })).toEqual({ kind: "image", src: "/x.jpg" })
        expect(headerToMedia({ type: "VIDEO" })).toEqual({ kind: "video" })
        expect(headerToMedia({ type: "LOCATION", location: { name: "Atelier", address: "Paris" } })).toEqual({
            kind: "location",
            name: "Atelier",
            address: "Paris",
        })
        expect(headerToMedia({ type: "TEXT", text: "hi" })).toBeNull()
        expect(headerToMedia(null)).toBeNull()
    })
})

describe("mapTemplateRow", () => {
    it("maps a doc, formatting counts and filtering empty buttons", () => {
        const doc: TemplateDoc = {
            _id: "t1",
            name: "confirmation_commande",
            category: "UTILITY",
            language: "fr",
            status: "APPROVED",
            body: "Bonjour {{1}}",
            footer: "Merci",
            buttons: [
                { type: "URL", text: "Voir la commande", url: "https://x" },
                { type: "QUICK_REPLY", text: "" },
            ],
            sentCount: 1240,
            readCount: 930,
        }
        const row = mapTemplateRow(doc)
        expect(row).toMatchObject({
            id: "t1",
            name: "confirmation_commande",
            category: "Utility",
            lang: "fr",
            status: "approved",
            sent: (1240).toLocaleString("fr-FR"),
            open: "75%",
            preview: "Bonjour {{1}}",
            footer: "Merci",
        })
        expect(row.buttons).toEqual([{ label: "Voir la commande", kind: "url" }])
    })

    it("shows dashes for an unsent draft", () => {
        const row = mapTemplateRow({ _id: "t2", name: "x", status: "DRAFT" })
        expect(row.sent).toBe("—")
        expect(row.open).toBe("—")
        expect(row.status).toBe("draft")
        expect(row.buttons).toBeUndefined()
    })
})

describe("buildCategoryFilters / mapTemplatesData", () => {
    const docs: TemplateDoc[] = [
        { _id: "a", name: "a", category: "MARKETING", status: "APPROVED" },
        { _id: "b", name: "b", category: "MARKETING", status: "PENDING" },
        { _id: "c", name: "c", category: "UTILITY", status: "DRAFT" },
    ]

    it("builds 'all' first, then present categories with counts", () => {
        const rows = docs.map(mapTemplateRow)
        expect(buildCategoryFilters(rows)).toEqual([
            { key: "all", label: "Tous", count: 3 },
            { key: "marketing", label: "Marketing", count: 2 },
            { key: "utility", label: "Utility", count: 1 },
        ])
    })

    it("pluralises the count line and defaults selection to the first row", () => {
        const data = mapTemplatesData(docs)
        expect(data.count).toBe("3 modèles · synchro Meta")
        expect(data.templates).toHaveLength(3)
        expect(data.selectedId).toBe("a")
    })

    it("keeps the count singular for a lone template", () => {
        expect(mapTemplatesData([docs[0]]).count).toBe("1 modèle · synchro Meta")
    })
})
