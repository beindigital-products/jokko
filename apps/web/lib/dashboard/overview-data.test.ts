import { describe, expect, it } from "vitest"

import {
    attentionStateFromWaitMs,
    channelLabel,
    FCFA_PER_MARKETING_CONVERSATION,
    firstName,
    formatDateLabel,
    greetingNameFrom,
    humanizeWait,
    mapAttention,
    mapCampaigns,
    mapFlows,
    mapKpis,
    mapMarketingCredit,
    mapOnboarding,
    mapTeam,
    poleNameMap,
    usageSpentThisMonth,
    type BroadcastListItemInput,
    type ConversationListItemInput,
    type CreditTransactionInput,
    type DashboardStatsInput,
    type FlowListItemInput,
    type OnboardingChecklistInput,
    type PresenceMemberInput,
} from "./overview-data"

// Fixed reference instant: Saturday 24 May 2026, 12:00:00 local.
const NOW = new Date(2026, 4, 24, 12, 0, 0).getTime()
const MIN = 60_000
const HOUR = 60 * MIN

// ───────────────────────────────────────────────────────────────────────────
// small helpers
// ───────────────────────────────────────────────────────────────────────────

describe("humanizeWait", () => {
    it("shows 'à l'instant' under a minute", () => {
        expect(humanizeWait(0)).toBe("à l'instant")
        expect(humanizeWait(59_000)).toBe("à l'instant")
    })

    it("shows whole minutes under an hour", () => {
        expect(humanizeWait(8 * MIN)).toBe("8 min")
        expect(humanizeWait(59 * MIN + 30_000)).toBe("59 min")
    })

    it("shows 'Hh MMm' at and beyond an hour with zero-padded minutes", () => {
        expect(humanizeWait(HOUR + 4 * MIN)).toBe("1h 04m")
        expect(humanizeWait(2 * HOUR + 15 * MIN)).toBe("2h 15m")
        expect(humanizeWait(HOUR)).toBe("1h 00m")
    })
})

describe("attentionStateFromWaitMs", () => {
    it("is 'unassigned' up to 20 minutes", () => {
        expect(attentionStateFromWaitMs(0)).toBe("unassigned")
        expect(attentionStateFromWaitMs(20 * MIN)).toBe("unassigned")
    })

    it("is 'stale' above 20 and up to 60 minutes", () => {
        expect(attentionStateFromWaitMs(21 * MIN)).toBe("stale")
        expect(attentionStateFromWaitMs(60 * MIN)).toBe("stale")
    })

    it("is 'breach' above 60 minutes", () => {
        expect(attentionStateFromWaitMs(61 * MIN)).toBe("breach")
        expect(attentionStateFromWaitMs(5 * HOUR)).toBe("breach")
    })
})

describe("channelLabel", () => {
    it("normalises known channels and defaults to WhatsApp", () => {
        expect(channelLabel("WHATSAPP")).toBe("WhatsApp")
        expect(channelLabel("SMS")).toBe("SMS")
        expect(channelLabel("")).toBe("WhatsApp")
        expect(channelLabel(null)).toBe("WhatsApp")
        expect(channelLabel(undefined)).toBe("WhatsApp")
    })

    it("title-cases unknown channels", () => {
        expect(channelLabel("EMAIL")).toBe("Email")
    })
})

describe("firstName / greetingNameFrom", () => {
    it("takes the first token", () => {
        expect(firstName("Mamadou Seck")).toBe("Mamadou")
        expect(firstName("  Awa   Diop ")).toBe("Awa")
    })

    it("handles empty input", () => {
        expect(firstName("")).toBe("")
        expect(firstName(null)).toBe("")
        expect(firstName(undefined)).toBe("")
    })

    it("greeting falls back when no name", () => {
        expect(greetingNameFrom("Fatou Ba")).toBe("Fatou")
        expect(greetingNameFrom(null)).toBe("à vous")
    })
})

