export type InvoiceStatus = "paid" | "open" | "void"

export interface Invoice {
    id: string
    date: string
    number: string
    total: string
    status: InvoiceStatus
}

export interface UsageMeter {
    label: string
    value: string
    total: string
    /** 0–1 fraction */
    fraction: number
    cost: string
}

export interface BillingData {
    /** Eyebrow: e.g. "Compte · Pro · facture mensuelle" */
    eyebrow: string
    plan: {
        name: string
        tagline: string
        price: string
        priceUnit: string
        renewalNote: string
    }
    usage: UsageMeter[]
    invoices: Invoice[]
}

/** Shared grid columns for the invoice table header + rows. */
export const INVOICE_COLS =
    "minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,0.8fr) 32px"
