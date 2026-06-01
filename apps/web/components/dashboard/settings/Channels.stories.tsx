import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ChannelCard } from "./ChannelCard"
import { WebhookBox } from "./WebhookBox"

const meta = {
    title: "Dashboard/Settings/Channels",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const Cards: Story = {
    name: "ChannelCard · qualité variants",
    render: () => (
        <div className="max-w-3xl space-y-2.5">
            <ChannelCard
                name="Atelier Bracquet · Paris"
                phone="+33 1 84 60 12 88"
                wabaId="WABA ID 1023890123"
                status={{ label: "● ACTIF", tone: "good" }}
                quality="GREEN"
                volume={142}
            />
            <ChannelCard
                name="Atelier Bracquet · Sénégal"
                phone="+221 33 822 14 50"
                wabaId="WABA ID 1023891123"
                status={{ label: "● ACTIF", tone: "good" }}
                quality="GREEN"
                volume={38}
            />
            <ChannelCard
                name="Atelier Bracquet · CI"
                phone="+225 27 22 91 04 17"
                wabaId="WABA ID 1023892123"
                status={{ label: "● QUALITÉ MOYENNE", tone: "warn" }}
                quality="YELLOW"
                volume={21}
            />
        </div>
    ),
}

export const Webhook: Story = {
    name: "WebhookBox · URL + copier",
    render: () => (
        <div className="max-w-3xl">
            <WebhookBox
                url="https://api.jokko.app/v1/webhooks/wa/atelier-bracquet"
                verifiedAgo="il y a 4 min"
                lastStatus="200 OK · 412 ms"
            />
        </div>
    ),
}