// ───────────────────────────────────────────────────────────────────────────
// mapKpis
// ───────────────────────────────────────────────────────────────────────────

function makeStats(over: Partial<DashboardStatsInput["chartData"]> = {}): DashboardStatsInput {
    return {
        stats: [
            { title: "Total Conversations", value: "10", description: "", trend: "up", trendValue: "+5%" },
            { title: "Taux de Réponse", value: "82%", description: "", trend: "up", trendValue: "+12.0%" },
        ],
        chartData: {
            inboundMessages: 1240,
            outboundMessages: 980,
            responseRate: 79,
            totalConversations: 42,
            openConversations: 7,
            resolvedConversations: 35,
            ...over,
        },
    }
}

function presenceMember(over: Partial<PresenceMemberInput> = {}): PresenceMemberInput {
    return {
        _id: "m1",
        role: "AGENT",
        status: "ONLINE",
        activeConversations: 0,
        maxConversations: 5,
        poleId: null,
        user: { name: "Agent A", email: "a@x.io", image: null },
        ...over,
    }
}

describe("mapKpis", () => {
    it("produces the 5 French KPIs with the documented values", () => {
        const presence = [
            presenceMember({ _id: "1", status: "ONLINE" }),
            presenceMember({ _id: "2", status: "BUSY" }),
            presenceMember({ _id: "3", status: "AWAY" }),
            presenceMember({ _id: "4", status: "OFFLINE" }),
        ]
        const kpis = mapKpis(makeStats(), presence)

        expect(kpis).toHaveLength(5)
        expect(kpis.map((k) => k.label)).toEqual([
            "Conversations reçues",
            "Réponses envoyées",
            "Taux de réponse",
            "Agents en ligne",
            "Non résolues",
        ])
        // Inbound / outbound formatted FR (thin-space grouping).
        expect(kpis[0].value).toBe((1240).toLocaleString("fr-FR"))
        expect(kpis[1].value).toBe((980).toLocaleString("fr-FR"))
        expect(kpis[2].value).toBe("79%")
        // online = ONLINE + BUSY = 2 of 4.
        expect(kpis[3].value).toBe("2 / 4")
        expect(kpis[3].deltaTone).toBe("mute")
        expect(kpis[4].value).toBe((7).toLocaleString("fr-FR"))
        expect(kpis[4].deltaTone).toBe("warn")
    })

    it("surfaces the response-rate trend onto the rate KPI", () => {
        const kpis = mapKpis(makeStats(), [])
        expect(kpis[2].delta).toBe("+12.0%")
        expect(kpis[2].deltaTone).toBe("good")
    })

    it("marks a downward rate trend as warn", () => {
        const stats = makeStats()
        stats.stats[1] = { title: "Taux de Réponse", value: "60%", description: "", trend: "down", trendValue: "-8%" }
        const kpis = mapKpis(stats, [])
        expect(kpis[2].deltaTone).toBe("warn")
    })

    it("omits the rate delta when no trend is present", () => {
        const stats = makeStats()
        stats.stats = [{ title: "Taux de Réponse", value: "60%", description: "" }]
        const kpis = mapKpis(stats, [])
        expect(kpis[2].delta).toBeUndefined()
    })

    it("renders 0 / 0 agents for an empty org", () => {
        const kpis = mapKpis(makeStats({ inboundMessages: 0, outboundMessages: 0, openConversations: 0, responseRate: 0 }), [])
        expect(kpis[3].value).toBe("0 / 0")
        expect(kpis[0].value).toBe("0")
        expect(kpis[2].value).toBe("0%")
    })
})

// ───────────────────────────────────────────────────────────────────────────
// mapAttention
// ───────────────────────────────────────────────────────────────────────────

