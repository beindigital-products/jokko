import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
    // Auth: brute-force protection
    sendMessage: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 5 },

    // WhatsApp test messages
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
