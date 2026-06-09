import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getCurrentOrgId } from "./lib/auth";
import { rateLimiter } from "./lib/rateLimits";

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifie");

        await rateLimiter.limit(ctx, "uploadFile", { key: userId, throws: true });

        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Mint a signed download URL for a stored object.
 *
 * SECURITY: a raw `ctx.storage.getUrl(storageId)` is a cross-tenant IDOR —
 * any authenticated user could mint a URL for ANY object in the deployment.
 * The only client-initiated download path is shortcut media (MessageInput),
 * so we require the storageId to be referenced by a shortcut **in the
 * caller's own organization** before handing back a URL. Shortcuts per org
 * are few, so the org-scoped scan is cheap.
 */
export const getDownloadUrl = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) throw new Error("Non authentifie");

        const owningShortcut = await ctx.db
            .query("shortcuts")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .filter((q) => q.eq(q.field("mediaStorageId"), args.storageId))
            .first();
        if (!owningShortcut) {
            throw new Error("Média introuvable dans cette organisation");
        }

        return await ctx.storage.getUrl(args.storageId);
    },
});
