export interface MentionCandidate {
    userId: string
    name: string
}

export interface ResolvedMention {
    userId: string
    name: string
}

/**
 * Given the note text and the set of teammates the user picked via the
 * @ menu, keeps only those whose `@Name` token still appears in the text
 * (the user may have deleted some after inserting them). Deduplicates by
 * userId. Pure + testable.
 */
export function resolveMentions(
    text: string,
    picked: MentionCandidate[],
): ResolvedMention[] {
    const seen = new Set<string>()
    const out: ResolvedMention[] = []
    for (const m of picked) {
        if (seen.has(m.userId)) continue
        if (text.includes(`@${m.name}`)) {
            seen.add(m.userId)
            out.push({ userId: m.userId, name: m.name })
        }
    }
    return out
}

/**
 * Detects an in-progress `@query` at the caret. Returns the query (text
 * after the `@`, without the `@`) when the caret sits right after an
 * `@…` token that starts at the beginning or after whitespace; otherwise
 * null. Mirrors the `/shortcut` detection pattern.
 */
export function detectMentionQuery(
    textBeforeCaret: string,
): { query: string; start: number } | null {
    const match = textBeforeCaret.match(/(?:^|\s)@([\p{L}\d'’-]*)$/u)
    if (!match) return null
    const query = match[1]
    const start = textBeforeCaret.length - query.length - 1 // position of '@'
    return { query, start }
}

/**
 * Replaces the in-progress `@query` token (ending at the caret) with
 * `@FullName ` and returns the new text + new caret offset.
 */
export function insertMention(
    text: string,
    caret: number,
    mentionStart: number,
    name: string,
): { text: string; caret: number } {
    const before = text.slice(0, mentionStart)
    const after = text.slice(caret)
    const token = `@${name} `
    return {
        text: before + token + after,
        caret: before.length + token.length,
    }
}
