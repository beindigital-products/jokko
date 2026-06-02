import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Banner, type BannerProps } from "./Banner"

const meta = {
    title: "Primitives/Banner",
    component: Banner,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Banner>

export default meta
type Story = StoryObj<typeof meta>

const NEUTRAL: BannerProps = {
    tone: "neutral",
    eyebrow: "Essai · jour 1 / 14",
    left: "13 jours restants",
    progress: 1 / 14,
    title: "Bienvenue dans Jokko",
    body: "Aucune limite pendant l'essai. Choisissez un plan quand vous serez prêt.",
    cta: "Choisir un plan",
    ctaTone: "primary",
    dismissible: true,
}

const REMINDER: BannerProps = {
    tone: "reminder",
    eyebrow: "Essai · jour 8 / 14",
    left: "6 jours restants",
    progress: 8 / 14,
    title: "Plus que 6 jours d'essai",
    body: "Activez votre abonnement pour ne pas interrompre l'envoi de messages.",
    cta: "Activer mon abonnement",
    ctaTone: "ink",
    dismissible: true,
}

const URGENT: BannerProps = {
    tone: "urgent",
    eyebrow: "Essai · jour 12 / 14",
    left: "2 jours restants",
    progress: 12 / 14,
    title: "Plus que 2 jours",
    body: "À l'expiration, l'envoi de nouveaux messages sera bloqué.",
    cta: "Activer maintenant",
    ctaTone: "danger",
}

const EXPIRED: BannerProps = {
    tone: "expired",
    eyebrow: "Essai expiré",
    left: "Envoi suspendu",
    progress: 1,
    title: "Essai terminé",
    body: "Vous voyez encore vos données, mais l'envoi est suspendu. Activez votre abonnement pour reprendre.",
    cta: "Activer mon abonnement",
    ctaTone: "danger",
    secondaryCta: "Demander à l'admin",
}

const WARN: BannerProps = {
    tone: "warn",
    eyebrow: "Plan · Pro",
    left: "9 / 10 sièges",
    title: "Vous atteignez la limite de sièges",
    body: "Pour inviter plus de coéquipiers, passez au plan Business.",
    cta: "Comparer les plans",
    ctaTone: "ink",
    dismissible: true,
}

const GOOD: BannerProps = {
    tone: "good",
    eyebrow: "Numéro · Paris",
    title: "Numéro WhatsApp reconnecté",
    body: "Tout est revenu en ligne. Les messages entrants sont de nouveau délivrés.",
    cta: "Voir l'inbox",
    ctaTone: "primary",
    dismissible: true,
}

export const Neutral: Story = { args: NEUTRAL }
export const Reminder: Story = { args: REMINDER }
export const Urgent: Story = { args: URGENT }
export const Expired: Story = { args: EXPIRED }
export const Warn: Story = { args: WARN }
export const Good: Story = { args: GOOD }

export const AllStates: Story = {
    args: NEUTRAL,
    render: () => (
        <div className="flex flex-col gap-3">
            {[NEUTRAL, REMINDER, URGENT, EXPIRED, WARN, GOOD].map((b) => (
                <Banner key={b.tone} {...b} />
            ))}
        </div>
    ),
}

export const Sidebar: Story = {
    args: { ...REMINDER, variant: "sidebar" },
    decorators: [
        (Story) => (
            <div style={{ width: 260, background: "var(--paper-warm)", padding: 16 }}>
                <Story />
            </div>
        ),
    ],
}
