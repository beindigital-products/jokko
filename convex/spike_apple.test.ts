import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("Spike S1 — Apple identityToken verification", () => {
    let t: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
    });

    it("returns valid:false with explicit error when APPLE_BUNDLE_ID env var is missing", async () => {
        const original = process.env.APPLE_BUNDLE_ID;
        delete process.env.APPLE_BUNDLE_ID;
        try {
            const result = await t.action(api.spike_apple.verifyAppleToken, {
                identityToken: "fake.token.value",
            });
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/APPLE_BUNDLE_ID/);
        } finally {
            if (original) process.env.APPLE_BUNDLE_ID = original;
        }
    });

    it("returns valid:false on a malformed JWT (not 3 segments)", async () => {
        const result = await t.action(api.spike_apple.verifyAppleToken, {
            identityToken: "not-a-jwt",
            expectedAudience: "com.jokko.spike",
        });
        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
    });

    it("returns valid:false on a syntactically valid but unsigned JWT", async () => {
        const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "fake" })).toString(
            "base64url"
        );
        const payload = Buffer.from(
            JSON.stringify({
                iss: "https://appleid.apple.com",
                aud: "com.jokko.spike",
                sub: "001234.deadbeef.5678",
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000),
                email: "test@privaterelay.appleid.com",
            })
        ).toString("base64url");
        const fakeSignature = "fakesignature";
        const fakeToken = `${header}.${payload}.${fakeSignature}`;

        const result = await t.action(api.spike_apple.verifyAppleToken, {
            identityToken: fakeToken,
            expectedAudience: "com.jokko.spike",
        });
        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
    });

    it("rejects token with wrong audience even if signature were valid (claim check)", async () => {
        const header = Buffer.from(JSON.stringify({ alg: "RS256", kid: "fake" })).toString(
            "base64url"
        );
        const payload = Buffer.from(
            JSON.stringify({
                iss: "https://appleid.apple.com",
                aud: "com.evil.app",
                sub: "001234.deadbeef.5678",
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000),
            })
        ).toString("base64url");
        const fakeToken = `${header}.${payload}.sig`;

        const result = await t.action(api.spike_apple.verifyAppleToken, {
            identityToken: fakeToken,
            expectedAudience: "com.jokko.spike",
        });
        expect(result.valid).toBe(false);
    });
});
