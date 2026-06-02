// Shared types for the Tableau de bord (overview) panels.

export type DeltaTone = "good" | "warn" | "mute"

export interface OverviewKpi {
    label: string
    value: string
    delta?: string
    deltaTone?: DeltaTone
    sub: string
}

export type AttentionState = "unassigned" | "stale" | "breach"
export interface AttentionRow {
    id: string
    who: string
    last: string
    channel: string
    tags: string[]
    wait: string
    state: AttentionState
}

export type AgentState = "typing" | "online" | "busy" | "away"
export interface TeamActivityRow {
    id: string
    name: string
    busy: string
    state: AgentState
    pole: string
    load: number
}

export type CampaignStatus = "sending" | "completed" | "paused"
export interface CampaignRow {
    id: string
    name: string
    delivered: string
    read: string
    deliveredPct: number
    status: CampaignStatus
}

export interface FlowRow {
    id: string
    name: string
    runs: number
    period: string
}

export interface OnboardingStep {
    label: string
    done: boolean
}

/** Full-width WhatsApp marketing-credit bar on the cockpit. */
export interface MarketingCredit {
    /** Current balance, e.g. "€128.40". */
    balance: string
    /** Marketing conversations the balance covers, e.g. "2 040". */
    conversations: string
    /** Spent this month, e.g. "€148.72". */
    spent: string
    /** Monthly budget, e.g. "€820". */
    budget: string
    /** Spent fraction of budget, 0–100. */
    pct: number
    /** Runway line when healthy, e.g. "Tient ≈ 9 jours au rythme actuel". */
    runwayLabel: string
    /** Optional auto-top-up pill, e.g. "Recharge auto · €100". */
    autoTopupLabel?: string
    /** Low-balance treatment (red border + warn meter + lowLabel). */
    low?: boolean
    /** Message shown when low, e.g. "Solde bas — rechargez…". */
    lowLabel?: string
    /** CTA label, default "Ajouter des crédits". */
    ctaLabel?: string
}

/** Compact marketing-campaign credit balance shown on the overview cockpit. */
export interface CreditBalance {
    /** Current balance, e.g. "€38.20". */
    balance: string
    /** Status line, e.g. "≈ 1 200 conv. Meta restantes". */
    estimate: string
    /** When true, render the low-balance warning treatment. */
    low?: boolean
    /** CTA label, e.g. "Recharger". */
    ctaLabel: string
}
