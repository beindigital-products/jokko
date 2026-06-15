import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { IntegrationConnectDialog } from "./IntegrationConnectDialog"
import { DisconnectDialog } from "@/components/integrations/disconnect-dialog"

const meta = {
    title: "Screens/Integrations/Modals",
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 760, background: "var(--paper-warm)" }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta

export default meta
type Story = StoryObj

const noop = () => {}

export const ConnectOAuth: Story = {
    render: () => (
        <IntegrationConnectDialog
            open
            onOpenChange={noop}
            workspace="Atelier Bracquet"
            integration={{ id: "salesforce", name: "Salesforce", cat: "CRM", authMode: "oauth2" }}
            onConnectOAuth={noop}
            onConnectApiKey={noop}
        />
    ),
}

export const ConnectApiKey: Story = {
    render: () => (
        <IntegrationConnectDialog
            open
            onOpenChange={noop}
            workspace="Atelier Bracquet"
            integration={{ id: "nocrm", name: "noCRM.io", cat: "CRM", authMode: "apiKey" }}
            instanceHint={{ label: "Sous-domaine noCRM.io", placeholder: "monentreprise" }}
            onConnectOAuth={noop}
            onConnectApiKey={noop}
        />
    ),
}

export const Disconnect: Story = {
    render: () => (
        <DisconnectDialog
            open
            providerId="hubspot"
            providerLabel="HubSpot"
            category="CRM"
            supportsRemoteRevoke={false}
            onCancel={noop}
            onConfirm={noop}
        />
    ),
}
