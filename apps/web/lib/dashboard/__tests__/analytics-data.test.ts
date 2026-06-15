import { describe, expect, it } from "vitest"

import { groupThousands, mapAnalytics, type DashboardStats } from "../analytics-data"

function stats(over: Partial<DashboardStats> = {}): DashboardStats {
    return {
        global: {
            totalMessages: 4612,
            conversationInbound: 1200,
            conversationOutbound: 1100,
            marketingOutbound: 300,
            totalConversations: 820,
            openConversations: 142,
            closedConversations: 678,
            avgResponseTime: "2m 14s",
            responseRate: 92,
        },
        agents: [
            { id: "a", name: "Lucie", conversationsCount: 5, handledConversations: 40, avgResponseTime: "1m 48s" },
            { id: "b", name: "Tom", conversationsCount: 8, handledConversations: 60, avgResponseTime: "2m 02s" },
            { id: "c", name: "Inès", conversationsCount: 3, handledConversations: 12, avgResponseTime: "N/A" },
        ],
        dailyActivity: [
            { label: "1 mai", inbound: 10, outbound: 8, marketing: 2 },
            { label: "2 mai", inbound: 14, outbound: 9, marketing: 0 },
        ],
        trends: {
            messages: { trend: "up", value: "+12%" },
            conversations: { trend: "down", value: "-4%" },
        },
        heatmap: {
            rows: [[0, 1]],
            hours: ["8h", "10h"],
            days: ["L"],
            peakLabel: "lundi 8h–10h",
        },
        ...over,
    }
}

describe("groupThousands", () => {
    it("inserts thin spaces every 3 digits", () => {
        expect(groupThousands(4612)).toBe("4 612")
        expect(groupThousands(999)).toBe("999")
        expect(groupThousands(1234567)).toBe("1 234 567")
    })
})

describe("mapAnalytics", () => {
    it("maps the 4 KPIs from real metrics, only real deltas carry a trend", () => {
        const { kpis } = mapAnalytics(stats())
        expect(kpis[0]).toMatchObject({ label: "Conversations", value: "820", delta: "-4%", trend: "down" })
        expect(kpis[1]).toMatchObject({ label: "Messages", value: "4 612", delta: "+12%", trend: "up" })
        // response time / rate have no prior-period series → no delta
        expect(kpis[2]).toMatchObject({ label: "Temps de réponse moy.", value: "2m 14s" })
        expect(kpis[2].delta).toBeUndefined()
        expect(kpis[3]).toMatchObject({ label: "Taux de réponse", value: "92%" })
        expect(kpis[3].delta).toBeUndefined()
    })

    it("stacks volume by message type with three channels", () => {
        const d = mapAnalytics(stats())
        expect(d.channels.map((c) => c.key)).toEqual(["recus", "envoyes", "marketing"])
        expect(d.volume[0]).toEqual({ day: "1 mai", recus: 10, envoyes: 8, marketing: 2 })
    })

    it("ranks top agents by handled conversations and never shows CSAT", () => {
        const { topAgents } = mapAnalytics(stats())
        expect(topAgents.map((a) => a.name)).toEqual(["Tom", "Lucie", "Inès"])
        expect(topAgents[0]).toEqual({ id: "b", name: "Tom", conv: 60, time: "2m 02s" })
        expect(topAgents.every((a) => !("csat" in a) || a.csat === undefined)).toBe(true)
    })

    it("builds the status split from real open / closed counts", () => {
        const { status } = mapAnalytics(stats())
        expect(status).toEqual([
            { key: "closed", label: "Résolues", value: 678, color: "var(--status-good)" },
            { key: "open", label: "En cours", value: 142, color: "var(--accent)" },
        ])
    })

    it("passes the backend heatmap through unchanged", () => {
        const { heatmap } = mapAnalytics(stats())
        expect(heatmap.peakLabel).toBe("lundi 8h–10h")
        expect(heatmap.hours).toEqual(["8h", "10h"])
    })

    it("falls back to N/A response time without throwing", () => {
        const d = mapAnalytics(stats({ global: { ...stats().global, avgResponseTime: "" } }))
        expect(d.kpis[2].value).toBe("N/A")
    })
})
