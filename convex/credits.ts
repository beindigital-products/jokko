import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { getCurrentOrgId } from "./lib/auth";

/**
 * Get the current credit balance for the active organization
 */
export const getBalance = query({
    args: {},
    handler: async (ctx) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) return null;

        const org = await ctx.db.get(orgId);
        return org?.creditBalance ?? 0;
    },
});

/**
 * Get transaction history
 */
export const getTransactions = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) return [];

        return await ctx.db
            .query("creditTransactions")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .order("desc") // Most recent first
            .take(args.limit ?? 20);
    },
});

/**
 * Add credits to an organization (Admin or Webhook usage)
 */
export const addCredits = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        amount: v.number(),
        description: v.optional(v.string()),
        referenceId: v.optional(v.string()),
        type: v.union(
            v.literal("RECHARGE"),
            v.literal("BONUS"),
            v.literal("REFUND"),
            v.literal("ADJUSTMENT")
        ),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Org not found");

        const currentBalance = org.creditBalance ?? 0;
        const newBalance = currentBalance + args.amount;

        await ctx.db.patch(args.organizationId, {
            creditBalance: newBalance,
        });

        await ctx.db.insert("creditTransactions", {
            organizationId: args.organizationId,
            amount: args.amount,
            type: args.type,
            description: args.description,
            referenceId: args.referenceId,
            balanceAfter: newBalance,
            createdAt: Date.now(),
        });

        return newBalance;
    },
});

/**
 * Deduct credits from a specific organization (Internal/System usage).
 *
 * NOTE: the former public `deductCredits` mutation was removed. Letting the
 * client pick the amount and when to call it meant credit consumption was
 * enforced client-side (skippable / spoofable). Debiting now happens
 * server-side and atomically inside the billable action (e.g. broadcasts.ts)
 * through this internal mutation.
 */
export const internalDeductCredits = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        amount: v.number(),
        description: v.string(),
        referenceId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const org = await ctx.db.get(args.organizationId);
        if (!org) throw new Error("Org not found");

        const currentBalance = org.creditBalance ?? 0;

        if (currentBalance < args.amount) {
            throw new Error("Insufficient credits");
        }

        const newBalance = currentBalance - args.amount;

        await ctx.db.patch(args.organizationId, {
            creditBalance: newBalance,
        });

        await ctx.db.insert("creditTransactions", {
            organizationId: args.organizationId,
            amount: -args.amount,
            type: "USAGE",
            description: args.description,
            referenceId: args.referenceId,
            balanceAfter: newBalance,
            createdAt: Date.now(),
        });

        return { success: true, newBalance };
    },
});

/**
 * Debug: Add credits (internal only — not callable from clients)
 */
export const debugAddCredits = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const orgId = args.organizationId;

        const org = await ctx.db.get(orgId);
        if (!org) throw new Error("Org not found");

        const currentBalance = org.creditBalance ?? 0;
        const newBalance = currentBalance + args.amount;

        await ctx.db.patch(orgId, {
            creditBalance: newBalance,
        });

        await ctx.db.insert("creditTransactions", {
            organizationId: orgId,
            amount: args.amount,
            type: "RECHARGE",
            description: "Recharge Test / Debug",
            balanceAfter: newBalance,
            createdAt: Date.now(),
        });

        return newBalance;
    },
});
