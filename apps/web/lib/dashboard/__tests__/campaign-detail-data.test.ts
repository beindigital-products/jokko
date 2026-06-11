import { describe, expect, it } from "vitest"

import {
    mapCampaignDetail,
    mapDetailStatus,
    type BroadcastActivityEvent,
    type BroadcastDetailDoc,
} from "../campaign-detail-data"

function doc(over: Partial<BroadcastDetailDoc> = {}): BroadcastDetailDoc {
    return {
        name: "Promo printemps",
        status: "SENDING",
        createdAt: new Date(2026, 5, 1).getTime(),
        sentCount: 600,
        deliveredCount: 580,
        readCount: 410,
        repliedCount: 24,
        failedCount: 6,
        audienceConfig: { type: "ALL" },
        totalAudience: 1200,
        channelName: "Paris",
        template: {
            name: "Collection",
            category: "MARKETING",
            body: "Bonjour {{1}} !",
            footer: "STOP pour stop",
            header: { type: "IMAGE" },
            buttons: [{ text: "Voir" }],
        },
        ...over,
    }
}

describe("mapDetailStatus", () => {
    it("maps backend statuses to detail buckets", () => {
        expect(mapDetailStatus("SENDING")).toEqual({ status: "sending", label: "En cours" })
        expect(mapDetailStatus("SCHEDULED")).toEqual({ status: "scheduled", label: "Planifiée" })
        expect(mapDetailStatus("COMPLETED")).toEqual({ status: "completed", label: "Terminée" })
        expect(mapDetailStatus("FAILED")).toEqual({ status: "completed", label: "Terminée" })
        expect(mapDetailStatus("CANCELLED")).toEqual({ status: "cancelled", label: "Annulée" })
        expect(mapDetailStatus("DRAFT")).toEqual({ status: "draft", label: "Brouillon" })
    })
})

describe("mapCampaignDetail", () => {
    it("maps a sending campaign (progress, cost, preview, timeline)", () => {
        const activity: BroadcastActivityEvent[] = [
            { type: "created", timestamp: new Date(2026, 5, 1).getTime(), message: "Campagne créée" },
            { type: "failures", timestamp: new Date(2026, 5, 2).getTime(), message: "Échecs détectés · 6" },
        ]
        const d = mapCampaignDetail(doc(), activity)
        expect(d.status).toBe("sending")
        expect(d.eligible).toBe(1200)
        expect(d.progress).toEqual({ done: 600, total: 1200, etaLabel: "600 restants", paused: false })
        expect(d.cost).toMatch(/36[\s ]?000 FCFA/) // actual FCFA (600 × 60)
        expect(d.cost).not.toContain("€")
        expect(d.header).toBe("image")
        expect(d.buttons).toEqual(["Voir"])
        expect(d.timeline).toHaveLength(2)
        expect(d.timeline[1].tone).toBe("hot")
    })

    it("scheduled campaign: estimated cost + countdown, no progress", () => {
        const d = mapCampaignDetail(
            doc({ status: "SCHEDULED", sentCount: 0, deliveredCount: 0, readCount: 0, failedCount: 0, scheduledAt: new Date(2026, 5, 10, 9).getTime() }),
        )
        expect(d.status).toBe("scheduled")
        expect(d.progress).toBeUndefined()
        expect(d.countdown?.etaLabel).toContain("Démarre")
        expect(d.cost.startsWith("est. ")).toBe(true)
    })
})
