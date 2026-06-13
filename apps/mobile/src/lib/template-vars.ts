/**
 * Pure helpers for WhatsApp template bodies — parsing the `{{n}}` placeholders
 * so the template detail screen can highlight them and list the variables.
 * Kept framework-free so it's unit-testable without React Native.
 */

/** Unique, ascending list of placeholder indices found in a template body. */
export function parseTokens(body: string): number[] {
    const found = new Set<number>();
    for (const m of body.matchAll(/\{\{\s*(\d+)\s*\}\}/g)) {
        const n = Number(m[1]);
        if (Number.isFinite(n)) found.add(n);
    }
    return [...found].sort((a, b) => a - b);
}

export type BodySegment = { text: string; token: number | null };

/**
 * Split a body into ordered segments: literal text and `{{n}}` placeholders.
 * Empty fragments (between adjacent tokens) are dropped.
 */
export function splitTemplateBody(body: string): BodySegment[] {
    if (!body) return [];
    return body
        .split(/(\{\{\s*\d+\s*\}\})/g)
        .filter((part) => part !== "")
        .map((part) => {
            const m = part.match(/\{\{\s*(\d+)\s*\}\}/);
            return m ? { text: part, token: Number(m[1]) } : { text: part, token: null };
        });
}

/** Label shown for a placeholder: its example value if known, else `{{n}}`. */
export function tokenLabel(token: number, examples?: string[]): string {
    return examples?.[token - 1] ?? `{{${token}}}`;
}
