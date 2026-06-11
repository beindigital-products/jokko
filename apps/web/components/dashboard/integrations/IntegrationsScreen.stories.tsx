import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { IntegrationsScreen } from "./IntegrationsScreen"
import type { IntegrationsData } from "./types"

// Mirrors what ships: the 6 real CRM connectors (functional) + the design's
// broader catalog as honest "Bientôt" (available: false) showcase cards.
const INTEGRATIONS_DATA: IntegrationsData = {
    activeCount: 2,
    integrations: [
        { id: "hubspot", name: "HubSpot", desc: "Sync contacts + deals, bidirectionnel.", cat: "CRM", on: true, health: "good", last: "synchronisé il y a 4 min", available: true },
        { id: "pipedrive", name: "Pipedrive", desc: "Pipeline deals + activités.", cat: "CRM", on: true, health: "good", last: "synchronisé il y a 12 min", available: true },
        { id: "salesforce", name: "Salesforce", desc: "Comptes, opportunités, activités.", cat: "CRM", on: false, health: null, last: "—", available: true },
        { id: "sellsy", name: "Sellsy", desc: "CRM + facturation française.", cat: "CRM", on: false, health: null, last: "—", available: true },
        { id: "axonaut", name: "Axonaut", desc: "Gestion + facturation pour PME.", cat: "CRM", on: false, health: null, last: "—", available: true },
        { id: "nocrm", name: "noCRM.io", desc: "CRM léger orienté prospection.", cat: "CRM", on: false, health: null, last: "—", available: true },
        { id: "notion", name: "Notion", desc: "Bases de contacts + docs internes.", cat: "Prod.", on: false, health: null, last: "—", available: false },
        { id: "sheets", name: "Google Sheets", desc: "Export auto vers feuille de calcul.", cat: "Prod.", on: false, health: null, last: "—", available: false },
        { id: "slack", name: "Slack", desc: "Notifications + commandes /jokko.", cat: "Messagerie", on: false, health: null, last: "—", available: false },
        { id: "teams", name: "Microsoft Teams", desc: "Notifications + bot dans les canaux.", cat: "Messagerie", on: false, health: null, last: "—", available: false },
        { id: "stripe", name: "Stripe", desc: "Liens de paiement dans les messages.", cat: "Paiement", on: false, health: null, last: "—", available: false },
        { id: "shopify", name: "Shopify", desc: "Commandes + statut livraison.", cat: "E-commerce", on: false, health: null, last: "—", available: false },
        { id: "webhook", name: "Webhook personnalisé", desc: "POST sortant sur événements.", cat: "API", on: false, health: null, last: "—", available: false },
        { id: "zapier", name: "Zapier", desc: "3 000+ apps via triggers.", cat: "API", on: false, health: null, last: "—", available: false },
    ],
}

const meta = {
    title: "Screens/Integrations",
    component: IntegrationsScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 900 }}>
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
    args: { data: { activeCount: 0, integrations: [] } },
}
