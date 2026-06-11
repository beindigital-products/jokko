import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TemplateCreateModal } from "./TemplateCreateModal"

afterEach(cleanup)

/** Fill a valid snake_case name and advance past step 1. */
function fillNameAndContinue(name = "promo_ete") {
    fireEvent.change(screen.getByPlaceholderText("devis_envoye_fr"), { target: { value: name } })
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }))
}

describe("TemplateCreateModal (wizard)", () => {
    it("renders nothing when closed", () => {
        const { container } = render(<TemplateCreateModal open={false} onOpenChange={() => {}} />)
        expect(container).toBeEmptyDOMElement()
    })

    it("opens on step 1 and gates Continue on a valid snake_case name", () => {
        render(<TemplateCreateModal open onOpenChange={() => {}} />)
        expect(screen.getByText("Configurez le modèle")).toBeInTheDocument()

        const cont = screen.getByRole("button", { name: "Continuer" })
        expect(cont).toBeDisabled()

        fireEvent.change(screen.getByPlaceholderText("devis_envoye_fr"), { target: { value: "ab" } })
        expect(cont).toBeDisabled() // too short

        fireEvent.change(screen.getByPlaceholderText("devis_envoye_fr"), { target: { value: "promo_ete" } })
        expect(cont).not.toBeDisabled()
    })

    it("advances to the content step and requires a body before continuing", () => {
        render(<TemplateCreateModal open onOpenChange={() => {}} />)
        fillNameAndContinue()
        expect(screen.getByText("Composez le message")).toBeInTheDocument()

        const cont = screen.getByRole("button", { name: "Continuer" })
        expect(cont).toBeDisabled()
        fireEvent.change(screen.getByPlaceholderText("Saisissez votre message…"), {
            target: { value: "Bonjour {{1}}" },
        })
        expect(cont).not.toBeDisabled()
    })

    it("requires a sample for each detected variable", () => {
        render(<TemplateCreateModal open onOpenChange={() => {}} />)
        fillNameAndContinue()
        fireEvent.change(screen.getByPlaceholderText("Saisissez votre message…"), {
            target: { value: "Bonjour {{1}}" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Continuer" })) // → variables

        expect(screen.getByText("Un exemple par variable")).toBeInTheDocument()
        const cont = screen.getByRole("button", { name: "Continuer" })
        expect(cont).toBeDisabled()
        fireEvent.change(screen.getByPlaceholderText("ex. Margaux"), { target: { value: "Margaux" } })
        expect(cont).not.toBeDisabled()
    })

    it("submits the derived TEXT payload to Meta and shows the success screen", async () => {
        const onCreate = vi.fn().mockResolvedValue(true)
        render(<TemplateCreateModal open onOpenChange={() => {}} onCreate={onCreate} />)

        fillNameAndContinue()
        fireEvent.change(screen.getByPlaceholderText("Saisissez votre message…"), {
            target: { value: "Bonjour, votre commande est confirmée." },
        })
        fireEvent.click(screen.getByRole("button", { name: "Continuer" })) // → variables
        fireEvent.click(screen.getByRole("button", { name: "Continuer" })) // → buttons
        fireEvent.click(screen.getByRole("button", { name: "Continuer" })) // → récap

        fireEvent.click(screen.getByRole("button", { name: /Soumettre à Meta/ }))

        await waitFor(() => expect(onCreate).toHaveBeenCalled())
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ name: "promo_ete", type: "TEXT", category: "MARKETING" }),
            { submit: true },
        )
        await waitFor(() => expect(screen.getByText("Soumis à Meta")).toBeInTheDocument())
    })

    it("derives CALL_TO_ACTION when a URL button is added", async () => {
        const onCreate = vi.fn().mockResolvedValue(true)
        render(<TemplateCreateModal open onOpenChange={() => {}} onCreate={onCreate} />)
        fillNameAndContinue()
        fireEvent.change(screen.getByPlaceholderText("Saisissez votre message…"), {
            target: { value: "Découvrez la boutique." },
        })
        fireEvent.click(screen.getByRole("button", { name: "Continuer" })) // → variables
        fireEvent.click(screen.getByRole("button", { name: "Continuer" })) // → buttons

        fireEvent.click(screen.getByRole("button", { name: /Ajouter un bouton/ }))
        fireEvent.click(screen.getByRole("button", { name: "Lien URL" }))
        fireEvent.change(screen.getByPlaceholderText("Texte du bouton"), { target: { value: "Voir" } })
        fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "https://x.co" } })

        fireEvent.click(screen.getByRole("button", { name: "Continuer" })) // → récap
        fireEvent.click(screen.getByRole("button", { name: /Soumettre à Meta/ }))

        await waitFor(() => expect(onCreate).toHaveBeenCalled())
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ type: "CALL_TO_ACTION" }),
            { submit: true },
        )
    })

    it("hands advanced formats off to the full-page editor", () => {
        const onAdvanced = vi.fn()
        render(<TemplateCreateModal open onOpenChange={() => {}} onAdvanced={onAdvanced} />)
        fireEvent.click(screen.getByText(/Format avancé/))
        expect(screen.getByText("Carrousel, liste, catalogue…")).toBeInTheDocument()
        fireEvent.click(screen.getByText("Carrousel"))
        expect(onAdvanced).toHaveBeenCalledWith("CAROUSEL")
    })
})
