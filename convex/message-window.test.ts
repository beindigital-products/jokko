import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * messages.send is the free-form (non-template) path. Meta only accepts it while
 * the 24h customer-service window is open; past it, the send is rejected (131047)
 * and the agent only ever saw a generic FAILED. The mutation must reject early
 * with an actionable error when the window is closed, and allow the send when it
 * is open or untracked (windowExpiresAt unset).
 */
describe("messages.send — 24h service window guard", () => {
    let t: any;
    let orgId: any;
    let asUser: any;

    const HOUR = 60 * 60 * 1000;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const userId = await t.run(async (ctx: any) =>
            ctx.db.insert("users", { email: "agent@test.com", name: "Agent" }));
        orgId = await t.run(async (ctx: any) =>
            ctx.db.insert("organizations", {
                name: "Org", ownerId: userId, plan: "BUSINESS",
                createdAt: Date.now(), updatedAt: Date.now(),
            }));
        await t.run(async (ctx: any) => {
            await ctx.db.insert("memberships", {
                userId, organizationId: orgId, role: "OWNER", status: "ONLINE",
                maxConversations: 10, activeConversations: 0, lastSeenAt: Date.now(), joinedAt: Date.now(),
            });
            await ctx.db.insert("userSessions", {
                userId, currentOrganizationId: orgId, lastActivityAt: Date.now(),
            });
        });
        asUser = t.withIdentity({ subject: userId, issuer: "test" });
    });

    // Empty phone → the send path skips the WhatsApp scheduler, so the mutation
    // resolves cleanly in-test while still exercising the window guard.
    const makeConversation = (windowExpiresAt: number | undefined) =>
        t.run(async (ctx: any) => {
            const contactId = await ctx.db.insert("contacts", {
                organizationId: orgId, name: "C", phone: "", searchName: "C", tags: [],
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            return ctx.db.insert("conversations", {
                organizationId: orgId, contactId, channel: "WHATSAPP", status: "OPEN",
                lastMessageAt: Date.now(), unreadCount: 0, tags: [], windowExpiresAt,
                createdAt: Date.now(), updatedAt: Date.now(),
            });
        });

    it("rejects a free-form send when the window is closed", async () => {
        const conversationId = await makeConversation(Date.now() - HOUR); // expired
        await expect(
            asUser.mutation(api.messages.send, { conversationId, content: "Coucou", type: "TEXT" }),
        ).rejects.toThrow(/fenêtre de 24h est fermée/i);
    });

    it("allows a free-form send while the window is open", async () => {
        const conversationId = await makeConversation(Date.now() + HOUR); // still open
        const messageId = await asUser.mutation(api.messages.send, {
            conversationId, content: "Bonjour", type: "TEXT",
        });
        expect(messageId).toBeDefined();
    });

    it("allows a send when the window is untracked (no inbound yet)", async () => {
        const conversationId = await makeConversation(undefined);
        const messageId = await asUser.mutation(api.messages.send, {
            conversationId, content: "Bonjour", type: "TEXT",
        });
        expect(messageId).toBeDefined();
    });
});
