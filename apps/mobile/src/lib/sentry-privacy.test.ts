import { describe, expect, it } from "vitest";
import { buildSentryPrivacyConfig } from "./sentry-privacy";

describe("Spike S6 — Sentry privacy config", () => {
    it("disables default PII and wires beforeSend scrubber", () => {
        const config = buildSentryPrivacyConfig({
            dsn: "https://public@example.ingest.sentry.io/1",
            environment: "test",
            release: "1.0.0",
        });

        expect(config.enabled).toBe(true);
        expect(config.sendDefaultPii).toBe(false);
        expect(config.environment).toBe("test");
        expect(config.release).toBe("1.0.0");

        const scrubbed = config.beforeSend({
            user: { email: "client@example.com", id: "user_123" },
            message: "Failed to send to +33 6 12 34 56 78",
        });

        expect(scrubbed?.user?.email).toBeUndefined();
        expect(scrubbed?.user?.id).toBe("user_123");
        expect(scrubbed?.message).toBe("Failed to send to [REDACTED]");
    });

    it("keeps Sentry disabled by default without a DSN", () => {
        const config = buildSentryPrivacyConfig();
        expect(config.enabled).toBe(false);
        expect(config.tracesSampleRate).toBe(0.05);
    });

    it("scrubs breadcrumbs before Sentry stores them", () => {
        const config = buildSentryPrivacyConfig({ enabled: true });

        const breadcrumb = config.beforeBreadcrumb({
            category: "console",
            message: "Opened conversation with client@example.com",
            data: { body: "Private WhatsApp message" },
        });

        expect(breadcrumb?.message).toBe("Opened conversation with [REDACTED]");
        expect(breadcrumb?.data?.body).toBe("[REDACTED]");
    });
});
