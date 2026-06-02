import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Banner, type BannerProps } from "./Banner"
import { Icon } from "./Icon"
import { Toast } from "./Toast"

const meta = {
    title: "Primitives/Notifications",
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const caption = "font-mono text-[11px] text-[var(--ink-soft)]"
const spec = "border border-[var(--ink-200)] rounded-xl p-[18px]"

// ── Banner fixtures ────────────────────────────────────────────────────────────

const WELCOME: BannerProps = {
    tone: "neutral",
    eyebrow: "Essai · jour 1 sur 14",
    left: "13 jours restants",
    progress: 0.07,
    title: "Bienvenue sur le plan Business",
    body: "Aucune limite pendant l'essai. Découvrez tout ce que Jokko sait faire.",
    cta: "Voir les fonctionnalités",
    ctaTone: "primary",
    dismissible: true,
}

const ENDING: BannerProps = {
    tone: "urgent",
    eyebrow: "Essai · jour 12 sur 14",
    left: "2 jours restants",
    progress: 12 / 14,
    title: "Votre essai se termine dans 2 jours",
    body: "Activez votre abonnement pour ne pas interrompre l'envoi de messages.",
    cta: "Activer mon abonnement",
    ctaTone: "danger",
}

const DISCONNECTED: BannerProps = {
    tone: "expired",
    eyebrow: "Numéro · Paris",
    title: "Numéro WhatsApp déconnecté",
    body: "Les messages entrants ne sont plus délivrés. Reconnectez le numéro pour reprendre.",
    cta: "Reconnecter le numéro",
    ctaTone: "danger",
}

// ── Counters ───────────────────────────────────────────────────────────────────

function BellBadge() {
    return (
        <span className="relative inline-flex text-[var(--ink-700)]">
            <Icon name="bell" size={20} />
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--status-danger)] px-1 font-mono text-[9px] font-medium leading-none text-white">
                3
            </span>
        </span>
    )
}

function CountPill({ tone, children }: { tone: "accent" | "neutral"; children: React.ReactNode }) {
    const cls =
        tone === "accent"
            ? "bg-[var(--accent-muted)] text-[var(--accent)]"
            : "bg-[var(--paper-warm)] text-[var(--ink-700)] border border-[var(--ink-200)]"
    return (
        <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-medium leading-none ${cls}`}
        >
            {children}
        </span>
    )
}

// ── Story ──────────────────────────────────────────────────────────────────────

export const Default: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <div className={spec}>
                <div className="flex flex-col gap-3">
                    <Banner {...WELCOME} />
                    <Banner {...ENDING} />
                    <Banner {...DISCONNECTED} />
                </div>
                <div className={`${caption} mt-3`}>banners · neutral / urgent / expired</div>
            </div>

            <div className={spec}>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
                    <Toast
                        tone="success"
                        icon="sparkle"
                        title="Campagne envoyée"
                        body="« Promo Fête des mères » livrée à 2 392 contacts."
                        time="2 min"
                    />
                    <Toast
                        tone="alert"
                        icon="bell"
                        title="Crédit marketing bas"
                        body="Solde €18,40 — rechargez avant la prochaine campagne."
                        time="maint."
                    />
                </div>
                <div className={`${caption} mt-3`}>toasts · success / alert</div>
            </div>

            <div className={spec}>
                <div className="flex items-center gap-6">
                    <BellBadge />
                    <CountPill tone="accent">142</CountPill>
                    <CountPill tone="neutral">14</CountPill>
                </div>
                <div className={`${caption} mt-3`}>counters · bell badge · accent / neutral pills</div>
            </div>
        </div>
    ),
}
