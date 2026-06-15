// @vitest-environment node
/**
 * Tests for the HubSpot adapter — webhook signature verification and event parsing.
 */

import { describe, it, expect } from "vitest";
import { parseWebhookEvent, verifyWebhookSignature, toUnifiedContact } from "./rest";

async function signV3(secret: string, base: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base));
    const bytes = new Uint8Array(sig);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}

describe("verifyWebhookSignature", () => {
    const secret = "shh_hubspot_secret";
    const rawBody = '[{"eventId":42,"subscriptionType":"contact.creation","objectId":100,"portalId":1,"occurredAt":1700000000000}]';

    it("returns false when signature header is missing", async () => {
        const ok = await verifyWebhookSignature({
            rawBody,
            headers: { "x-hubspot-request-timestamp": String(Date.now()) },
            secret,
        });
        expect(ok).toBe(false);
    });

    it("returns false when timestamp is stale (>5 min)", async () => {
        const timestamp = String(Date.now() - 10 * 60 * 1000);
        const ok = await verifyWebhookSignature({
            rawBody,
            headers: {
                "x-hubspot-signature-v3": "deadbeef",
                "x-hubspot-request-timestamp": timestamp,
            },
            secret,
        });
        expect(ok).toBe(false);
    });

    it("accepts a valid signature with correct base string", async () => {
        const timestamp = String(Date.now());
        const uri = "https://example.com/webhooks/crm/hubspot";
        const base = `POST${uri}${rawBody}${timestamp}`;
        const sig = await signV3(secret, base);
        const ok = await verifyWebhookSignature({
            rawBody,
            headers: {
                "x-hubspot-signature-v3": sig,
                "x-hubspot-request-timestamp": timestamp,
                host: "example.com",
                "x-forwarded-proto": "https",
            },
            secret,
        });
        expect(ok).toBe(true);
    });

    it("rejects tampered body with same signature", async () => {
        const timestamp = String(Date.now());
        const uri = "https://example.com/webhooks/crm/hubspot";
        const base = `POST${uri}${rawBody}${timestamp}`;
        const sig = await signV3(secret, base);
        const ok = await verifyWebhookSignature({
            rawBody: rawBody.replace("42", "43"),
            headers: {
                "x-hubspot-signature-v3": sig,
                "x-hubspot-request-timestamp": timestamp,
                host: "example.com",
                "x-forwarded-proto": "https",
            },
            secret,
        });
        expect(ok).toBe(false);
    });
});

describe("parseWebhookEvent", () => {
    it("returns empty array for invalid JSON", async () => {
        const out = await parseWebhookEvent({ rawBody: "not json", headers: {} });
        expect(out).toEqual([]);
    });

    it("parses contact creation event with stable eventKey", async () => {
        const raw = JSON.stringify([
            {
                eventId: 999,
                subscriptionType: "contact.creation",
                objectId: 100,
                portalId: 7,
                occurredAt: 1700000000000,
            },
        ]);
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out).toHaveLength(1);
        expect(out[0].eventKey).toBe("hubspot:999");
        expect(out[0].entityType).toBe("contact");
        expect(out[0].entityExternalId).toBe("100");
        expect(out[0].remoteAccountId).toBe("7");
    });

    it("falls back to composite eventKey when eventId is missing", async () => {
        const raw = JSON.stringify([
            {
                subscriptionType: "deal.propertyChange",
                objectId: 50,
                portalId: 7,
                occurredAt: 1700000001000,
            },
        ]);
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out[0].eventKey).toBe("hubspot:deal.propertyChange:50:1700000001000");
        expect(out[0].entityType).toBe("deal");
    });

    it("flags unknown subscriptionType as entityType=unknown", async () => {
        const raw = JSON.stringify([
            { eventId: 1, subscriptionType: "ticket.creation", objectId: 1, portalId: 1 },
        ]);
        const out = await parseWebhookEvent({ rawBody: raw, headers: {} });
        expect(out[0].entityType).toBe("unknown");
    });
});

describe("toUnifiedContact field mapping", () => {
    const raw = {
        id: "42",
        properties: {
            firstname: "Awa",
            lastname: "Diop",
            email: "awa@perso.com",
            work_email: "awa@work.com",
            phone: "+221770000000",
            mobilephone: "+221780000000",
            custom_phone: "+221760000000",
        } as Record<string, string | null>,
    };

    it("uses HubSpot defaults when no mapping is given", () => {
        const c = toUnifiedContact(raw);
        expect(c.firstName).toBe("Awa");
        expect(c.emails).toEqual(["awa@perso.com", "awa@work.com"]);
        expect(c.phones.map((p) => p.raw)).toEqual(["+221770000000", "+221780000000"]);
    });

    it("honors a custom mapping for email + phone source properties", () => {
        const c = toUnifiedContact(raw, { email: "work_email", phone: "custom_phone" });
        expect(c.emails).toEqual(["awa@work.com"]);
        expect(c.phones.map((p) => p.raw)).toEqual(["+221760000000"]);
        // unmapped fields keep their defaults
        expect(c.firstName).toBe("Awa");
        expect(c.lastName).toBe("Diop");
    });

    it("falls back to default when a mapped property is absent on the record", () => {
        const c = toUnifiedContact(raw, { firstName: "given_name" });
        // given_name doesn't exist → undefined (no crash)
        expect(c.firstName).toBeUndefined();
    });
});
