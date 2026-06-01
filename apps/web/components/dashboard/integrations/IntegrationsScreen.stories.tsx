import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { IntegrationsScreen } from "./IntegrationsScreen"
import type { IntegrationsData } from "./types"

const INTEGRATIONS_DATA: IntegrationsData = {
    activeCount: 6,
    integrations: [
        {
            id: "hubspot",
            name: "HubSpot",
            desc: "Sync contacts + deals, bidirectionnel",
            cat: "CRM",
            on: true,
            health: "good",
            last: "synchronisé il y a 4 min",
        },
        {
            id: "salesforce",
            name: "Salesforce",
            desc: "Comptes, opportunités, activités",
            cat: "CRM",
            on: false,
            health: null,
            last: "—",
        },
        {
            id: "pipedrive",
            name: "Pipedrive",
            desc: "Pipeline deals + activités",
            cat: "CRM",
            on: true,
            health: "good",
            last: "synchronisé il y a 12 min",
        },
        {
            id: "zoho",
            name: "Zoho CRM",
            desc: "CRM léger + facturation",
            cat: "CRM",
            on: false,
            health: null,
            last: "—",
        },
        {
            id: "notion",
            name: "Notion",
            desc: "Bases de contacts + docs internes",
            cat: "Prod.",
            on: true,
            health: "warn",
            last: "échec partiel il y a 1h",
        },
        {
            id: "sheets",
            name: "Google Sheets",
            desc: "Export auto vers feuille de calcul",
            cat: "Prod.",
            on: true,
            health: "good",
            last: "synchronisé il y a 22 min",
        },
        {
            id: "slack",
            name: "Slack",
            desc: "Notifications + commandes /jokko",
            cat: "Messagerie",
            on: true,
            health: "good",
            last: "actif",
        },
        {
            id: "teams",
            name: "Microsoft Teams",
            desc: "Notifications + bot dans les canaux",
            cat: "Messagerie",
            on: false,
            health: null,
            last: "—",
        },
        {
            id: "webhook",
            name: "Webhook personnalisé",
            desc: "POST sortant sur événements",
            cat: "API",
            on: true,
            health: "good",
            last: "412 ms · 200 OK",
        },
        {
            id: "zapier",
            name: "Zapier",
            desc: "3 000+ apps via triggers",
            cat: "API",
            on: false,
            health: null,
            last: "—",
        },
        {
            id: "stripe",
            name: "Stripe",
            desc: "Liens de paiement dans les messages",
            cat: "Paiement",
            on: true,
            health: "good",
            last: "actif · 24 liens créés",
        },
        {
            id: "shopify",
            name: "Shopify",
            desc: "Commandes + statut livraison",
            cat: "E-commerce",
            on: false,
            health: null,
            last: "—",
        },
    ],
}

const meta = {
    title: "Dashboard/Integrations",
    component: IntegrationsScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 840 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof IntegrationsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: INTEGRATIONS_DATA },
}

export const Empty: Story = {
    args: {
        data: {
            activeCount: 0,
            integrations: [],
        },
    },
}
