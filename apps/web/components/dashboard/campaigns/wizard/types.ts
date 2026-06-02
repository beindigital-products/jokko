// Types for the v3 campaign-creation wizard (Nom → Modèle → Audience →
// Variables → Envoi → Récap). Presentational fixtures; the real flow maps
// onto convex `broadcasts.create` (name, templateId, audienceConfig,
// variable mapping, scheduledAt).

export type WizardStepId = 1 | 2 | 3 | 4 | 5 | 6

export interface WizardStep {
    id: WizardStepId
    label: string
}

export const CAMPAIGN_STEPS: WizardStep[] = [
    { id: 1, label: "Nom" },
    { id: 2, label: "Modèle" },
    { id: 3, label: "Audience" },
    { id: 4, label: "Variables" },
    { id: 5, label: "Envoi" },
    { id: 6, label: "Récap" },
]

export type TemplateCategory = "Marketing" | "Utility" | "Authentification"
export type TemplateStatus = "approved" | "pending" | "rejected"

export interface WizardTemplate {
    id: string
    name: string
    category: TemplateCategory
    lang: string
    status: TemplateStatus
    /** Body with {{1}} {{2}} placeholders. */
    body: string
    /** Optional header line (e.g. document name). */
    header?: string
    footer?: string
    /** Quick-reply / CTA button labels shown under the bubble. */
    buttons?: string[]
}

export type AudienceType = "all" | "segment" | "country"

export interface AudienceOption {
    type: AudienceType
    label: string
    sub: string
}

export interface VariableMapping {
    /** e.g. "{{1}}" */
    token: string
    /** "Contact · Prénom" | "Valeur fixe" | … */
    source: string
    /** preview value, e.g. "Margaux" */
    example: string
}

export interface SendingNumber {
    id: string
    city: string
    number: string
    pole: string
}

export interface CampaignDraft {
    name: string
    description: string
    templateId: string | null
    audienceType: AudienceType
    /** selected segment/country chips */
    audienceTags: string[]
    audienceCount: number
    audienceExcluded: number
    variables: VariableMapping[]
    sendingNumberId: string
    schedule: "now" | "scheduled"
    /** human label for the scheduled slot, e.g. "Samedi 13 juin 2026 · 10:00" */
    scheduleLabel: string
}

export interface CampaignWizardData {
    draft: CampaignDraft
    templates: WizardTemplate[]
    audienceOptions: AudienceOption[]
    /** chips available when audienceType !== "all" */
    audiencePool: string[]
    sendingNumbers: SendingNumber[]
    cost: { amount: string; detail: string; balanceAfter: string; ok: boolean }
}
