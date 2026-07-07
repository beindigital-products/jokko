import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentOrgId } from "./lib/auth";
import { getMaxStorageMB, isUnlimited } from "./lib/planHelpers";

/**
 * Current media storage usage for the caller's org (for the billing UI).
 */
export const getUsage = query({
    args: {},
    handler: async (ctx) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) return null;
        const org = await ctx.db.get(orgId);
        if (!org) return null;
        const maxMB = await getMaxStorageMB(ctx, org.plan);
        return {
            usedBytes: org.storageBytesUsed ?? 0,
            maxMB,
            unlimited: isUnlimited(maxMB),
        };
    },
});

/**
 * Repair the storage counter from the truth: sum the sizes of every _storage
 * blob referenced by the org's messages. Paginated + self-rescheduling so it
 * scales past a single mutation's read budget. Run manually (or from a cron)
 * to correct any drift the incremental counter accumulated.
 */
export const recompute = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        cursor: v.optional(v.string()),
        accum: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const page = await ctx.db
            .query("messages")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .paginate({ cursor: args.cursor ?? null, numItems: 500 });

        let total = args.accum ?? 0;
        for (const m of page.page) {
            if (m.mediaStorageId) {
                const meta = await ctx.db.system.get(m.mediaStorageId);
                total += meta?.size ?? 0;
            }
        }

        if (!page.isDone) {
            await ctx.scheduler.runAfter(0, internal.storage_usage.recompute, {
                organizationId: args.organizationId,
                cursor: page.continueCursor,
                accum: total,
            });
            return;
        }

        await ctx.db.patch(args.organizationId, { storageBytesUsed: total });
    },
});
