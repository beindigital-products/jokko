import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Plus } from "lucide-react"
import { useState } from "react"

import { ChannelCard } from "./ChannelCard"
import { SettingsTabsNav } from "./SettingsTabsNav"
import { WebhookBox } from "./WebhookBox"
import { HeaderButton } from "../shell/HeaderButton"

const meta = {
    title: "Screens/Settings/Layout",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

const SETTINGS_TABS = [
    { key: "org", label: "Organisation" },
    { key: "canaux", label: "Canaux WhatsApp", count: 3 },
    { key: "team", label: "Équipe & rôles" },
    { key: "notifs", label: "Notifications" },
    { key: "security", label: "Sécurité · 2FA" },
    { key: "api", label: "API · Webhooks" },
    { key: "intégrations", label: "Intégrations", count: 4 },
    { key: "privacy", label: "Confidentialité" },
    { key: "appearance", label: "Apparence" },
]

export const TabsNav: Story = {
    name: "TabsNav · vertical",
    render: () => {
        const [active, setActive] = useState("canaux")
        return (
            <div className="min-h-[400px] w-[220px] border-r border-[var(--ink-200)]">
                <SettingsTabsNav tabs={SETTINGS_TABS} activeKey={active} onChange={setActive} />
            </div>
        )
    },
}

export const FullView: Story = {
    name: "Full settings view · tabs + content",
    render: () => {
        const [active, setActive] = useState("canaux")
        return (
            <div className="grid min-h-[600px] grid-cols-[220px_1fr] rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)]">
                <SettingsTabsNav tabs={SETTINGS_TABS} activeKey={active} onChange={setActive} />
                <div className="px-7 py-5">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        Canaux WhatsApp Business
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
                        Trois numéros, une boîte unique.
                    </h2>
                    <p className="mt-1.5 text-[13px] text-[var(--ink-500)]">
                        Chaque numéro est connecté via Meta Business Cloud API. Le webhook entrant est auto-configuré et signé HMAC-SHA256.
                    </p>
                    <div className="mt-5 space-y-2.5">
                        <ChannelCard name="Atelier Bracquet · Paris" phone="+33 1 84 60 12 88" wabaId="WABA ID 1023890123" status={{ label: "● ACTIF", tone: "good" }} quality="GREEN" volume={142} />
                        <ChannelCard name="Atelier Bracquet · Sénégal" phone="+221 33 822 14 50" wabaId="WABA ID 1023891123" status={{ label: "● ACTIF", tone: "good" }} quality="GREEN" volume={38} />
                        <ChannelCard name="Atelier Bracquet · CI" phone="+225 27 22 91 04 17" wabaId="WABA ID 1023892123" status={{ label: "● QUALITÉ MOYENNE", tone: "warn" }} quality="YELLOW" volume={21} />
                        <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--ink-200)] p-3">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-[var(--ink-300)]">
                                    <Plus className="h-3.5 w-3.5 text-[var(--ink-500)]" />
                                </span>
                                <div>
                                    <div className="text-[13px] font-semibold">Connecter un nouveau numéro</div>
                                    <div className="text-[11px] text-[var(--ink-soft)]">via Meta Business · 1-2 minutes</div>
                                </div>
                            </div>
                            <HeaderButton variant="primary">Connecter</HeaderButton>
                        </div>
                    </div>
                    <div className="mt-7">
                        <WebhookBox
                            url="https://api.jokko.app/v1/webhooks/wa/atelier-bracquet"
                            verifiedAgo="il y a 4 min"
                            lastStatus="200 OK · 412 ms"
                        />
                    </div>
                </div>
            </div>
        )
    },
}
