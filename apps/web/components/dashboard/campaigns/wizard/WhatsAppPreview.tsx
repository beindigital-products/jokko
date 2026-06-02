import { Fragment } from "react"
import type { VariableMapping, WizardTemplate } from "./types"

interface WhatsAppPreviewProps {
    template: WizardTemplate
    /** Variable mapping — examples fill the {{N}} placeholders, highlighted. */
    variables: VariableMapping[]
    time?: string
}

/** Replace {{N}} tokens in the body with the mapped example, accent-highlighted. */
function renderBody(body: string, variables: VariableMapping[]) {
    const parts = body.split(/(\{\{\d+\}\})/g)
    return parts.map((part, i) => {
        const m = part.match(/^\{\{(\d+)\}\}$/)
        if (!m) return <Fragment key={i}>{part}</Fragment>
        const v = variables.find((x) => x.token === part)
        return (
            <b key={i} className="font-medium text-[var(--accent)]">
                {v ? v.example : part}
            </b>
        )
    })
}

/**
 * WhatsAppPreview — renders a template as it appears in WhatsApp: a chat bubble
 * on the WA paper background, with mapped variables filled in and highlighted.
 * Recreates the preview pane of the design's campaign wizard.
 */
export function WhatsAppPreview({ template, variables, time = "10:00" }: WhatsAppPreviewProps) {
    return (
        <div
            className="rounded-xl p-3.5"
            style={{
                background: "#E3DDD0",
                backgroundImage: "radial-gradient(rgba(10,10,10,0.04) 1px, transparent 1px)",
                backgroundSize: "8px 8px",
            }}
        >
            <div
                className="bg-white px-2.5 py-2 text-[13px] leading-[1.45] tracking-[-0.005em] text-[var(--ink-900)] shadow-[0_1px_1px_rgba(10,10,10,0.08)]"
                style={{ borderRadius: "8px 8px 8px 2px" }}
            >
                {template.header ? (
                    <div className="mb-1.5 flex items-center gap-1.5 rounded-md bg-[var(--paper-warm)] px-2 py-1.5 text-[12px] text-[var(--ink-700)]">
                        📄 {template.header}
                    </div>
                ) : null}
                <div>{renderBody(template.body, variables)}</div>
                {template.footer ? (
                    <div className="mt-1.5 text-[11px] italic text-[var(--ink-soft)]">{template.footer}</div>
                ) : null}
                <div className="mt-1.5 text-right font-mono text-[10px] text-[var(--ink-soft)] tabular-nums">
                    {time} ✓✓
                </div>
                {template.buttons && template.buttons.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1 border-t border-[var(--ink-100)] pt-2">
                        {template.buttons.map((b) => (
                            <div key={b} className="text-center text-[12.5px] font-medium text-[var(--accent)]">
                                {b}
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
