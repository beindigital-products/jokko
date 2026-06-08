import { describe, expect, it } from "vitest"

import {
    formatJoined,
    mapRole,
    mapStatus,
    mapTeam,
    type MembersData,
    type PolesData,
} from "../team-data"

const POLE_ID = "pole_ventes"

function membersData(over: Partial<MembersData> = {}): MembersData {
    return {
        nonOwnerCount: 2,
        limit: 10,
        members: [
            {
                id: "m1",
                userId: "u1",
                role: "owner",
                poleId: null,
                poleName: null,
                status: "AWAY",
                activeConversations: 2,
                joinedAt: new Date(2025, 0, 4).toISOString(),
                user: { name: "Sophie Bracquet", email: "sophie@bracquet.fr" },
            },
            {
                id: "m2",
                userId: "u2",
                role: "agent",
                poleId: POLE_ID,
                poleName: "Ventes",
                status: "ONLINE",
                activeConversations: 12,
                joinedAt: new Date(2026, 2, 8).toISOString(),
                user: { name: "Inès Caron", email: "ines@bracquet.fr" },
            },
            {
                id: "m3",
                userId: "u3",
                role: "agent",
                poleId: POLE_ID,
                poleName: "Ventes",
                status: "OFFLINE",
                activeConversations: 4,
                joinedAt: new Date(2026, 4, 2).toISOString(),
                user: { name: "Camille Brun", email: "camille@bracquet.fr" },
            },
        ],
        ...over,
    }
}

function polesData(over: Partial<PolesData> = {}): PolesData {
    return {
        poles: [{ id: POLE_ID, name: "Ventes", color: "#6938EF", memberCount: 2 }],
        ...over,
    }
}

describe("mapRole", () => {
    it("normalizes backend lowercase roles", () => {
        expect(mapRole("owner")).toBe("OWNER")
        expect(mapRole("admin")).toBe("ADMIN")
        expect(mapRole("agent")).toBe("AGENT")
        expect(mapRole("")).toBe("AGENT")
    })
})

describe("mapStatus", () => {
    it("maps presence enums to v3 status, defaulting to offline", () => {
        expect(mapStatus("ONLINE")).toBe("online")
        expect(mapStatus("BUSY")).toBe("busy")
        expect(mapStatus("AWAY")).toBe("away")
        expect(mapStatus("OFFLINE")).toBe("offline")
        expect(mapStatus(null)).toBe("offline")
        expect(mapStatus(undefined)).toBe("offline")
    })
})

describe("formatJoined", () => {
    it("formats an ISO date in French long form", () => {
        expect(formatJoined(new Date(2026, 2, 8).toISOString())).toBe("8 mars 2026")
    })
    it("returns a dash for missing/invalid input", () => {
        expect(formatJoined(null)).toBe("—")
        expect(formatJoined("not-a-date")).toBe("—")
    })
})

describe("mapTeam", () => {
    it("builds the seats label from nonOwnerCount / limit", () => {
        expect(mapTeam(membersData(), polesData()).seats).toBe("2 / 10 sièges")
    })

    it("defaults seats safely when counts are missing", () => {
        const d = mapTeam(
            { members: [] },
            { poles: [] },
        )
        expect(d.seats).toBe("0 / 1 sièges")
        expect(d.members).toEqual([])
        expect(d.poles).toEqual([])
    })

    it("sums per-pole open conversations from member workloads", () => {
        const pole = mapTeam(membersData(), polesData()).poles[0]
        // members m2 (12) + m3 (4) belong to Ventes → 16
        expect(pole.conv).toBe(16)
        expect(pole.members).toBe(2)
        expect(pole.color).toBe("#6938EF")
    })

    it("falls back to a palette color when the pole has none", () => {
        const pole = mapTeam(
            membersData(),
            { poles: [{ id: POLE_ID, name: "Ventes", color: null, memberCount: 2 }] },
        ).poles[0]
        expect(pole.color).toBe("var(--accent)")
    })

    it("maps members with role/status/conv/poles/joined", () => {
        const m = mapTeam(membersData(), polesData()).members
        expect(m[0]).toMatchObject({
            name: "Sophie Bracquet",
            role: "OWNER",
            status: "away",
            conv: 2,
            poles: [],
        })
        expect(m[1]).toMatchObject({
            name: "Inès Caron",
            role: "AGENT",
            status: "online",
            conv: 12,
            poles: ["Ventes"],
            joined: "8 mars 2026",
        })
    })

    it("falls back to email when a member has no name", () => {
        const data = membersData()
        data.members[1].user.name = null
        expect(mapTeam(data, polesData()).members[1].name).toBe("ines@bracquet.fr")
    })
})
