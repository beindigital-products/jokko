import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { Upload, Users } from "lucide-react"

import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { ContactsTable } from "./ContactsTable"
import type { ContactsTableEntry } from "./ContactsTable"
import { ContactsGrid } from "./ContactsGrid"
import { ContactsCrmImportModal } from "./ContactsCrmImportModal"
import { Pagination } from "../primitives/Pagination"

const ENTRIES: ContactsTableEntry[] = [
    { id: "1", name: "Léa Marchand", initials: "LM", color: "rose", phone: "+33 6 12 34 56 78", email: "lea.marchand@gmail.com", tags: [{ label: "CLIENT" }, { label: "VIP", tone: "accent" }], lastExchange: "il y a 2h" },
    { id: "2", name: "Mehdi Sané", initials: "MS", color: "violet", phone: "+221 77 614 02 11", email: "mehdi@sene-imports.sn", tags: [{ label: "PROSPECT" }, { label: "DAKAR" }], lastExchange: "il y a 16min" },
    { id: "3", name: "Coralie Vidal", initials: "CV", color: "emerald", phone: "+33 7 88 23 47 02", email: "coralie.v@hotmail.fr", tags: [{ label: "SUPPORT" }], lastExchange: "il y a 30min" },
    { id: "4", name: "Sébastien Ouattara", initials: "SO", color: "amber", phone: "+225 07 04 88 12 90", email: "ouattara.s@gmail.com", tags: [{ label: "PROSPECT" }, { label: "ABIDJAN" }], lastExchange: "il y a 1h" },
    { id: "5", name: "Aurélien Petit", initials: "AP", color: "sky", phone: "+33 6 65 03 11 47", email: "a.petit@maison-petit.fr", tags: [{ label: "CLIENT" }], lastExchange: "il y a 2h" },
    { id: "6", name: "Naomi Diop", initials: "ND", color: "indigo", phone: "+221 76 408 33 02", email: "naomi.diop@orange.sn", tags: [{ label: "CLIENT" }, { label: "DAKAR" }], lastExchange: "hier" },
    { id: "7", name: "Pierre Wahl", initials: "PW", color: "violet", phone: "+33 6 41 22 88 09", email: "pierre.wahl@me.com", tags: [{ label: "CLIENT" }], lastExchange: "hier" },
    { id: "8", name: "Camille Rousseau", initials: "CR", color: "crimson", phone: "+33 7 14 09 33 81", email: "c.rousseau@gmail.com", tags: [{ label: "CLIENT" }, { label: "VIP", tone: "accent" }], lastExchange: "mardi" },
]

const meta = {
    title: "Screens/Contacts",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

/* ─────────────────────────── Table disposition ─────────────────────────── */

function TableStory() {
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
}

export const Table: Story = {
    name: "Disposition tableau",
    render: () => <TableStory />,
}

/* ──────────────────────────── Card disposition ─────────────────────────── */

function CardsStory() {
    const [selected, setSelected] = useState<Set<string>>(new Set(["1"]))
    return (
        <div className="bg-[var(--paper-white)]">
            <ContactsGrid
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
}

export const Cards: Story = {
    name: "Disposition carte",
    render: () => <CardsStory />,
}

/* ───────────────────────── Empty state (shadcn Empty) ──────────────────── */

function EmptyStateStory() {
    const [importOpen, setImportOpen] = useState(false)
    return (
        <div className="bg-[var(--paper-white)]">
            <Empty className="border border-dashed border-[var(--ink-200)] bg-[var(--paper-warm)]/40">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Users />
                    </EmptyMedia>
                    <EmptyTitle>Votre annuaire est vide.</EmptyTitle>
                    <EmptyDescription>
                        Importez vos contacts depuis HubSpot, Pipedrive ou Salesforce —
                        ou laissez-les se créer tout seuls au fil des conversations.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <button
                        type="button"
                        onClick={() => setImportOpen(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        Importer depuis un CRM
                    </button>
                    <button
                        type="button"
                        className="text-[13px] font-medium text-[var(--accent)]"
                    >
                        Voir le guide d&apos;import ↗
                    </button>
                </EmptyContent>
            </Empty>

            <ContactsCrmImportModal open={importOpen} onOpenChange={setImportOpen} />
        </div>
    )
}

export const EmptyState: Story = {
    name: "Annuaire vide",
    render: () => <EmptyStateStory />,
}

/* ─────────────────────── CRM import creation modal ─────────────────────── */

function ImportFromCrmStory() {
    const [open, setOpen] = useState(true)
    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: "100%", height: 620, background: "var(--paper-warm)" }}
        >
            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white"
                >
                    <Upload className="h-3.5 w-3.5" />
                    Importer depuis un CRM
                </button>
            ) : null}
            <ContactsCrmImportModal open={open} onOpenChange={setOpen} />
        </div>
    )
}

export const ImportFromCrm: Story = {
    name: "Modal · import depuis un CRM",
    parameters: { layout: "fullscreen" },
    render: () => <ImportFromCrmStory />,
}
