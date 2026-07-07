import { describe, it, expect } from "vitest";
import { planFeatureAllowed } from "./lib/planFeatures";

/**
 * planFeatureAllowed is the boolean gate used by getRoutingContext to decide
 * whether the auto-assignment action may call OpenAI. It must mirror the paid-
 * access rule (trial unlocks all; post-trial requires a chosen plan + active
 * Stripe sub, ENTERPRISE exempt) and the per-feature minimum plan.
 */
const NOW = 1_700_000_000_000;
const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
const afterTrial = NOW - TRIAL_MS - 1;

describe("planFeatureAllowed — gate IA (auto-assignation)", () => {
    it("déverrouille l'IA pendant l'essai, même en FREE", () => {
        expect(planFeatureAllowed({ plan: "FREE", createdAt: NOW - 1000 }, "ai", NOW)).toBe(true);
    });

    it("verrouille l'IA pour FREE une fois l'essai terminé", () => {
        expect(planFeatureAllowed({ plan: "FREE", createdAt: afterTrial }, "ai", NOW)).toBe(false);
    });

    it("verrouille l'IA pour BUSINESS (réservée PRO+) même abonné", () => {
        expect(planFeatureAllowed(
            { plan: "BUSINESS", hasSelectedPlan: true, stripeStatus: "active", createdAt: afterTrial },
            "ai", NOW,
        )).toBe(false);
    });

    it("autorise l'IA pour PRO avec abonnement Stripe actif", () => {
        expect(planFeatureAllowed(
            { plan: "PRO", hasSelectedPlan: true, stripeStatus: "active", createdAt: afterTrial },
            "ai", NOW,
        )).toBe(true);
    });

    it("verrouille PRO si l'essai est fini et aucun abonnement actif", () => {
        expect(planFeatureAllowed(
            { plan: "PRO", hasSelectedPlan: true, createdAt: afterTrial },
            "ai", NOW,
        )).toBe(false);
    });

    it("autorise ENTERPRISE (accès payant manuel, sans Stripe)", () => {
        expect(planFeatureAllowed(
            { plan: "ENTERPRISE", hasSelectedPlan: true, createdAt: afterTrial },
            "ai", NOW,
        )).toBe(true);
    });
});
