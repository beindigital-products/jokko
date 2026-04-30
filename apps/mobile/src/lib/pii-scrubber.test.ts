import { describe, it, expect } from "vitest";
import { scrubPii, scrubString, type SentryEvent } from "./pii-scrubber";

describe("Spike S6 — PII scrubber", () => {
    describe("scrubString", () => {
        it("redacts email addresses", () => {
            expect(scrubString("Contact user@example.com for help")).toBe(
                "Contact [REDACTED] for help"
            );
        });

        it("redacts multiple emails in one string", () => {
            expect(scrubString("From: a@b.com To: c@d.org")).toBe(
                "From: [REDACTED] To: [REDACTED]"
            );
        });

        it("redacts international phone numbers", () => {
            expect(scrubString("Call +33 6 12 34 56 78")).toBe("Call [REDACTED]");
        });

        it("redacts local FR phone numbers", () => {
            expect(scrubString("Tel: 06 12 34 56 78")).toBe("Tel: [REDACTED]");
        });

        it("redacts phone with dashes", () => {
            expect(scrubString("Phone: +221-77-123-4567")).toBe("Phone: [REDACTED]");
        });

        it("does not redact short number sequences (< 7 digits)", () => {
            expect(scrubString("Error code 42")).toBe("Error code 42");
        });

        it("redacts WhatsApp message IDs (wamid)", () => {
            expect(
                scrubString("Message wamid.ABGGFlA5FPAzA0Y0Z0RGQSA= delivered")
            ).toBe("Message [REDACTED] delivered");
        });

        it("preserves strings with no PII", () => {
            expect(scrubString("Hello world")).toBe("Hello world");
        });

        it("handles privaterelay Apple emails", () => {
            expect(
                scrubString("User abc123@privaterelay.appleid.com signed in")
            ).toBe("User [REDACTED] signed in");
        });
    });

    describe("scrubPii (Sentry beforeSend)", () => {
        it("strips user.email, user.username, user.ip_address but keeps user.id", () => {
            const event: SentryEvent = {
                user: {
                    id: "user_123",
                    email: "user@example.com",
                    username: "John Doe",
                    ip_address: "192.168.1.1",
                },
            };

            const result = scrubPii(event);

            expect(result.user?.id).toBe("user_123");
            expect(result.user?.email).toBeUndefined();
            expect(result.user?.username).toBeUndefined();
            expect(result.user?.ip_address).toBeUndefined();
        });

        it("redacts request.data string entirely", () => {
            const event: SentryEvent = {
                request: {
                    data: '{"text":"Bonjour, mon email est a@b.com","phone":"+33612345678"}',
                },
            };

            const result = scrubPii(event);
            expect(result.request?.data).toBe("[REDACTED]");
        });

        it("scrubs request.data object deeply", () => {
            const event: SentryEvent = {
                request: {
                    data: {
                        body: "Le client a demandé un devis",
                        metadata: { email: "client@corp.com" },
                    },
                },
            };

            const result = scrubPii(event);
            const data = result.request?.data as Record<string, unknown>;
            expect(data.body).toBe("[REDACTED]");
            const metadata = data.metadata as Record<string, unknown>;
            expect(metadata.email).toBe("[REDACTED]");
        });

        it("redacts authorization and cookie headers", () => {
            const event: SentryEvent = {
                request: {
                    headers: {
                        Authorization: "Bearer eyJhbGci...",
                        Cookie: "session=abc123",
                        "Content-Type": "application/json",
                        "X-Api-Key": "sk-live-12345",
                    },
                },
            };

            const result = scrubPii(event);
            expect(result.request?.headers?.Authorization).toBe("[REDACTED]");
            expect(result.request?.headers?.Cookie).toBe("[REDACTED]");
            expect(result.request?.headers?.["X-Api-Key"]).toBe("[REDACTED]");
            expect(result.request?.headers?.["Content-Type"]).toBe(
                "application/json"
            );
        });

        it("scrubs emails from breadcrumb messages", () => {
            const event: SentryEvent = {
                breadcrumbs: [
                    {
                        category: "console",
                        message: "User logged in: admin@jokko.io",
                    },
                    {
                        category: "http",
                        message: "POST /api/contacts",
                        data: { phone: "+221 77 123 45 67" },
                    },
                ],
            };

            const result = scrubPii(event);
            expect(result.breadcrumbs?.[0]?.message).toBe(
                "User logged in: [REDACTED]"
            );
            expect(
                (result.breadcrumbs?.[1]?.data as Record<string, unknown>)?.phone
            ).toBe("[REDACTED]");
        });

        it("scrubs exception values containing PII", () => {
            const event: SentryEvent = {
                exception: {
                    values: [
                        {
                            value: "Error sending to user@test.com: connection refused",
                        },
                    ],
                },
            };

            const result = scrubPii(event);
            expect(result.exception?.values?.[0]?.value).toBe(
                "Error sending to [REDACTED]: connection refused"
            );
        });

        it("scrubs extra fields with sensitive keys (password, secret, token)", () => {
            const event: SentryEvent = {
                extra: {
                    user_password: "hunter2",
                    api_secret: "sk-prod-abc",
                    auth_token: "eyJhbGci...",
                    debug_info: "Normal debug text",
                },
            };

            const result = scrubPii(event);
            expect(result.extra?.user_password).toBe("[REDACTED]");
            expect(result.extra?.api_secret).toBe("[REDACTED]");
            expect(result.extra?.auth_token).toBe("[REDACTED]");
            expect(result.extra?.debug_info).toBe("Normal debug text");
        });

        it("scrubs message body keys (body, text, content, message_body)", () => {
            const event: SentryEvent = {
                extra: {
                    text: "Conversation privée du client",
                    content: "Détails de la commande #123",
                    message_body: "WhatsApp message privé",
                    status: "delivered",
                },
            };

            const result = scrubPii(event);
            expect(result.extra?.text).toBe("[REDACTED]");
            expect(result.extra?.content).toBe("[REDACTED]");
            expect(result.extra?.message_body).toBe("[REDACTED]");
            expect(result.extra?.status).toBe("delivered");
        });

        it("handles empty event gracefully", () => {
            const event: SentryEvent = {};
            const result = scrubPii(event);
            expect(result).toEqual({});
        });

        it("handles event with null/undefined fields gracefully", () => {
            const event: SentryEvent = {
                user: undefined,
                request: undefined,
                breadcrumbs: undefined,
                extra: undefined,
            };
            const result = scrubPii(event);
            expect(result.user).toBeUndefined();
        });

        it("full realistic Sentry event — no PII leak", () => {
            const event: SentryEvent = {
                user: {
                    id: "user_abc",
                    email: "sophie@monentreprise.fr",
                    username: "Sophie Durand",
                    ip_address: "78.31.42.100",
                },
                request: {
                    url: "https://befitting-hornet-738.convex.cloud/api/messages.send",
                    headers: {
                        Authorization: "Bearer eyJhbGciOiJSUzI1NiJ9...",
                        "Content-Type": "application/json",
                    },
                    data: {
                        text: "Bonjour, votre commande est prête. Contactez-moi au 06 12 34 56 78",
                        conversationId: "conv_123",
                    },
                },
                breadcrumbs: [
                    {
                        category: "navigation",
                        message: "Opened conversation with client@corp.com",
                    },
                    {
                        category: "console",
                        message: "Sending message to +221 77 456 78 90",
                        data: { body: "Message privé du client" },
                    },
                ],
                extra: {
                    orgId: "org_456",
                    token: "secret_session_token",
                    lastError: "Timeout calling sophie@jokko.io",
                },
                exception: {
                    values: [
                        {
                            value: "NetworkError: failed to reach user@example.com at +33612345678",
                        },
                    ],
                },
            };

            const result = scrubPii(event);

            expect(result.user?.email).toBeUndefined();
            expect(result.user?.username).toBeUndefined();
            expect(result.user?.ip_address).toBeUndefined();
            expect(result.user?.id).toBe("user_abc");

            expect(result.request?.headers?.Authorization).toBe("[REDACTED]");
            const data = result.request?.data as Record<string, unknown>;
            expect(data.text).toBe("[REDACTED]");
            expect(data.conversationId).toBe("conv_123");

            expect(result.breadcrumbs?.[0]?.message).not.toContain("client@corp.com");
            expect(result.breadcrumbs?.[1]?.message).not.toContain("+221");
            expect(
                (result.breadcrumbs?.[1]?.data as Record<string, unknown>)?.body
            ).toBe("[REDACTED]");

            expect(result.extra?.token).toBe("[REDACTED]");
            expect(result.extra?.lastError).not.toContain("sophie@jokko.io");
            expect(result.extra?.orgId).toBe("org_456");

            expect(result.exception?.values?.[0]?.value).not.toContain(
                "user@example.com"
            );
            expect(result.exception?.values?.[0]?.value).not.toContain(
                "+33612345678"
            );
        });
    });
});
