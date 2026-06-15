import { describe, expect, it } from "vitest"

import { mapIntegrations, relativeTime, type ProviderDoc, type ConnectionDoc } from "../integrations-data"

const NOW = new Date(2026, 5, 5, 12, 0, 0).getTime()

const PROVIDERS: ProviderDoc[] = [
    { key: "hubspot", displayName: "HubSpot", authMode: "oauth2", availability: "available" },
    { key: "pipedrive", displayName: "Pipedrive", authMode: "oauth2", availability: "available" },
    { key: "axonaut", displayName: "Axonaut", authMode: "apiKey", availability: "available" },
]

describe("relativeTime", () => {
    it("renders compact French buckets", () => {
        expect(relativeTime(NOW, NOW)).toBe("à l'instant")
        expect(relativeTime(NOW - 4 * 60_000, NOW)).toBe("il y a 4 min")
        expect(relativeTime(NOW - 3 * 3_600_000, NOW)).toBe("il y a 3 h")
    })
})

describe("mapIntegrations", () => {
    it("renders real CRM providers (functional) + showcase coming-soon cards", () => {
        const conns: ConnectionDoc[] = [
            { _id: "c1", provider: "hubspot", status: "active", lastSyncAt: NOW - 4 * 60_000 },
            { _id: "c2", provider: "pipedrive", status: "degraded", lastErrorAt: NOW - 60 * 60_000 },
        ]
        const { activeCount, integrations } = mapIntegrations(PROVIDERS, conns, NOW)

        const hubspot = integrations.find((i) => i.id === "hubspot")!
        expect(hubspot.on).toBe(true)
        expect(hubspot.health).toBe("good")
        expect(hubspot.last).toBe("synchronisé il y a 4 min")
        expect(hubspot.cat).toBe("CRM")
        expect(hubspot.available).toBe(true)

        const pipedrive = integrations.find((i) => i.id === "pipedrive")!
        expect(pipedrive.on).toBe(true)
        expect(pipedrive.health).toBe("warn")
        expect(pipedrive.last).toBe("incident il y a 1 h")

        const axonaut = integrations.find((i) => i.id === "axonaut")!
        expect(axonaut.on).toBe(false)
        expect(axonaut.last).toBe("—")

        // Showcase connectors are present and marked unavailable.
        const slack = integrations.find((i) => i.id === "slack")!
        expect(slack.available).toBe(false)
        expect(slack.cat).toBe("Messagerie")

        // Only active connections count toward the eyebrow.
        expect(activeCount).toBe(2)
    })

    it("prefers an active connection over a disconnected one for the same provider", () => {
        const conns: ConnectionDoc[] = [
            { _id: "old", provider: "hubspot", status: "disconnected" },
            { _id: "new", provider: "hubspot", status: "active", lastSyncAt: NOW },
        ]
        const { integrations } = mapIntegrations(PROVIDERS, conns, NOW)
        expect(integrations.find((i) => i.id === "hubspot")!.on).toBe(true)
    })

    it("never yields duplicate ids — render keys stay unique even on bad input", () => {
        // Backend returns the same provider key twice + a key that collides with
        // a static showcase id ("slack"). The catalog must still expose unique ids.
        const dupProviders: ProviderDoc[] = [
            ...PROVIDERS,
            { key: "hubspot", displayName: "HubSpot (dup)", authMode: "oauth2", availability: "available" },
            { key: "slack", displayName: "Slack CRM?", authMode: "apiKey", availability: "available" },
        ]
        const { integrations } = mapIntegrations(dupProviders, [], NOW)
        const ids = integrations.map((i) => i.id)
        expect(ids.length).toBe(new Set(ids).size)
        // The live provider wins the "slack" id over the showcase entry.
        expect(integrations.find((i) => i.id === "slack")!.cat).toBe("CRM")
    })
})
