import { describe, expect, it } from "vitest"

import { mapAutomationsData, relativeTime, triggerLabel, type FlowDoc } from "../automations-data"

const NOW = new Date(2026, 5, 4, 12, 0, 0).getTime() // 4 June 2026, local

function doc(over: Partial<FlowDoc> = {}): FlowDoc {
    return {
        _id: "f1",
        name: "Welcome",
        triggerType: "NEW_CONVERSATION",
        isActive: false,
        updatedAt: NOW,
        ...over,
    }
}

describe("triggerLabel", () => {
    it("maps known trigger types and falls back to a default", () => {
        expect(triggerLabel("KEYWORD")).toBe("Mot-clé")
        expect(triggerLabel("NEW_CONVERSATION")).toBe("Nouveau message")
        expect(triggerLabel("SCHEDULE")).toBe("Plage horaire")
        expect(triggerLabel("UNKNOWN")).toBe("Nouveau message")
    })
})

describe("relativeTime", () => {
    it("renders compact French buckets", () => {
        expect(relativeTime(NOW, NOW)).toBe("à l'instant")
        expect(relativeTime(NOW - 5 * 60_000, NOW)).toBe("il y a 5 min")
        expect(relativeTime(NOW - 2 * 3_600_000, NOW)).toBe("il y a 2 h")
        expect(relativeTime(NOW - 3 * 86_400_000, NOW)).toBe("il y a 3 j")
    })

    it("falls back to a date past a week", () => {
        expect(relativeTime(NOW - 30 * 86_400_000, NOW)).toMatch(/mai/)
    })
})

describe("mapAutomationsData", () => {
    it("derives KPIs from active/draft counts", () => {
        const data = mapAutomationsData(
            [
                doc({ _id: "a", isActive: true }),
                doc({ _id: "b", isActive: true }),
                doc({ _id: "c", isActive: false }),
            ],
            NOW,
        )
        expect(data.count).toBe("3 flows")
        expect(data.automations).toHaveLength(3)
        expect(data.kpis.find((k) => k.label === "Total")?.value).toBe("3")
        expect(data.kpis.find((k) => k.label === "Actives")?.value).toBe("2")
        expect(data.kpis.find((k) => k.label === "Brouillons")?.value).toBe("1")
        expect(data.kpis.find((k) => k.label === "Taux d'activation")?.value).toBe("67%")
    })

    it("maps a row: description fallback + trigger + relative time", () => {
        const [row] = mapAutomationsData([doc({ _id: "x", name: "Routage", triggerType: "KEYWORD", updatedAt: NOW - 3_600_000 })], NOW).automations
        expect(row.name).toBe("Routage")
        expect(row.description).toBe("Automatisation WhatsApp")
        expect(row.trigger).toBe("Mot-clé")
        expect(row.updated).toBe("il y a 1 h")
    })

    it("singular count + zero state", () => {
        const data = mapAutomationsData([doc({ isActive: false })], NOW)
        expect(data.count).toBe("1 flow")
        expect(data.kpis.find((k) => k.label === "Taux d'activation")?.value).toBe("0%")
        const empty = mapAutomationsData([], NOW)
        expect(empty.count).toBe("0 flow")
    })
})
