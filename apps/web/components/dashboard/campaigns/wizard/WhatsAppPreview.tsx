import {
    WaChatFrame,
    WhatsAppBubble,
    highlightBody,
    type WaButton,
    type WaMedia,
} from "@/components/dashboard/primitives/WhatsAppBubble"
import { cwResolve } from "./wizard-data"
import type { TemplateHeader, TemplateVar, WizardTemplate } from "./types"

interface WhatsAppPreviewProps {
    template: WizardTemplate
    /** Current variable bindings — example/fixed values fill the {{N}} tokens. */
    variables: TemplateVar[]
    time?: string
}

/** Resolve a {{N}} token to its bound example/fixed value. */
function resolver(variables: TemplateVar[]) {
    return (token: string) => {
        const v = variables.find((x) => x.token === token)
        return v ? cwResolve(v) : token
    }
}

/** Resolve {{N}} tokens inside a header label (e.g. a document filename). */
function resolveLabel(label: string, resolve: (t: string) => string): string {
    return label.replace(/\{\{\d+\}\}/g, (t) => resolve(t))
}

/** Map the wizard's header shape onto the shared bubble's media model. */
function toMedia(header: TemplateHeader | null, resolve: (t: string) => string): WaMedia | null {
    if (!header) return null
    switch (header.type) {
        case "doc":
            return {
                kind: "document",
                filename: resolveLabel(header.label, resolve),
                pages: header.pages,
                size: header.size,
            }
        case "image":
            return { kind: "image", alt: header.label }
        case "video":
            return { kind: "video", duration: header.duration }
        case "location":
            return { kind: "location", name: resolveLabel(header.label, resolve), address: header.address }
    }
}

/** Infer a WhatsApp button affordance from its French/English label. */
function toButton(label: string): WaButton {
    if (/désinscr|unsubscribe|\bstop\b|annuler/i.test(label)) return { label, kind: "reply" }
    if (/appel|call|téléphone|contact/i.test(label)) return { label, kind: "phone" }
    return { label, kind: "url" }
}

/**
 * WhatsAppPreview — renders a campaign template as it lands in WhatsApp. Thin
 * adapter over the shared {@link WhatsAppBubble}: maps the wizard template
 * (header / body / footer / buttons) onto the bubble and fills `{{N}}` tokens
 * with the bound example values.
 */
export function WhatsAppPreview({ template, variables, time = "10:00" }: WhatsAppPreviewProps) {
    const resolve = resolver(variables)
    return (
        <WaChatFrame>
            <WhatsAppBubble
                media={toMedia(template.header, resolve)}
                body={highlightBody(template.body, resolve)}
                footer={template.footer}
                buttons={template.buttons.map(toButton)}
                time={time}
            />
        </WaChatFrame>
    )
}
