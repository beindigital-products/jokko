import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * Global ⌘K search over message content. The critical property is org-scoping:
 * a user must only ever see messages from their OWN active organization.
 */
describe("searchGlobal — message content search", () => {
    let t: any;
    let asUser: any;
    let convId: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const s = await t.run(async (ctx: any) => {
            const user = await ctx.db.insert("users", { email: "a@t.com", name: "Agent" });
            const org = await ctx.db.insert("organizations", {
                name: "Org", ownerId: user, plan: "BUSINESS", createdAt: Date.now(), updatedAt: Date.now(),
            });
            await ctx.db.insert("memberships", {
                userId: user, organizationId: org, role: "OWNER", status: "ONLINE",
                maxConversations: 10, activeConversations: 0, lastSeenAt: Date.now(), joinedAt: Date.now(),
            });
            await ctx.db.insert("userSessions", { userId: user, currentOrganizationId: org, lastActivityAt: Date.now() });
            const contact = await ctx.db.insert("contacts", {
                organizationId: org, name: "Fatou", phone: "221770000001", searchName: "Fatou",
                isWhatsApp: true, createdAt: Date.now(), updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: org, contactId: contact, status: "OPEN", unreadCount: 0,
                lastMessageAt: Date.now(), channel: "WHATSAPP", createdAt: Date.now(), updatedAt: Date.now(),
            });
            await ctx.db.insert("messages", {
                organizationId: org, conversationId: conv, contactId: contact, type: "TEXT",
                content: "Rendez-vous projet alpha demain matin", direction: "INBOUND", status: "DELIVERED",
                createdAt: Date.now(), updatedAt: Date.now(),
            });

            // Another org's message that must NEVER surface for our user.
            const other = await ctx.db.insert("organizations", {
                name: "Other", ownerId: user, plan: "BUSINESS", createdAt: Date.now(), updatedAt: Date.now(),
            });
            const oContact = await ctx.db.insert("contacts", {
                organizationId: other, name: "X", phone: "1", searchName: "X",
                isWhatsApp: true, createdAt: Date.now(), updatedAt: Date.now(),
            });
            const oConv = await ctx.db.insert("conversations", {
                organizationId: other, contactId: oContact, status: "OPEN", unreadCount: 0,
                lastMessageAt: Date.now(), channel: "WHATSAPP", createdAt: Date.now(), updatedAt: Date.now(),
            });
            await ctx.db.insert("messages", {
                organizationId: other, conversationId: oConv, contactId: oContact, type: "TEXT",
                content: "dossier confidentiel autre organisation", direction: "INBOUND", status: "DELIVERED",
                createdAt: Date.now(), updatedAt: Date.now(),
            });

            return { user, conv };
        });
        asUser = t.withIdentity({ subject: s.user, issuer: "test" });
        convId = s.conv;
    });

    it("finds a message by content and deep-links to its conversation", async () => {
        const res = await asUser.query(api.search.searchGlobal, { query: "alpha" });
        expect(res.messages.length).toBe(1);
        expect(res.messages[0].link).toBe(`/dashboard/conversations/${convId}`);
        expect(res.messages[0].name).toBe("Fatou");
        expect(res.messages[0].snippet).toContain("alpha");
    });

    it("never returns another organization's messages", async () => {
        const res = await asUser.query(api.search.searchGlobal, { query: "confidentiel" });
        expect(res.messages.length).toBe(0);
    });

    it("returns an empty shape for a blank query", async () => {
        const res = await asUser.query(api.search.searchGlobal, { query: "   " });
        expect(res).toEqual({ contacts: [], pages: [], messages: [] });
    });
});
