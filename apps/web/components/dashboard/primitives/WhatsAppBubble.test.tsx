import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { WaMediaHeader, WhatsAppBubble, highlightBody } from "./WhatsAppBubble"

afterEach(cleanup)

describe("WaMediaHeader", () => {
    it("renders a document chip with filename, page count, ext and size", () => {
        render(<WaMediaHeader media={{ kind: "document", filename: "Devis_AB-2042.pdf", pages: 2, size: "248 ko" }} />)
        expect(screen.getByText("Devis_AB-2042.pdf")).toBeInTheDocument()
        expect(screen.getByText("2 pages · PDF · 248 ko")).toBeInTheDocument()
    })

    it("derives the extension from the filename when not given", () => {
        render(<WaMediaHeader media={{ kind: "document", filename: "facture.docx" }} />)
        expect(screen.getByText("DOCX")).toBeInTheDocument()
    })

    it("renders a real <img> for an image header when src is provided", () => {
        render(<WaMediaHeader media={{ kind: "image", src: "/x.jpg", alt: "Visuel collection" }} />)
        expect(screen.getByRole("img", { name: "Visuel collection" })).toBeInTheDocument()
    })

    it("falls back to a placeholder (no <img>) for an image header without src", () => {
        render(<WaMediaHeader media={{ kind: "image" }} />)
        expect(screen.queryByRole("img")).toBeNull()
    })

    it("renders the duration for a video header", () => {
        render(<WaMediaHeader media={{ kind: "video", duration: "0:24" }} />)
        expect(screen.getByText("0:24")).toBeInTheDocument()
    })

    it("renders name and address for a location header", () => {
        render(
            <WaMediaHeader
                media={{ kind: "location", name: "Atelier Bracquet", address: "18 rue de Sévigné, 75004 Paris" }}
            />,
        )
        expect(screen.getByText("Atelier Bracquet")).toBeInTheDocument()
        expect(screen.getByText("18 rue de Sévigné, 75004 Paris")).toBeInTheDocument()
    })
})

describe("WhatsAppBubble", () => {
    it("renders body, footer, time and CTA buttons", () => {
        render(
            <WhatsAppBubble
                body="Bonjour"
                footer="— L'équipe"
                time="10:24"
                buttons={[{ label: "Voir la boutique", kind: "url" }]}
            />,
        )
        expect(screen.getByText("Bonjour")).toBeInTheDocument()
        expect(screen.getByText("— L'équipe")).toBeInTheDocument()
        expect(screen.getByText("10:24")).toBeInTheDocument()
        expect(screen.getByText("Voir la boutique")).toBeInTheDocument()
    })

    it("renders no media header when media is null", () => {
        render(<WhatsAppBubble media={null} body="Texte seul" />)
        expect(screen.getByText("Texte seul")).toBeInTheDocument()
        expect(screen.queryByText(/\.pdf$/)).toBeNull()
    })
})

describe("highlightBody", () => {
    it("keeps the literal {{N}} token when no resolver is given", () => {
        render(<div>{highlightBody("Bonjour {{1}}")}</div>)
        expect(screen.getByText("{{1}}")).toBeInTheDocument()
    })

    it("substitutes the token with the resolved value", () => {
        render(<div>{highlightBody("Bonjour {{1}}", (t) => (t === "{{1}}" ? "Margaux" : t))}</div>)
        expect(screen.getByText("Margaux")).toBeInTheDocument()
        expect(screen.queryByText("{{1}}")).toBeNull()
    })
})
