export type AutomationStatus = "active" | "draft"

export interface AutomationRow {
    id: string
    name: string
    /** Sub-line under the name (description or fallback). */
    description: string
    /** Drives the toggle + status label. */
    active: boolean
    /** Trigger label, e.g. "Nouveau message" or "Mot-clé". */
    trigger: string
    /** Runs over 7 days, formatted (or "—" until backend tracks executions). */
    runs: string
    /** Conversion rate, formatted (or "—"). */
    conv: string
    /** Relative "modified" label, e.g. "il y a 2 h". */
    updated: string
}

export interface AutomationsKpi {
    label: string
    value: string
    delta: string
}

export interface AutomationsData {
    count: string
    kpis: AutomationsKpi[]
    automations: AutomationRow[]
}

/** Shared grid template for the automations table header + rows. */
export const AUTOMATIONS_COLS =
    "minmax(0,2.5fr) minmax(0,1.1fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,0.9fr) 40px"
