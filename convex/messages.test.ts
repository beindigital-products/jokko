import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("messages.react", () => {
    let t: any;
    let userId: string;
    let orgId: string;
    let conversationId: string;
    let messageId: string;
    let asUser: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);

        userId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
        });

        orgId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("organizations", {
                name: "Test Org",
                ownerId: userId,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        await t.run(async (ctx: any) => {
            await ctx.db.insert("memberships", {
                userId,
                organizationId: orgId,
                role: "OWNER",
                status: "ONLINE",
                maxConversations: 10,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        });

        ({ conversationId, messageId } = await t.run(async (ctx: any) => {
            const contactId = await ctx.db.insert("contacts", {
                organizationId: orgId,
                name: "Contact",
                phone: "",
                searchName: "Contact",
                tags: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const convId = await ctx.db.insert("conversations", {
                organizationId: orgId,
                contactId,
                channel: "WHATSAPP",
                status: "OPEN",
                lastMessageAt: Date.now(),
                lastMessageDirection: "INBOUND",
                unreadCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tags: [],
            });
            const msgId = await ctx.db.insert("messages", {
                organizationId: orgId,
                conversationId: convId,
                contactId,
                type: "TEXT",
                content: "Hi",
                direction: "INBOUND",
                status: "DELIVERED",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return { conversationId: convId, messageId: msgId };
        }));

        asUser = t.withIdentity({ subject: userId, issuer: "test" });
    });

    async function listReactions() {
        return await t.run(async (ctx: any) =>
            ctx.db
                .query("messageReactions")
                .withIndex("by_message", (q: any) => q.eq("messageId", messageId))
                .collect(),
        );
    }

    it("adds a new reaction", async () => {
        const result = await asUser.mutation(api.messages.react, {
            messageId,
            emoji: "❤️",
        });
        expect(result).toEqual({ action: "added" });

        const reactions = await listReactions();
        expect(reactions).toHaveLength(1);
        expect(reactions[0].emoji).toBe("❤️");
        expect(reactions[0].userId).toBe(userId);
    });

    it("toggles off when the same user reacts with the same emoji again", async () => {
        await asUser.mutation(api.messages.react, { messageId, emoji: "👍" });
        const second = await asUser.mutation(api.messages.react, {
            messageId,
            emoji: "👍",
        });

        expect(second).toEqual({ action: "removed" });
        expect(await listReactions()).toHaveLength(0);
    });

    it("replaces when the same user reacts with a different emoji", async () => {
        await asUser.mutation(api.messages.react, { messageId, emoji: "👍" });
        const second = await asUser.mutation(api.messages.react, {
            messageId,
            emoji: "🙏",
        });

        expect(second).toEqual({ action: "replaced" });
        const reactions = await listReactions();
        expect(reactions).toHaveLength(1);
        expect(reactions[0].emoji).toBe("🙏");
    });

    it("rejects empty or oversize emoji", async () => {
        await expect(
            asUser.mutation(api.messages.react, { messageId, emoji: "" }),
        ).rejects.toThrow(/required/);
        await expect(
            asUser.mutation(api.messages.react, { messageId, emoji: "🥲🥲🥲🥲🥲" }),
        ).rejects.toThrow(/too long/);
    });

    it("unreact removes the user's reaction without touching others", async () => {
        // Add a reaction from a second user
        const userId2 = await t.run(async (ctx: any) => {
            const u = await ctx.db.insert("users", { email: "other@test.com", name: "Other" });
            await ctx.db.insert("memberships", {
                userId: u,
                organizationId: orgId,
                role: "AGENT",
                status: "ONLINE",
                maxConversations: 10,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
            return u;
        });
        const asOther = t.withIdentity({ subject: userId2, issuer: "test" });

        await asUser.mutation(api.messages.react, { messageId, emoji: "❤️" });
        await asOther.mutation(api.messages.react, { messageId, emoji: "👍" });
        expect(await listReactions()).toHaveLength(2);

        await asUser.mutation(api.messages.unreact, { messageId });
        const remaining = await listReactions();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].userId).toBe(userId2);
    });

    it("list returns enriched reactions array on each message", async () => {
        await asUser.mutation(api.messages.react, { messageId, emoji: "❤️" });

        const result = await asUser.query(api.messages.list, {
            conversationId,
            paginationOpts: { numItems: 10, cursor: null },
        });
        const msg = result.page.find((m: any) => m._id === messageId);
        expect(msg.reactions).toEqual([
            expect.objectContaining({ userId, emoji: "❤️" }),
        ]);
    });
});
