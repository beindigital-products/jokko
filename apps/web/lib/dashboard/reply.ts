/**
 * Reply / quote helpers — shared between the composer (reply preview banner)
 * and the thread (quoted-parent block on a bubble). Pure functions so they
 * are unit-testable and stay consistent across both surfaces.
 */

/** Message types that carry media instead of (or alongside) text. */
type ReplyableType = string | null | undefined

/**
 * Human snippet shown when quoting a message. Prefers the text content;
 * falls back to a typed media label so a quoted photo reads "📷 Photo"
 * rather than an empty line.
 */
export function replyPreviewText(type: ReplyableType, content?: string | null): string {
    const text = content?.trim()
    if (text) return text
    switch ((type ?? "TEXT").toUpperCase()) {
        case "IMAGE":
            return "📷 Photo"
        case "VIDEO":
            return "🎥 Vidéo"
        case "AUDIO":
            return "🎵 Message vocal"
        case "DOCUMENT":
            return "📄 Document"
        case "LOCATION":
            return "📍 Position"
        case "STICKER":
            return "🎨 Sticker"
        default:
            return "Message"
    }
}

/**
 * Who authored the quoted message, from the reader's point of view.
 * Outbound → "Vous"; inbound → the contact's name (or a neutral fallback).
 */
export function replyAuthorLabel(
    direction?: "INBOUND" | "OUTBOUND" | string,
    contactName?: string | null,
): string {
    if (direction === "OUTBOUND") return "Vous"
    return contactName?.trim() || "Client"
}
