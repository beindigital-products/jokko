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