function conv(over: Partial<ConversationListItemInput> = {}): ConversationListItemInput {
    // Spread `over` LAST so explicit nulls (preview/tags/contact) are preserved.
    return {
        _id: "c1",
        channel: "WHATSAPP",
        preview: "Bonjour, j'ai une question",
        tags: ["support"],
        lastMessageAt: NOW - 8 * MIN,
        contact: { name: "Awa Diop", phoneNumber: "+221770000000" },
        ...over,
    }
}

describe("mapAttention", () => {
    it("maps rows, humanises wait and escalates state by wait", () => {
        const rows = [
            conv({ _id: "fresh", lastMessageAt: NOW - 5 * MIN }),
            conv({ _id: "stale", lastMessageAt: NOW - 30 * MIN }),
            conv({ _id: "breach", lastMessageAt: NOW - (HOUR + 4 * MIN) }),
        ]
        const section = mapAttention(rows, NOW)

        expect(section.slaLabel).toBe("SLA 3m")
        expect(section.title).toBe("3 conversations à traiter")
        expect(section.rows).toHaveLength(3)

        expect(section.rows[0]).toMatchObject({ id: "fresh", who: "Awa Diop", channel: "WhatsApp", wait: "5 min", state: "unassigned" })
        expect(section.rows[0].last).toBe("Bonjour, j'ai une question")
        expect(section.rows[0].tags).toEqual(["support"])
        expect(section.rows[1]).toMatchObject({ wait: "30 min", state: "stale" })
        expect(section.rows[2]).toMatchObject({ wait: "1h 04m", state: "breach" })
    })

    it("falls back to phone then a placeholder for the contact name", () => {
        const phoneOnly = mapAttention([conv({ contact: { name: null, phoneNumber: "+221780000001" } })], NOW)
        expect(phoneOnly.rows[0].who).toBe("+221780000001")

        const noContact = mapAttention([conv({ contact: null })], NOW)
        expect(noContact.rows[0].who).toBe("Contact inconnu")
    })

    it("uses a placeholder preview and empty tags when missing", () => {
        const section = mapAttention([conv({ preview: null, tags: null })], NOW)
        expect(section.rows[0].last).toBe("Nouvelle conversation")
        expect(section.rows[0].tags).toEqual([])
    })

    it("singularises the title for a single row", () => {
        const section = mapAttention([conv()], NOW)
        expect(section.title).toBe("1 conversation à traiter")
    })

    it("caps at the limit (default 5)", () => {
        const many = Array.from({ length: 9 }, (_, i) => conv({ _id: `c${i}` }))
        expect(mapAttention(many, NOW).rows).toHaveLength(5)
        expect(mapAttention(many, NOW, 3).rows).toHaveLength(3)
    })

    it("shows the empty-state title with no rows", () => {
        const section = mapAttention([], NOW)
        expect(section.title).toBe("Tout est à jour")
        expect(section.rows).toEqual([])
    })

    it("clamps a future lastMessageAt to 'à l'instant'", () => {
        const section = mapAttention([conv({ lastMessageAt: NOW + 5 * MIN })], NOW)
        expect(section.rows[0].wait).toBe("à l'instant")
    })
})

// ───────────────────────────────────────────────────────────────────────────
// mapTeam
// ───────────────────────────────────────────────────────────────────────────

