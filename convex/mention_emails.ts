import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { sendMentionEmail } from "./lib/email";

/**
 * Proactive email for an @mention in an internal note. Scheduled (best-effort)
 * from messages.addInternalNote after the in-app MENTION notification. Isolated
 * in its own module so the AWS SES / react-email deps don't load into the hot
 * messages.ts path. A send failure is logged, never thrown (the note + in-app
 * notification already landed).
 */
export const send = internalAction({
    args: {
        to: v.string(),
        authorName: v.string(),
        where: v.string(),
        excerpt: v.string(),
        conversationId: v.string(),
    },
    handler: async (_ctx, args) => {
        // No email infra configured (test / local dev) → skip silently.
        if (!process.env.AWS_SES_FROM_EMAIL) return;

        const base = process.env.APP_URL ?? "https://app.jokko.co";
        const url = `${base}/dashboard/conversations/${args.conversationId}`;
        try {
            await sendMentionEmail({
                to: args.to,
                authorName: args.authorName,
                where: args.where,
                excerpt: args.excerpt,
                url,
            });
        } catch (e) {
            console.error("[mention-email] échec d'envoi:", e);
        }
    },
});
