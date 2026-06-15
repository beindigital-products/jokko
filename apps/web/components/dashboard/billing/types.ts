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

/** A pre-set top-up amount for the marketing-campaign credit wallet. */
export interface CreditPack {
    /** Display amount, e.g. "€100". */
    amount: string
    /** Approx conversations it buys, e.g. "≈ 3 100 conv.". */
    note: string
    /** Highlighted as the recommended pack. */
    selected?: boolean
}

/**
 * CreditWallet — pay-as-you-go credit used by Meta marketing/utility
 * conversations (broadcasts). Consumed per message depending on country
 * and category. Maps to `creditTransactions` (RECHARGE / USAGE) backend-side.
 */
export interface CreditWallet {
    /** Current balance, e.g. "€38.20". */
    balance: string
    /** Conversion estimate, e.g. "≈ 1 200 conv. Utility · 480 Marketing". */
    estimate: string
    /** When true, balance is too low to run a queued campaign. */
    low?: boolean
    /** Low-balance alert line (only rendered when `low`). */
    alert?: string
    /** Pre-set top-up amounts. */
    packs: CreditPack[]
    /** Auto top-up description shown next to the toggle. Omit to hide the row. */
    autoTopUp?: string
    /** Whether auto top-up is enabled (visual toggle). */
    autoTopUpEnabled?: boolean
    /** Footer payment hint, e.g. "Paiement sécurisé · Stripe · VISA •••• 4842". */
    paymentHint: string
    /** Primary CTA label, e.g. "Recharger €100". */
    ctaLabel: string
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
    credit: CreditWallet
    invoices: Invoice[]
}

/** Shared grid columns for the invoice table header + rows. */
export const INVOICE_COLS =
    "minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr) minmax(0,0.8fr) 32px"
