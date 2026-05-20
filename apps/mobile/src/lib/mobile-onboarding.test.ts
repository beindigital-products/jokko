import { describe, expect, it } from "vitest";
import {
    buildOrganizationSlug,
    buildWhatsAppConnectUrl,
    canContinueMobileOnboarding,
    getInitialStepForArrival,
    getMobileOnboardingProgress,
    getNextMobileOnboardingStep,
    getPreviousMobileOnboardingStep,
    type MobileBusinessProfile,
} from "./mobile-onboarding";

const validProfile: MobileBusinessProfile = {
    businessName: "Maison Dakar",
    sector: "Retail",
    locale: "fr",
    timezone: "Europe/Paris",
};

describe("mobile onboarding helpers", () => {
    it("builds a URL-safe organization slug", () => {
        expect(buildOrganizationSlug("Café de l'Étoile !")).toBe("cafe-de-l-etoile");
        expect(buildOrganizationSlug("  Jokko   Support  ")).toBe("jokko-support");
    });

    it("blocks business step until core profile fields are valid", () => {
        expect(
            canContinueMobileOnboarding("business", {
                ...validProfile,
                businessName: "A",
            })
        ).toBe(false);
        expect(canContinueMobileOnboarding("business", validProfile)).toBe(true);
    });

    it("skips business creation for invited users", () => {
        expect(getInitialStepForArrival("invite")).toBe("permissions");
        expect(getPreviousMobileOnboardingStep("permissions", "invite")).toBeNull();
        expect(getNextMobileOnboardingStep("permissions", "invite")).toBe("done");
    });

    it("walks through new workspace steps in order", () => {
        expect(getInitialStepForArrival("new-workspace")).toBe("business");
        expect(getNextMobileOnboardingStep("business")).toBe("whatsapp");
        expect(getNextMobileOnboardingStep("whatsapp")).toBe("permissions");
        expect(getPreviousMobileOnboardingStep("permissions")).toBe("whatsapp");
    });

    it("computes progress by step", () => {
        expect(getMobileOnboardingProgress("business")).toBe(25);
        expect(getMobileOnboardingProgress("done")).toBe(100);
    });

    it("builds the WhatsApp web configuration URL", () => {
        expect(buildWhatsAppConnectUrl({ workspaceSlug: "maison-dakar" })).toBe(
            "https://app.jokko.io/dashboard/settings?tab=whatsapp&source=mobile_onboarding&workspace=maison-dakar"
        );
        expect(buildWhatsAppConnectUrl({ baseUrl: "https://acme.jokko.co/" })).toBe(
            "https://acme.jokko.co/dashboard/settings?tab=whatsapp&source=mobile_onboarding"
        );
    });
});
