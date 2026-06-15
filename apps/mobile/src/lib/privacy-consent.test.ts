import { describe, expect, it } from "vitest";
import {
    buildPrivacyConsentUpdate,
    createDefaultPrivacyConsent,
    parsePrivacyConsent,
    revokePrivacyConsent,
    serializePrivacyConsent,
    shouldShowPrivacyConsent,
} from "./privacy-consent";

describe("privacy consent", () => {
    it("defaults crash reporting on and product analytics off", () => {
        const consent = createDefaultPrivacyConsent(new Date("2026-05-01T00:00:00.000Z"));
        expect(consent).toMatchObject({
            version: 1,
            crashReporting: true,
            productAnalytics: false,
            decidedAt: "2026-05-01T00:00:00.000Z",
        });
    });

    it("roundtrips valid consent", () => {
        const consent = createDefaultPrivacyConsent();
        expect(parsePrivacyConsent(serializePrivacyConsent(consent))).toEqual(consent);
    });

    it("shows the modal when consent is absent or stale", () => {
        expect(shouldShowPrivacyConsent(null)).toBe(true);
        expect(shouldShowPrivacyConsent("{\"version\":0}")).toBe(true);
        expect(shouldShowPrivacyConsent(serializePrivacyConsent(createDefaultPrivacyConsent()))).toBe(false);
    });

    it("updates only selected choices and refreshes the decision date", () => {
        const current = createDefaultPrivacyConsent(new Date("2026-05-01T00:00:00.000Z"));
        const updated = buildPrivacyConsentUpdate(
            current,
            { productAnalytics: true },
            new Date("2026-05-02T12:00:00.000Z"),
        );

        expect(updated).toEqual({
            version: 1,
            crashReporting: true,
            productAnalytics: true,
            decidedAt: "2026-05-02T12:00:00.000Z",
        });
    });

    it("revokes optional diagnostics and analytics without deleting the decision", () => {
        expect(revokePrivacyConsent(new Date("2026-05-03T08:30:00.000Z"))).toEqual({
            version: 1,
            crashReporting: false,
            productAnalytics: false,
            decidedAt: "2026-05-03T08:30:00.000Z",
        });
    });
});
