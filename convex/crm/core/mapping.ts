/**
 * E.164 phone normalization. Condition P0 C3.
 * No silent fallback. Pure functions, no Convex imports.
 */

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export type NormalizeReason = "empty" | "unparseable" | "invalid" | "no_country";

export type NormalizeResult =
    | {
        ok: true;
        e164: string;
        countryCode: CountryCode;
        nationalNumber: string;
    }
    | { ok: false; reason: NormalizeReason };

export function normalizeToE164(
    input: string | undefined | null,
    defaultCountry?: CountryCode
): NormalizeResult {
    if (!input || typeof input !== "string") {
        return { ok: false, reason: "empty" };
    }
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return { ok: false, reason: "empty" };
    }

    const hasPlus = trimmed.startsWith("+");
    const parsed = parsePhoneNumberFromString(
        trimmed,
        hasPlus ? undefined : defaultCountry
    );

    if (!parsed) {
        if (!hasPlus && !defaultCountry) {
            return { ok: false, reason: "no_country" };
        }
        return { ok: false, reason: "unparseable" };
    }

    if (!parsed.isValid()) {
        return { ok: false, reason: "invalid" };
    }

    return {
        ok: true,
        e164: parsed.number,
        countryCode: parsed.country as CountryCode,
        nationalNumber: parsed.nationalNumber,
    };
}

export function selectBestPhone(
    phones: Array<{ raw: string; type?: string }>,
    defaultCountry?: CountryCode
): NormalizeResult & { rawIndex?: number } {
    if (!phones || phones.length === 0) return { ok: false, reason: "empty" };

    const priority = (t?: string): number => {
        const lower = (t || "").toLowerCase();
        if (lower.includes("mobile") || lower.includes("cell")) return 0;
        if (lower.includes("whatsapp")) return 1;
        if (lower === "" || lower === "primary") return 2;
        return 3;
    };

    const sorted = phones
        .map((p, i) => ({ p, i }))
        .sort((a, b) => priority(a.p.type) - priority(b.p.type));

    for (const { p, i } of sorted) {
        const r = normalizeToE164(p.raw, defaultCountry);
        if (r.ok) return { ...r, rawIndex: i };
    }

    return { ok: false, reason: "invalid" };
}

export function fullNameFrom(parts: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
}): string {
    if (parts.fullName && parts.fullName.trim()) return parts.fullName.trim();
    const joined = [parts.firstName, parts.lastName].filter(Boolean).join(" ").trim();
    return joined || "Contact";
}

// ── Per-connection field mapping ────────────────────────────────────────────

/** Which remote CRM property feeds each Jokko field (adapter-agnostic). */
export interface FieldMapping {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    /** Remote property holding tags (array, or a comma/semicolon-separated string). */
    tags?: string;
}

export interface MappedIdentity {
    firstName?: string;
    lastName?: string;
    emails: string[];
    phones: Array<{ raw: string; type?: string }>;
    /** Parsed tag names from the mapped tags property (undefined if not mapped). */
    tags?: string[];
}

/** Parse a remote tags value (array or comma/semicolon-separated string) into clean names. */
export function parseTagList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === "string") {
        return value
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }
    return [];
}

/**
 * Overlays a connection's field mapping on an adapter's default identity fields.
 * For each mapped key, reads that property off the raw remote record (as a
 * non-empty string) and overrides the default; unmapped keys keep the default.
 * No mapping → returns the defaults untouched (zero behavior change). Shared by
 * every CRM adapter so mapping behaves identically across providers.
 */
export function mappedIdentity(
    raw: unknown,
    mapping: FieldMapping | undefined,
    defaults: MappedIdentity,
): MappedIdentity {
    const m = mapping ?? {};
    if (!m.firstName && !m.lastName && !m.email && !m.phone && !m.tags) return defaults;

    const rec = (raw ?? {}) as Record<string, unknown>;
    const str = (k?: string): string | undefined => {
        if (!k) return undefined;
        const v = rec[k];
        return typeof v === "string" && v.trim().length > 0 ? v : undefined;
    };

    return {
        firstName: m.firstName ? str(m.firstName) : defaults.firstName,
        lastName: m.lastName ? str(m.lastName) : defaults.lastName,
        emails: m.email ? (str(m.email) ? [str(m.email)!] : []) : defaults.emails,
        phones: m.phone ? (str(m.phone) ? [{ raw: str(m.phone)!, type: "primary" }] : []) : defaults.phones,
        tags: m.tags ? parseTagList(rec[m.tags]) : defaults.tags,
    };
}
