import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CampaignDetailScreen, type CampaignDetailData } from "./CampaignDetailScreen"

const EXCL = [
    { label: "Sans consentement marketing", n: 142 },
    { label: "Doublons fusionnés", n: 64 },
    { label: "Hors fenêtre 24 h", n: 40 },
]

const SENDING: CampaignDetailData = {
    name: "Nouvelle collection printemps",
    status: "sending",
    statusLabel: "En cours",
    tpl: "Collection printemps",
    sender: "Paris · +33 1 84 60 12 88",
    audienceLabel: "1 240 contacts · Clientes actives",
    startLabel: "Démarrée aujourd’hui · 11:00",
    eligible: 1240,
    sent: 847,
    delivered: 821,
    read: 612,
    failed: 14,
    replies: 38,
    cost: "€26.48",
    costNote: "sur €34.72 estimés",
    progress: { done: 847, total: 1240, etaLabel: "~14 min restantes", paused: false },
    header: "image",
    body: "Bonjour {{1}}, la nouvelle collection printemps est arrivée. Profitez de -15% sur les nouveautés jusqu’à dimanche soir.",
    sample: "Margaux",
    footer: "Répondez STOP pour vous désabonner",
    buttons: ["Voir la collection", "Se désabonner"],
    segment: "Clientes actives — achat < 90 j",
    segCount: 1486,
    excl: EXCL,
    timeline: [
        { label: "Campagne créée", time: "Hier · 16:42", tone: "mute" },
        { label: "Planifiée", time: "Hier · 16:45", tone: "accent" },
        { label: "Envoi démarré", time: "Aujourd’hui · 11:00", tone: "accent" },
        { label: "Échecs détectés · 14", time: "Aujourd’hui · 11:06", tone: "hot" },
    ],
}

const COMPLETED: CampaignDetailData = {
    ...SENDING,
    name: "Promo Fête des mères",
    status: "completed",
    statusLabel: "Terminée",
    tpl: "Devis envoyé",
    audienceLabel: "2 408 contacts · Base clients",
    startLabel: "Terminée · 26 mai · 18:30",
    eligible: 2408,
    sent: 2408,
    delivered: 2392,
    read: 1880,
    failed: 16,
    replies: 214,
    cost: "€76.94",
    costNote: "€0.032 / conversation",
    progress: undefined,
    timeline: [
        { label: "Campagne créée", time: "25 mai · 11:20", tone: "mute" },
        { label: "Envoi démarré", time: "26 mai · 18:00", tone: "accent" },
        { label: "Échecs détectés · 16", time: "26 mai · 18:12", tone: "hot" },
        { label: "Terminée", time: "26 mai · 18:30", tone: "good" },
    ],
}

const SCHEDULED: CampaignDetailData = {
    ...SENDING,
    name: "Relance paniers abandonnés",
    status: "scheduled",
    statusLabel: "Planifiée",
    tpl: "Relance impayée",
    audienceLabel: "88 contacts · Paniers > 50 €",
    startLabel: "Démarre demain · 09:00 · Europe/Paris",
    eligible: 88,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    replies: 0,
    cost: "est. €2.80",
    costNote: "≈ €0.032 / conversation",
    progress: undefined,
    countdown: { etaLabel: "Démarre dans 21 h" },
    header: "none",
    buttons: ["Reprendre ma commande"],
    timeline: [
        { label: "Campagne créée", time: "Aujourd’hui · 10:12", tone: "mute" },
        { label: "Planifiée · demain 09:00", time: "Aujourd’hui · 10:20", tone: "accent" },
    ],
}

const DRAFT: CampaignDetailData = {
    ...SCHEDULED,
    name: "Lancement service livraison",
    status: "draft",
    statusLabel: "Brouillon",
    tpl: "— non sélectionné",
    audienceLabel: "Audience non définie",
    startLabel: "Jamais envoyée · brouillon",
    eligible: 0,
    cost: "—",
    costNote: "à estimer",
    countdown: undefined,
    segment: "À sélectionner",
    segCount: 0,
    excl: [],
    timeline: [{ label: "Brouillon créé", time: "Aujourd’hui · 15:30", tone: "mute" }],
}

const meta = {
    title: "Screens/Campaigns/Detail",
    component: CampaignDetailScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 900 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof CampaignDetailScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Sending: Story = { args: { data: SENDING } }
export const Completed: Story = { args: { data: COMPLETED } }
export const Scheduled: Story = { args: { data: SCHEDULED } }
export const Draft: Story = { args: { data: DRAFT } }
export const AgentReadOnly: Story = { args: { data: SENDING, role: "AGENT" } }
