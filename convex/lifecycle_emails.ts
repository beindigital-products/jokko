import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { sendWelcomeEmail, sendTrialReminderEmail } from "./lib/email";

/**
 * Lifecycle emails — welcome (once, on onboarding completion) and trial-ending
 * reminder (daily cron, once per org). Sends are best-effort and skip silently
 * when AWS SES isn't configured (test / local dev), mirroring the mention-email
 * module so the SES/react-email deps stay off hot paths.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_MS = 14 * DAY_MS;
// Remind when the trial has 2 days or fewer left.
const REMINDER_WINDOW_MS = 2 * DAY_MS;

export const sendWelcome = internalAction({
    args: { to: v.string(), userName: v.string() },
    handler: async (_ctx, args) => {
        if (!process.env.AWS_SES_FROM_EMAIL) return;
        const base = process.env.APP_URL ?? "https://app.jokko.co";
        try {
            await sendWelcomeEmail({
                to: args.to,
                userName: args.userName,
                dashboardUrl: `${base}/dashboard`,
            });
        } catch (e) {
            console.error("[welcome-email] échec d'envoi:", e);
        }
    },
});

/** Orgs whose trial ends within the window and that haven't chosen a plan. */
export const findTrialRemindees = internalQuery({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const orgs = await ctx.db.query("organizations").collect();
        const out: { orgId: Id<"organizations">; email: string; name: string; daysLeft: number }[] = [];

        for (const org of orgs) {
            if (org.trialReminderSentAt) continue; // already reminded once

            const trialEnd = org.trialEndsAt ?? ((org.createdAt ?? now) + TRIAL_MS);
            const msLeft = trialEnd - now;
            if (msLeft <= 0 || msLeft > REMINDER_WINDOW_MS) continue; // not in window

            const status = org.stripe?.status;
            if (status === "active" || status === "trialing") continue; // already paying

            const owner = await ctx.db.get(org.ownerId);
            if (!owner?.email) continue;

            out.push({
                orgId: org._id,
                email: owner.email,
                name: owner.name ?? "",
                daysLeft: Math.max(1, Math.ceil(msLeft / DAY_MS)),
            });
        }
        return out;
    },
});

export const markReminded = internalMutation({
    args: { orgId: v.id("organizations") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.orgId, { trialReminderSentAt: Date.now() });
    },
});

/**
 * Daily cron entry point. Runs as an action so it can send emails directly
 * (marking each org via a mutation first, so a send failure never re-spams).
 */
export const runTrialReminders = internalAction({
    args: {},
    handler: async (ctx) => {
        const remindees = await ctx.runQuery(internal.lifecycle_emails.findTrialRemindees, {});
        const base = process.env.APP_URL ?? "https://app.jokko.co";

        for (const r of remindees) {
            // Mark first (idempotent guard): a failed send won't cause a re-send.
            await ctx.runMutation(internal.lifecycle_emails.markReminded, { orgId: r.orgId });

            if (!process.env.AWS_SES_FROM_EMAIL) continue;
            try {
                await sendTrialReminderEmail({
                    to: r.email,
                    userName: r.name,
                    daysLeft: r.daysLeft,
                    billingUrl: `${base}/dashboard/billing`,
                });
            } catch (e) {
                console.error("[trial-reminder-email] échec d'envoi:", e);
            }
        }
    },
});
