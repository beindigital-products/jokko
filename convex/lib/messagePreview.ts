/**
 * WhatsApp-style conversation preview from a message's type + content.
 *
 * Single source of truth used everywhere `conversation.preview` is written, so
 * the inbox lists on mobile AND desktop (both read `conversation.preview`) stay
 * consistent. Audio shows "Message vocal" with the duration in parentheses when
 * it's known (the mobile recorder embeds it in the message content, e.g.
 * "Note vocale (0:34)"). Clean text only — the clients add their own glyphs
 * (the mobile inbox draws a mic icon; the keyword stays in the text so it still
 * detects the kind).
 */

/** Extracts an "m:ss" duration from a content string (e.g. "Note vocale (0:34)"). */
function extractAudioDuration(content: string): string | null {
  const paren = content.match(/\((\d{1,2}:\d{2})\)/);
  if (paren) return paren[1];
  const bare = content.match(/\b(\d{1,2}:\d{2})\b/);
  if (bare) return bare[1];
  const seconds = content.match(/\((\d+)\s*s\)/i);
  if (seconds) {
    const total = Number(seconds[1]);
    if (Number.isFinite(total) && total > 0) {
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
    }
  }
  return null;
}

export function formatConversationPreview(message: {
  type?: string | null;
  content?: string | null;
}): string {
  const type = (message.type ?? "TEXT").toUpperCase();
  const content = (message.content ?? "").trim();
  const isPlaceholder = content.startsWith("[") && content.endsWith("]");
  const caption = content && !isPlaceholder ? content : "";

  switch (type) {
    case "AUDIO": {
      const duration = extractAudioDuration(content);
      return duration ? `Message vocal (${duration})` : "Message vocal";
    }
    case "IMAGE":
      return caption ? `Photo — ${caption}` : "Photo";
    case "VIDEO":
      return caption ? `Vidéo — ${caption}` : "Vidéo";
    case "DOCUMENT":
      return caption ? `Document — ${caption}` : "Document";
    case "STICKER":
      return "Sticker";
    case "LOCATION":
      return caption ? `Position — ${caption}` : "Position";
    case "REACTION":
      return content || "Réaction";
    default:
      return caption || content;
  }
}
