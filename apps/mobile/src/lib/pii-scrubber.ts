/**
 * Spike S6 — PII scrubbing for Sentry events.
 *
 * Strips personally identifiable information from Sentry events BEFORE they
 * leave the device. Critical for RGPD compliance (Decision #55, #68).
 *
 * This module exports a `beforeSend` handler that can be passed directly to
 * `Sentry.init({ beforeSend: scrubPii })`.
 *
 * Patterns scrubbed:
 * - Email addresses (RFC 5322 simplified)
 * - Phone numbers (international + local FR formats)
 * - WhatsApp message bodies (in request data, breadcrumbs, extra)
 * - User PII fields (email, username, ip_address)
 * - Authorization headers
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,4}[\s\-.]?)?(\(?\d{1,4}\)?[\s\-.]?){2,5}\d{2,4}/g;
const WHATSAPP_ID_REGEX = /wamid\.[A-Za-z0-9+/=]+/g;

const PII_PLACEHOLDER = "[REDACTED]";

export interface SentryEvent {
    user?: {
        email?: string;
        username?: string;
        ip_address?: string;
        id?: string;
        [key: string]: unknown;
    };
    request?: {
        data?: string | Record<string, unknown>;
        headers?: Record<string, string>;
        url?: string;
        [key: string]: unknown;
    };
    breadcrumbs?: SentryBreadcrumb[];
    extra?: Record<string, unknown>;
    tags?: Record<string, string>;
    message?: string | { formatted?: string };
    contexts?: Record<string, unknown>;
    exception?: {
        values?: Array<{
            value?: string;
            [key: string]: unknown;
        }>;
    };
}

export interface SentryBreadcrumb {
    message?: string;
    data?: Record<string, unknown>;
    category?: string;
    [key: string]: unknown;
}

export function scrubString(input: string): string {
    return input
        .replace(EMAIL_REGEX, PII_PLACEHOLDER)
        .replace(PHONE_REGEX, (match) => {
            const digits = match.replace(/\D/g, "");
            if (digits.length >= 7) return PII_PLACEHOLDER;
            return match;
        })
        .replace(WHATSAPP_ID_REGEX, PII_PLACEHOLDER);
}

function isSensitiveKey(key: string): boolean {
    const keyLower = key.toLowerCase();
    return (
        keyLower.includes("password") ||
        keyLower.includes("secret") ||
        keyLower.includes("token") ||
        keyLower.includes("authorization") ||
        keyLower.includes("cookie") ||
        keyLower.includes("apikey") ||
        keyLower.includes("api_key") ||
        keyLower === "body" ||
        keyLower === "text" ||
        keyLower === "message_body" ||
        keyLower === "messagebody" ||
        keyLower === "content"
    );
}

function scrubValue(key: string, value: unknown): unknown {
    if (isSensitiveKey(key)) {
        return PII_PLACEHOLDER;
    }

    if (typeof value === "string") {
        return scrubString(value);
    }

    if (Array.isArray(value)) {
        return value.map((item) => scrubValue(key, item));
    }

    if (value && typeof value === "object") {
        return scrubRecord(value as Record<string, unknown>);
    }

    return value;
}

function scrubRecord(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = scrubValue(key, value);
    }
    return result;
}

export function scrubBreadcrumb(crumb: SentryBreadcrumb | null): SentryBreadcrumb | null {
    if (!crumb) return crumb;

    if (crumb.message) {
        crumb.message = scrubString(crumb.message);
    }

    if (crumb.data && typeof crumb.data === "object") {
        crumb.data = scrubRecord(crumb.data) as Record<string, unknown>;
    }

    return crumb;
}

export function scrubPii(event: SentryEvent): SentryEvent {
    if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
    }

    if (event.request) {
        if (event.request.url) {
            event.request.url = scrubString(event.request.url);
        }

        if (typeof event.request.data === "string") {
            event.request.data = PII_PLACEHOLDER;
        } else if (event.request.data && typeof event.request.data === "object") {
            event.request.data = scrubRecord(event.request.data);
        }

        if (event.request.headers) {
            const scrubbed: Record<string, string> = {};
            for (const [key, value] of Object.entries(event.request.headers)) {
                const keyLower = key.toLowerCase();
                if (
                    keyLower === "authorization" ||
                    keyLower === "cookie" ||
                    keyLower === "x-api-key"
                ) {
                    scrubbed[key] = PII_PLACEHOLDER;
                } else {
                    scrubbed[key] = scrubString(value);
                }
            }
            event.request.headers = scrubbed;
        }
    }

    if (event.breadcrumbs) {
        for (const crumb of event.breadcrumbs) {
            scrubBreadcrumb(crumb);
        }
    }

    if (event.extra && typeof event.extra === "object") {
        event.extra = scrubRecord(event.extra);
    }

    if (event.tags && typeof event.tags === "object") {
        event.tags = scrubRecord(event.tags) as Record<string, string>;
    }

    if (event.contexts && typeof event.contexts === "object") {
        event.contexts = scrubRecord(event.contexts);
    }

    if (typeof event.message === "string") {
        event.message = scrubString(event.message);
    } else if (event.message?.formatted) {
        event.message.formatted = scrubString(event.message.formatted);
    }

    if (event.exception?.values) {
        for (const exc of event.exception.values) {
            if (exc.value) {
                exc.value = scrubString(exc.value);
            }
        }
    }

    return event;
}
