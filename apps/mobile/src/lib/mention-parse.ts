/**
 * Pure helpers for the @mention autocomplete in internal notes. Framework-free
 * so they're unit-testable without React Native.
 */

export type PickedMention = { userId: string; name: string };

/**
 * The active mention query = the run of non-whitespace, non-"@" characters right
 * after the last "@" at the END of the text (what the user is currently typing).
 * Returns "" right after typing "@" (show the full list), or null if there's no
 * open mention token. A trailing space closes the token (returns null).
 */
export function activeMentionQuery(text: string): string | null {
    const match = text.match(/@([^\s@]*)$/);
    return match ? match[1] : null;
}

/** Replace the open "@query" at the end with "@{name} " (full name + a space). */
export function applyMention(text: string, name: string): string {
    return text.replace(/@[^\s@]*$/, `@${name} `);
}

/**
 * The mentions to persist: the picked entries whose "@{name}" still appears in the
 * final note text (so deleting a name drops it), deduped by userId, in text order.
 */
export function resolveMentions(text: string, picked: PickedMention[]): PickedMention[] {
    const seen = new Set<string>();
    const out: PickedMention[] = [];
    for (const mention of picked) {
        if (seen.has(mention.userId)) continue;
        if (text.includes(`@${mention.name}`)) {
            seen.add(mention.userId);
            out.push(mention);
        }
    }
    return out;
}
