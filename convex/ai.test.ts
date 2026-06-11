import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * ai.generateReplyDraft — the inbox Copilot reply-draft assist. Without an
 * OPENAI_API_KEY (the test env) the action returns a deterministic fallback
 * draft, so these tests exercise the membership scoping + plan gate + wiring
 * without hitting OpenAI.
 */
describe("ai.generateReplyDraft", () => {
    let t: any;
    let convId: string;
    let asMember: any;
    let asOutsider: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const ids = await t.run(async (ctx: any) => {
            const member = await ctx.db.insert("users", { email: "agent@a.com", name: "Agent" });
            const outsider = await ctx.db.insert("users", { email: "out@b.com", name: "Out" });
            // PRO + chosen plan + past trial → "ai" feature allowed by plan (not trial).
            const org = await ctx.db.insert("organizations", {
                name: "Be in Digital", ownerId: member, plan: "PRO", hasSelectedPlan: true,
                trialEndsAt: Date.now() - 1000, createdAt: Date.now() - 1000, updatedAt: Date.now(),
            });
            await ctx.db.insert("memberships", {
                userId: member, organizationId: org, role: "OWNER", status: "ONLINE",
                maxConversations: 10, activeConversations: 0, lastSeenAt: Date.now(), joinedAt: Date.now(),
            });
            await ctx.db.insert("userSessions", { userId: member, currentOrganizationId: org, lastActivityAt: Date.now() });
            const contact = await ctx.db.insert("contacts", {
                organizationId: org, name: "Client", phone: "+221770000002",
                searchName: "client", tags: [], createdAt: Date.now(), updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: org, contactId: contact, channel: "WHATSAPP", status: "OPEN",
                lastMessageAt: Date.now(), preview: "", unreadCount: 0,
                createdAt: Date.now(), updatedAt: Date.now(), tags: [],
            });
            await ctx.db.insert("messages", {
                organizationId: org, conversationId: conv, contactId: contact, type: "TEXT",
                content: "Bonjour, êtes-vous ouverts demain ?", direction: "INBOUND",
                status: "DELIVERED", createdAt: Date.now(), updatedAt: Date.now(),
            });
            return { member, outsider, conv };
        });
        convId = ids.conv;
        asMember = t.withIdentity({ subject: ids.member, issuer: "test" });
        asOutsider = t.withIdentity({ subject: ids.outsider, issuer: "test" });
    });

    it("returns a non-empty draft for a member (PRO plan)", async () => {
        const res = await asMember.action(api.ai.generateReplyDraft, { conversationId: convId });
        expect(res.error).toBeUndefined();
        expect(typeof res.draft).toBe("string");
        expect(res.draft.length).toBeGreaterThan(0);
    });

    it("denies a non-member (cross-tenant access)", async () => {
        await expect(
            asOutsider.action(api.ai.generateReplyDraft, { conversationId: convId }),
        ).rejects.toThrow(/introuvable|refus|accès/i);
    });
});
