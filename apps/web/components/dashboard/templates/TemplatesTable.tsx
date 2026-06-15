import { TemplateRow } from "./TemplateRow"
import { TEMPLATES_COLS, type TemplateRow as TemplateRowData } from "./types"

interface TemplatesTableProps {
    templates: TemplateRowData[]
    selectedId?: string
    onSelect?: (id: string) => void
}

/** Templates table — mono header + one TemplateRow per WhatsApp template. */
export function TemplatesTable({ templates, selectedId, onSelect }: TemplatesTableProps) {
    return (
        <div className="flex-1 overflow-auto">
            <div className="min-w-[720px]">
                <div
                    className="grid items-center gap-x-5 border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-8 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]"
                    style={{ gridTemplateColumns: TEMPLATES_COLS, height: 38 }}
                >
                    <div>Modèle</div>
                    <div>Catégorie</div>
                    <div>Langue</div>
                    <div>Statut Meta</div>
                    <div className="text-right">Envoyés</div>
                    <div className="text-right">Ouvert</div>
                </div>
                {templates.map((t) => (
                    <TemplateRow
                        key={t.id}
                        template={t}
                        selected={t.id === selectedId}
                        onClick={() => onSelect?.(t.id)}
                    />
                ))}
            </div>
        </div>
    )
}
