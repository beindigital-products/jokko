import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * Regression tests for the calls.ts cross-tenant authorization fixes (audit
 * H1/H2/M2). Before the fix, call mutations only checked `status` (not the
 * caller's org) and the active-call / history reads had no auth at all — a user
 * in org B could accept/reject/terminate org A's calls and read its PII.
 */
describe("calls — cross-tenant authorization", () => {
    let t: any;
    let orgA: string;
    let aliceA: string; // member of org A
    let malloryB: string; // member of org B only
    let callId: string;
    let convA: string;
    let asAlice: any;
    let asMallory: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const ids = await t.run(async (ctx: any) => {
            const alice = await ctx.db.insert("users", { email: "alice@a.com", name: "Alice" });
            const mallory = await ctx.db.insert("users", { email: "mallory@b.com", name: "Mallory" });
            const oa = await ctx.db.insert("organizations", {
                name: "Org A", ownerId: alice, plan: "PRO",
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            const ob = await ctx.db.insert("organizations", {
                name: "Org B", ownerId: mallory, plan: "PRO",
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            await ctx.db.insert("memberships", {
                userId: alice, organizationId: oa, role: "OWNER", status: "ONLINE",
                maxConversations: 10, activeConversations: 0, lastSeenAt: Date.now(), joinedAt: Date.now(),
            });
            await ctx.db.insert("memberships", {
                userId: mallory, organizationId: ob, role: "OWNER", status: "ONLINE",
                maxConversations: 10, activeConversations: 0, lastSeenAt: Date.now(), joinedAt: Date.now(),
            });
            const contactId = await ctx.db.insert("contacts", {
                organizationId: oa, name: "Client", phone: "+221770000001",
                searchName: "client", tags: [], createdAt: Date.now(), updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: oa, contactId, channel: "WHATSAPP", status: "OPEN",
                lastMessageAt: Date.now(), lastMessageDirection: "INBOUND", preview: "",
                unreadCount: 0, createdAt: Date.now(), updatedAt: Date.now(), tags: [],
            });
            const call = await ctx.db.insert("calls", {
                organizationId: oa, conversationId: conv, contactId,
                externalCallId: "ext_1", direction: "INBOUND",
                fromPhone: "+221770000001", toPhone: "+221770000999",
                status: "RINGING", startedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now(),
            });
            return { oa, alice, mallory, call, conv };
        });
        orgA = ids.oa;
        aliceA = ids.alice;
        malloryB = ids.mallory;
        callId = ids.call;
        convA = ids.conv;
        asAlice = t.withIdentity({ subject: aliceA, issuer: "test" });
        asMallory = t.withIdentity({ subject: malloryB, issuer: "test" });
    });

    it("blocks a non-member from accepting another org's call", async () => {
        await expect(
            asMallory.mutation(api.calls.acceptCall, { callId, sdpAnswer: "x" }),
        ).rejects.toThrow(/membre/i);
    });

    it("blocks a non-member from rejecting another org's call", async () => {
        await expect(
            asMallory.mutation(api.calls.rejectCall, { callId }),
        ).rejects.toThrow(/membre/i);
    });

    it("blocks a non-member from terminating another org's call (was unauthenticated)", async () => {
        await expect(
            asMallory.mutation(api.calls.terminateCall, { callId }),
        ).rejects.toThrow(/membre/i);
        // The call is untouched (still RINGING).
        const call = await t.run(async (ctx: any) => ctx.db.get(callId));
        expect(call.status).toBe("RINGING");
    });

    it("getActiveCall returns null for a non-member, the call for a member", async () => {
        expect(await asMallory.query(api.calls.getActiveCall, { organizationId: orgA })).toBeNull();
        const forMember = await asAlice.query(api.calls.getActiveCall, { organizationId: orgA });
        expect(forMember?._id).toBe(callId);
    });

    it("getCallHistory returns [] for a non-member, the history for a member", async () => {
        expect(await asMallory.query(api.calls.getCallHistory, { conversationId: convA })).toEqual([]);
        const forMember = await asAlice.query(api.calls.getCallHistory, { conversationId: convA });
        expect(forMember).toHaveLength(1);
    });
});
