import type { AnalyticsData } from "@/components/dashboard/analytics"

/**
 * analytics-data — pure mapper turning real Convex analytics
 * (`analytics.getDashboardStats`) into the v3 `AnalyticsData` consumed by
 * `AnalyticsScreen`. Side-effect free → unit-testable.
 *
 * Honest reconciliation with the design mock (which used fabricated CSAT /
 * by-city channels):
 *  - KPIs surface only metrics the backend actually computes — Conversations
 *    and Messages carry real period-over-period deltas; response time / rate
 *    have no prior-period series so they show a plain caption (no fake trend).
 *  - the volume chart is stacked by **message type** (reçus / envoyés /
 *    marketing), the real dimension `dailyActivity` provides — not by channel.
 *  - top agents show conv + avg response time (no CSAT tracking yet).
 *  - status split is the real open / closed conversation counts.
 *  - the heatmap comes straight from the backend (real message timestamps).
 */

export interface DashboardStats {
    global: {
        totalMessages: number
        conversationInbound?: number
        conversationOutbound?: number
        marketingOutbound?: number
        totalConversations: number
        openConversations: number
        closedConversations: number
        avgResponseTime: string
        responseRate: number
    }
    agents: Array<{
        id: string
        name: string
        conversationsCount?: number
        handledConversations?: number
        avgResponseTime: string
    }>
    dailyActivity: Array<{
        label: string
        inbound: number
        outbound: number
        marketing: number
    }>
    trends: {
        messages: { trend: "up" | "down"; value: string }
        conversations: { trend: "up" | "down"; value: string }
    }
    heatmap?: {
        rows: number[][]
        hours: string[]
        days: string[]
        peakLabel: string
    }
}

/** Empty heatmap shown before the backend reports any peak-hours data. */
const EMPTY_HEATMAP = {
    rows: Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => 0)),
    hours: ["8h", "10h", "12h", "14h", "16h", "18h", "20h"],
    days: ["L", "M", "M", "J", "V", "S", "D"],
    peakLabel: "—",
}

/** "4612" → "4 612" (deterministic, locale-independent for tests). */
export function groupThousands(n: number): string {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

const VOLUME_CHANNELS = [
    { key: "recus", label: "Reçus", color: "var(--accent)" },
    { key: "envoyes", label: "Envoyés", color: "var(--ink-900)" },
    { key: "marketing", label: "Marketing", color: "var(--status-warn)" },
]

export function mapAnalytics(stats: DashboardStats): AnalyticsData {
    const g = stats.global

    const kpis = [
        {
            label: "Conversations",
            value: groupThousands(g.totalConversations),
            delta: stats.trends.conversations.value,
            trend: stats.trends.conversations.trend,
            sub: "vs période préc.",
        },
        {
            label: "Messages",
            value: groupThousands(g.totalMessages),
            delta: stats.trends.messages.value,
            trend: stats.trends.messages.trend,
            sub: "vs période préc.",
        },
        {
            label: "Temps de réponse moy.",
            value: g.avgResponseTime || "N/A",
            sub: "moyenne globale",
        },
        {
            label: "Taux de réponse",
            value: `${g.responseRate}%`,
            sub: "réponses / messages reçus",
        },
    ]

    const volume = stats.dailyActivity.map((d) => ({
        day: d.label,
        recus: d.inbound,
        envoyes: d.outbound,
        marketing: d.marketing,
    }))

    const topAgents = [...stats.agents]
        .sort(
            (a, b) =>
                (b.handledConversations ?? b.conversationsCount ?? 0) -
                (a.handledConversations ?? a.conversationsCount ?? 0),
        )
        .slice(0, 5)
        .map((a) => ({
            id: a.id,
            name: a.name,
            conv: a.handledConversations ?? a.conversationsCount ?? 0,
            time: a.avgResponseTime || "N/A",
        }))

    const status = [
        {
            key: "closed",
            label: "Résolues",
            value: g.closedConversations,
            color: "var(--status-good)",
        },
        {
            key: "open",
            label: "En cours",
            value: g.openConversations,
            color: "var(--accent)",
        },
    ]

    return {
        kpis,
        volume,
        channels: VOLUME_CHANNELS,
        topAgents,
        status,
        heatmap: stats.heatmap ?? EMPTY_HEATMAP,
    }
}
