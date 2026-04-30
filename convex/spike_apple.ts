"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";

const jwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL));

export const verifyAppleToken = action({
    args: {
        identityToken: v.string(),
        expectedAudience: v.optional(v.string()),
        expectedNonce: v.optional(v.string()),
    },
    returns: v.object({
        valid: v.boolean(),
        error: v.optional(v.string()),
        claims: v.optional(
            v.object({
                sub: v.string(),
                email: v.optional(v.string()),
                emailVerified: v.optional(v.boolean()),
                isPrivateEmail: v.optional(v.boolean()),
                nonce: v.optional(v.string()),
                authTime: v.optional(v.number()),
                iat: v.number(),
                exp: v.number(),
            })
        ),
    }),
    handler: async (_ctx, args) => {
        const audience = args.expectedAudience ?? process.env.APPLE_BUNDLE_ID;
        if (!audience) {
            return {
                valid: false,
                error: "APPLE_BUNDLE_ID env var not set (use pnpx convex env set APPLE_BUNDLE_ID com.jokko.spike)",
            };
        }

        try {
            const { payload } = await jwtVerify(args.identityToken, jwks, {
                issuer: APPLE_ISSUER,
                audience,
            });

            if (args.expectedNonce && payload.nonce !== args.expectedNonce) {
                return { valid: false, error: "Nonce mismatch" };
            }

            const sub = payload.sub;
            if (!sub) {
                return { valid: false, error: "Missing sub claim" };
            }

            return {
                valid: true,
                claims: {
                    sub,
                    email: typeof payload.email === "string" ? payload.email : undefined,
                    emailVerified:
                        typeof payload.email_verified === "boolean"
                            ? payload.email_verified
                            : payload.email_verified === "true",
                    isPrivateEmail:
                        typeof payload.is_private_email === "boolean"
                            ? payload.is_private_email
                            : payload.is_private_email === "true",
                    nonce: typeof payload.nonce === "string" ? payload.nonce : undefined,
                    authTime:
                        typeof payload.auth_time === "number" ? payload.auth_time : undefined,
                    iat: payload.iat ?? 0,
                    exp: payload.exp ?? 0,
                },
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown JWT error";
            return { valid: false, error: message };
        }
    },
});
