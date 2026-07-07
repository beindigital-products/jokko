import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { planFromPriceId } from "./lib/stripePlans";
import { enforceChannelDowngrade } from "./lib/planEnforcement";
import { createNotification } from "./notifications";

/**
 * True when a Stripe webhook event is older than the last one already applied
 * to this org (out-of-order retry). Stripe delivers events at-least-once and
 * can replay an old event after a newer one; applying it would clobber the
 * current subscription state. `eventCreated` is `event.created` (unix seconds).
 */
function isStaleStripeEvent(
    org: { stripe?: { lastEventAt?: number } | null },
    eventCreated: number | undefined,
): boolean {
    const last = org.stripe?.lastEventAt;
    return eventCreated != null && last != null && eventCreated < last;
}

/**
 * Persist the Stripe customer ID immediately after creation.
 * Prevents duplicate customer creation on concurrent calls.
 */
export const saveCustomerId = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        stripeCustomerId: v.string(),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error(`Organization ${args.organizationId} not found`);

        await ctx.db.patch(org._id, {
            stripe: {
                ...org.stripe,
                customerId: args.stripeCustomerId,
            },
            updatedAt: Date.now(),
        });
    },
});

/**
 * Called when a Stripe Checkout Session completes (new subscription).
 * - Resolves the priceId from the subscription object (not session metadata)
 * - Sets trialUsed = true to prevent unlimited free trials
 */
export const handleCheckoutCompleted = internalMutation({
    args: {
        organizationId: v.string(),
        stripeCustomerId: v.string(),
        subscriptionId: v.string(),
        priceId: v.string(),
        currentPeriodEnd: v.number(),
        status: v.string(),
        eventCreated: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId as Id<"organizations">);
        if (!org) throw new Error(`Organization ${args.organizationId} not found`);

        // Ordering guard: ignore a Stripe event older than the last one applied
        // (out-of-order retry) so a stale event can't overwrite a newer state.
        if (isStaleStripeEvent(org, args.eventCreated)) {
            console.warn(`[Stripe] Stale checkout event for ${org._id} ignored`);
            return;
        }

        const plan = planFromPriceId(args.priceId);

        await ctx.db.patch(org._id, {
            plan: plan,
            hasSelectedPlan: true,
            stripe: {
                customerId: args.stripeCustomerId,
                subscriptionId: args.subscriptionId,
                priceId: args.priceId,
                status: args.status,
                currentPeriodEnd: args.currentPeriodEnd,
                trialUsed: true, // Mark trial as used
                lastEventAt: args.eventCreated ?? org.stripe?.lastEventAt,
            },
            updatedAt: Date.now(),
        });

        // Cascade enforcement si le nouveau plan a des limites inférieures
        await enforceChannelDowngrade(ctx, org._id as Id<"organizations">, plan);
    },
});

/**
 * Called when a subscription is updated (renewal, plan change, status change).
 */
export const updateSubscription = internalMutation({
    args: {
        stripeCustomerId: v.string(),
        subscriptionId: v.string(),
        priceId: v.string(),
        status: v.string(),
        currentPeriodEnd: v.number(),
        organizationId: v.optional(v.string()),
        eventCreated: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Try by stripe customer index first, fallback to direct org ID
        let org: any = await ctx.db
            .query("organizations")
            .withIndex("by_stripe_customer", (q) => q.eq("stripe.customerId", args.stripeCustomerId))
            .first();

        if (!org && args.organizationId) {
            org = await ctx.db.get(args.organizationId as any);
        }

        if (!org) {
            console.error(`[Stripe] No org found for customer ${args.stripeCustomerId}`);
            return;
        }

        // Ordering guard: ignore an out-of-order (stale) Stripe event so it
        // can't clobber a newer subscription state.
        if (isStaleStripeEvent(org, args.eventCreated)) {
            console.warn(`[Stripe] Stale subscription event for ${org._id} ignored`);
            return;
        }

        const plan = planFromPriceId(args.priceId);

        // Determine if trial was used (status is trialing or was trialing before)
        const trialUsed = org.stripe?.trialUsed === true ||
            args.status === "trialing" ||
            args.status === "active";

        await ctx.db.patch(org._id, {
            plan: plan,
            hasSelectedPlan: true,
            stripe: {
                customerId: args.stripeCustomerId,
                subscriptionId: args.subscriptionId,
                priceId: args.priceId,
                status: args.status,
                currentPeriodEnd: args.currentPeriodEnd,
                trialUsed,
                lastEventAt: args.eventCreated ?? org.stripe?.lastEventAt,
            },
            updatedAt: Date.now(),
        });

        await enforceChannelDowngrade(ctx, org._id, plan);
    },
});