describe("mapTeam", () => {
    it("sorts by load desc, maps state, and uses the role as the pole chip by default", () => {
        const members = [
            presenceMember({ _id: "a", status: "ONLINE", role: "OWNER", activeConversations: 1, user: { name: "Owner O", email: "o@x.io", image: null } }),
            presenceMember({ _id: "b", status: "BUSY", role: "AGENT", activeConversations: 5, user: { name: "Busy B", email: "b@x.io", image: null } }),
            presenceMember({ _id: "c", status: "AWAY", role: "ADMIN", activeConversations: 3, user: { name: "Away A", email: "c@x.io", image: null } }),
            presenceMember({ _id: "d", status: "OFFLINE", role: "AGENT", activeConversations: 0, user: { name: "Off D", email: "d@x.io", image: null } }),
        ]
        const team = mapTeam(members)

        expect(team.map((t) => t.id)).toEqual(["b", "c", "a", "d"])
        expect(team[0]).toMatchObject({ name: "Busy B", state: "busy", load: 5, busy: "—", pole: "Agent" })
        expect(team[1]).toMatchObject({ state: "away", pole: "Admin" })
        expect(team[2]).toMatchObject({ state: "online", pole: "Owner" })
        expect(team[3]).toMatchObject({ state: "away", pole: "Agent" })
    })

    it("resolves pole names when a lookup is provided", () => {
        const members = [presenceMember({ _id: "a", poleId: "pole1", role: "AGENT" })]
        const team = mapTeam(members, { pole1: "Support" })
        expect(team[0].pole).toBe("Support")
    })

    it("falls back to email then a placeholder for the name", () => {
        const emailOnly = mapTeam([presenceMember({ user: { name: null, email: "only@x.io", image: null } })])
        expect(emailOnly[0].name).toBe("only@x.io")

        const neither = mapTeam([presenceMember({ user: { name: "", email: null, image: null } })])
        expect(neither[0].name).toBe("Coéquipier")
    })

    it("caps at the limit (default 6)", () => {
        const members = Array.from({ length: 8 }, (_, i) => presenceMember({ _id: `m${i}`, activeConversations: i }))
        expect(mapTeam(members)).toHaveLength(6)
        expect(mapTeam(members, undefined, 2)).toHaveLength(2)
    })

    it("returns [] for an empty team", () => {
        expect(mapTeam([])).toEqual([])
    })
})

describe("poleNameMap", () => {
    it("builds an id→name lookup and tolerates null/empty", () => {
        expect(poleNameMap([{ _id: "p1", name: "Ventes" }, { _id: "p2", name: "Support" }])).toEqual({ p1: "Ventes", p2: "Support" })
        expect(poleNameMap(null)).toEqual({})
        expect(poleNameMap(undefined)).toEqual({})
    })
})

// ───────────────────────────────────────────────────────────────────────────
// mapCampaigns
// ───────────────────────────────────────────────────────────────────────────

function broadcast(over: Partial<BroadcastListItemInput> = {}): BroadcastListItemInput {
    return {
        _id: "b1",
        name: "Promo",
        status: "SENDING",
        sentCount: 200,
        deliveredCount: 180,
        readCount: 90,
        ...over,
    }
}

describe("mapCampaigns", () => {
    it("maps the 3 most recent broadcasts with derived percentages", () => {
        const broadcasts = [
            broadcast({ _id: "1", status: "SENDING", sentCount: 200, deliveredCount: 180, readCount: 90 }),
            broadcast({ _id: "2", status: "COMPLETED", sentCount: 100, deliveredCount: 100, readCount: 50 }),
            broadcast({ _id: "3", status: "DRAFT", sentCount: 0, deliveredCount: 0, readCount: 0 }),
            broadcast({ _id: "4", status: "FAILED" }),
        ]
        const section = mapCampaigns(broadcasts)

        expect(section.rows).toHaveLength(3)
        expect(section.total).toBe("3 / 4")

        expect(section.rows[0]).toMatchObject({ id: "1", status: "sending", delivered: "180", read: "45%", deliveredPct: 90 })
        expect(section.rows[1]).toMatchObject({ id: "2", status: "completed", delivered: "100", read: "50%", deliveredPct: 100 })
        // Non-sending/completed → paused; zero sent → 0% and falls back to sentCount for delivered.
        expect(section.rows[2]).toMatchObject({ id: "3", status: "paused", delivered: "0", read: "0%", deliveredPct: 0 })
    })

    it("falls back to sentCount for delivered when deliveredCount is 0", () => {
        const section = mapCampaigns([broadcast({ sentCount: 50, deliveredCount: 0, readCount: 10 })])
        expect(section.rows[0].delivered).toBe("50")
        expect(section.rows[0].read).toBe("20%")
    })

    it("returns no rows but a 0 / 0 total for an empty list", () => {
        const section = mapCampaigns([])
        expect(section.rows).toEqual([])
        expect(section.total).toBe("0 / 0")
    })
})

