import { describe, expect, it } from "vitest";
import {
    computeInboxCounts,
    filterMobileConversations,
    formatConversationTimestamp,
    getConversationDisplayName,
    getConversationInitials,
    getConversationPreview,
    groupInboxConversations,
    inboxMessageKind,
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
        // Dates construites en heure LOCALE : la fonction affiche l'heure locale,
        // donc le test doit être indépendant du fuseau de la machine/CI (sinon
        // il passe en UTC+2 mais casse en UTC, comme sur le runner GitHub).
        const now = new Date(2026, 4, 2, 14, 0); // 2 mai 2026, 14:00
        expect(formatConversationTimestamp(new Date(2026, 4, 2, 12, 5).getTime(), now)).toBe("12:05");
        expect(formatConversationTimestamp(new Date(2026, 4, 1, 12, 5).getTime(), now)).toBe("Hier");
        expect(formatConversationTimestamp(new Date(2026, 3, 25, 12, 5).getTime(), now)).toBe("25/04");
    });
});

describe("computeInboxCounts", () => {
    it("counts all / unread / mine from the full set", () => {
        expect(computeInboxCounts(conversations, "u1")).toEqual({ all: 3, unread: 1, mine: 1 });
        expect(computeInboxCounts(conversations, null)).toEqual({ all: 3, unread: 1, mine: 0 });
        expect(computeInboxCounts([], "u1")).toEqual({ all: 0, unread: 0, mine: 0 });
    });
});

describe("groupInboxConversations", () => {
    it("splits into pinned / today / earlier", () => {
        const now = new Date("2026-05-02T12:00:00.000Z");
        const at = (offsetMs: number): number => now.getTime() - offsetMs;
        const rows: MobileConversationSearchFields[] = [
            { _id: "pin", isPinned: true, lastMessageAt: at(10 * 86_400_000) },
            { _id: "today", isPinned: false, lastMessageAt: at(2 * 3_600_000) },
            { _id: "old", isPinned: false, lastMessageAt: at(5 * 86_400_000) },
        ];
        const groups = groupInboxConversations(rows, now);
        expect(groups.pinned.map((r) => r._id)).toEqual(["pin"]);
        expect(groups.today.map((r) => r._id)).toEqual(["today"]);
        expect(groups.earlier.map((r) => r._id)).toEqual(["old"]);
    });
});

describe("inboxMessageKind", () => {
    it("detects voice / doc / image / text from a preview", () => {
        expect(inboxMessageKind("[AUDIO]")).toBe("voice");
        expect(inboxMessageKind("Note vocale")).toBe("voice");
        expect(inboxMessageKind("facture.pdf")).toBe("doc");
        expect(inboxMessageKind("Photo.jpg")).toBe("image");
        expect(inboxMessageKind("Bonjour")).toBe("text");
        expect(inboxMessageKind("")).toBe("text");
        expect(inboxMessageKind(null)).toBe("text");
    });
});
