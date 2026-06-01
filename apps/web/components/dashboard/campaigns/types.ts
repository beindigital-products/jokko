export type CampaignStatus = "sending" | "scheduled" | "completed" | "draft" | "paused"

export interface CampaignRow {
    id: string
    name: string
    status: CampaignStatus
    tpl: string
    audience: string
    delivered: string
    read: string
    cost: string
    start: string
    /** progress 0..1 for sending/paused (bar under the name). */
    progress?: number
    /** small hint under the name (draft / scheduled). */
    hint?: string
    hintTone?: "mute" | "accent"
}

export interface CampaignsKpi {
    label: string
    value: string
    delta: string
}

export interface CampaignsData {
    count: string
    kpis: CampaignsKpi[]
    campaigns: CampaignRow[]
}

/** Shared grid template for the campaigns table header + rows. */
export const CAMPAIGNS_COLS =
    "minmax(0,2.2fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,0.9fr) minmax(0,0.7fr)"
