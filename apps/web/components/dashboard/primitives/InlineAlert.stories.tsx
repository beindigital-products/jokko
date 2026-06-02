import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AlertTriangle, CheckCircle2, CreditCard, Info, Unplug } from "lucide-react"

import { InlineAlert } from "./InlineAlert"

function MiniBtn({ children }: { children: React.ReactNode }) {
    return (
        <button
            type="button"
            className="inline-flex h-7 items-center rounded-[var(--radius-btn)] border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 text-[12px] font-medium text-[var(--ink-700)]"
        >
            {children}
        </button>
    )
}

const meta = {
    title: "Primitives/InlineAlert",
    component: InlineAlert,
    parameters: { layout: "padded" },
    decorators: [
        (Story) => (
            <div style={{ maxWidth: 560 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof InlineAlert>

export default meta
type Story = StoryObj<typeof meta>

export const WebhookError: Story = {
    args: {
        tone: "danger",
        icon: AlertTriangle,
        title: "Webhook entrant en erreur",
        code: "HTTP 503",
        body: "Meta n'arrive plus à délivrer les messages reçus. Dernière tentative il y a 4 min.",
        actions: <MiniBtn>Diagnostiquer</MiniBtn>,
    },
}

export const ChannelDown: Story = {
    args: {
        tone: "danger",
        icon: Unplug,
        title: "Numéro WhatsApp déconnecté",
        body: "Le token Meta a expiré. Reconnectez via Embedded Signup pour reprendre.",
        actions: <MiniBtn>Reconnecter le numéro</MiniBtn>,
    },
}

export const PaymentFailed: Story = {
    args: {
        tone: "warn",
        icon: CreditCard,
        title: "Échec du dernier prélèvement",
        body: "VISA •••• 4842 — Carte expirée. Mettez à jour votre moyen de paiement avant le 28 mai.",
        actions: <MiniBtn>Mettre à jour</MiniBtn>,
    },
}

export const Info_: Story = {
    args: {
        tone: "accent",
        icon: Info,
        title: "Brouillon partagé",
        body: "Inès a laissé un brouillon sur cette conversation. Vous pouvez l'éditer avant d'envoyer.",
    },
}

export const Success: Story = {
    args: {
        tone: "good",
        icon: CheckCircle2,
        title: "Conformité OK",
        body: "1 204 contacts ont donné leur consentement et sont éligibles à la catégorie Marketing.",
    },
}

export const AllTones: Story = {
    args: { title: "Exemple" },
    render: () => (
        <div className="flex flex-col gap-2.5">
            <InlineAlert tone="danger" icon={AlertTriangle} title="Erreur" code="HTTP 503" body="Une erreur récupérable s'est produite." actions={<MiniBtn>Réessayer</MiniBtn>} />
            <InlineAlert tone="warn" icon={CreditCard} title="Avertissement" body="Quelque chose mérite votre attention." />
            <InlineAlert tone="accent" icon={Info} title="Information" body="Un contexte utile, sans urgence." />
            <InlineAlert tone="good" icon={CheckCircle2} title="Succès" body="L'opération s'est bien déroulée." />
            <InlineAlert tone="mute" title="Neutre" body="Une note discrète, sans tonalité." />
        </div>
    ),
}
