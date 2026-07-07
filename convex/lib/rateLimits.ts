import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

// NOTE — outbound WhatsApp message throttling is NOT done with a per-message
// token bucket here: that would fight the broadcast sender (chunks of 50).
// Real outbound throttling lives in the send path itself — broadcasts use an
// inter-chunk delay (CHUNK_DELAY_MS) and the automation engine is bounded by
// MAX_STEPS per inbound message. This limiter only guards discrete user-driven
// endpoints below.
export const rateLimiter = new RateLimiter(components.rateLimiter, {
    // WhatsApp "send test message" button (per channel/org) — anti-abuse.
    sendTestMessage: { kind: "token bucket", rate: 5, period: MINUTE, capacity: 2 },

    // Checkout sessions
    createCheckout: { kind: "fixed window", rate: 5, period: HOUR },

    // Organization creation
    createOrganization: { kind: "fixed window", rate: 5, period: HOUR },

    // File uploads
    uploadFile: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },

    // WhatsApp channel operations
    whatsappConnect: { kind: "fixed window", rate: 10, period: HOUR },

    // Public marketing mutations (unauthenticated, keyed by email/user) —
    // abuse/spam protection on waiting-list, newsletter, and support tickets.
    waitingListJoin: { kind: "fixed window", rate: 5, period: HOUR },
    newsletterSubscribe: { kind: "fixed window", rate: 5, period: HOUR },
    createTicket: { kind: "fixed window", rate: 10, period: HOUR },
});

/**
 * Minimal RFC-5322-ish email format check + length bound. Used by public
 * marketing mutations to reject obviously malformed / oversized input before
 * it ever hits the database. NOT a deliverability check.
 */
export function isValidEmail(email: string): boolean {
    if (typeof email !== "string") return false;
    if (email.length < 3 || email.length > 254) return false;
    // Single @, non-empty local part, domain with a dot, no whitespace.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
