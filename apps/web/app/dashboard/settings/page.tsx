"use client"

import { useState } from "react"

import { PageHeader } from "@/components/dashboard/shell"
import { SettingsTabsNav, type SettingsTab } from "@/components/dashboard/settings"
import { ChannelsSettings } from "@/components/settings/ChannelsSettings"
import { ProfileSection } from "./_sections/profile-section"
import { OrganizationSection } from "./_sections/organization-section"
import {
    AppearanceSection,
    ApiWebhooksSection,
    DEEP_LINK_ICONS,
    DeepLinkSection,
    NotificationsSection,
    PrivacySection,
    SecuritySection,
} from "./_sections/account-sections"

/**
 * Réglages — v3 full-bleed settings page. Recreates the `Jokko Desktop.html`
 * ScreenSettings: a vertical sub-nav (SettingsTabsNav) + a scrolling content
 * panel. Each section keeps its real Convex wiring; the WhatsApp panel reuses
 * the functional ChannelsSettings (connect / test / pole assignment …).
 */
const TABS: SettingsTab[] = [
    { key: "profile", label: "Profil" },
    { key: "organization", label: "Organisation" },
    { key: "whatsapp", label: "Canaux WhatsApp" },
    { key: "team", label: "Équipe & rôles" },
    { key: "notifications", label: "Notifications" },
    { key: "security", label: "Sécurité · 2FA" },
    { key: "api", label: "API · Webhooks" },
    { key: "integrations", label: "Intégrations" },
    { key: "privacy", label: "Confidentialité" },
    { key: "appearance", label: "Apparence" },
]

function Section({ active }: { active: string }) {
    switch (active) {
        case "profile":
            return <ProfileSection />
        case "organization":
            return <OrganizationSection />
        case "whatsapp":
            return <ChannelsSettings />
        case "team":
            return (
                <DeepLinkSection
                    icon={DEEP_LINK_ICONS.team}
                    title="Équipe & rôles"
                    description="Membres, rôles, pôles et invitations de votre organisation."
                    href="/dashboard/team"
                    cta="Gérer l'équipe"
                />
            )
        case "notifications":
            return <NotificationsSection />
        case "security":
            return <SecuritySection />
        case "api":
            return <ApiWebhooksSection />
        case "integrations":
            return (
                <DeepLinkSection
                    icon={DEEP_LINK_ICONS.integrations}
                    title="Intégrations"
                    description="Connectez votre CRM et synchronisez vos contacts."
                    href="/dashboard/integrations"
                    cta="Gérer les intégrations"
                />
            )
        case "privacy":
            return <PrivacySection />
        case "appearance":
            return <AppearanceSection />
        default:
            return null
    }
}

export default function SettingsPage() {
    const [active, setActive] = useState("profile")

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow="Compte · préférences"
                title="Réglages"
                description="Numéros WhatsApp connectés, équipe, sécurité, webhooks, conformité RGPD."
            />
            <div className="flex min-h-0 flex-1">
                <div className="w-[180px] shrink-0 overflow-y-auto bg-[var(--paper-warm)]/50 sm:w-[208px]">
                    <SettingsTabsNav tabs={TABS} activeKey={active} onChange={setActive} />
                </div>
                <div className="min-w-0 flex-1 overflow-y-auto bg-[var(--paper-warm)]/30 px-5 py-7 sm:px-7">
                    <div className="mx-auto max-w-3xl">
                        <Section active={active} />
                    </div>
                </div>
            </div>
        </div>
    )
}
