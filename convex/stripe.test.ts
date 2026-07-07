import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * Stripe delivers subscription events at-least-once and can replay an OLD event
 * after a newer one (out-of-order retry). The ordering guard (stripe.lastEventAt)
 * must drop the stale event so it cannot clobber the current subscription state.
 */
describe("Stripe subscription — out-of-order event guard", () => {
    let t: any;
    let orgId: any;
    const customerId = "cus_TEST";

    beforeEach(async () => {
        t = convexTest(schema, modules);
        // enforceChannelDowngrade (called by the subscription mutations) reads
        // the plans table, so it must be seeded.
        await t.mutation(internal.plans.seedPlans, {});
        orgId = await t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "o@test.com", name: "O" });
            return await ctx.db.insert("organizations", {
                name: "Org", ownerId: owner, plan: "BUSINESS",
                stripe: { customerId },
                createdAt: Date.now(), updatedAt: Date.now(),
            });
        });
    });

    const stripe = () => t.run(async (ctx: any) => (await ctx.db.get(orgId)).stripe);
    const update = (status: string, eventCreated: number) =>
        t.mutation(internal.stripe.updateSubscription, {
            stripeCustomerId: customerId, subscriptionId: "sub_1", priceId: "price_x",
            status, currentPeriodEnd: 999, eventCreated,
        });

    it("ignores a stale update that arrives after a newer one", async () => {
        await update("active", 2000);
        expect((await stripe()).status).toBe("active");
        expect((await stripe()).lastEventAt).toBe(2000);

        await update("past_due", 1000); // older event, delivered late
        const s = await stripe();
        expect(s.status).toBe("active");  // NOT regressed
        expect(s.lastEventAt).toBe(2000); // unchanged
    });

    it("ignores a stale cancel after a newer active event", async () => {
        await update("active", 2000);
        await t.mutation(internal.stripe.cancelSubscription, {
            stripeCustomerId: customerId, eventCreated: 1500, // older than 2000
        });
        expect((await stripe()).status).toBe("active"); // cancel dropped
    });

    it("applies a newer event normally", async () => {
        await update("active", 1000);
        await update("canceled", 2000);
        expect((await stripe()).status).toBe("canceled");
    });

    it("invoice.payment_failed flips the org to past_due and notifies the owner", async () => {
        await update("active", 1000);
        await t.mutation(internal.stripe.markInvoicePaymentFailed, {
            stripeCustomerId: customerId, eventCreated: 2000,
        });
        expect((await stripe()).status).toBe("past_due");

        const notifs = await t.run(async (ctx: any) =>
            ctx.db.query("notifications").filter((q: any) => q.eq(q.field("type"), "SYSTEM")).collect());
        expect(notifs.length).toBe(1);
        expect(notifs[0].link).toBe("/dashboard/billing");
    });

    it("invoice.paid recovers a past_due org back to active", async () => {
        await t.mutation(internal.stripe.markInvoicePaymentFailed, {
            stripeCustomerId: customerId, eventCreated: 1000,
        });
        expect((await stripe()).status).toBe("past_due");
        await t.mutation(internal.stripe.markInvoicePaid, {
            stripeCustomerId: customerId, eventCreated: 2000,
        });
        expect((await stripe()).status).toBe("active");
    });

    it("ignores a stale invoice.payment_failed", async () => {
        await update("active", 2000);
        await t.mutation(internal.stripe.markInvoicePaymentFailed, {
            stripeCustomerId: customerId, eventCreated: 1000, // older than the active event
        });
        expect((await stripe()).status).toBe("active"); // not flipped
    });
});
