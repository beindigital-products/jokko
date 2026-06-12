import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const join = mutation({
    args: {
        email: v.string(),
        companyName: v.string(),
        representativeName: v.string()
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("waitingList")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existing) {
            return { success: true, message: "Vous êtes déjà sur la liste d'attente !" };
        }

        await ctx.db.insert("waitingList", {
            email: args.email,
            companyName: args.companyName,
            representativeName: args.representativeName,
            status: "PENDING",
            createdAt: Date.now(),
        });

        return { success: true, message: "Vous avez rejoint la liste d'attente avec succès !" };
    },
});

export const subscribeNewsletter = mutation({
    args: {
        email: v.string(),
        source: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("waitingList")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existing) {
            return { success: true, alreadySubscribed: true };
        }

        await ctx.db.insert("waitingList", {
            email: args.email,
            companyName: "newsletter",
            representativeName: args.source ?? "newsletter",
            status: "NEWSLETTER",
            createdAt: Date.now(),
        });

        return { success: true, alreadySubscribed: false };
    },
});

