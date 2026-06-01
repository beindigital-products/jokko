export type TemplateStatus = "approved" | "pending" | "rejected"
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
