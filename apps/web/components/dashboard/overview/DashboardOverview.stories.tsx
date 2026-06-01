import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { DashboardOverview, type DashboardOverviewData } from "./DashboardOverview"

const KPIS: DashboardOverviewData["kpis"] = [
    { label: "Conversations reçues", value: "142", delta: "+22", deltaTone: "good", sub: "vs hier 120" },
    { label: "Réponses envoyées", value: "128", delta: "+18", deltaTone: "good", sub: "par 6 agents" },
    { label: "Temps moyen 1re rép.", value: "2m 14s", delta: "−18s", deltaTone: "good", sub: "cible 3m" },
    { label: "Agents en ligne", value: "6 / 8", deltaTone: "mute", sub: "2 en pause déjeuner" },
    { label: "Non résolues", value: "14", delta: "−3", deltaTone: "warn", sub: "dont 2 > 24h" },
]

const ATTENTION: DashboardOverviewData["attention"] = {
    title: "5 conversations sans assignation ou en attente",
    slaLabel: "SLA 3m",
    rows: [
        { id: "1", who: "Mehdi Sané", last: "Vous livrez à Dakar le mardi 3 ?", channel: "Dakar", tags: ["prospect"], wait: "8 min", state: "unassigned" },
        { id: "2", who: "Naomi Diop", last: "Note vocale · 0:34", channel: "Dakar", tags: ["client"], wait: "14 min", state: "unassigned" },
        { id: "3", who: "Sébastien Ouattara", last: "Bonjour, je voulais savoir si…", channel: "Abidjan", tags: ["prospect"], wait: "24 min", state: "stale" },
        { id: "4", who: "Pierre Wahl", last: "Je passe à 18h, ça vous va ?", channel: "Paris", tags: ["client"], wait: "38 min", state: "stale" },
        { id: "5", who: "Awa Diallo", last: "D'accord, je confirme alors.", channel: "Dakar", tags: [], wait: "1h 04m", state: "breach" },
    ],
}

const TEAM: DashboardOverviewData["team"] = [
    { id: "1", name: "Inès Caron", load: 12, busy: "Mehdi Sané", state: "typing", pole: "Ventes" },
    { id: "2", name: "Lucie Aubert", load: 18, busy: "Coralie Vidal", state: "online", pole: "Support" },
    { id: "3", name: "Tom Roussel", load: 6, busy: "Léa Marchand", state: "online", pole: "Ventes" },
    { id: "4", name: "Omar Ba", load: 8, busy: "Awa Diallo", state: "busy", pole: "Dakar" },
    { id: "5", name: "Awa Sow", load: 14, busy: "—", state: "away", pole: "Dakar" },
    { id: "6", name: "Camille Brun", load: 4, busy: "—", state: "away", pole: "Ventes" },
]

const CAMPAIGNS: DashboardOverviewData["campaigns"] = {
    total: "3 / 6",
    rows: [
        { id: "1", name: "Promo Fête des mères", delivered: "2 408", read: "78%", deliveredPct: 99, status: "completed" },
        { id: "2", name: "Nouvelle collection printemps", delivered: "847 / 1 240", read: "49%", deliveredPct: 68, status: "sending" },
        { id: "3", name: "Réactivation 90j", delivered: "210 / 696", read: "13%", deliveredPct: 30, status: "paused" },
    ],
}

const FLOWS: DashboardOverviewData["flows"] = {
    activeLabel: "11 actifs",
    total24h: "518 exécutions",
    items: [
        { id: "1", name: "Welcome — premier message", runs: 218, period: "24h" },
        { id: "2", name: "Routage par mot-clé", runs: 142, period: "24h" },
        { id: "3", name: "Hors horaires", runs: 64, period: "24h" },
        { id: "4", name: "Devis automatisé", runs: 38, period: "24h" },
    ],
}

const ONBOARDING: DashboardOverviewData["onboarding"] = {
    progressLabel: "4 / 6",
    headline: "Encore deux étapes.",
    steps: [
        { label: "Connecter un numéro WhatsApp", done: true },
        { label: "Inviter l'équipe", done: true },
        { label: "Créer un premier modèle", done: true },
        { label: "Soumettre 1 modèle à Meta", done: true },
        { label: "Configurer une automatisation", done: false },
        { label: "Connecter un CRM", done: false },
    ],
}

const FULL: DashboardOverviewData = {
    greetingName: "Sophie",
    dateLabel: "jeudi 24 mai 2026",
    kpis: KPIS,
    attention: ATTENTION,
    team: TEAM,
    campaigns: CAMPAIGNS,
    flows: FLOWS,
    onboarding: ONBOARDING,
}

const meta = {
    title: "Dashboard/Overview",
    component: DashboardOverview,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 940 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof DashboardOverview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: FULL },
}

export const Loading: Story = {
    args: { loading: true },
}

export const Empty: Story = {
    args: {
        data: {
            ...FULL,
            dateLabel: "jeudi 24 mai 2026 · nouvelle organisation",
            kpis: [
                { label: "Conversations reçues", value: "0", deltaTone: "mute", sub: "—" },
                { label: "Réponses envoyées", value: "0", deltaTone: "mute", sub: "—" },
                { label: "Temps moyen 1re rép.", value: "—", deltaTone: "mute", sub: "cible 3m" },
                { label: "Agents en ligne", value: "1 / 1", deltaTone: "mute", sub: "vous" },
                { label: "Non résolues", value: "0", deltaTone: "mute", sub: "tout est à jour" },
            ],
            attention: { title: "Tout est à jour", rows: [] },
            team: [],
            campaigns: { total: "0 / 0", rows: [] },
            flows: { activeLabel: "0 actif", total24h: "0 exécution", items: [] },
        },
    },
}

export const TrialExpired: Story = {
    args: { data: FULL, trial: { state: "expired" } },
}

export const TrialActive: Story = {
    args: { data: FULL, trial: { state: "active", daysLeft: 7 } },
}
