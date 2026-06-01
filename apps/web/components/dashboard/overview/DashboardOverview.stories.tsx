import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { DashboardOverview, type DashboardOverviewData } from "./DashboardOverview"

const ACTIVITY = [
    { day: "Mar", inbound: 88, outbound: 64 },
    { day: "Mer", inbound: 112, outbound: 96 },
    { day: "Jeu", inbound: 74, outbound: 70 },
    { day: "Ven", inbound: 134, outbound: 121 },
    { day: "Sam", inbound: 52, outbound: 41 },
    { day: "Dim", inbound: 38, outbound: 33 },
    { day: "Lun", inbound: 121, outbound: 104 },
]

const STATUS = [
    { key: "resolved", label: "Résolues", value: 68, color: "var(--status-good)" },
    { key: "open", label: "En cours", value: 18, color: "var(--accent)" },
    { key: "pending", label: "En attente", value: 9, color: "var(--status-warn)" },
    { key: "abandoned", label: "Abandonnées", value: 5, color: "var(--ink-400)" },
]

const TEAM: DashboardOverviewData["team"] = [
    { id: "1", name: "Inès Caron", initials: "IC", color: "violet", status: "online", role: "AGENT", openCount: 12 },
    { id: "2", name: "Tom Roussel", initials: "TR", color: "sky", status: "online", role: "ADMIN", openCount: 6 },
    { id: "3", name: "Lucie Aubert", initials: "LA", color: "rose", status: "busy", role: "AGENT", openCount: 18 },
    { id: "4", name: "Omar Ba", initials: "OB", color: "emerald", status: "online", role: "AGENT", openCount: 8 },
    { id: "5", name: "Mathieu Khelifa", initials: "MK", color: "amber", status: "offline", role: "AGENT", openCount: 0 },
    { id: "6", name: "Awa Sow", initials: "AS", color: "indigo", status: "away", role: "AGENT", openCount: 14 },
]

const RECENT: DashboardOverviewData["recent"] = [
    { id: "1", name: "Mehdi Sané", initials: "MS", color: "violet", preview: "Vous livrez à Dakar le mardi 3 ?", time: "11:32", unread: true },
    { id: "2", name: "Léa Marchand", initials: "LM", color: "rose", preview: "Parfait, j'ai bien reçu la facture. Merci !", time: "11:47" },
    { id: "3", name: "Coralie Vidal", initials: "CV", color: "amber", preview: "Voici la photo de la pièce 👍", time: "11:18" },
    { id: "4", name: "Sébastien Ouattara", initials: "SO", color: "sky", preview: "Vous : D'accord, je vous envoie le devis demain.", time: "10:54" },
    { id: "5", name: "Naomi Diop", initials: "ND", color: "teal", preview: "Note vocale · 0:34", time: "Hier", unread: true },
]

const CHANNELS_OK: DashboardOverviewData["channels"] = [
    { id: "1", name: "Atelier Bracquet · Paris", phone: "+33 1 84 60 12 88", quality: "GREEN", volume: 142 },
    { id: "2", name: "Atelier Bracquet · Sénégal", phone: "+221 33 822 14 50", quality: "GREEN", volume: 38 },
    { id: "3", name: "Atelier Bracquet · CI", phone: "+225 27 22 91 04 17", quality: "GREEN", volume: 21 },
]

const USAGE: DashboardOverviewData["usage"] = [
    { label: "CONVERSATIONS META", value: "4 612", total: "10 000", sub: "Ce mois · €148.72", tone: "accent" },
    { label: "CONTACTS", value: "2 408", total: "5 000", sub: "Inclus", tone: "good" },
    { label: "SIÈGES", value: "8", total: "10", sub: "Plan Pro", tone: "good" },
]

