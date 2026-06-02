import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { ConversationHeader } from "./ConversationHeader"
import { ConversationList } from "./ConversationList"
import type { ConversationListEntry } from "./ConversationList"
import { ConversationThread } from "./ConversationThread"
import type { ThreadDayGroup } from "./ConversationThread"
import { CopilotPanel } from "./CopilotPanel"
import { MessageComposer } from "./MessageComposer"

const meta = {
    title: "Screens/Inbox/Conversation",
    parameters: { layout: "fullscreen" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

const ENTRIES: ConversationListEntry[] = [
    { id: "1", contactName: "Léa Marchand", initials: "LM", color: "rose", snippet: "Parfait, on lance.", timestamp: "11:47", tags: [{ label: "VIP", tone: "accent" }], unreadCount: 2 },
    { id: "2", contactName: "Mehdi Sané", initials: "MS", color: "violet", snippet: "Vous livrez à Dakar le mardi 3 ?", timestamp: "11:32", tags: [{ label: "PROSPECT" }, { label: "DAKAR" }], unread: true, unreadCount: 3 },
    { id: "3", contactName: "Coralie Vidal", initials: "CV", color: "emerald", snippet: "Voici la photo de la pièce", timestamp: "11:08", tags: [{ label: "CLIENT" }], unreadCount: 1 },
    { id: "4", contactName: "Sébastien Ouattara", initials: "SO", color: "amber", snippet: "Pour mardi 3, vous expédiez par DHL ?", timestamp: "10:24", tags: [{ label: "PROSPECT" }] },
    { id: "5", contactName: "Aurélien Petit", initials: "AP", color: "sky", snippet: "C'est noté, merci.", timestamp: "09:53", tags: [{ label: "CLIENT" }] },
]

const THREAD: ThreadDayGroup[] = [
    {
        day: "Aujourd'hui · 24 mai 2026",
        messages: [
            { id: "m1", side: "in", body: <>Bonjour Inès,<br />Vous livrez à Dakar le mardi 3 ?</> },
            { id: "m2", side: "in", body: "J'ai besoin de 3 pièces du modèle Tessier en noir, taille M." },
            { id: "m3", side: "out", body: "Bonjour Mehdi, je vérifie le stock immédiatement.", timestamp: "11:30", deliveryStatus: "read" },
            { id: "m4", side: "out", body: "Pour le mardi 3, expédition DHL Express depuis Paris — arrivée Dakar mercredi 4 en fin de journée.", timestamp: "11:31", deliveryStatus: "read" },
            { id: "m5", side: "in", body: "Parfait. Pouvez-vous me confirmer le tarif pour les 3 pièces livrées ?", timestamp: "11:32" },
            { id: "m6", side: "out", body: "3 Tessier noir M : 480 € TTC. Livraison Dakar : 64 €. Total : 544 €.", timestamp: "11:32", deliveryStatus: "delivered" },
        ],
    },
]

const HEADER_CHIPS = [
    { label: "VIA DAKAR" },
    { label: "● ASSIGNÉ À MOI", tone: "warn" as const },
    { label: "PROSPECT" },
]

export const List: Story = {
    name: "List · middle column",
    render: () => {
        const [activeId, setActiveId] = useState("2")
        const [filter, setFilter] = useState("all")
        return (
            <div className="flex h-screen bg-[var(--paper-white)]">
                <ConversationList
                    filters={[
                        { key: "all", label: "Tout", count: 142 },
                        { key: "unread", label: "Non lu", count: 28 },
                        { key: "assigned", label: "Assigné", count: 12 },
                        { key: "mentions", label: "Mentions", count: 1 },
                    ]}
                    activeFilter={filter}
                    onFilterChange={setFilter}
                    entries={ENTRIES}
                    activeEntryId={activeId}
                    onEntryClick={setActiveId}
                />
            </div>
        )
    },
}

export const Header: Story = {
    name: "Header · contact + chips + actions",
    render: () => (
        <div className="bg-[var(--paper-white)]">
            <ConversationHeader
                name="Mehdi Sané"
                initials="MS"
                color="violet"
                phone="+221 77 614 02 11"
                chips={HEADER_CHIPS}
            />
        </div>
    ),
}

export const Thread: Story = {
    name: "Thread · header + bubbles + composer",
    render: () => (
        <div className="flex h-screen bg-[var(--paper-white)]">
            <ConversationThread
                header={
                    <ConversationHeader
                        name="Mehdi Sané"
                        initials="MS"
                        color="violet"
                        phone="+221 77 614 02 11"
                        chips={HEADER_CHIPS}
                    />
                }
                groups={THREAD}
                composer={<MessageComposer />}
            />
        </div>
    ),
}

export const FullView: Story = {
    name: "Full view · 3 colonnes (list + thread + copilot)",
    render: () => {
        const [activeId, setActiveId] = useState("2")
        const [filter, setFilter] = useState("all")
        return (
            <div className="flex h-screen bg-[var(--paper-white)]">
                <ConversationList
                    filters={[
                        { key: "all", label: "Tout", count: 142 },
                        { key: "unread", label: "Non lu", count: 28 },
                        { key: "assigned", label: "Assigné", count: 12 },
                        { key: "mentions", label: "Mentions", count: 1 },
                    ]}
                    activeFilter={filter}
                    onFilterChange={setFilter}
                    entries={ENTRIES}
                    activeEntryId={activeId}
                    onEntryClick={setActiveId}
                />
                <ConversationThread
                    header={
                        <ConversationHeader
                            name="Mehdi Sané"
                            initials="MS"
                            color="violet"
                            phone="+221 77 614 02 11"
                            chips={HEADER_CHIPS}
                        />
                    }
                    groups={THREAD}
                    composer={<MessageComposer />}
                />
                <CopilotPanel
                    contactName="Mehdi Sané"
                    initials="MS"
                    color="violet"
                    phone="+221 77 614 02 11"
                    summary="Mehdi veut commander 3 × Tessier noir M, livraison Dakar mardi 3. Devis envoyé à 544 € TTC, en attente de confirmation."
                    draft="Mehdi, je vous confirme la prise en compte du règlement. Expédition demain matin, numéro de suivi DHL dans la journée."
                    attributes={[
                        { label: "Pays", value: "🇸🇳 Sénégal" },
                        { label: "Langue", value: "Français" },
                        { label: "Source", value: "Landing · 12 mai" },
                    ]}
                />
            </div>
        )
    },
}
