import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { ReactNode } from "react"

import {
    WaChatFrame,
    WhatsAppBubble,
    highlightBody,
    type WhatsAppBubbleProps,
} from "./WhatsAppBubble"

// Example variable bindings so the {{N}} tokens render as a real message would.
const EG: Record<string, string> = {
    "{{1}}": "Margaux",
    "{{2}}": "Printemps 2026",
    "{{3}}": "atb.fr/suivi",
}
const filled = (text: string) => highlightBody(text, (t) => EG[t] ?? t)

/** A single phone-width chat frame, the way the preview rail shows it. */
function Phone({ children }: { children: ReactNode }) {
    return <div style={{ width: 332 }}>{children}</div>
}

/** A labelled tile for the gallery. */
function Tile({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div style={{ width: 300 }}>
            <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {label}
            </div>
            <WaChatFrame>{children}</WaChatFrame>
        </div>
    )
}

const meta = {
    title: "Components/WhatsApp Bubble",
    component: WhatsAppBubble,
    parameters: { layout: "centered" },
    // Default body so the render-driven stories below satisfy the required prop.
    args: { body: "Aperçu du modèle" },
} satisfies Meta<typeof WhatsAppBubble>

export default meta
type Story = StoryObj<typeof meta>

// Reusable bubble configs ------------------------------------------------------

const DOCUMENT: WhatsAppBubbleProps = {
    media: { kind: "document", filename: "Devis_AB-2042.pdf", pages: 2, size: "248 ko" },
    body: filled("Bonjour {{1}}, voici votre devis personnalisé. Il est valable 14 jours."),
    footer: "— L'équipe Atelier Bracquet",
    buttons: [{ label: "Voir la boutique", kind: "url" }],
    time: "10:24",
}

const IMAGE: WhatsAppBubbleProps = {
    media: { kind: "image", alt: "Visuel collection" },
    body: filled("Bonjour {{1}}, notre nouvelle collection {{2}} vient d'arriver 🌿"),
    footer: "— Atelier Bracquet",
    buttons: [
        { label: "Découvrir", kind: "url" },
        { label: "Se désinscrire", kind: "reply" },
    ],
    time: "09:02",
}

const VIDEO: WhatsAppBubbleProps = {
    media: { kind: "video", duration: "0:24" },
    body: filled("En coulisses de l'atelier {{2}} — 24 secondes de savoir-faire."),
    buttons: [{ label: "Voir la vidéo", kind: "url" }],
    time: "18:40",
}

const LOCATION: WhatsAppBubbleProps = {
    media: {
        kind: "location",
        name: "Atelier Bracquet",
        address: "18 rue de Sévigné, 75004 Paris",
    },
    body: filled("Votre rendez-vous est confirmé. On vous attend à la boutique !"),
    buttons: [{ label: "Nous appeler", kind: "phone" }],
    time: "11:32",
}

const TEXT: WhatsAppBubbleProps = {
    body: filled("Welcome {{1}}! Enjoy 10% off your first order this week. Reply STOP to unsubscribe."),
    buttons: [{ label: "Shop now", kind: "url" }],
    time: "08:15",
}

// Stories ----------------------------------------------------------------------

/** Every media header side by side — the file banner in all its forms. */
export const Gallery: Story = {
    render: () => (
        <div className="flex flex-wrap gap-7" style={{ maxWidth: 980 }}>
            <Tile label="Document">
                <WhatsAppBubble {...DOCUMENT} />
            </Tile>
            <Tile label="Image">
                <WhatsAppBubble {...IMAGE} />
            </Tile>
            <Tile label="Vidéo">
                <WhatsAppBubble {...VIDEO} />
            </Tile>
            <Tile label="Localisation">
                <WhatsAppBubble {...LOCATION} />
            </Tile>
            <Tile label="Texte seul">
                <WhatsAppBubble {...TEXT} />
            </Tile>
        </div>
    ),
}

/** Document header — PDF chip with filename, page count, size and a download affordance. */
export const Document: Story = {
    render: () => (
        <Phone>
            <WaChatFrame>
                <WhatsAppBubble {...DOCUMENT} />
            </WaChatFrame>
        </Phone>
    ),
}

/** Image header — full-width media that fills the top of the bubble. */
export const ImageHeader: Story = {
    render: () => (
        <Phone>
            <WaChatFrame>
                <WhatsAppBubble {...IMAGE} />
            </WaChatFrame>
        </Phone>
    ),
}

/** Video header — media with a play button and a duration chip. */
export const Video: Story = {
    render: () => (
        <Phone>
            <WaChatFrame>
                <WhatsAppBubble {...VIDEO} />
            </WaChatFrame>
        </Phone>
    ),
}

/** Location header — map thumbnail with a pin, plus the place name and address. */
export const Location: Story = {
    render: () => (
        <Phone>
            <WaChatFrame>
                <WhatsAppBubble {...LOCATION} />
            </WaChatFrame>
        </Phone>
    ),
}

/** No header — a plain text template with a single CTA. */
export const TextOnly: Story = {
    render: () => (
        <Phone>
            <WaChatFrame>
                <WhatsAppBubble {...TEXT} />
            </WaChatFrame>
        </Phone>
    ),
}

/** Delivery ticks — sent (grey single), delivered (grey double), read (blue double). */
export const DeliveryStates: Story = {
    render: () => (
        <Phone>
            <WaChatFrame className="flex flex-col gap-2">
                <WhatsAppBubble body="Message envoyé." status="sent" time="10:00" />
                <WhatsAppBubble body="Message distribué." status="delivered" time="10:01" />
                <WhatsAppBubble body="Message lu." status="read" time="10:02" />
            </WaChatFrame>
        </Phone>
    ),
}
