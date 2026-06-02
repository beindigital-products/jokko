import { describe, expect, it } from "vitest"

import { trialBannerContent } from "./trial-banner-content"

describe("trialBannerContent", () => {
    it("expired → expired tone, suspended, non-dismissible, with admin escalation", () => {
        const c = trialBannerContent({ expired: true, days: 0 })
        expect(c.tone).toBe("expired")
        expect(c.dataState).toBe("expired")
        expect(c.title).toBe("Essai terminé")
        expect(c.left).toBe("Envoi suspendu")
        expect(c.progress).toBe(1)
        expect(c.ctaTone).toBe("danger")
        expect(c.secondaryCta).toBe("Demander à l'admin")
        expect(c.dismissible).toBe(false)
    })

    it("urgent at ≤2 days → danger CTA, non-dismissible", () => {
        const c = trialBannerContent({ expired: false, days: 2 })
        expect(c.tone).toBe("urgent")
        expect(c.dataState).toBe("urgent")
        expect(c.title).toBe("Plus que 2 jours")
        expect(c.ctaTone).toBe("danger")
        expect(c.dismissible).toBe(false)
    })

    it("singularises copy at exactly 1 day", () => {
        const c = trialBannerContent({ expired: false, days: 1 })
        expect(c.title).toBe("Plus que 1 jour")
        expect(c.left).toBe("1 jour restant")
    })

    it("reminder between 3 and 9 days → ink CTA, dismissible", () => {
        const c = trialBannerContent({ expired: false, days: 7 })
        expect(c.tone).toBe("reminder")
        expect(c.dataState).toBe("rappel")
        expect(c.ctaTone).toBe("ink")
        expect(c.left).toBe("7 jours restants")
        expect(c.dismissible).toBe(true)
        expect(c.secondaryCta).toBeUndefined()
    })

    it("neutral at 10+ days → welcome, primary CTA", () => {
        const c = trialBannerContent({ expired: false, days: 12 })
        expect(c.tone).toBe("neutral")
        expect(c.dataState).toBe("neutre")
        expect(c.title).toBe("Bienvenue dans Jokko")
        expect(c.ctaTone).toBe("primary")
        expect(c.eyebrow).toBe("Essai · jour 2 / 14")
        expect(c.dismissible).toBe(true)
    })

    it("progress rises as days fall", () => {
        const far = trialBannerContent({ expired: false, days: 12 }).progress
        const near = trialBannerContent({ expired: false, days: 2 }).progress
        expect(near).toBeGreaterThan(far)
    })
})
