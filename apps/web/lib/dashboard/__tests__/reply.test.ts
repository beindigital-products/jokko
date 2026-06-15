import { describe, expect, it } from "vitest"
import { replyPreviewText, replyAuthorLabel } from "../reply"

describe("replyPreviewText", () => {
    it("returns the text content when present", () => {
        expect(replyPreviewText("TEXT", "Bonjour, ça va ?")).toBe("Bonjour, ça va ?")
    })

    it("prefers content even on a media message (caption)", () => {
        expect(replyPreviewText("IMAGE", "Voici la photo")).toBe("Voici la photo")
    })

    it("falls back to a typed label when there is no text", () => {
        expect(replyPreviewText("IMAGE", null)).toBe("📷 Photo")
        expect(replyPreviewText("VIDEO", "")).toBe("🎥 Vidéo")
        expect(replyPreviewText("AUDIO", "   ")).toBe("🎵 Message vocal")
        expect(replyPreviewText("DOCUMENT", undefined)).toBe("📄 Document")
        expect(replyPreviewText("LOCATION", null)).toBe("📍 Position")
        expect(replyPreviewText("STICKER", null)).toBe("🎨 Sticker")
    })

    it("is case-insensitive on the type and handles unknown/empty types", () => {
        expect(replyPreviewText("image", null)).toBe("📷 Photo")
        expect(replyPreviewText(null, null)).toBe("Message")
        expect(replyPreviewText("WHATEVER", null)).toBe("Message")
    })
})

describe("replyAuthorLabel", () => {
    it("labels outbound messages as 'Vous'", () => {
        expect(replyAuthorLabel("OUTBOUND", "Awa Diop")).toBe("Vous")
    })

    it("uses the contact name for inbound messages", () => {
        expect(replyAuthorLabel("INBOUND", "Awa Diop")).toBe("Awa Diop")
    })

    it("falls back to 'Client' when inbound and no contact name", () => {
        expect(replyAuthorLabel("INBOUND", null)).toBe("Client")
        expect(replyAuthorLabel(undefined, "   ")).toBe("Client")
    })
})
