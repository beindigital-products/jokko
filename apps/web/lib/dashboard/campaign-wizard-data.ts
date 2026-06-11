import type {
    CampaignWizardData,
    SendingNumber,
    TemplateCategory,
    TemplateHeader,
    TemplateVar,
    WizardSegment,
    WizardTemplate,
} from "@/components/dashboard/campaigns/wizard"
import type { TemplateDoc } from "./templates-data"
import { FCFA_PER_CONVERSATION } from "./overview-data"

/**
 * campaign-wizard-data — pure mappers turning real Convex data (approved
 * templates, audience options, channels, wallet balance) into the v3
 * `CampaignWizardData` the wizard modal consumes, plus the inverse
 * `segToAudienceConfig` used when persisting. Side-effect free → unit-testable.
 *
 * Audience model: the wizard's segment id is `"all"` or `"tag:<tagId>"`, mapped
 * to the backend `audienceConfig` ({ALL} | {TAGS, tags:[id]}).
 */

export interface AudienceOptions {
    all: number
    tags: { id: string; name: string; count: number }[]
}

export interface ChannelDoc {
    _id: string
    label: string
    displayPhoneNumber: string
    status: string
}

const SEG_ALL = "all"
const tagSegId = (tagId: string) => `tag:${tagId}`

/** Map a wizard segment id back to a Convex `audienceConfig`. */
export function segToAudienceConfig(segId: string): { type: "ALL" | "TAGS"; tags?: string[] } {
    if (segId.startsWith("tag:")) return { type: "TAGS", tags: [segId.slice(4)] }
    return { type: "ALL" }
}

/** A draft broadcast, reduced to the fields the wizard needs to pre-fill. */
export interface BroadcastEditDoc {
    name: string
    templateId: string
    audienceConfig: { type: "ALL" | "TAGS" | "COUNTRIES"; tags?: string[]; countries?: string[] }
    scheduledAt?: number
    whatsappChannelId?: string
}

/**
 * Reverse of the wizard's create mapping: turn a draft broadcast into the
 * wizard's `initial` field values so "Reprendre la configuration" re-opens the
 * wizard pre-filled. Falls back to the default initial when a referenced
 * template/channel is no longer available.
 */
export function broadcastToWizardInitial(
    b: BroadcastEditDoc,
    data: CampaignWizardData,
): CampaignWizardData["initial"] {
    const tpl = data.templates.find((t) => t.id === b.templateId)
    const segId =
        b.audienceConfig.type === "TAGS" && b.audienceConfig.tags && b.audienceConfig.tags.length > 0
            ? tagSegId(b.audienceConfig.tags[0])
            : SEG_ALL
    const numId =
        b.whatsappChannelId && data.numbers.some((n) => n.id === b.whatsappChannelId)
            ? b.whatsappChannelId
            : data.numbers[0].id
    const scheduled = typeof b.scheduledAt === "number"
    const d = scheduled ? new Date(b.scheduledAt as number) : null
    const pad = (n: number) => String(n).padStart(2, "0")
    // Local components throughout, to round-trip with the wizard's
    // `new Date(`${date}T${time}`)` (parsed in local time).
    return {
        name: b.name,
        desc: "",
        cat: tpl?.cat ?? data.initial.cat,
        tplId: tpl ? tpl.id : data.initial.tplId,
        segId,
        mode: scheduled ? "scheduled" : "now",
        date: d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : data.initial.date,
        time: d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : data.initial.time,
        numId,
    }
}

/** Unique, ordered `{{N}}` tokens in a template body. */
function tokensOf(body: string): string[] {
    const out: string[] = []
    const re = /\{\{(\d+)\}\}/g
    let m: RegExpExecArray | null
    while ((m = re.exec(body)) !== null) {
        const tok = `{{${m[1]}}}`
        if (!out.includes(tok)) out.push(tok)
    }
    return out
}

/** MARKETING/UTILITY → wizard category; everything else (AUTH) is not broadcastable. */
function mapCat(category?: string): TemplateCategory | null {
    const c = (category ?? "").toUpperCase()
    if (c === "MARKETING") return "Marketing"
    if (c === "UTILITY") return "Utility"
    return null
}

function mapHeader(header: TemplateDoc["header"]): TemplateHeader | null {
    switch (header?.type) {
        case "IMAGE":
            return { type: "image", label: "Visuel" }
        case "VIDEO":
            return { type: "video", label: "Vidéo", duration: "0:20" }
        case "DOCUMENT":
            return { type: "doc", label: "document.pdf", pages: 2, size: "240 ko" }
        case "LOCATION":
            return { type: "location", label: header.location?.name ?? "Localisation", address: header.location?.address ?? "" }
        default:
            // TEXT / NONE headers render inline, not as a media block.
            return null
    }
}

/** Map an approved template doc to a wizard template (null = not broadcastable). */
export function mapWizardTemplate(t: TemplateDoc): WizardTemplate | null {
    const cat = mapCat(t.category)
    if (cat === null) return null
    const tokens = tokensOf(t.body ?? "")
    const vars: TemplateVar[] = tokens.map((token, i) =>
        i === 0 ? { token, src: "first" } : { token, src: "fixed", fixed: "" },
    )
    return {
        id: t._id,
        name: t.name,
        cat,
        lang: (t.language ?? "fr").toUpperCase(),
        header: mapHeader(t.header),
        body: t.body ?? "",
        footer: t.footer || null,
        buttons: (t.buttons ?? []).map((b) => b.text ?? "").filter(Boolean),
        vars,
    }
}

/** YYYY-MM-DD for `daysAhead` from `now`. */
function isoDate(now: number, daysAhead: number): string {
    return new Date(now + daysAhead * 86_400_000).toISOString().slice(0, 10)
}

/**
 * Build the wizard data from real Convex inputs. Returns `null` when the org
 * can't broadcast yet (no approved template or no active channel) so the host
 * can show a helpful message instead of an empty wizard.
 */
export function buildCampaignWizardData(
    {
        templates,
        audience,
        channels,
        balance,
    }: {
        templates: TemplateDoc[]
        audience: AudienceOptions
        channels: ChannelDoc[]
        balance: number
    },
    now: number = Date.now(),
): CampaignWizardData | null {
    const wizTemplates = templates
        .filter((t) => t.status === "APPROVED")
        .map(mapWizardTemplate)
        .filter((t): t is WizardTemplate => t !== null)

    const numbers: SendingNumber[] = channels
        .filter((c) => c.status === "active")
        .map((c) => ({ id: c._id, label: c.label, num: c.displayPhoneNumber, quality: "—" }))

    if (wizTemplates.length === 0 || numbers.length === 0) return null

    const segments: WizardSegment[] = [
        { id: SEG_ALL, fr: "Tous les contacts", total: audience.all, excluded: 0, desc: "Annuaire complet" },
        ...audience.tags.map((t) => ({
            id: tagSegId(t.id),
            fr: t.name,
            total: t.count,
            excluded: 0,
            desc: "Contacts portant ce tag",
        })),
    ]

    const first = wizTemplates[0]
    return {
        templates: wizTemplates,
        segments,
        numbers,
        // FCFA per conversation (the user's currency), by category.
        price: { Marketing: FCFA_PER_CONVERSATION.MARKETING, Utility: FCFA_PER_CONVERSATION.UTILITY },
        balance,
        initial: {
            name: "",
            desc: "",
            cat: first.cat,
            tplId: first.id,
            segId: SEG_ALL,
            mode: "now",
            date: isoDate(now, 1),
            time: "10:00",
            numId: numbers[0].id,
        },
    }
}