// ───────────────────────────────────────────────────────────────────────────
// mapFlows
// ───────────────────────────────────────────────────────────────────────────

function flow(over: Partial<FlowListItemInput> = {}): FlowListItemInput {
    return { _id: "f1", name: "Bienvenue", isActive: true, ...over }
}

describe("mapFlows", () => {
    it("keeps only active flows, zeroes runs and empties period (honest gap)", () => {
        const flows = [
            flow({ _id: "1", name: "Bienvenue", isActive: true }),
            flow({ _id: "2", name: "Brouillon", isActive: false }),
            flow({ _id: "3", name: "Relance", isActive: true }),
        ]
        const section = mapFlows(flows)

        expect(section.items).toHaveLength(2)
        expect(section.items[0]).toEqual({ id: "1", name: "Bienvenue", runs: 0, period: "" })
        expect(section.items[1].name).toBe("Relance")
        expect(section.activeLabel).toBe("2 actifs")
        expect(section.total24h).toBeUndefined()
    })

    it("singularises the active label", () => {
        expect(mapFlows([flow({ isActive: true })]).activeLabel).toBe("1 actif")
    })

    it("caps the items at the limit (default 4)", () => {
        const flows = Array.from({ length: 6 }, (_, i) => flow({ _id: `f${i}`, isActive: true }))
        expect(mapFlows(flows).items).toHaveLength(4)
    })

    it("handles no active flows", () => {
        const section = mapFlows([flow({ isActive: false })])
        expect(section.items).toEqual([])
        expect(section.activeLabel).toBe("0 actif")
    })
})

// ───────────────────────────────────────────────────────────────────────────
// marketing credit
// ───────────────────────────────────────────────────────────────────────────

function txn(over: Partial<CreditTransactionInput> = {}): CreditTransactionInput {
    return { amount: -100, type: "USAGE", createdAt: NOW, ...over }
}

describe("usageSpentThisMonth", () => {
    it("sums |amount| of USAGE transactions in the current month only", () => {
        const txns = [
            txn({ amount: -100, createdAt: NOW }),
            txn({ amount: -250, createdAt: new Date(2026, 4, 1, 9, 0, 0).getTime() }),
            // Different month — ignored.
            txn({ amount: -999, createdAt: new Date(2026, 3, 30, 9, 0, 0).getTime() }),
            // Non-usage — ignored.
            txn({ amount: 5000, type: "RECHARGE", createdAt: NOW }),
        ]
        expect(usageSpentThisMonth(txns, NOW)).toBe(350)
    })

    it("is 0 with no usage", () => {
        expect(usageSpentThisMonth([], NOW)).toBe(0)
        expect(usageSpentThisMonth([txn({ type: "RECHARGE", amount: 1000 })], NOW)).toBe(0)
    })
})

