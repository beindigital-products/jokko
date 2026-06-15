import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ContactCard } from "./ContactCard"
import { ContactsGrid } from "./ContactsGrid"
import { ContactsCrmImportModal } from "./ContactsCrmImportModal"
import type { ContactsTableEntry } from "./ContactsTable"

afterEach(cleanup)

const ENTRIES: ContactsTableEntry[] = [
    { id: "1", name: "Léa Marchand", initials: "LM", phone: "+33 6 12 34 56 78", email: "lea@x.fr", tags: [{ label: "CLIENT" }], lastExchange: "il y a 2h" },
    { id: "2", name: "Mehdi Sané", initials: "MS", phone: "+221 77 614 02 11", lastExchange: "il y a 16min" },
]

describe("ContactCard", () => {
    it("renders name, email, tags and last exchange", () => {
        render(
            <ContactCard
                name="Léa Marchand"
                initials="LM"
                phone="+33 6 12 34 56 78"
                email="lea@x.fr"
                tags={[{ label: "CLIENT" }, { label: "VIP", tone: "accent" }]}
                lastExchange="il y a 2h"
            />,
        )
        expect(screen.getByText("Léa Marchand")).toBeInTheDocument()
        expect(screen.getByText("lea@x.fr")).toBeInTheDocument()
        expect(screen.getByText("CLIENT")).toBeInTheDocument()
        expect(screen.getByText("VIP")).toBeInTheDocument()
        expect(screen.getByText("il y a 2h")).toBeInTheDocument()
    })

    it("toggles selection without triggering the card click", () => {
        const onToggle = vi.fn()
        const onCardClick = vi.fn()
        render(
            <ContactCard
                name="Léa Marchand"
                initials="LM"
                phone="+33 6 12 34 56 78"
                onToggleSelect={onToggle}
                onCardClick={onCardClick}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Sélectionner" }))
        expect(onToggle).toHaveBeenCalledWith(true)
        expect(onCardClick).not.toHaveBeenCalled()
    })
})

describe("ContactsGrid", () => {
    it("renders one card per entry", () => {
        render(<ContactsGrid entries={ENTRIES} />)
        expect(screen.getByText("Léa Marchand")).toBeInTheDocument()
        expect(screen.getByText("Mehdi Sané")).toBeInTheDocument()
    })
})

describe("ContactsCrmImportModal", () => {
    it("renders nothing when closed", () => {
        const { container } = render(
            <ContactsCrmImportModal open={false} onOpenChange={() => {}} />,
        )
        expect(container).toBeEmptyDOMElement()
    })

    it("walks from provider selection to the import summary", () => {
        const onImported = vi.fn()
        render(
            <ContactsCrmImportModal open onOpenChange={() => {}} onImported={onImported} />,
        )
        // Step 1: continue is disabled until a provider is picked.
        const next = screen.getByRole("button", { name: /Continuer/ })
        expect(next).toBeDisabled()
        fireEvent.click(screen.getByText("HubSpot"))
        expect(next).not.toBeDisabled()
        fireEvent.click(next)
        // Step 2: mapping shows the connected provider, then import.
        expect(screen.getByText(/Correspondance des champs/i)).toBeInTheDocument()
        fireEvent.click(screen.getByRole("button", { name: /Importer .* contacts/ }))
        // Step 3: done summary.
        expect(screen.getByText(/contacts importés/i)).toBeInTheDocument()
        expect(onImported).toHaveBeenCalledTimes(1)
    })
})
