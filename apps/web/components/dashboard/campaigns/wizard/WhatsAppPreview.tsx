import { Fragment } from "react"

import { Icon } from "@/components/dashboard/primitives/Icon"
import { cwResolve } from "./wizard-data"
import type { TemplateVar, WizardTemplate } from "./types"

interface WhatsAppPreviewProps {
    template: WizardTemplate
    /** Current variable bindings — example/fixed values fill the {{N}} tokens. */
    variables: TemplateVar[]
    time?: string
}

/** Resolve a {{N}} token to its bound example/fixed value. */
function resolveToken(token: string, variables: TemplateVar[]): string {
    const v = variables.find((x) => x.token === token)
    return v ? cwResolve(v) : token
}

/** Render the body, substituting {{N}} tokens with accent-highlighted values. */
function renderBody(body: string, variables: TemplateVar[]) {
    const parts = body.split(/(\{\{\d+\}\})/g)
    return parts.map((part, i) => {
        const m = part.match(/^\{\{(\d+)\}\}$/)
        if (!m) return <Fragment key={i}>{part}</Fragment>
        return (
            <b key={i} className="font-medium text-[var(--accent)]">
                {resolveToken(part, variables)}
            </b>
        )
    })
}

/** Resolve {{N}} tokens inside a header label (e.g. a document filename). */
function resolveHeader(label: string, variables: TemplateVar[]): string {
    return label.replace(/\{\{(\d+)\}\}/g, (_, n) => resolveToken(`{{${n}}}`, variables))
}

/**
 * WhatsAppPreview — renders a template as it appears in WhatsApp: a chat bubble
 * on the WA paper background, with the bound variables filled in and
 * highlighted. Supports a document or image header, footer, double-check
 * timestamp and centered CTA buttons. Recreates `CwWaPreview` from the design.
 */
export function WhatsAppPreview({ template, variables, time = "10:00" }: WhatsAppPreviewProps) {
    return (
        <div
            className="rounded-xl p-3.5"
            style={{
                background: "#E3DDD0",
                backgroundImage: "radial-gradient(rgba(10,10,10,0.05) 1px, transparent 1px)",
                backgroundSize: "9px 9px",
            }}
        >
            <div
                className="bg-white px-2.5 py-2 text-[13px] leading-[1.45] tracking-[-0.005em] text-[var(--ink-900)] shadow-[0_1px_1px_rgba(10,10,10,0.08)]"
                style={{ borderRadius: "8px 8px 8px 2px" }}
            >
                {template.header ? (
                    template.header.type === "doc" ? (
                        <div className="mb-1.5 flex items-center gap-1.5 rounded-md bg-[var(--paper-warm)] px-2 py-[7px] text-[12px] text-[var(--ink-500)]">
                            <Icon name="doc" size={14} color="var(--accent)" />
                            {resolveHeader(template.header.label, variables)}
                        </div>
                    ) : (
                        <div
                            className="mb-1.5 flex h-24 items-center justify-center rounded-md font-mono text-[10px]"
                            style={{
                                background:
                                    "repeating-linear-gradient(135deg, #d9d2c4, #d9d2c4 7px, #cfc7b6 7px, #cfc7b6 14px)",
                                color: "#8c8472",
                            }}
                        >
                            {template.header.label}
                        </div>
                    )
                ) : null}

                <div>{renderBody(template.body, variables)}</div>

                {template.footer ? (
                    <div className="mt-1.5 text-[11.5px] italic text-[var(--ink-soft)]">{template.footer}</div>
                ) : null}

                <div className="mt-1.5 text-right font-mono text-[10px] tabular-nums text-[var(--ink-soft)]">
                    {time} ✓✓
                </div>

                {template.buttons.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1 border-t border-[var(--ink-100)] pt-1.5">
                        {template.buttons.map((b) => (
                            <div key={b} className="py-[3px] text-center text-[12.5px] text-[#0084FF]">
                                {b}
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
