import type { TemplateType } from "@/convex/lib/templateTypes"
import type { WaButton, WaMedia } from "@/components/dashboard/primitives/WhatsAppBubble"
import type {
    TemplateCategory,
    TemplateRowData as TemplateRow,
    TemplateStatus,
    TemplatesData,
} from "@/components/dashboard/templates"

/**
 * templates-data — pure mappers turning Convex `templates` docs into the v3
 * `TemplatesScreen` shapes (`TemplateRow` / `TemplatesData`). Kept side-effect
 * free so it unit-tests without a Convex client or a DOM.
 */

/** A button as stored on a Convex template doc (subset we render). */
export interface TemplateDocButton {
    type?: string
    text?: string
    url?: string
    phoneNumber?: string
}

/** The header sub-object on a Convex template doc (subset we render). */
export interface TemplateDocHeader {
    type?: string
    text?: string
    mediaUrl?: string
    location?: { name?: string; address?: string } | null
}

/** The slice of a Convex `templates` doc the screen needs. */
export interface TemplateDoc {
    _id: string
    name: string
    category?: string
    language?: string
    status?: string
    type?: string
    header?: TemplateDocHeader | null
    body?: string
    footer?: string
    buttons?: TemplateDocButton[] | null
    sentCount?: number
    readCount?: number
}

/**
 * Template types whose full v3 create form is complete (header text / body /
 * footer / buttons-with-values). Everything else needs the advanced (legacy)
 * builder — media upload, carousel cards, list sections, catalogs, etc.
 */
export const SIMPLE_TEMPLATE_TYPES: ReadonlySet<TemplateType> = new Set([
    "TEXT",
    "QUICK_REPLY",
    "CALL_TO_ACTION",
    "AUTHENTICATION",
])

export function isSimpleTemplateType(type: TemplateType): boolean {
    return SIMPLE_TEMPLATE_TYPES.has(type)
}

/** Map the Convex approval status to the v3 status pill bucket. */
export function mapTemplateStatus(status: string | undefined): TemplateStatus {
    switch (status) {
        case "APPROVED":
            return "approved"
        case "PENDING":
        case "IN_APPEAL":
        case "PENDING_DELETION":
            return "pending"
        case "REJECTED":
        case "PAUSED":
        case "DISABLED":
            return "rejected"
        default:
            // DRAFT and anything unknown read as an unsubmitted draft.
            return "draft"
    }
}

/** Title-case the WhatsApp category enum into the v3 label. */
export function mapTemplateCategory(category: string | undefined): TemplateCategory {
    switch ((category ?? "").toUpperCase()) {
        case "MARKETING":
            return "Marketing"
        case "AUTHENTICATION":
            return "Authentication"
        default:
            return "Utility"
    }
}

/** Map a WhatsApp button type to the shared bubble's icon kind. */
function buttonKind(type: string | undefined): WaButton["kind"] {
    if (type === "URL") return "url"
    if (type === "PHONE_NUMBER" || type === "VOICE_CALL") return "phone"
    return "reply"
}

/** Map a template doc's header to the WhatsApp bubble media (text → none). */
export function headerToMedia(header: TemplateDocHeader | null | undefined): WaMedia | null {
    switch (header?.type) {
        case "IMAGE":
            return { kind: "image", src: header.mediaUrl }
        case "VIDEO":
            return { kind: "video" }
        case "DOCUMENT":
            return { kind: "document", filename: "document.pdf" }
        case "LOCATION":
            return {
                kind: "location",
                name: header.location?.name ?? "Localisation",
                address: header.location?.address ?? "",
            }
        default:
            return null
    }
}

/** French thousands grouping; "—" for an unsent template. */
function formatCount(n: number | undefined): string {
    if (!n) return "—"
    return n.toLocaleString("fr-FR")
}

/** Read/open rate as a percent string; "—" when nothing was sent. */
function formatOpenRate(sent: number | undefined, read: number | undefined): string {
    if (!sent || sent <= 0) return "—"
    return `${Math.round(((read ?? 0) / sent) * 100)}%`
}

export function mapTemplateRow(doc: TemplateDoc): TemplateRow {
    const buttons = (doc.buttons ?? [])
        .filter((b) => (b.text ?? "").trim())
        .map<WaButton>((b) => ({ label: b.text as string, kind: buttonKind(b.type) }))

    return {
        id: doc._id,
        name: doc.name,
        category: mapTemplateCategory(doc.category),
        lang: doc.language ?? "fr",
        status: mapTemplateStatus(doc.status),
        sent: formatCount(doc.sentCount),
        open: formatOpenRate(doc.sentCount, doc.readCount),
        preview: doc.body ?? "",
        media: headerToMedia(doc.header),
        footer: doc.footer || undefined,
        buttons: buttons.length ? buttons : undefined,
    }
}

/** Build the category filter pills (all + each present category, with counts). */
export function buildCategoryFilters(rows: TemplateRow[]) {
    const counts = new Map<TemplateCategory, number>()
    for (const r of rows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1)

    const ORDER: TemplateCategory[] = ["Marketing", "Utility", "Authentication"]
    const present = ORDER.filter((c) => counts.has(c)).map((c) => ({
        key: c.toLowerCase(),
        label: c,
        count: counts.get(c) ?? 0,
    }))

    return [{ key: "all", label: "Tous", count: rows.length }, ...present]
}

export function mapTemplatesData(docs: TemplateDoc[], selectedId?: string): TemplatesData {
    const templates = docs.map(mapTemplateRow)
    const n = templates.length
    return {
        count: `${n} modèle${n > 1 ? "s" : ""} · synchro Meta`,
        categories: buildCategoryFilters(templates),
        templates,
        selectedId: selectedId ?? templates[0]?.id,
    }
}