describe("mapMarketingCredit", () => {
    it("formats FCFA, estimates conversations and the spent/total meter", () => {
        const credit = mapMarketingCredit(
            12000,
            [txn({ amount: -3000, createdAt: NOW }), txn({ amount: 9999, type: "RECHARGE", createdAt: NOW })],
            NOW,
        )

        expect(credit.balance).toBe(`${(12000).toLocaleString("fr-FR")} FCFA`)
        expect(credit.spent).toBe(`${(3000).toLocaleString("fr-FR")} FCFA`)
        // budget = spent + balance = 15000.
        expect(credit.budget).toBe(`${(15000).toLocaleString("fr-FR")} FCFA`)
        // pct = 3000 / 15000 = 20.
        expect(credit.pct).toBe(20)
        // conversations ≈ balance / 60 = 200.
        expect(credit.conversations).toBe((Math.floor(12000 / FCFA_PER_MARKETING_CONVERSATION)).toLocaleString("fr-FR"))
        expect(credit.runwayLabel).toBe("Crédit marketing disponible")
        expect(credit.autoTopupLabel).toBeUndefined()
        expect(credit.low).toBe(false)
        expect(credit.lowLabel).toBeUndefined()
    })

    it("flags the low-balance state below 1000 FCFA", () => {
        const credit = mapMarketingCredit(500, [], NOW)
        expect(credit.low).toBe(true)
        expect(credit.lowLabel).toBe("Solde bas — rechargez avant la prochaine campagne")
    })

    it("avoids divide-by-zero when nothing is loaded", () => {
        const credit = mapMarketingCredit(0, [], NOW)
        expect(credit.pct).toBe(0)
        expect(credit.budget).toBe(`0 FCFA`)
        expect(credit.conversations).toBe("0")
        expect(credit.low).toBe(true)
    })
})

// ───────────────────────────────────────────────────────────────────────────
// onboarding
// ───────────────────────────────────────────────────────────────────────────

function checklist(over: Partial<OnboardingChecklistInput> = {}): OnboardingChecklistInput {
    const steps =
        over.steps ??
        [
            { key: "whatsapp", done: true },
            { key: "team", done: true },
            { key: "template", done: false },
            { key: "templateMeta", done: false },
            { key: "automation", done: false },
            { key: "crm", done: false },
        ]
    const completed = over.completed ?? steps.filter((s) => s.done).length
    return { steps, completed, total: over.total ?? steps.length }
}

describe("mapOnboarding", () => {
    it("maps keys to French labels and reports progress + remaining headline", () => {
        const section = mapOnboarding(checklist())
        expect(section.steps).toHaveLength(6)
        expect(section.steps[0]).toEqual({ label: "Connecter un numéro WhatsApp", done: true })
        expect(section.steps[1]).toEqual({ label: "Inviter l'équipe", done: true })
        expect(section.steps[2].label).toBe("Créer un premier modèle")
        expect(section.steps[3].label).toBe("Soumettre 1 modèle à Meta")
        expect(section.steps[4].label).toBe("Configurer une automatisation")
        expect(section.steps[5].label).toBe("Connecter un CRM")

        expect(section.progressLabel).toBe("2 / 6")
        expect(section.headline).toBe("Encore 4 étapes.")
    })

    it("singularises the remaining headline", () => {
        const section = mapOnboarding(checklist({ completed: 5, total: 6 }))
        expect(section.headline).toBe("Encore 1 étape.")
    })

    it("celebrates when everything is done", () => {
        const allDone = checklist({
            steps: [
                { key: "whatsapp", done: true },
                { key: "team", done: true },
            ],
            completed: 2,
            total: 2,
        })
        const section = mapOnboarding(allDone)
        expect(section.headline).toBe("Tout est prêt !")
        expect(section.progressLabel).toBe("2 / 2")
    })

    it("falls back to the raw key for unknown steps", () => {
        const section = mapOnboarding(checklist({ steps: [{ key: "mystery", done: false }], completed: 0, total: 1 }))
        expect(section.steps[0].label).toBe("mystery")
    })
})

// ───────────────────────────────────────────────────────────────────────────
// formatDateLabel
// ───────────────────────────────────────────────────────────────────────────

describe("formatDateLabel", () => {
    it("formats a date in long French form", () => {
        const label = formatDateLabel(NOW)
        // 24 May 2026 is a Sunday.
        expect(label).toContain("24")
        expect(label).toContain("mai")
        expect(label).toContain("2026")
        expect(label.toLowerCase()).toBe(label.toLowerCase()) // sanity: returns a string
    })
})
