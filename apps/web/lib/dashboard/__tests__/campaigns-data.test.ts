import { describe, expect, it } from "vitest"

import {
    mapCampaignStatus,
    mapCampaignRow,
    mapCampaignsData,
    type BroadcastDoc,
} from "../campaigns-data"

const NOW = new Date(2026, 5, 4, 12, 0, 0).getTime() // 4 June 2026, local

function doc(over: Partial<BroadcastDoc> = {}): BroadcastDoc {
    return {
        _id: "b1",
        name: "Campagne",
        status: "DRAFT",
        createdAt: new Date(2026, 5, 2).getTime(),
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        repliedCount: 0,
        failedCount: 0,
        templateName: "Welcome",
        templateCategory: "MARKETING",
        channelName: "Paris",
        audienceCount: 0,
        ...over,
    }
}

describe("mapCampaignStatus", () => {
    it("maps backend statuses into the 5 list buckets", () => {
        expect(mapCampaignStatus("SENDING")).toBe("sending")
        expect(mapCampaignStatus("SCHEDULED")).toBe("scheduled")
        expect(mapCampaignStatus("COMPLETED")).toBe("completed")
        expect(mapCampaignStatus("FAILED")).toBe("completed")
        expect(mapCampaignStatus("CANCELLED")).toBe("draft")
        expect(mapCampaignStatus("DRAFT")).toBe("draft")
    })
})

describe("mapCampaignRow", () => {
    it("a completed campaign: full progress, real stats, actual cost", () => {
        const r = mapCampaignRow(
            doc({
                status: "COMPLETED",
                sentCount: 2408,
                deliveredCount: 2392,
                readCount: 1880,
                audienceCount: 2408,
                completedAt: new Date(2026, 4, 26).getTime(),
            }),
        )
        expect(r.status).toBe("completed")
        expect(r.progress).toBe(1)
        expect(r.delivered).toMatch(/2[\s ]?392/)
        expect(r.read).toMatch(/1[\s ]?880/)
        expect(r.audience).toMatch(/2[\s ]?408/)
        expect(r.cost).toMatch(/144[\s ]?480 FCFA/) // actual FCFA (2408 × 60), no "est."
        expect(r.cost).not.toContain("€")
        expect(r.start).toContain("terminé")
    })

    it("a scheduled campaign: accent hint, estimated cost, no stats", () => {
        const r = mapCampaignRow(doc({ status: "SCHEDULED", audienceCount: 88, scheduledAt: new Date(2026, 5, 5, 9, 0).getTime() }))
        expect(r.status).toBe("scheduled")
        expect(r.delivered).toBe("—")
        expect(r.read).toBe("—")
        expect(r.cost.startsWith("est. ")).toBe(true)
        expect(r.hintTone).toBe("accent")
        expect(r.hint).toContain("Démarre")
    })

    it("a draft campaign: everything empty + mute hint", () => {
        const r = mapCampaignRow(doc({ status: "DRAFT" }))
        expect(r.audience).toBe("—")
        expect(r.cost).toBe("—")
        expect(r.progress).toBeUndefined()
        expect(r.hint).toBe("À configurer")
        expect(r.hintTone).toBe("mute")
    })

    it("a sending campaign: progress = sent / audience", () => {
        const r = mapCampaignRow(doc({ status: "SENDING", sentCount: 620, audienceCount: 1240, deliveredCount: 600, readCount: 410 }))
        expect(r.status).toBe("sending")
        expect(r.progress).toBeCloseTo(0.5, 5)
    })
})

describe("mapCampaignsData", () => {
    it("aggregates KPIs from broadcasts created this month only", () => {
        const data = mapCampaignsData(
            [
                doc({ _id: "a", status: "COMPLETED", sentCount: 100, deliveredCount: 98, readCount: 80, createdAt: new Date(2026, 5, 1).getTime() }),
                doc({ _id: "b", status: "COMPLETED", sentCount: 100, deliveredCount: 100, readCount: 60, createdAt: new Date(2026, 5, 3).getTime() }),
                // Last month → excluded from KPI sums.
                doc({ _id: "c", status: "COMPLETED", sentCount: 9999, deliveredCount: 9999, readCount: 9999, createdAt: new Date(2026, 4, 15).getTime() }),
            ],
            NOW,
        )
        expect(data.count).toBe("3 campagnes")
        expect(data.campaigns).toHaveLength(3)
        const sent = data.kpis.find((k) => k.label === "Envoyés ce mois")
        expect(sent?.value).toBe("200") // 100 + 100, May one excluded
        const delivery = data.kpis.find((k) => k.label === "Taux de livraison")
        expect(delivery?.value).toBe("99%") // 198 / 200
    })
})
