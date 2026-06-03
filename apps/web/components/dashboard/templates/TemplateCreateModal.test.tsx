import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TemplateTypeGrid } from "./TemplateTypeGrid"
import { TemplateCreateModal } from "./TemplateCreateModal"

afterEach(cleanup)

describe("TemplateTypeGrid", () => {
    it("renders the type groups and reports the picked type", () => {
        const onSelect = vi.fn()
        render(<TemplateTypeGrid onSelect={onSelect} />)
        expect(screen.getByText("Templates de Base")).toBeInTheDocument()
        expect(screen.getByText("Interactifs")).toBeInTheDocument()
        fireEvent.click(screen.getByText("Texte Simple"))
        expect(onSelect).toHaveBeenCalledWith("TEXT")
    })
})

describe("TemplateCreateModal", () => {
    it("renders nothing when closed", () => {
        const { container } = render(
            <TemplateCreateModal open={false} onOpenChange={() => {}} />,
        )
        expect(container).toBeEmptyDOMElement()
    })

    it("advances from type selection to the builder", () => {
        render(<TemplateCreateModal open onOpenChange={() => {}} />)
        expect(screen.getByText(/Choisissez le type/i)).toBeInTheDocument()
        fireEvent.click(screen.getByText("Appel à l'Action"))
        // Builder step is now visible.
        expect(screen.getByPlaceholderText("ex. confirmation_commande")).toBeInTheDocument()
        expect(screen.getByText("Aperçu WhatsApp")).toBeInTheDocument()
    })

    it("adapts the form to the type's features (Authentication: no header, OTP button)", () => {
        render(<TemplateCreateModal open onOpenChange={() => {}} defaultType="AUTHENTICATION" />)
        expect(screen.queryByText("En-tête (header)")).not.toBeInTheDocument()
        expect(screen.getByText("Code OTP")).toBeInTheDocument()
    })

    it("requires a name before the draft can be created and reports submit intent", () => {
        const onOpenChange = vi.fn()
        const onCreate = vi.fn()
        render(
            <TemplateCreateModal
                open
                onOpenChange={onOpenChange}
                onCreate={onCreate}
                defaultType="CALL_TO_ACTION"
            />,
        )
        const draftBtn = screen.getByRole("button", { name: "Créer le brouillon" })
        expect(draftBtn).toBeDisabled()

        fireEvent.change(screen.getByPlaceholderText("ex. confirmation_commande"), {
            target: { value: "offre_printemps" },
        })
        expect(draftBtn).not.toBeDisabled()

        fireEvent.click(screen.getByRole("button", { name: /Soumettre à Meta/ }))
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ name: "offre_printemps", type: "CALL_TO_ACTION" }),
            { submit: true },
        )
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })
})