const FULL: DashboardOverviewData = {
    greetingName: "Sophie",
    dateLabel: "Lundi 1 juin 2026 · 3 numéros · sync OK",
    period: "today",
    kpis: [
        { eyebrow: "Conversations à traiter", value: "23", trend: "+12% vs hier", trendDirection: "up" },
        { eyebrow: "Temps 1re réponse", value: "2m 14s", trend: "−18% vs hier", trendDirection: "up" },
        { eyebrow: "Taux de résolution", value: "94%", trend: "+2 pts vs hier", trendDirection: "up" },
        { eyebrow: "Messages envoyés", value: "486", trend: "aujourd'hui", trendDirection: "neutral" },
    ],
    attention: [
        { key: "unassigned", label: "Non assignées", value: 14, tone: "accent", hint: "En attente d'un agent", cta: "Assigner", href: "/dashboard/assignments" },
        { key: "mine", label: "Mes conversations ouvertes", value: 6, tone: "neutral", hint: "À toi", cta: "Ouvrir", href: "/dashboard/conversations" },
        { key: "sla", label: "Fenêtre 24 h bientôt fermée", value: 3, tone: "warn", hint: "< 4 h restantes", cta: "Voir", href: "/dashboard/conversations" },
    ],
    activity: ACTIVITY,
    statusBreakdown: STATUS,
    team: TEAM,
    recent: RECENT,
    channels: CHANNELS_OK,
    usage: USAGE,
}

const meta = {
    title: "Dashboard/Overview",
    component: DashboardOverview,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div className="h-[900px] bg-[var(--paper-warm)]/40">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof DashboardOverview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: FULL, role: "OWNER" },
}

export const Loading: Story = {
    args: { loading: true },
}

export const Empty: Story = {
    args: {
        role: "OWNER",
        data: {
            ...FULL,
            greetingName: "Sophie",
            dateLabel: "Lundi 1 juin 2026 · nouvelle organisation",
            kpis: [
                { eyebrow: "Conversations à traiter", value: "0", trend: "—", trendDirection: "neutral" },
                { eyebrow: "Temps 1re réponse", value: "—", trendDirection: "neutral" },
                { eyebrow: "Taux de résolution", value: "—", trendDirection: "neutral" },
                { eyebrow: "Messages envoyés", value: "0", trend: "aujourd'hui", trendDirection: "neutral" },
            ],
            attention: [
                { key: "unassigned", label: "Non assignées", value: 0, tone: "neutral" },
                { key: "mine", label: "Mes conversations ouvertes", value: 0, tone: "neutral" },
                { key: "sla", label: "Fenêtre 24 h bientôt fermée", value: 0, tone: "neutral" },
            ],
            activity: ACTIVITY.map((a) => ({ ...a, inbound: 0, outbound: 0 })),
            statusBreakdown: STATUS.map((s) => ({ ...s, value: 0 })),
            team: [],
            recent: [],
            channels: [],
            usage: [
                { label: "CONVERSATIONS META", value: "0", total: "10 000", tone: "accent" },
                { label: "CONTACTS", value: "0", total: "5 000", tone: "good" },
                { label: "SIÈGES", value: "1", total: "10", tone: "good" },
            ],
        },
    },
}

export const TrialExpired: Story = {
    args: { data: FULL, role: "OWNER", trial: { state: "expired" } },
}

export const ChannelWarning: Story = {
    args: {
        role: "OWNER",
        data: {
            ...FULL,
            channels: [
                { id: "1", name: "Atelier Bracquet · Paris", phone: "+33 1 84 60 12 88", quality: "GREEN", volume: 142 },
                { id: "2", name: "Atelier Bracquet · CI", phone: "+225 27 22 91 04 17", quality: "YELLOW", volume: 21 },
                { id: "3", name: "Atelier Bracquet · Mali", phone: "+223 70 11 22 33", quality: "RED", volume: 4 },
            ],
        },
    },
}

export const AgentView: Story = {
    args: {
        role: "AGENT",
        data: {
            ...FULL,
            greetingName: "Omar",
            attention: [
                { key: "mine", label: "Mes conversations ouvertes", value: 8, tone: "accent", cta: "Ouvrir", href: "/dashboard/conversations" },
                { key: "mentions", label: "Mentions non lues", value: 2, tone: "warn", cta: "Voir", href: "/dashboard/notifications" },
                { key: "today", label: "Résolues aujourd'hui", value: 11, tone: "neutral" },
            ],
        },
    },
}
