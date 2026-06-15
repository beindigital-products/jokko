export const PRIVACY_CONSENT_VERSION = 1;
export const PRIVACY_CONSENT_STORAGE_KEY = "jokko.global.privacyConsent.v1";

export type PrivacyConsent = {
    version: typeof PRIVACY_CONSENT_VERSION;
    crashReporting: boolean;
    productAnalytics: boolean;
    decidedAt: string;
};

export type PrivacyConsentChoicePatch = Partial<
    Pick<PrivacyConsent, "crashReporting" | "productAnalytics">
>;

export function createDefaultPrivacyConsent(now: Date = new Date()): PrivacyConsent {
    return {
        version: PRIVACY_CONSENT_VERSION,
        crashReporting: true,
        productAnalytics: false,
        decidedAt: now.toISOString(),
    };
}

export function serializePrivacyConsent(consent: PrivacyConsent): string {
    return JSON.stringify(consent);
}

export function parsePrivacyConsent(raw: string | null | undefined): PrivacyConsent | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<PrivacyConsent>;
        if (
            parsed.version !== PRIVACY_CONSENT_VERSION ||
            typeof parsed.crashReporting !== "boolean" ||
            typeof parsed.productAnalytics !== "boolean" ||
            typeof parsed.decidedAt !== "string"
        ) {
            return null;
        }

        return {
            version: PRIVACY_CONSENT_VERSION,
            crashReporting: parsed.crashReporting,
            productAnalytics: parsed.productAnalytics,
            decidedAt: parsed.decidedAt,
        };
    } catch {
        return null;
    }
}

export function shouldShowPrivacyConsent(raw: string | null | undefined): boolean {
    return parsePrivacyConsent(raw) === null;
}

export function buildPrivacyConsentUpdate(
    current: PrivacyConsent | null | undefined,
    patch: PrivacyConsentChoicePatch,
    now: Date = new Date(),
): PrivacyConsent {
    const base = current ?? createDefaultPrivacyConsent(now);

    return {
        version: PRIVACY_CONSENT_VERSION,
        crashReporting: patch.crashReporting ?? base.crashReporting,
        productAnalytics: patch.productAnalytics ?? base.productAnalytics,
        decidedAt: now.toISOString(),
    };
}

export function revokePrivacyConsent(now: Date = new Date()): PrivacyConsent {
    return {
        version: PRIVACY_CONSENT_VERSION,
        crashReporting: false,
        productAnalytics: false,
        decidedAt: now.toISOString(),
    };
}
