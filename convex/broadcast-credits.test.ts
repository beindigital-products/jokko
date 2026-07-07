import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * The campaign audience cost is debited upfront when the chunked sender starts
 * (cursor 0). deductBroadcastCredits must be EXACTLY-ONCE per campaign so a
 * crash-and-rerun at cursor 0 never double-charges the org.
 */
describe("deductBroadcastCredits — idempotence", () => {
    let t: any;
    let orgId: any;
    let broadcastId: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const s = await t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "o@test.com", name: "O" });
            const org = await ctx.db.insert("organizations", {
                name: "Org", ownerId: owner, plan: "BUSINESS", creditBalance: 10_000,
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            const templateId = await ctx.db.insert("templates", {
                organizationId: org, name: "T", slug: "t", type: "MARKETING", category: "MARKETING",
                language: "fr", status: "APPROVED", body: "Hi",
                sentCount: 0, deliveredCount: 0, readCount: 0, repliedCount: 0,
                clickedCount: 0, convertedCount: 0, failedCount: 0, blockedCount: 0,
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            const broadcast = await ctx.db.insert("broadcasts", {
                organizationId: org, name: "Campagne", templateId,
                audienceConfig: { type: "ALL" }, status: "SENDING",
                sentCount: 0, deliveredCount: 0, readCount: 0, repliedCount: 0, failedCount: 0,
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            return { org, broadcast };
        });
        orgId = s.org;
        broadcastId = s.broadcast;
    });

    const balance = () => t.run(async (ctx: any) => (await ctx.db.get(orgId)).creditBalance);
    const usageTxns = () => t.run(async (ctx: any) =>
        ctx.db.query("creditTransactions").filter((q: any) => q.eq(q.field("type"), "USAGE")).collect());

    it("debits once even when called twice at cursor 0", async () => {
        const args = { broadcastId, organizationId: orgId, amount: 800, audienceTotal: 50 };
        const r1 = await t.mutation(internal.broadcasts.deductBroadcastCredits, args);
        const r2 = await t.mutation(internal.broadcasts.deductBroadcastCredits, args);

        expect(r1.ok).toBe(true);
        expect(r2.ok).toBe(true);
        expect(r2.alreadyCharged).toBe(true);
        expect(await balance()).toBe(10_000 - 800); // debited ONCE, not twice
        expect((await usageTxns()).length).toBe(1);   // single ledger entry

        const b = await t.run(async (ctx: any) => ctx.db.get(broadcastId));
        expect(b.creditsDeducted).toBe(true);
        expect(b.audienceTotal).toBe(50);
    });

    it("fails without debiting when credits are insufficient", async () => {
        const r = await t.mutation(internal.broadcasts.deductBroadcastCredits, {
            broadcastId, organizationId: orgId, amount: 999_999, audienceTotal: 50,
        });
        expect(r.ok).toBe(false);
        expect(r.reason).toBe("insufficient_credits");
        expect(await balance()).toBe(10_000); // untouched
        expect((await usageTxns()).length).toBe(0);
    });
});
