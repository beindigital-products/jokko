import type { WaButton, WaMedia } from "../primitives/WhatsAppBubble"

export type TemplateStatus = "approved" | "pending" | "rejected" | "draft"
export type TemplateCategory = "Marketing" | "Utility" | "Authentication"

export interface TemplateRow {
    id: string
    name: string
    category: TemplateCategory
    lang: string
    status: TemplateStatus
    sent: string
    open: string
    preview: string
    /** Header attachment (document / image / video / location) for the preview. */
    media?: WaMedia | null
    /** Optional footer line shown under the body. */
    footer?: string
    /** Optional CTA / quick-reply buttons. */
    buttons?: WaButton[]
}

/** Category filter pill shape. */
export interface TemplateCategoryFilter {
    key: string
    label: string
    count: number
}

export interface TemplatesData {
    /** e.g. "24 modèles · synchro Meta" */
    count: string
    categories: TemplateCategoryFilter[]
    templates: TemplateRow[]
    /** The template currently selected for preview (index into templates). */
    selectedId?: string
}

/** Shared grid template columns for header + rows. */
export const TEMPLATES_COLS =
    "minmax(0,2fr) minmax(0,1fr) minmax(0,0.6fr) minmax(0,1fr) minmax(0,0.7fr) minmax(0,0.7fr)"
