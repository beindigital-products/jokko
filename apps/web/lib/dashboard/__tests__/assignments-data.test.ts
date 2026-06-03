import { describe, expect, it } from "vitest"

import {
    agentLoadState,
    mapAgentLoad,
    mapChannelRoutes,
    mapFallbackOptions,
    mapSlaMetrics,
    mapStrategies,
    type AgentsListItem,
    type ChannelListItem,
} from "../assignments-data"

describe("agentLoadState", () => {
    it("returns off when the agent is offline", () => {
        expect(agentLoadState({ status: "Hors ligne", load: 4, maxLoad: 15 })).toBe("off")
    })

    it("returns over at or above capacity (online)", () => {
        expect(agentLoadState({ status: "En ligne", load: 15, maxLoad: 15 })).toBe("over")
        expect(agentLoadState({ status: "Occupé", load: 18, maxLoad: 15 })).toBe("over")
    })

    it("returns ok when online with active conversations", () => {
        expect(agentLoadState({ status: "En ligne", load: 6, maxLoad: 15 })).toBe("ok")
    })

    it("returns low when online and free", () => {
        expect(agentLoadState({ status: "En ligne", load: 0, maxLoad: 15 })).toBe("low")
    })
})

describe("mapAgentLoad", () => {
    const agents: AgentsListItem[] = [
        { id: "1", fullName: "Lucie Aubert", department: "Support", load: 18, maxLoad: 15, status: "En ligne" },
        { id: "2", fullName: "Omar Ba", department: "", load: 0, maxLoad: 0, status: "Hors ligne" },
    ]

    it("maps fields and guards a zero capacity", () => {
        const [lucie, omar] = mapAgentLoad(agents)
        expect(lucie).toMatchObject({ id: "1", name: "Lucie Aubert", pole: "Support", open: 18, cap: 15, state: "over" })
        // Empty department falls back, zero capacity is clamped to 1 (avoid /0 in the bar).
        expect(omar).toMatchObject({ pole: "Général", cap: 1, state: "off" })
    })
})

describe("mapChannelRoutes", () => {
    const channels: ChannelListItem[] = [
        { label: "Paris", displayPhoneNumber: "+33 1 84 60 12 88", pole: { name: "Pôle Ventes" }, primaryTeam: null },
        { label: "Support", displayPhoneNumber: "+221 33 822 14 50", pole: null, primaryTeam: { name: "Équipe Dakar" } },
        { label: "Standard", displayPhoneNumber: "+225 27 22 91 04 17", pole: null, primaryTeam: null },
    ]

    it("routes to pole, then team, then a global fallback", () => {
        const routes = mapChannelRoutes(channels)
        expect(routes[0]).toEqual({ city: "Paris", number: "+33 1 84 60 12 88", dest: "Pôle Ventes", destSub: "Pôle dédié" })
        expect(routes[1].dest).toBe("Équipe Dakar")
        expect(routes[1].destSub).toBe("Équipe dédiée")
        expect(routes[2].dest).toBe("Tous les agents")
        expect(routes[2].destSub).toBe("Round-robin global")
    })
})

describe("mapSlaMetrics", () => {
    it("uses the avg response time when present", () => {
        const [first, resolution] = mapSlaMetrics("2 min")
        expect(first.value).toBe("2 min")
        expect(first.stat).toBe("Moyenne 2 min")
        expect(resolution.value).toBe("—")
    })

    it("degrades to no-data when avg is missing", () => {
        expect(mapSlaMetrics(undefined)[0].stat).toBe("Aucune donnée")
        expect(mapSlaMetrics("")[0].value).toBe("—")
    })
})

describe("mapFallbackOptions", () => {
    it("reflects the excludeOfflineAgents + auto settings", () => {
        const opts = mapFallbackOptions({ excludeOfflineAgents: true, autoAssignEnabled: false })
        expect(opts[0].enabled).toBe(true)
        expect(opts[1].enabled).toBe(false)
        expect(opts[2].enabled).toBe(false)
    })
})

describe("mapStrategies", () => {
    it("returns 4 options with exactly one selected", () => {
        const s = mapStrategies()
        expect(s).toHaveLength(4)
        expect(s.filter((o) => o.selected)).toHaveLength(1)
        expect(s.find((o) => o.selected)?.id).toBe("rr")
    })
})
