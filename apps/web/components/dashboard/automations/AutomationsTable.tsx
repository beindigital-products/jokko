import { AutomationRow, type AutomationRowActions } from "./AutomationRow"
import { AUTOMATIONS_COLS, type AutomationRow as AutomationRowData } from "./types"

/** Automations table — mono header + one AutomationRow per flow. */
export function AutomationsTable({
    automations,
    emptyLabel = "Aucune automatisation pour le moment.",
    ...actions
}: {
    automations: AutomationRowData[]
    emptyLabel?: string
} & AutomationRowActions) {
    return (
        <div className="flex-1 overflow-auto">
            <div className="min-w-[820px]">
                <div
                    className="grid items-center gap-x-4 border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-8 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]"
                    style={{ gridTemplateColumns: AUTOMATIONS_COLS, height: 38 }}
                >
                    <div>Automatisation</div>
                    <div>Statut</div>
                    <div>Déclencheur</div>
                    <div className="text-right">Exéc. 7 j · conv.</div>
                    <div>Modifié</div>
                    <div />
                </div>
                {automations.length === 0 ? (
                    <div className="px-8 py-16 text-center text-[13px] text-[var(--ink-soft)]">{emptyLabel}</div>
                ) : (
                    automations.map((a) => <AutomationRow key={a.id} automation={a} {...actions} />)
                )}
            </div>
        </div>
    )
}
