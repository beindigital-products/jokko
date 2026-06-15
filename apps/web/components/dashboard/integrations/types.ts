export type IntegrationHealth = "good" | "warn" | null

export type IntegrationCategory =
    | "CRM"
    | "Prod."
    | "Messagerie"
    | "Paiement"
    | "E-commerce"
    | "API"

export interface Integration {
    id: string
    name: string
    desc: string
    cat: IntegrationCategory
    /** Whether this integration is currently connected/active. */
    on: boolean
    health: IntegrationHealth
    /** Short status string (e.g. "synchronisé il y a 4 min" or "—"). */
    last: string
    /** False = roadmap/showcase connector (renders "Bientôt", not connectable). Defaults true. */
    available?: boolean
}

export type FilterCategory = "Tous" | IntegrationCategory

export interface IntegrationsData {
    /** Number of active integrations to display in the eyebrow. */
    activeCount: number
    integrations: Integration[]
}
