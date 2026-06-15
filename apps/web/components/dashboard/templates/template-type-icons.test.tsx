import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TEMPLATE_TYPE_CONFIGS, type TemplateType } from "@/convex/lib/templateTypes"
import { TEMPLATE_TYPE_ICONS } from "./template-type-icons"
import { TemplateTypeGrid } from "./TemplateTypeGrid"

afterEach(cleanup)

describe("TEMPLATE_TYPE_ICONS", () => {
    it("maps every template type to a line icon", () => {
        const types = Object.keys(TEMPLATE_TYPE_CONFIGS) as TemplateType[]
        for (const type of types) {
            const Icon = TEMPLATE_TYPE_ICONS[type]
            expect(Icon, `missing icon for ${type}`).toBeTruthy()
            // lucide-react icons are forwardRef render components.
            expect(["function", "object"]).toContain(typeof Icon)
        }
    })

    it("does not introduce extra (orphan) icon entries", () => {
        const configKeys = Object.keys(TEMPLATE_TYPE_CONFIGS).sort()
        const iconKeys = Object.keys(TEMPLATE_TYPE_ICONS).sort()
        expect(iconKeys).toEqual(configKeys)
    })
})

describe("TemplateTypeGrid icons", () => {
    it("renders an SVG line icon for each type (no emoji glyphs)", () => {
        const { container } = render(<TemplateTypeGrid onSelect={vi.fn()} />)
        const typeCount = Object.keys(TEMPLATE_TYPE_CONFIGS).length
        // One type icon per card (plus the hover arrow) → at least one svg per type.
        expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(typeCount)
        // The grid no longer prints the legacy double-box emoji for Multi-Produits.
        expect(screen.queryByText("📦📦")).not.toBeInTheDocument()
    })
})
