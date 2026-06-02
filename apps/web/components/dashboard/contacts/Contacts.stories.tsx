import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { ContactsTable } from "./ContactsTable"
import type { ContactsTableEntry } from "./ContactsTable"
import { Pagination } from "../primitives/Pagination"

const ENTRIES: ContactsTableEntry[] = [
    { id: "1", name: "Léa Marchand", initials: "LM", color: "rose", phone: "+33 6 12 34 56 78", email: "lea.marchand@gmail.com", tags: [{ label: "CLIENT" }, { label: "VIP", tone: "accent" }], lastExchange: "il y a 2h", value: "2 480 €", commands: 3 },
    { id: "2", name: "Mehdi Sané", initials: "MS", color: "violet", phone: "+221 77 614 02 11", email: "mehdi@sene-imports.sn", tags: [{ label: "PROSPECT" }, { label: "DAKAR" }], lastExchange: "il y a 16min", value: "544 €", commands: 1 },
    { id: "3", name: "Coralie Vidal", initials: "CV", color: "emerald", phone: "+33 7 88 23 47 02", email: "coralie.v@hotmail.fr", tags: [{ label: "SUPPORT" }], lastExchange: "il y a 30min", value: "320 €", commands: 2 },
    { id: "4", name: "Sébastien Ouattara", initials: "SO", color: "amber", phone: "+225 07 04 88 12 90", email: "ouattara.s@gmail.com", tags: [{ label: "PROSPECT" }, { label: "ABIDJAN" }], lastExchange: "il y a 1h" },
    { id: "5", name: "Aurélien Petit", initials: "AP", color: "sky", phone: "+33 6 65 03 11 47", email: "a.petit@maison-petit.fr", tags: [{ label: "CLIENT" }], lastExchange: "il y a 2h", value: "1 120 €", commands: 4 },
    { id: "6", name: "Naomi Diop", initials: "ND", color: "indigo", phone: "+221 76 408 33 02", email: "naomi.diop@orange.sn", tags: [{ label: "CLIENT" }, { label: "DAKAR" }], lastExchange: "hier", value: "880 €", commands: 2 },
    { id: "7", name: "Pierre Wahl", initials: "PW", color: "violet", phone: "+33 6 41 22 88 09", email: "pierre.wahl@me.com", tags: [{ label: "CLIENT" }], lastExchange: "hier", value: "410 €", commands: 1 },
    { id: "8", name: "Camille Rousseau", initials: "CR", color: "crimson", phone: "+33 7 14 09 33 81", email: "c.rousseau@gmail.com", tags: [{ label: "CLIENT" }, { label: "VIP", tone: "accent" }], lastExchange: "mardi", value: "3 240 €", commands: 6 },
]

const meta = {
    title: "Screens/Contacts/Table",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
    name: "Default · 8 rows with selection",
    render: () => {
        const [selected, setSelected] = useState<Set<string>>(new Set())
        return (
            <div className="bg-[var(--paper-white)]">
                <ContactsTable
                    entries={ENTRIES}
                    selectedIds={selected}
                    onToggleSelect={(id, sel) => {
                        const next = new Set(selected)
                        if (sel) next.add(id)
                        else next.delete(id)
                        setSelected(next)
                    }}
                />
                <div className="mt-4">
                    <Pagination
                        summary={`12 sur 2 408 · ${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`}
                        page="1 / 201"
                    />
                </div>
            </div>
        )
    },
}

export const Empty: Story = {
    name: "Empty state",
    render: () => (
        <div className="bg-[var(--paper-white)]">
            <ContactsTable entries={[]} />
            <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">
                Aucun contact ne correspond à votre recherche.
            </p>
        </div>
    ),
}
