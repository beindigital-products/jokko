import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { ConversationHeader } from "./ConversationHeader"
import { ConversationList } from "./ConversationList"
import type { ConversationListEntry } from "./ConversationList"
import { ConversationThread } from "./ConversationThread"
import type { ThreadDayGroup } from "./ConversationThread"
import { CopilotPanel } from "./CopilotPanel"
import { MentionCard } from "./MentionCard"
import { MessageBubble } from "./MessageBubble"
import { MessageComposer } from "./MessageComposer"

const meta = {
    title: "Dashboard/Inbox",
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
            { id: "m3", side: "out", body: "Bonjour Mehdi, merci pour votre message. Je vérifie le stock immédiatement.", timestamp: "11:30", deliveryStatus: "read" },
            { id: "m4", side: "out", body: "Pour le mardi 3, nous expédions par DHL Express depuis Paris — arrivée Dakar mercredi 4 en fin de journée.", timestamp: "11:31", deliveryStatus: "read" },
            { id: "m5", side: "in", body: "Parfait. Pouvez-vous me confirmer le tarif pour les 3 pièces livrées ?", timestamp: "11:32" },
            { id: "m6", side: "out", body: "3 Tessier noir M : 480 € TTC. Livraison Dakar : 64 €. Total : 544 €.", timestamp: "11:32", deliveryStatus: "delivered" },
        ],
    },
]

export const BubbleVariants: Story = {
    name: "MessageBubble · variants",
    render: () => (
        <div className="max-w-md space-y-3 p-6 bg-[var(--paper-warm)]/40">
            <MessageBubble side="in" timestamp="10:42">Hello, vous êtes ouverts ce mardi ?</MessageBubble>
            <MessageBubble side="out" timestamp="10:43" deliveryStatus="sent">Bonjour ! Oui, 9h-18h.</MessageBubble>
            <MessageBubble side="out" timestamp="10:44" deliveryStatus="delivered">Vous voulez réserver ?</MessageBubble>
            <MessageBubble side="out" timestamp="10:45" deliveryStatus="read">Tap pour confirmer 👇</MessageBubble>
        </div>
    ),
}

export const ListOnly: Story = {
    name: "ConversationList (middle column)",
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

export const ThreadOnly: Story = {
    name: "ConversationThread (with header + composer)",
    render: () => (
        <div className="flex h-screen bg-[var(--paper-white)]">
            <ConversationThread
                header={
                    <ConversationHeader
                        name="Mehdi Sané"
                        initials="MS"
                        color="violet"
                        phone="+221 77 614 02 11"
                        chips={[
                            { label: "VIA DAKAR" },
                            { label: "● ASSIGNÉ À MOI", tone: "warn" },
                            { label: "PROSPECT" },
                        ]}
                    />
                }
                groups={THREAD}
                composer={<MessageComposer />}
            />
        </div>
    ),
}

export const CopilotOnly: Story = {
    name: "CopilotPanel (right column)",
    render: () => (
        <div className="flex h-screen bg-[var(--paper-white)] justify-end">
            <CopilotPanel
                contactName="Mehdi Sané"
                initials="MS"
                color="violet"
                phone="+221 77 614 02 11"
                summary="Mehdi veut commander 3 × Tessier noir M, livraison Dakar mardi 3. Devis envoyé à 544 € TTC, en attente de confirmation paiement."
                draft="Mehdi, je vous confirme la prise en compte du règlement. Expédition demain matin, vous recevrez le numéro de suivi DHL dans la journée."
                attributes={[
                    { label: "Pays", value: "🇸🇳 Sénégal" },
                    { label: "Langue", value: "Français" },
                    { label: "Source", value: "Landing · 12 mai" },
                    { label: "Premier contact", value: "il y a 12 jours" },
                    { label: "Valeur estimée", value: "544 € · L1 cmd" },
                ]}
            />
        </div>
    ),
}

export const FullInboxView: Story = {
    name: "Full Inbox view (3 columns)",
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
                            chips={[
                                { label: "VIA DAKAR" },
                                { label: "● ASSIGNÉ À MOI", tone: "warn" },
                                { label: "PROSPECT" },
                            ]}
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
                    summary="Mehdi veut commander 3 × Tessier noir M, livraison Dakar mardi 3. Devis envoyé à 544 € TTC, en attente de confirmation paiement."
                    draft="Mehdi, je vous confirme la prise en compte du règlement. Expédition demain matin, vous recevrez le numéro de suivi DHL dans la journée."
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

export const MentionsFeed: Story = {
    name: "MentionCard · feed équipe",
    render: () => (
        <div className="space-y-3 p-8 bg-[var(--paper-white)] max-w-3xl">
            <MentionCard
                author="Tom R."
                initials="TR"
                color="crimson"
                action="vous a mentionnée sur"
                target="Mehdi Sané"
                message="@Inès tu peux vérifier le stock Tessier noir M ?"
                timestamp="il y a 8 min"
            />
            <MentionCard
                author="Lucie A."
                initials="LA"
                color="rose"
                action="vous a assigné"
                target="Coralie Vidal"
                message="Cliente VIP — à traiter ce matin"
                timestamp="il y a 32 min"
            />
            <MentionCard
                author="Omar B."
                initials="OB"
                color="emerald"
                action="a répondu à votre note"
                target="Naomi Diop"
                message="« Stock OK, on a 4 pièces »"
                timestamp="il y a 1h"
            />
        </div>
    ),
}
