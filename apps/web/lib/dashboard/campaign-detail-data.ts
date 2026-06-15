import type {
    CampaignDetailData,
    CampaignDetailStatus,
    CampaignTimelineEvent,
} from "@/components/dashboard/campaigns"
import { fcfa, FCFA_PER_CONVERSATION } from "./overview-data"

/**
 * campaign-detail-data — pure mapper turning `broadcasts.get` + `getActivity`
 * into the v3 `CampaignDetailData`. Side-effect free → unit-testable. Cost is
 * estimated in **FCFA** (~`FCFA_PER_MARKETING_CONVERSATION` / conversation — the
 * broadcast stores no cost); exclusions aren't tracked by the backend so the
 * list is empty.
 */

export interface BroadcastDetailDoc {
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
    audienceConfig: { type: "ALL" | "TAGS" | "COUNTRIES"; tags?: string[]; countries?: string[] }
    totalAudience: number
    channelName?: string | null
    template?: {
        name?: string
        category?: string
        body?: string
        footer?: string
        header?: { type?: string; text?: string } | null
        buttons?: { text?: string }[] | null
    } | null
}

export interface BroadcastActivityEvent {
    type: string
    timestamp: number
    message: string
}

const nf = (n: number) => n.toLocaleString("fr-FR")

export function mapDetailStatus(status: BroadcastDetailDoc["status"]): { status: CampaignDetailStatus; label: string } {
    switch (status) {
        case "SCHEDULED":
            return { status: "scheduled", label: "Planifiée" }
        case "SENDING":
            return { status: "sending", label: "En cours" }
        case "PAUSED":
            return { status: "paused", label: "En pause" }
        case "COMPLETED":
        case "FAILED":
            return { status: "completed", label: "Terminée" }
        case "CANCELLED":
            return { status: "cancelled", label: "Annulée" }
        default:
            return { status: "draft", label: "Brouillon" }
    }
}

const ACTIVITY_TONE: Record<string, CampaignTimelineEvent["tone"]> = {
    created: "mute",
    scheduled: "accent",
    sending_started: "accent",
    completed: "good",
    failures: "hot",
    cancelled: "hot",
    retry: "accent",
}

function fmtDateTime(ts: number): string {
    return new Date(ts).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function headerKind(t?: string): CampaignDetailData["header"] {
    switch (t) {
        case "IMAGE":
            return "image"
        case "VIDEO":
            return "video"
        case "DOCUMENT":
            return "doc"
        case "TEXT":
            return "text"
        default:
            return "none"
    }
}

function startLabel(b: BroadcastDetailDoc): string {
    switch (b.status) {
        case "COMPLETED":
        case "FAILED":
            return b.completedAt ? `Terminée · ${fmtDateTime(b.completedAt)}` : "Terminée"
        case "SCHEDULED":
            return b.scheduledAt ? `Démarre le ${fmtDateTime(b.scheduledAt)}` : "Planifiée"
        case "SENDING":
            return "Démarrée"
        case "CANCELLED":
            return "Annulée avant envoi"
        default:
            return "Jamais envoyée · brouillon"
    }
}

function audienceLabel(b: BroadcastDetailDoc): string {
    const seg =
        b.audienceConfig.type === "ALL"
            ? "Tous les contacts"
            : b.audienceConfig.type === "TAGS"
              ? "Segment par tags"
              : "Par pays"
    return `${nf(b.totalAudience)} contact${b.totalAudience > 1 ? "s" : ""} · ${seg}`
}

function segmentLabel(b: BroadcastDetailDoc): string {
    if (b.audienceConfig.type === "ALL") return "Tous les contacts"
    if (b.audienceConfig.type === "TAGS") return "Contacts par tags"
    return "Contacts par pays"
}

export function mapCampaignDetail(
    b: BroadcastDetailDoc,
    activity?: BroadcastActivityEvent[] | null,
): CampaignDetailData {
    const { status, label } = mapDetailStatus(b.status)
    const hasSend = b.sentCount > 0
    const rate = FCFA_PER_CONVERSATION[(b.template?.category ?? "MARKETING").toUpperCase()] ?? FCFA_PER_CONVERSATION.MARKETING
    const costBase = hasSend ? b.sentCount : b.totalAudience
    const costValue = fcfa(costBase * rate)
    const cost = costBase > 0 ? (hasSend ? costValue : `est. ${costValue}`) : "—"

    const timeline: CampaignTimelineEvent[] = (activity ?? []).map((e) => ({
        label: e.message,
        time: fmtDateTime(e.timestamp),
        tone: ACTIVITY_TONE[e.type] ?? "mute",
    }))

    const header = headerKind(b.template?.header?.type)

    return {
        name: b.name,
        status,
        statusLabel: label,
        tpl: b.template?.name ?? "—",
        sender: b.channelName ?? "— non défini",
        audienceLabel: audienceLabel(b),
        startLabel: startLabel(b),
        eligible: b.totalAudience,
        sent: b.sentCount,
        delivered: b.deliveredCount,
        read: b.readCount,
        failed: b.failedCount,
        replies: b.repliedCount,
        cost,
        costNote: `≈ ${fcfa(rate)} / conversation`,
        progress:
            status === "sending" || status === "paused"
                ? {
                      done: b.sentCount,
                      total: b.totalAudience || b.sentCount,
                      etaLabel: `${nf(Math.max((b.totalAudience || b.sentCount) - b.sentCount, 0))} restants`,
                      paused: status === "paused",
                  }
                : undefined,
        countdown:
            status === "scheduled" && b.scheduledAt ? { etaLabel: `Démarre le ${fmtDateTime(b.scheduledAt)}` } : undefined,
        header,
        headerText: b.template?.header?.text,
        body: b.template?.body ?? "",
        sample: "Awa",
        footer: b.template?.footer || undefined,
        buttons: (b.template?.buttons ?? []).map((x) => x.text ?? "").filter(Boolean),
        segment: segmentLabel(b),
        segCount: b.totalAudience,
        excl: [],
        timeline,
    }
}
