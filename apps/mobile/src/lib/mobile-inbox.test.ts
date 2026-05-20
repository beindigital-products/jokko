import { describe, expect, it } from "vitest";
import {
    filterMobileConversations,
    formatConversationTimestamp,
    getConversationDisplayName,
    getConversationInitials,
    getConversationPreview,
    type MobileConversationSearchFields,
} from "./mobile-inbox";

const conversations: MobileConversationSearchFields[] = [
    {
        _id: "c1",
        contact: { name: "Awa Ndiaye", phoneNumber: "+221700000001" },
        preview: "Bonjour",
        unreadCount: 2,
        assignedTo: { _id: "u1", user: { name: "Agent A", email: "a@jokko.test" } },
        isPinned: false,
        lastMessageAt: new Date("2026-05-02T08:00:00.000Z").getTime(),
    },
    {
        _id: "c2",
        contact: { name: "Client VIP", phoneNumber: "+221700000002" },
        preview: "Besoin de prix",
        unreadCount: 0,
        assignedTo: null,
        isPinned: true,
        lastMessageAt: new Date("2026-05-01T08:00:00.000Z").getTime(),
    },
    {
        _id: "c3",
        contact: { phoneNumber: "+221700000003" },
        preview: "",
        unreadCount: 0,
        assignedTo: { _id: "u2", user: { name: "Agent B", email: "b@jokko.test" } },
        isPinned: false,
        lastMessageAt: new Date("2026-04-30T08:00:00.000Z").getTime(),
    },
];

describe("mobile inbox helpers", () => {
    it("derives contact labels, initials and empty previews", () => {
        expect(getConversationDisplayName(conversations[0])).toBe("Awa Ndiaye");
        expect(getConversationInitials(conversations[0])).toBe("AN");
        expect(getConversationDisplayName(conversations[2])).toBe("+221700000003");
        expect(getConversationPreview(conversations[2])).toBe("Aucun message pour le moment");
    });

    it("filters unread conversations", () => {
        expect(filterMobileConversations(conversations, "unread", "", "u1").map((item) => item._id)).toEqual(["c1"]);
    });

    it("filters assigned conversations for the current user", () => {
        expect(filterMobileConversations(conversations, "mine", "", "u1").map((item) => item._id)).toEqual(["c1"]);
    });

    it("searches across normalized contact data and keeps pinned rows first", () => {
        expect(filterMobileConversations(conversations, "all", "vip", "u1").map((item) => item._id)).toEqual(["c2"]);
        expect(filterMobileConversations(conversations, "all", "", "u1").map((item) => item._id)).toEqual(["c2", "c1", "c3"]);
    });

    it("formats timestamps for mobile rows", () => {
        const now = new Date("2026-05-02T12:00:00.000Z");
        expect(formatConversationTimestamp(new Date("2026-05-02T10:05:00.000Z").getTime(), now)).toBe("12:05");
        expect(formatConversationTimestamp(new Date("2026-05-01T10:05:00.000Z").getTime(), now)).toBe("Hier");
        expect(formatConversationTimestamp(new Date("2026-04-25T10:05:00.000Z").getTime(), now)).toBe("25/04");
    });
});
