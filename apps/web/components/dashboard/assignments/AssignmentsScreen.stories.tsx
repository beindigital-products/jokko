import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AssignmentsScreen } from "./AssignmentsScreen"
import type { AssignmentsData } from "./types"

const DATA: AssignmentsData = {
    autoEnabled: true,
    activeSinceLabel: "Actif depuis 84 jours",

    strategies: [
        {
            id: "rr",
            label: "Round-robin entre tous les agents en ligne",
            sub: "Distribution équitable. Recommandé pour démarrer.",
            selected: false,
        },
        {
            id: "pole",
            label: "Round-robin par pôle",
            sub: "Selon le numéro WhatsApp ou le mot-clé du message.",
            selected: true,
        },
        {
            id: "chan",
            label: "Par numéro WhatsApp",
            sub: "Chaque numéro est dédié à un agent ou un pôle.",
            selected: false,
        },
        {
            id: "kw",
            label: "Par mot-clé / intention",
            sub: "Détection automatique + bascule au pôle adapté.",
            selected: false,
        },
    ],

    channels: [
        {
            city: "Paris",
            number: "+33 1 84 60 12 88",
            dest: "Pôle Ventes",
            destSub: "3 agents · Inès, Tom, Camille",
        },
        {
            city: "Dakar",
            number: "+221 33 822 14 50",
            dest: "Pôle Dakar",
            destSub: "2 agents · Omar, Awa",
        },
        {
            city: "Abidjan",
            number: "+225 27 22 91 04 17",
            dest: "Pôle Support",
            destSub: "3 agents · Lucie, Mathieu, Camille",
        },
    ],

    agents: [
        { id: "1", name: "Lucie Aubert",      pole: "Support", open: 18, cap: 15, state: "over" },
        { id: "2", name: "Awa Sow",            pole: "Dakar",   open: 14, cap: 15, state: "ok"   },
        { id: "3", name: "Inès Caron",         pole: "Ventes",  open: 12, cap: 15, state: "ok"   },
        { id: "4", name: "Omar Ba",            pole: "Dakar",   open: 8,  cap: 15, state: "low"  },
        { id: "5", name: "Tom Roussel",        pole: "Ventes",  open: 6,  cap: 15, state: "low"  },
        { id: "6", name: "Camille Brun",       pole: "Ventes",  open: 4,  cap: 15, state: "low"  },
        { id: "7", name: "Mathieu Khelifa",    pole: "Support", open: 0,  cap: 15, state: "off"  },
    ],

    slas: [
        {
            label: "Première réponse",
            value: "3 min",
            stat: "Moy. 2m 14s · respecté à 92%",
            statTone: "good",
        },
        {
            label: "Résolution",
            value: "24 h",
            stat: "Moy. 18h · 2 SLAs dépassés cette semaine",
            statTone: "warn",
        },
    ],

    slaAlert:
        "Notifier le manager dès qu'un SLA est dépassé de plus de 15 min.",

    fallbackDesc:
        "Si l'assigné est hors ligne plus de 10 minutes, la conversation bascule sur son pôle en round-robin.",

    fallbackOptions: [
        { label: "Bascule sur le pôle (round-robin)", enabled: true  },
        { label: "Notifier le pôle dans Slack",       enabled: true  },
        { label: "Envoyer une réponse automatique au contact", enabled: false },
    ],
}

const EMPTY_DATA: AssignmentsData = {
    autoEnabled: false,
    activeSinceLabel: "",

    strategies: [
        {
            id: "rr",
            label: "Round-robin entre tous les agents en ligne",
            sub: "Distribution équitable. Recommandé pour démarrer.",
            selected: true,
        },
        {
            id: "pole",
            label: "Round-robin par pôle",
            sub: "Selon le numéro WhatsApp ou le mot-clé du message.",
            selected: false,
        },
        {
            id: "chan",
            label: "Par numéro WhatsApp",
            sub: "Chaque numéro est dédié à un agent ou un pôle.",
            selected: false,
        },
        {
            id: "kw",
            label: "Par mot-clé / intention",
            sub: "Détection automatique + bascule au pôle adapté.",
            selected: false,
        },
    ],

    channels: [],

    agents: [],

    slas: [
        {
            label: "Première réponse",
            value: "—",
            stat: "Aucune donnée",
            statTone: "good",
        },
        {
            label: "Résolution",
            value: "—",
            stat: "Aucune donnée",
            statTone: "good",
        },
    ],

    slaAlert: "Configurez un SLA pour activer les alertes.",

    fallbackDesc:
        "Si l'assigné est hors ligne plus de 10 minutes, la conversation bascule sur son pôle en round-robin.",

    fallbackOptions: [
        { label: "Bascule sur le pôle (round-robin)", enabled: false },
        { label: "Notifier le pôle dans Slack",       enabled: false },
        { label: "Envoyer une réponse automatique au contact", enabled: false },
    ],
}

const meta = {
    title: "Dashboard/Assignments",
    component: AssignmentsScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 1280 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AssignmentsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: DATA },
}

export const Empty: Story = {
    args: { data: EMPTY_DATA },
}