/**
 * Called when a subscription is canceled/deleted.
 */
export const cancelSubscription = internalMutation({
    args: {
        stripeCustomerId: v.string(),
        eventCreated: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_stripe_customer", (q) => q.eq("stripe.customerId", args.stripeCustomerId))
            .first();

        if (!org) {
            console.error(`[Stripe] No org found for customer ${args.stripeCustomerId}`);
            return;
        }

        // Ordering guard: a stale cancel event must not downgrade an org that a
        // newer event has since re-activated.
        if (isStaleStripeEvent(org, args.eventCreated)) {
            console.warn(`[Stripe] Stale cancel event for ${org._id} ignored`);
            return;
        }

        await ctx.db.patch(org._id, {
            plan: "FREE",
            hasSelectedPlan: false,
            stripe: {
                customerId: args.stripeCustomerId,
                subscriptionId: org.stripe?.subscriptionId,
                priceId: org.stripe?.priceId,
                status: "canceled",
                currentPeriodEnd: org.stripe?.currentPeriodEnd,
                trialUsed: org.stripe?.trialUsed ?? true,
                lastEventAt: args.eventCreated ?? org.stripe?.lastEventAt,
            },
            updatedAt: Date.now(),
        });

        await enforceChannelDowngrade(ctx, org._id, "FREE");
    },
});

/**
 * A subscription renewal payment failed (invoice.payment_failed). Flip the org
 * to `past_due` and alert the owner. Previously this produced NO signal at all —
 * an expired card silently degraded the account until the subscription was
 * eventually canceled downstream.
 */
export const markInvoicePaymentFailed = internalMutation({
    args: { stripeCustomerId: v.string(), eventCreated: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_stripe_customer", (q) => q.eq("stripe.customerId", args.stripeCustomerId))
            .first();
        if (!org) {
            console.error(`[Stripe] No org found for customer ${args.stripeCustomerId}`);
            return;
        }
        if (isStaleStripeEvent(org, args.eventCreated)) return;

        await ctx.db.patch(org._id, {
            stripe: {
                ...(org.stripe ?? {}),
                customerId: args.stripeCustomerId,
                status: "past_due",
                lastEventAt: args.eventCreated ?? org.stripe?.lastEventAt,
            },
            updatedAt: Date.now(),
        });

        await createNotification(ctx, {
            organizationId: org._id,
            userId: org.ownerId,
            type: "SYSTEM",
            title: "Échec de paiement",
            message:
                "Le renouvellement de votre abonnement a échoué. Mettez à jour votre moyen de paiement pour éviter l'interruption du service.",
            link: "/dashboard/billing",
            metadata: {},
        });
    },
});

/**
 * A subscription invoice was paid (invoice.paid). If the org was `past_due`,
 * clear it back to `active` — the payment recovered.
 */
export const markInvoicePaid = internalMutation({
    args: { stripeCustomerId: v.string(), eventCreated: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const org = await ctx.db
            .query("organizations")
            .withIndex("by_stripe_customer", (q) => q.eq("stripe.customerId", args.stripeCustomerId))
            .first();
        if (!org || !org.stripe) return;
        if (isStaleStripeEvent(org, args.eventCreated)) return;

        await ctx.db.patch(org._id, {
            stripe: {
                ...org.stripe,
                status: org.stripe.status === "past_due" ? "active" : org.stripe.status,
                lastEventAt: args.eventCreated ?? org.stripe.lastEventAt,
            },
            updatedAt: Date.now(),
        });
    },
});

/**
 * Migration / régularisation rétroactive : applique la règle de cascade
 * à toutes les organisations existantes. Utile après le déploiement
 * pour désactiver les canaux excédentaires d'orgs déjà en dépassement.
 */
export const backfillPlanLimits = internalMutation({
    args: {},
    handler: async (ctx) => {
        const orgs = await ctx.db.query("organizations").collect();
        let totalDisabled = 0;
        let orgsAffected = 0;
        for (const org of orgs) {
            const disabled = await enforceChannelDowngrade(ctx, org._id, org.plan);
            if (disabled > 0) {
                totalDisabled += disabled;
                orgsAffected += 1;
            }
        }
        console.log(
            `[backfillPlanLimits] Désactivé ${totalDisabled} canaux dans ${orgsAffected} orgs`,
        );
        return { totalDisabled, orgsAffected };
    },
});
