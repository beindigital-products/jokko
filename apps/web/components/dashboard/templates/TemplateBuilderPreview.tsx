"use client"

import type { ReactNode } from "react"

import type { TemplateTypeConfig } from "@/convex/lib/templateTypes"
import type {
    TemplateButtonData,
    TemplateCarouselEditorCard,
    TemplateHeaderData,
    TemplateListSection,
} from "@/components/templates/types"
import { Icon } from "../primitives/Icon"
import {
    WaChatFrame,
    WhatsAppBubble,
    highlightBody,
    type WaButton,
    type WaMedia,
} from "../primitives/WhatsAppBubble"

const WA_LINK = "#0084FF"

interface TemplateBuilderPreviewProps {
    data: {
        header?: TemplateHeaderData
        body: string
        footer?: string
        buttons?: TemplateButtonData[]
        sections?: TemplateListSection[]
        cards?: TemplateCarouselEditorCard[]
    }
    config: TemplateTypeConfig
}

/** Map a template header to the shared bubble media (TEXT renders inline, not as media). */
function headerToMedia(header?: TemplateHeaderData): WaMedia | null {
    const dynamic = (url?: string) => (url && !url.includes("{{") ? url : undefined)
    switch (header?.type) {
        case "IMAGE":
            return { kind: "image", src: dynamic(header.url) }
        case "VIDEO":
            return { kind: "video", src: dynamic(header.url), duration: "0:18" }
        case "DOCUMENT":
            return { kind: "document", filename: "document.pdf", pages: 2, size: "240 ko" }
        case "LOCATION":
            return { kind: "location", name: "Localisation", address: "" }
        default:
            return null
    }
}

function buttonKind(type?: string): WaButton["kind"] {
    if (type === "URL") return "url"
    if (type === "PHONE_NUMBER" || type === "VOICE_CALL") return "phone"
    return "reply"
}

function toWaButtons(buttons?: TemplateButtonData[]): WaButton[] {
    return (buttons ?? [])
        .filter((b) => (b.text ?? "").trim())
        .map((b) => ({ label: b.text, kind: buttonKind(b.type) }))
}

/** A body node: optional bold TEXT-header line, then the highlighted message. */
function bubbleBody(header: TemplateHeaderData | undefined, body: string): ReactNode {
    return (
        <>
            {header?.type === "TEXT" && header.text ? (
                <div className="mb-1 font-semibold text-[var(--ink-900)]">{header.text}</div>
            ) : null}
            {body ? (
                highlightBody(body)
            ) : (
                <span className="text-[var(--ink-soft)]">Votre message apparaîtra ici…</span>
            )}
        </>
    )
}

/**
 * TemplateBuilderPreview — the "Aperçu WhatsApp" panel for the full-page
 * builder. Renders the draft through the shared {@link WhatsAppBubble} so the
 * media header / buttons look identical to the modal and the catalogue, with
 * dedicated handling for LIST (menu button) and CAROUSEL (scrollable cards).
 * Presentational — no Convex.
 */
export function TemplateBuilderPreview({ data, config }: TemplateBuilderPreviewProps) {
    const { header, body, footer, buttons, cards } = data

    return (
        <div className="flex h-full flex-col">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                Aperçu WhatsApp
            </p>
            <div className="mt-3 flex-1">
                <WaChatFrame>
                    {config.type === "CAROUSEL" ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {(cards && cards.length > 0 ? cards : [{ body: "", buttons: [] }]).map((card, idx) => (
                                <div key={idx} className="w-[78%] shrink-0">
                                    <WhatsAppBubble
                                        media={{ kind: "image", src: card.headerUrl && !card.headerUrl.includes("{{") ? card.headerUrl : undefined }}
                                        body={
                                            <>
                                                {card.title ? (
                                                    <div className="mb-1 font-semibold text-[var(--ink-900)]">{card.title}</div>
                                                ) : null}
                                                {card.body ? (
                                                    highlightBody(card.body)
                                                ) : (
                                                    <span className="text-[var(--ink-soft)]">Carte {idx + 1}…</span>
                                                )}
                                            </>
                                        }
                                        buttons={toWaButtons(card.buttons)}
                                        time="11:32"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : config.type === "LIST" ? (
                        <>
                            <WhatsAppBubble
                                body={bubbleBody(header, body)}
                                footer={config.features.hasFooter ? footer || undefined : undefined}
                                time="11:32"
                            />
                            <button
                                type="button"
                                className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-[12.5px] font-medium shadow-[0_1px_1px_rgba(10,10,10,0.08)]"
                                style={{ color: WA_LINK }}
                            >
                                <Icon name="list" size={14} color={WA_LINK} />
                                {buttons?.[0]?.text || "Voir les options"}
                            </button>
                        </>
                    ) : (
                        <WhatsAppBubble
                            media={config.features.hasHeader ? headerToMedia(header) : null}
                            body={bubbleBody(header, body)}
                            footer={config.features.hasFooter ? footer || undefined : undefined}
                            buttons={config.features.hasButtons ? toWaButtons(buttons) : undefined}
                            time="11:32"
                        />
                    )}
                </WaChatFrame>
            </div>
        </div>
    )
}
