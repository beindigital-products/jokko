import { describe, expect, it } from "vitest"

import { UNLIMITED } from "@/lib/plan-utils"
import { mapPlan, mapUsage, type BillingPlanInput } from "../billing-data"

const PRO: BillingPlanInput = {
    key: "PRO",
    name: "Pro",
    monthlyPriceFCFA: 149000,
    maxAgents: 10,
    maxWhatsappChannels: 3,
    maxConversationsPerMonth: 10000,
}

const FREE: BillingPlanInput = {
    key: "FREE",
    name: "Gratuit",
    maxAgents: 2,
    maxWhatsappChannels: 1,
    maxConversationsPerMonth: 100,
}

describe("mapPlan", () => {
    it("maps a paid plan with FCFA price + tagline", () => {
        const p = mapPlan(PRO, { status: "active", subscriptionId: "sub_1" })
        expect(p).toMatchObject({
            name: "Pro",
            tagline: "jusqu'à 10 sièges · 3 numéros",
            price: "149 000 FCFA",
            priceUnit: "/ mois",
        })
        expect(p.renewalNote).toMatch(/Renouvellement automatique/)
    })

    it("renders the FREE plan as Gratuit without a price", () => {
        const p = mapPlan(FREE)
        expect(p.name).toBe("Gratuit")
        expect(p.price).toBe("Gratuit")
        expect(p.priceUnit).toBe("")
        expect(p.renewalNote).toMatch(/Aucun abonnement/)
    })

    it("singularizes the numéro tagline for a 1-number plan", () => {
        expect(mapPlan(FREE).tagline).toBe("jusqu'à 2 sièges · 1 numéro")
    })

    it("reflects the Stripe subscription status in the renewal note", () => {
        expect(mapPlan(PRO, { status: "trialing" }).renewalNote).toMatch(/Essai gratuit/)
        expect(mapPlan(PRO, { status: "past_due" }).renewalNote).toMatch(/en retard/)
        expect(mapPlan(PRO, { status: "canceled" }).renewalNote).toMatch(/annulé/)
        expect(mapPlan(PRO, {}).renewalNote).toBe("Abonnement actif.")
    })
})

describe("mapUsage", () => {
    it("builds 3 real usage meters with fractions", () => {
        const u = mapUsage(PRO, { conversations: 4612, seats: 8, channels: 2 })
        expect(u.map((m) => m.label)).toEqual(["Conversations Meta", "Sièges", "Numéros WhatsApp"])
        expect(u[0]).toMatchObject({ value: "4 612", total: "10 000", cost: "inclus" })
        expect(u[0].fraction).toBeCloseTo(0.4612)
        expect(u[1]).toMatchObject({ value: "8", total: "10" })
        expect(u[1].fraction).toBeCloseTo(0.8)
        expect(u[2]).toMatchObject({ value: "2", total: "3" })
    })

    it("shows ∞ and a 0 fraction for unlimited limits", () => {
        const u = mapUsage(
            { ...PRO, maxConversationsPerMonth: UNLIMITED },
            { conversations: 99999, seats: 8, channels: 2 },
        )
        expect(u[0].total).toBe("∞")
        expect(u[0].fraction).toBe(0)
    })
})
