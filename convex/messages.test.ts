import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

describe("messages.addInternalNote", () => {
    let t: any;
    let authorId: string;
    let mateId: string;
    let orgId: string;
    let conversationId: string;
    let preview: string;
    let asAuthor: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);

        const ids = await t.run(async (ctx: any) => {
            const author = await ctx.db.insert("users", { email: "author@test.com", name: "Tom" });
            const mate = await ctx.db.insert("users", { email: "mate@test.com", name: "Inès" });
            const org = await ctx.db.insert("organizations", {
                name: "Org", ownerId: author, plan: "BUSINESS",
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            for (const [u, role] of [[author, "OWNER"], [mate, "AGENT"]] as const) {
                await ctx.db.insert("memberships", {
                    userId: u, organizationId: org, role, status: "ONLINE",
                    maxConversations: 10, activeConversations: 0,
                    lastSeenAt: Date.now(), joinedAt: Date.now(),
                });
            }
            await ctx.db.insert("userSessions", {
                userId: author, currentOrganizationId: org, lastActivityAt: Date.now(),
            });
            const contactId = await ctx.db.insert("contacts", {
                organizationId: org, name: "Mehdi", phone: "+221770000000",
                searchName: "mehdi", tags: [], createdAt: Date.now(), updatedAt: Date.now(),
            });
            const convId = await ctx.db.insert("conversations", {
                organizationId: org, contactId, channel: "WHATSAPP", status: "OPEN",
                lastMessageAt: Date.now(), lastMessageDirection: "INBOUND",
                preview: "dernier message client", unreadCount: 0,
                createdAt: Date.now(), updatedAt: Date.now(), tags: [],
            });
            return { author, mate, org, convId };
        });
        authorId = ids.author;
        mateId = ids.mate;
        orgId = ids.org;
        conversationId = ids.convId;
        preview = "dernier message client";
        asAuthor = t.withIdentity({ subject: authorId, issuer: "test" });
    });

    // addInternalNote schedules a best-effort mention email (internalAction).
    // convex-test can't run scheduled *actions* in teardown, so cancel any
    // pending jobs before the test ends — we assert scheduling separately.
    afterEach(async () => {
        await t.run(async (ctx: any) => {
            const jobs = await ctx.db.system.query("_scheduled_functions").collect();
            for (const j of jobs) {
                if (j.state.kind === "pending") await ctx.scheduler.cancel(j._id);
            }
        });
    });

    const notifsFor = (uid: string) =>
        t.run(async (ctx: any) =>
            ctx.db.query("notifications")
                .filter((q: any) => q.eq(q.field("userId"), uid))
                .collect());

    it("creates an internal note (isInternal + mentions, no WhatsApp send)", async () => {
        const id = await asAuthor.mutation(api.messages.addInternalNote, {
            conversationId,
            content: "@Inès peux-tu vérifier ?",
            mentions: [{ userId: mateId, name: "Inès" }],
        });
        const msg = await t.run(async (ctx: any) => ctx.db.get(id));
        expect(msg.isInternal).toBe(true);
        expect(msg.direction).toBe("OUTBOUND");
        expect(msg.contactId).toBeUndefined();
        expect(msg.mentions).toEqual([{ userId: mateId, name: "Inès" }]);
    });

    it("notifies the mentioned teammate (MENTION + link to conversation)", async () => {
        await asAuthor.mutation(api.messages.addInternalNote, {
            conversationId,
            content: "@Inès regarde ça",
            mentions: [{ userId: mateId, name: "Inès" }],
        });
        const mateNotifs = await notifsFor(mateId);
        expect(mateNotifs).toHaveLength(1);
        expect(mateNotifs[0].type).toBe("MENTION");
        expect(mateNotifs[0].link).toBe(`/dashboard/conversations/${conversationId}`);
    });

    it("does NOT notify the author for their own mention", async () => {
        await asAuthor.mutation(api.messages.addInternalNote, {
            conversationId,
            content: "@Tom note perso",
            mentions: [{ userId: authorId, name: "Tom" }],
        });
        expect(await notifsFor(authorId)).toHaveLength(0);
    });

    it("does not overwrite the customer-facing conversation preview", async () => {
        await asAuthor.mutation(api.messages.addInternalNote, {
            conversationId, content: "note interne", mentions: [],
        });
        const conv = await t.run(async (ctx: any) => ctx.db.get(conversationId));
        expect(conv.preview).toBe(preview);
    });

    it("ignores mentions of users who are NOT members of the org (no notif leak)", async () => {
        // A stranger account with no membership in this org. The mentions array
        // is client-supplied; a member must not be able to push a MENTION
        // (leaking the contact name + a 140-char note excerpt + deep link) to an
        // arbitrary user id.
        const strangerId = await t.run(async (ctx: any) =>
            ctx.db.insert("users", { email: "stranger@test.com", name: "Stranger" }));

        const id = await asAuthor.mutation(api.messages.addInternalNote, {
            conversationId,
            content: "@Stranger ping",
            mentions: [{ userId: strangerId, name: "Stranger" }],
        });

        // The note itself is still created…
        const msg = await t.run(async (ctx: any) => ctx.db.get(id));
        expect(msg.isInternal).toBe(true);
        // …but the non-member receives NO notification.
        expect(await notifsFor(strangerId)).toHaveLength(0);
    });

    it("schedules a best-effort mention email for a member who has an email", async () => {
        await asAuthor.mutation(api.messages.addInternalNote, {
            conversationId,
            content: "@Inès peux-tu regarder ?",
            mentions: [{ userId: mateId, name: "Inès" }],
        });
        const jobs = await t.run(async (ctx: any) =>
            ctx.db.system.query("_scheduled_functions").collect());
        expect(jobs.some((j: any) => String(j.name).includes("mention_emails"))).toBe(true);
        // afterEach cancels the job so the SES action never runs in teardown.
    });
});
