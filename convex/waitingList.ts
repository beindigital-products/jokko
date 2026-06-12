import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { rateLimiter, isValidEmail } from "./lib/rateLimits";

// Length bound for the public (unauthenticated) marketing free-text inputs.
// (Email length is bounded inside isValidEmail.)
const MAX_NAME = 200;

export const join = mutation({
    args: {
        email: v.string(),
        companyName: v.string(),
        representativeName: v.string()
    },
    handler: async (ctx, args) => {
        // Validate + normalize untrusted public input before any DB work.
        const email = args.email.trim().toLowerCase();
        if (!isValidEmail(email)) {
            throw new Error("Adresse email invalide");
        }
        const companyName = args.companyName.trim();
        const representativeName = args.representativeName.trim();
        if (companyName.length > MAX_NAME || representativeName.length > MAX_NAME) {
            throw new Error("Champ trop long");
        }

        // Abuse protection: keyed by normalized email (endpoint is public).
        await rateLimiter.limit(ctx, "waitingListJoin", { key: email, throws: true });

        const existing = await ctx.db
            .query("waitingList")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existing) {
            return { success: true, message: "Vous êtes déjà sur la liste d'attente !" };
        }

        await ctx.db.insert("waitingList", {
            email,
            companyName,
            representativeName,
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
        const email = args.email.trim().toLowerCase();
        if (!isValidEmail(email)) {
            throw new Error("Adresse email invalide");
        }
        const source = args.source?.trim().slice(0, MAX_NAME) ?? "newsletter";

        await rateLimiter.limit(ctx, "newsletterSubscribe", { key: email, throws: true });

        const existing = await ctx.db
            .query("waitingList")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existing) {
            return { success: true, alreadySubscribed: true };
        }

        await ctx.db.insert("waitingList", {
            email,
            companyName: "newsletter",
            representativeName: source,
            status: "NEWSLETTER",
            createdAt: Date.now(),
        });

        return { success: true, alreadySubscribed: false };
    },
});
