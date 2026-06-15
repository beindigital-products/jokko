import { describe, it, expect } from "vitest";
import { formatConversationPreview } from "./messagePreview";

describe("formatConversationPreview — audio (WhatsApp style)", () => {
  it("shows a voice message with the duration in parentheses", () => {
    expect(formatConversationPreview({ type: "AUDIO", content: "Note vocale (0:34)" })).toBe(
      "Message vocal (0:34)",
    );
    expect(formatConversationPreview({ type: "AUDIO", content: "Audio (1:05)" })).toBe("Message vocal (1:05)");
    expect(formatConversationPreview({ type: "AUDIO", content: "0:09" })).toBe("Message vocal (0:09)");
  });

  it("converts a seconds-only duration to m:ss", () => {
    expect(formatConversationPreview({ type: "AUDIO", content: "Vocal (90s)" })).toBe("Message vocal (1:30)");
  });

  it("falls back to 'Message vocal' without a known duration (incoming / placeholder)", () => {
    expect(formatConversationPreview({ type: "AUDIO", content: "" })).toBe("Message vocal");
    expect(formatConversationPreview({ type: "AUDIO", content: "[AUDIO]" })).toBe("Message vocal");
    expect(formatConversationPreview({ type: "AUDIO" })).toBe("Message vocal");
  });
});

describe("formatConversationPreview — other types", () => {
  it("labels media and keeps a caption when present (the keyword stays for client glyphs)", () => {
    expect(formatConversationPreview({ type: "IMAGE", content: "" })).toBe("Photo");
    expect(formatConversationPreview({ type: "IMAGE", content: "Voici la photo" })).toBe("Photo — Voici la photo");
    expect(formatConversationPreview({ type: "VIDEO", content: "" })).toBe("Vidéo");
    expect(formatConversationPreview({ type: "DOCUMENT", content: "facture.pdf" })).toBe("Document — facture.pdf");
    expect(formatConversationPreview({ type: "DOCUMENT", content: "[DOCUMENT]" })).toBe("Document");
    expect(formatConversationPreview({ type: "STICKER", content: "" })).toBe("Sticker");
    expect(formatConversationPreview({ type: "LOCATION", content: "" })).toBe("Position");
  });

  it("returns the raw text for TEXT messages", () => {
    expect(formatConversationPreview({ type: "TEXT", content: "Bonjour 👋" })).toBe("Bonjour 👋");
    expect(formatConversationPreview({ content: "Sans type" })).toBe("Sans type");
  });
});
