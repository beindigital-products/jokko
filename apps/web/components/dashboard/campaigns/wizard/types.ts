// Types for the v3 campaign-creation wizard (Objectif → Modèle → Audience →
// Variables → Envoi → Récap). Presentational fixtures; the real flow maps onto
// convex `broadcasts.create` (name, templateId, audienceConfig, variable
// mapping, scheduledAt). Mirrors the design's `CampaignWizard` data model.

export type WizardStepId = 1 | 2 | 3 | 4 | 5 | 6

export interface WizardStep {
    id: WizardStepId
    /** Short label used in the stepper. */
    label: string
}

export const CAMPAIGN_STEPS: WizardStep[] = [
    { id: 1, label: "Objectif" },
    { id: 2, label: "Modèle" },
    { id: 3, label: "Audience" },
    { id: 4, label: "Variables" },
    { id: 5, label: "Envoi" },
    { id: 6, label: "Récap" },
]

/** Meta template category — drives template list and per-conversation pricing. */
export type TemplateCategory = "Marketing" | "Utility"

/** Source a template variable resolves from (contact field or fixed value). */
export type VariableSourceId = "first" | "last" | "company" | "city" | "fixed"

export interface VariableSource {
    id: VariableSourceId
    label: string
    /** Example rendered value for the preview. */
    eg: string
}

/** A single template variable binding ({{N}} → a source, optional fixed value). */
export interface TemplateVar {
    token: string
    src: VariableSourceId
    fixed?: string
}

export interface TemplateHeader {
    type: "doc" | "image" | "video" | "location"
    /** May contain {{N}} tokens (doc filename / location name), resolved in the preview. */
    label: string
    /** Document: page count + human-readable size (e.g. "248 ko"). */
    pages?: number
    size?: string
    /** Video: duration label (e.g. "0:24"). */
    duration?: string
    /** Location: address line shown under the place name. */
    address?: string
}

export interface WizardTemplate {
    id: string
    name: string
    cat: TemplateCategory
    lang: string
    header: TemplateHeader | null
    /** Body with {{N}} placeholders. */
    body: string
    footer: string | null
    /** Quick-reply / CTA button labels shown under the bubble. */
    buttons: string[]
    vars: TemplateVar[]
}

export interface WizardSegment {
    id: string
    /** French label. */
    fr: string
    total: number
    excluded: number
    /** French description. */
    desc: string
}

export interface SendingNumber {
    id: string
    label: string
    num: string
    /** Quality rating (French). */
    quality: string
}

export type SendMode = "now" | "scheduled"

export interface CampaignWizardData {
    templates: WizardTemplate[]
    segments: WizardSegment[]
    numbers: SendingNumber[]
    /** Per-conversation price by category. */
    price: Record<TemplateCategory, number>
    /** Wallet balance available for this campaign (EUR). */
    balance: number
    /** Initial draft values. */
    initial: {
        name: string
        desc: string
        cat: TemplateCategory
        tplId: string
        segId: string
        mode: SendMode
        date: string
        time: string
        numId: string
    }
}
