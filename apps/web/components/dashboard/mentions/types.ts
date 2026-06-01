export type MentionKind = "mention" | "assignment" | "reply"

export interface MentionItem {
    id: string
    /** Name of the person who triggered the mention/assignment/reply. */
    who: string
    /** Human-readable verb phrase, e.g. "vous a mentionnée sur" */
    text: string
    /** Conversation name / contact name. */
    conv: string
    /** Quoted note or message body. */
    note: string
    /** Relative time label, e.g. "il y a 8 min". */
    time: string
}

export interface MentionsData {
    items: MentionItem[]
}
