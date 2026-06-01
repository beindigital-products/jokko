import { TemplateStatusPill } from "./TemplateStatusPill"
import { Chip } from "../primitives/Chip"
import { HeaderButton } from "../shell/HeaderButton"
import { Pencil, Send } from "lucide-react"
import type { TemplateRow } from "./types"

/**
 * Preview variables highlighted in WhatsApp message body.
 * {{N}} placeholders become bold cobalt spans.
 */
function HighlightedBody({ text }: { text: string }) {
    const parts = text.split(/({{[^}]+}})/)
    return (
        <>
            {parts.map((part, i) =>
                /^{{[^}]+}}$/.test(part) ? (
                    <b key={i} className="font-semibold text-[var(--accent)]">
                        {part}
                    </b>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </>
    )
}

interface TemplatePreviewPanelProps {
    template: TemplateRow | null
    canEdit?: boolean
}

/**
 * TemplatePreviewPanel — right pane showing a WhatsApp-style bubble for
 * the selected template plus header meta (name, status, category, lang)
 * and action buttons. Displays a placeholder when no template is selected.
 */
export function TemplatePreviewPanel({ template, canEdit = true }: TemplatePreviewPanelProps) {
    return (
        <div
            className="flex w-[360px] shrink-0 flex-col border-l border-[var(--ink-200)] bg-[var(--paper-warm)]"
        >
            {/* Header */}
            <div className="border-b border-[var(--ink-200)] px-[22px] pb-3.5 pt-5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                    Aperçu
                </p>
                {template ? (
                    <>
                        <p className="mt-1 text-[22px] font-bold leading-[1.1] tracking-tight text-[var(--ink-900)]">
                            {template.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <TemplateStatusPill status={template.status} />
                            <Chip tone="neutral">{template.category}</Chip>
                            <Chip tone="neutral">{template.lang.toUpperCase()}</Chip>
                        </div>
                    </>
                ) : (
                    <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">
                        Sélectionnez un modèle
                    </p>
                )}
            </div>

            {/* WhatsApp-style bubble */}
            <div className="flex-1 overflow-y-auto p-[22px]">
                {template ? (
                    <div
                        className="rounded-xl p-4"
                        style={{
                            background: "#E3DDD0",
                            backgroundImage: "radial-gradient(rgba(10,10,10,0.04) 1px, transparent 1px)",
                            backgroundSize: "8px 8px",
                        }}
                    >
                        <div
                            className="max-w-[95%] rounded-[8px_8px_8px_2px] bg-white p-[8px_10px] text-[13.5px] leading-[1.45] tracking-[-0.005em]"
                            style={{ boxShadow: "0 1px 1px rgba(10,10,10,0.08)" }}
                        >
                            {/* Attachment hint for templates that look like docs */}
                            {template.name.toLowerCase().includes("devis") && (
                                <div className="mb-1 text-[12px] text-[var(--ink-soft)]">
                                    📄 Devis_{"{{"}{2}{"}}"}.pdf
                                </div>
                            )}
                            <div>
                                <HighlightedBody text={template.preview} />
                            </div>
                            {/* Footer */}
                            <div className="mt-1.5 text-[11.5px] italic text-[var(--ink-soft)]">
                                — L'équipe Atelier Bracquet
                            </div>
                            {/* Time stamp */}
                            <div className="mt-2 flex items-center justify-between border-t border-[#eee] pt-1.5">
                                <span />
                                <span className="font-mono text-[10px] tabular-nums text-[var(--ink-soft)]">
                                    11:32 ✓✓
                                </span>
                            </div>
                            {/* CTA buttons */}
                            <div className="mt-1.5 flex flex-col gap-1 border-t border-[#eee] pt-1.5">
                                <div className="py-1 text-center text-[13px] text-[#0084FF]">
                                    📞 Nous appeler
                                </div>
                                <div className="py-1 text-center text-[13px] text-[#0084FF]">
                                    🔗 Voir la boutique
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-[12px] text-[var(--ink-soft)]">
                        Aucun modèle sélectionné
                    </div>
                )}
            </div>

            {/* Action footer */}
            <div className="flex items-center gap-1.5 border-t border-[var(--ink-200)] px-[22px] py-3.5">
                {canEdit && (
                    <HeaderButton icon={Pencil}>Éditer</HeaderButton>
                )}
                <HeaderButton icon={Send}>Envoyer test</HeaderButton>
                <div className="flex-1" />
                <HeaderButton variant="primary">Utiliser</HeaderButton>
            </div>
        </div>
    )
}
