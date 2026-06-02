import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AudioMessagePreview } from "./AudioMessagePreview"
import { MessageBubble } from "./MessageBubble"
import { MessageComposer } from "./MessageComposer"

const meta = {
    title: "Screens/Inbox/Message",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const BubbleText: Story = {
    name: "Bubble · text",
    render: () => (
        <div className="max-w-md space-y-3 p-6 bg-[var(--paper-warm)]/40">
            <MessageBubble side="in" timestamp="10:42">Hello, vous êtes ouverts ce mardi ?</MessageBubble>
            <MessageBubble side="out" timestamp="10:43" deliveryStatus="sent">Bonjour ! Oui, 9h-18h.</MessageBubble>
            <MessageBubble side="out" timestamp="10:44" deliveryStatus="delivered">Vous voulez réserver ?</MessageBubble>
            <MessageBubble side="out" timestamp="10:45" deliveryStatus="read">Tap pour confirmer 👇</MessageBubble>
        </div>
    ),
}

export const BubbleVoice: Story = {
    name: "Bubble · voice (audio)",
    render: () => (
        <div className="max-w-md space-y-3 p-6 bg-[var(--paper-warm)]/40">
            <MessageBubble
                side="in"
                timestamp="11:04"
                audio={{ durationLabel: "0:34", progressPct: 0 }}
            />
            <MessageBubble
                side="in"
                timestamp="11:05"
                audio={{ durationLabel: "1:12", progressPct: 35 }}
            />
            <MessageBubble
                side="out"
                timestamp="11:08"
                deliveryStatus="read"
                audio={{ durationLabel: "0:18", progressPct: 100 }}
            />
        </div>
    ),
}

export const Composer: Story = {
    name: "Composer · idle / recording / preview",
    render: () => (
        <div className="max-w-2xl">
            <MessageComposer />
            <p className="mt-3 px-5 text-[11px] text-[var(--ink-soft)]">
                Tapez du texte → bouton Envoyer activé · Cliquez le micro →
                enregistrement avec timer · Arrêter → AudioMessagePreview en
                place du textarea, le bouton Envoyer envoie alors l&apos;audio.
            </p>
        </div>
    ),
}

export const AudioPreview: Story = {
    name: "Audio preview · standalone",
    render: () => (
        <div className="max-w-md space-y-3 p-6">
            <p className="text-[11px] text-[var(--ink-soft)]">
                Pré-écoute après enregistrement, avant envoi :
            </p>
            <AudioMessagePreview durationLabel="0:34" progressPct={0} />
            <AudioMessagePreview durationLabel="1:12" progressPct={45} />
        </div>
    ),
}
