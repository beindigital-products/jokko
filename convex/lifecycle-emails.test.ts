import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

const DAY = 24 * 60 * 60 * 1000;

/**
 * The daily trial-reminder cron nudges orgs whose trial ends within 2 days and
 * that have not chosen a plan, exactly once each. The send action itself no-ops
 * without SES, so we assert on the trialReminderSentAt marker.
 */
describe("runTrialReminders — rappel de fin d'essai", () => {
    let t: any;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    async function makeOrg(opts: { trialEndsInDays: number; stripeStatus?: string; alreadyReminded?: boolean }) {
        return t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "owner@t.com", name: "O" });
            const now = Date.now();
            return ctx.db.insert("organizations", {
                name: "Org",
                ownerId: owner,
                plan: "FREE",
                trialEndsAt: now + opts.trialEndsInDays * DAY,
                ...(opts.stripeStatus ? { stripe: { customerId: "c", status: opts.stripeStatus } } : {}),
                ...(opts.alreadyReminded ? { trialReminderSentAt: now - DAY } : {}),
                createdAt: now,
                updatedAt: now,
            });
        });
    }

    const remindedAt = (orgId: any) =>
        t.run(async (ctx: any) => (await ctx.db.get(orgId)).trialReminderSentAt);

    it("reminds an org ending soon with no plan chosen", async () => {
        const org = await makeOrg({ trialEndsInDays: 1 });
        await t.action(internal.lifecycle_emails.runTrialReminders, {});
        expect(await remindedAt(org)).toBeTruthy();
    });

    it("ignores an org with a comfortable trial", async () => {
        const org = await makeOrg({ trialEndsInDays: 10 });
        await t.action(internal.lifecycle_emails.runTrialReminders, {});
        expect(await remindedAt(org)).toBeFalsy();
    });

    it("ignores an org already on an active Stripe subscription", async () => {
        const org = await makeOrg({ trialEndsInDays: 1, stripeStatus: "active" });
        await t.action(internal.lifecycle_emails.runTrialReminders, {});
        expect(await remindedAt(org)).toBeFalsy();
    });

    it("never reminds an org twice", async () => {
        const org = await makeOrg({ trialEndsInDays: 1, alreadyReminded: true });
        const before = await remindedAt(org);
        await t.action(internal.lifecycle_emails.runTrialReminders, {});
        expect(await remindedAt(org)).toBe(before); // unchanged
    });
});
