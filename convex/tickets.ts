import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rateLimiter, isValidEmail } from "./lib/rateLimits";

// Bounds for the (partly public) support-ticket inputs.
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
const MAX_PHONE = 40;

export const create = mutation({
    args: {
        subject: v.string(),
        message: v.string(),
        type: v.union(
            v.literal("BUG"),
            v.literal("FEATURE"),
            v.literal("BILLING"),
            v.literal("OTHER")
        ),
        priority: v.optional(v.union(
            v.literal("LOW"),
            v.literal("MEDIUM"),
            v.literal("HIGH"),
            v.literal("URGENT")
        )),
        contactEmail: v.optional(v.string()),
        contactPhone: v.optional(v.string()),
        attachmentStorageId: v.optional(v.id("_storage")),
        organizationId: v.optional(v.id("organizations")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        // Validate + bound untrusted input.
        const subject = args.subject.trim();
        const message = args.message.trim();
        if (!subject) throw new Error("Sujet requis");
        if (!message) throw new Error("Message requis");
        if (subject.length > MAX_SUBJECT) throw new Error("Sujet trop long");
        if (message.length > MAX_MESSAGE) throw new Error("Message trop long");

        const contactEmail = args.contactEmail?.trim();
        if (contactEmail && !isValidEmail(contactEmail)) {
            throw new Error("Adresse email invalide");
        }
        const contactPhone = args.contactPhone?.trim().slice(0, MAX_PHONE);

        // SECURITY: organizationId is client-supplied. Only attach the ticket to
        // an org the caller is actually a member of — otherwise a user could file
        // a ticket against an arbitrary tenant. Unauthenticated callers (public
        // support form) get no org context.
        let organizationId: typeof args.organizationId = undefined;
        if (userId && args.organizationId) {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user_org", (q) =>
                    q.eq("userId", userId).eq("organizationId", args.organizationId!),
                )
                .first();
            if (membership) organizationId = args.organizationId;
        }

        // Abuse protection: keyed by user when known, else by contact email, else
        // a shared anonymous bucket.
        const rateKey = userId ?? (contactEmail ? `email:${contactEmail.toLowerCase()}` : "anon");
        await rateLimiter.limit(ctx, "createTicket", { key: rateKey, throws: true });

        const ticketId = await ctx.db.insert("tickets", {
            subject,
            message,
            type: args.type,
            priority: args.priority,
            contactEmail,
            contactPhone,
            attachmentStorageId: args.attachmentStorageId,
            organizationId,
            userId: userId ?? undefined, // If user is logged in
            status: "OPEN",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return ticketId;
    },
});

export const listByUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("tickets")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});
