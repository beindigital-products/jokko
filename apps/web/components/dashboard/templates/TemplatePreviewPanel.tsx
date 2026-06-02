import { TemplateStatusPill } from "./TemplateStatusPill"
import { Chip } from "../primitives/Chip"
import { HeaderButton } from "../shell/HeaderButton"
import {
    WaChatFrame,
    WhatsAppBubble,
    highlightBody,
    type WaButton,
} from "../primitives/WhatsAppBubble"
import { Pencil, Send } from "lucide-react"
import type { TemplateRow } from "./types"

/** Fallback CTA buttons when a template doesn't define its own. */
const DEFAULT_BUTTONS: WaButton[] = [
    { label: "Nous appeler", kind: "phone" },
    { label: "Voir la boutique", kind: "url" },
]

interface TemplatePreviewPanelProps {
    template: TemplateRow | null
    canEdit?: boolean
}

/**
 * TemplatePreviewPanel — right pane showing the selected template exactly as it
 * lands in WhatsApp via the shared {@link WhatsAppBubble} (so the file / media
 * header matches the campaign wizard), plus header meta (name, status, category,
 * lang) and action buttons. Placeholder when no template is selected.
 */
export function TemplatePreviewPanel({ template, canEdit = true }: TemplatePreviewPanelProps) {
    return (
        <div className="hidden w-[360px] shrink-0 flex-col border-l border-[var(--ink-200)] bg-[var(--paper-warm)] lg:flex">
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
                    <p className="mt-2 text-[13.5px] text-[var(--ink-soft)]">Sélectionnez un modèle</p>
                )}
            </div>

            {/* WhatsApp-style bubble */}
            <div className="flex-1 overflow-y-auto p-[22px]">
                {template ? (
                    <WaChatFrame>
                        <WhatsAppBubble
                            media={template.media ?? null}
                            body={highlightBody(template.preview)}
                            footer={template.footer ?? "— L'équipe Atelier Bracquet"}
                            buttons={template.buttons ?? DEFAULT_BUTTONS}
                            time="11:32"
                        />
                    </WaChatFrame>
                ) : (
                    <div className="flex h-full items-center justify-center text-[12px] text-[var(--ink-soft)]">
                        Aucun modèle sélectionné
                    </div>
                )}
            </div>

            {/* Action footer */}
            <div className="flex items-center gap-1.5 border-t border-[var(--ink-200)] px-[22px] py-3.5">
                {canEdit && <HeaderButton icon={Pencil}>Éditer</HeaderButton>}
                <HeaderButton icon={Send}>Envoyer test</HeaderButton>
                <div className="flex-1" />
                <HeaderButton variant="primary">Utiliser</HeaderButton>
            </div>
        </div>
    )
}
