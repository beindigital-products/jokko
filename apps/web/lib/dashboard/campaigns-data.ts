import type { CampaignRow, CampaignStatus, CampaignsData } from "@/components/dashboard/campaigns/types"
import { fcfa, FCFA_PER_CONVERSATION } from "./overview-data"

/**
 * campaigns-data — pure mappers turning Convex `broadcasts.list` docs into the
 * v3 `CampaignsScreen` shapes (`CampaignsData`). Side-effect free so it unit-tests
 * without a Convex client. The broadcast doc stores counts + status but neither a
 * cost nor an audience total, so `broadcasts.list` enriches each row with
 * `audienceCount` + `templateCategory` and we estimate the Meta cost here — in
 * **FCFA** (the user's currency), ~`FCFA_PER_MARKETING_CONVERSATION` per conversation.
 */

/** The slice of an enriched `broadcasts.list` doc the screen needs. */
export interface BroadcastDoc {
    _id: string
    name: string
    status: "DRAFT" | "SCHEDULED" | "SENDING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED"
    scheduledAt?: number
    completedAt?: number
    createdAt: number
    sentCount: number
    deliveredCount: number
    readCount: number
    repliedCount: number
    failedCount: number
    templateName: string
    templateCategory?: string | null
    channelName?: string | null
    audienceCount: number
}

const fmt = (n: number) => n.toLocaleString("fr-FR")

/** Map the Convex broadcast status to the v3 list pill bucket (5 buckets). */
export function mapCampaignStatus(status: BroadcastDoc["status"]): CampaignStatus {
    switch (status) {
        case "PAUSED":
        case "SENDING":
            return "sending"
        case "SCHEDULED":
            return "scheduled"
        case "COMPLETED":
        case "FAILED":
            return "completed"
        case "CANCELLED":
        case "DRAFT":
        default:
            return "draft"
    }
}

function fmtDate(ts: number): string {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function fmtDateTime(ts: number): string {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

/** Human "start / status" label for the second column. */
function startLabel(b: BroadcastDoc): string {
    switch (b.status) {
        case "COMPLETED":
            return b.completedAt ? `${fmtDate(b.completedAt)} · terminé` : "terminé"
        case "FAILED":
            return b.completedAt ? `${fmtDate(b.completedAt)} · échec` : "échec"
        case "SCHEDULED":
            return b.scheduledAt ? fmtDateTime(b.scheduledAt) : "planifiée"
        case "PAUSED":
            return "en pause"
        case "SENDING":
            return "en cours"
        case "CANCELLED":
            return "annulée"
        default:
            return "brouillon"
    }
}

/** Per-conversation FCFA rate for a broadcast's template category. */
function rateFor(category?: string | null): number {
    return FCFA_PER_CONVERSATION[(category ?? "MARKETING").toUpperCase()] ?? FCFA_PER_CONVERSATION.MARKETING
}

/** Estimated Meta cost in FCFA: (sent if any, else eligible audience) × per-conv rate. */
function costLabel(b: BroadcastDoc): string {
    const base = b.sentCount > 0 ? b.sentCount : b.audienceCount
    if (base <= 0) return "—"
    const value = fcfa(base * rateFor(b.templateCategory))
    // Not started yet → it's an estimate.
    return b.sentCount > 0 ? value : `est. ${value}`
}

export function mapCampaignRow(b: BroadcastDoc): CampaignRow {
    const status = mapCampaignStatus(b.status)
    const hasSend = b.sentCount > 0

    let progress: number | undefined
    if (status === "completed") progress = 1
    else if (status === "sending" && b.audienceCount > 0) progress = Math.min(b.sentCount / b.audienceCount, 1)

    let hint: string | undefined
    let hintTone: CampaignRow["hintTone"]
    if (status === "scheduled") {
        hint = b.scheduledAt ? `Démarre ${fmtDateTime(b.scheduledAt)}` : "Planifiée"
        hintTone = "accent"
    } else if (status === "draft") {
        hint = "À configurer"
        hintTone = "mute"
    }

    return {
        id: b._id,
        name: b.name,
        status,
        tpl: b.templateName || "—",
        audience: b.audienceCount > 0 ? fmt(b.audienceCount) : "—",
        delivered: hasSend ? fmt(b.deliveredCount) : "—",
        read: hasSend ? fmt(b.readCount) : "—",
        cost: costLabel(b),
        start: startLabel(b),
        progress,
        hint,
        hintTone,
    }
}

/** Build the 4 KPI tiles from the broadcasts created in the current month. */
function buildKpis(docs: BroadcastDoc[], now: number): CampaignsData["kpis"] {
    const ref = new Date(now)
    const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1).getTime()
    const month = docs.filter((b) => b.createdAt >= monthStart)

    const sumSent = month.reduce((a, b) => a + b.sentCount, 0)
    const sumDelivered = month.reduce((a, b) => a + b.deliveredCount, 0)
    const sumRead = month.reduce((a, b) => a + b.readCount, 0)
    const cost = month.reduce((a, b) => a + b.sentCount * rateFor(b.templateCategory), 0)

    const deliveryRate = sumSent > 0 ? Math.round((sumDelivered / sumSent) * 1000) / 10 : 0
    const readRate = sumDelivered > 0 ? Math.round((sumRead / sumDelivered) * 1000) / 10 : 0
    const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? "s" : ""}`

    return [
        { label: "Envoyés ce mois", value: fmt(sumSent), delta: plural(month.length, "campagne") },
        { label: "Taux de livraison", value: `${deliveryRate}%`, delta: `${fmt(sumDelivered)} / ${fmt(sumSent)}` },
        { label: "Taux de lecture", value: `${readRate}%`, delta: `${fmt(sumRead)} lus` },
        { label: "Coût Meta · mois", value: fcfa(cost), delta: plural(month.length, "diffusion") },
    ]
}

export function mapCampaignsData(docs: BroadcastDoc[], now: number = Date.now()): CampaignsData {
    const n = docs.length
    return {
        count: `${n} campagne${n > 1 ? "s" : ""}`,
        kpis: buildKpis(docs, now),
        campaigns: docs.map(mapCampaignRow),
    }
}
