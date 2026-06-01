import { Download } from "lucide-react"

import { Chip } from "../primitives/Chip"
import { INVOICE_COLS, type Invoice, type InvoiceStatus } from "./types"

const STATUS_LABEL: Record<InvoiceStatus, string> = {
    paid: "Payée",
    open: "En attente",
    void: "Annulée",
}

const STATUS_TONE: Record<
    InvoiceStatus,
    "good" | "warn" | "neutral"
> = {
    paid: "good",
    open: "warn",
    void: "neutral",
}

interface InvoiceRowProps {
    invoice: Invoice
}

/**
 * InvoiceRow — single row in the invoices table: date, number, amount,
 * status chip, download icon. Uses the shared INVOICE_COLS grid.
 */
export function InvoiceRow({ invoice }: InvoiceRowProps) {
    return (
        <div
            className="grid items-center gap-x-5 border-b border-[var(--ink-100)] px-6 transition-colors hover:bg-[var(--paper-warm)]/50"
            style={{ gridTemplateColumns: INVOICE_COLS, height: 52 }}
        >
            {/* Date */}
            <div className="text-[13px] font-medium tracking-tight text-[var(--ink-900)]">
                {invoice.date}
            </div>

            {/* Invoice number */}
            <div className="font-mono text-[12px] tabular-nums text-[var(--ink-500)]">
                {invoice.number}
            </div>

            {/* Total */}
            <div className="text-[13px] font-medium tabular-nums text-[var(--ink-900)]">
                {invoice.total}
            </div>

            {/* Status */}
            <div>
                <Chip tone={STATUS_TONE[invoice.status]}>
                    {STATUS_LABEL[invoice.status]}
                </Chip>
            </div>

            {/* Download icon */}
            <button
                type="button"
                aria-label="Télécharger la facture"
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-400)] hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]"
            >
                <Download className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
