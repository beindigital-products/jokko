import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

/**
 * Regression tests for confirmConnected. The outbound call flow leaves the call
 * at RINGING after the SDP offer is sent; when ICE connects the browser calls
 * confirmConnected. The original handler only transitioned PRE_ACCEPTED (inbound),
 * so outbound calls stayed stuck at RINGING — which made getActiveCall treat the
 * live call as an incoming one and broke hang-up (routed to reject).
 */
describe("calls — confirmConnected transitions", () => {
    let t: any;
    let orgA: string;
    let aliceA: string;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const ids = await t.run(async (ctx: any) => {
            const alice = await ctx.db.insert("users", { email: "alice@a.com", name: "Alice" });
            const oa = await ctx.db.insert("organizations", {
                name: "Org A", ownerId: alice, plan: "PRO",
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            await ctx.db.insert("memberships", {
                userId: alice, organizationId: oa, role: "OWNER", status: "ONLINE",
                maxConversations: 10, activeConversations: 0, lastSeenAt: Date.now(), joinedAt: Date.now(),
            });
            return { oa, alice };
        });
        orgA = ids.oa;
        aliceA = ids.alice;
    });

    async function makeCall(status: string, direction: string) {
        return await t.run(async (ctx: any) =>
            ctx.db.insert("calls", {
                organizationId: orgA, externalCallId: "wacid.test", direction,
                fromPhone: "", toPhone: "+221770000001", agentId: aliceA,
                status, startedAt: Date.now(), createdAt: Date.now(), updatedAt: Date.now(),
            }),
        );
    }

    it("transitions an outbound RINGING call to CONNECTED (was stuck at RINGING)", async () => {
        const id = await makeCall("RINGING", "OUTBOUND");
        await t.withIdentity({ subject: aliceA, issuer: "test" }).mutation(api.calls.confirmConnected, { callId: id });
        const call = await t.run(async (ctx: any) => ctx.db.get(id));
        expect(call.status).toBe("CONNECTED");
    });

    it("leaves a non-connectable status untouched (REQUESTING_PERMISSION)", async () => {
        const id = await makeCall("REQUESTING_PERMISSION", "OUTBOUND");
        await t.withIdentity({ subject: aliceA, issuer: "test" }).mutation(api.calls.confirmConnected, { callId: id });
        const call = await t.run(async (ctx: any) => ctx.db.get(id));
        expect(call.status).toBe("REQUESTING_PERMISSION");
    });

    it("blocks a non-member from confirming another org's call", async () => {
        const id = await makeCall("RINGING", "OUTBOUND");
        const mallory = await t.run(async (ctx: any) =>
            ctx.db.insert("users", { email: "mallory@b.com", name: "Mallory" }),
        );
        await expect(
            t.withIdentity({ subject: mallory, issuer: "test" }).mutation(api.calls.confirmConnected, { callId: id }),
        ).rejects.toThrow(/membre/i);
    });
});

/**
 * Credit gate: outbound calls are billable, so requestOutboundCall must block
 * when the org has no credit. The frontend turns INSUFFICIENT_CREDIT into a
 * role-aware prompt (admin/owner → recharge; agent → ask an admin).
 */
describe("calls — credit gate (requestOutboundCall)", () => {
    let t: any;
    let orgId: string;
    let userId: string;
    let convId: string;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const ids = await t.run(async (ctx: any) => {
            const user = await ctx.db.insert("users", { email: "owner@a.com", name: "Owner" });
            const org = await ctx.db.insert("organizations", {
                name: "Org", ownerId: user, plan: "PRO",
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            await ctx.db.insert("memberships", {
                userId: user, organizationId: org, role: "OWNER", status: "ONLINE",
                maxConversations: 10, activeConversations: 0, lastSeenAt: Date.now(), joinedAt: Date.now(),
            });
            const contactId = await ctx.db.insert("contacts", {
                organizationId: org, name: "Client", phone: "+221770000001",
                searchName: "client", createdAt: Date.now(), updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: org, contactId, channel: "WHATSAPP", status: "OPEN",
                lastMessageAt: Date.now(), unreadCount: 0, preview: "", createdAt: Date.now(), updatedAt: Date.now(),
            });
            return { user, org, conv };
        });
        userId = ids.user;
        orgId = ids.org;
        convId = ids.conv;
    });

    afterEach(async () => {
        // requestOutboundCall schedules the CPR action; cancel any pending job so
        // convex-test teardown doesn't try to run a scheduled action.
        await t.run(async (ctx: any) => {
            const jobs = await ctx.db.system.query("_scheduled_functions").collect();
            for (const job of jobs) {
                if (job.state.kind === "pending" || job.state.kind === "inProgress") {
                    await ctx.scheduler.cancel(job._id);
                }
            }
        });
    });

    it("blocks an outbound call when the org has no credit", async () => {
        await expect(
            t.withIdentity({ subject: userId, issuer: "test" })
                .mutation(api.calls.requestOutboundCall, { conversationId: convId }),
        ).rejects.toThrow(/insufficient_credit|insuffisant/i);

        const calls = await t.run(async (ctx: any) => ctx.db.query("calls").collect());
        expect(calls).toHaveLength(0); // no call record created
    });

    it("allows an outbound call when the org has credit", async () => {
        await t.run(async (ctx: any) => ctx.db.patch(orgId, { creditBalance: 500 }));

        const result = await t.withIdentity({ subject: userId, issuer: "test" })
            .mutation(api.calls.requestOutboundCall, { conversationId: convId });
        expect(result.callId).toBeDefined();

        const calls = await t.run(async (ctx: any) => ctx.db.query("calls").collect());
        expect(calls).toHaveLength(1);
        expect(calls[0].direction).toBe("OUTBOUND");
    });

    it("debits the org credit when an outbound call ends (terminateCall)", async () => {
        await t.run(async (ctx: any) => ctx.db.patch(orgId, { creditBalance: 1000 }));
        const callId = await t.run(async (ctx: any) =>
            ctx.db.insert("calls", {
                organizationId: orgId, conversationId: convId, direction: "OUTBOUND",
                externalCallId: "wacid.bill", fromPhone: "", toPhone: "+221770000001",
                agentId: userId, status: "CONNECTED",
                answeredAt: Date.now() - 90_000, // ~90s ago → 2 started minutes
                startedAt: Date.now() - 100_000, createdAt: Date.now(), updatedAt: Date.now(),
            }),
        );

        await t.withIdentity({ subject: userId, issuer: "test" })
            .mutation(api.calls.terminateCall, { callId });

        // 90s → ceil(90/60) = 2 min × 10 FCFA (Senegal) = 20 FCFA debited.
        const org = await t.run(async (ctx: any) => ctx.db.get(orgId));
        expect(org.creditBalance).toBe(980);

        const txns = await t.run(async (ctx: any) => ctx.db.query("creditTransactions").collect());
        expect(txns.some((x: any) => x.type === "USAGE" && x.amount === -20)).toBe(true);
    });
});
