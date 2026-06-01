import { InvoiceRow } from "./InvoiceRow"
import { INVOICE_COLS, type Invoice } from "./types"

interface InvoicesTableProps {
    invoices: Invoice[]
    title?: string
    onViewAll?: () => void
}

/**
 * InvoicesTable — card panel with mono-header table listing invoices.
 * Shows a header with eyebrow + display title + "Tout voir" button,
 * then a row for each invoice via InvoiceRow.
 */
export function InvoicesTable({
    invoices,
    title = "6 dernières factures",
    onViewAll,
}: InvoicesTableProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]">
            {/* Card header */}
            <div className="flex items-center justify-between gap-4 border-b border-[var(--ink-200)] px-6 py-4">
                <div className="min-w-0">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Historique des factures
                    </p>
                    <div className="mt-1 font-display text-[22px] font-bold tracking-tight text-[var(--ink-900)]">
                        {title}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onViewAll}
                    className="inline-flex shrink-0 items-center rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                >
                    Tout voir
                </button>
            </div>

            {/* Table header */}
            <div
                className="grid items-center gap-x-5 border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-6 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]"
                style={{ gridTemplateColumns: INVOICE_COLS, height: 36 }}
            >
                <div>Date</div>
                <div>Référence</div>
                <div>Montant</div>
                <div>Statut</div>
                <div />
            </div>

            {/* Rows */}
            {invoices.length === 0 ? (
                <div className="px-6 py-10 text-center text-[13px] text-[var(--ink-soft)]">
                    Aucune facture pour le moment.
                </div>
            ) : (
                invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)
            )}
        </div>
    )
}
