import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

/**
 * Mentions feed — the dedicated "Mentions" page (Inbox · mentions).
 *
 * Source of truth is the `notifications` table, which is already populated
 * whenever a teammate @mentions you in an internal note (`MENTION`, written by
 * `messages.addInternalNote`) or a conversation is assigned to you
 * (`ASSIGNMENT`, written by `assignments.ts`). We read the current user's
 * notifications, keep only those two kinds, and enrich each one into a
 * structured row the UI can render as a card:
 *
 *   - `MENTION`   → joined via `metadata.messageId` to the real internal note,
 *                   so we surface the actual author + note body + conversation.
 *   - `ASSIGNMENT`→ no note/actor is stored, so we fall back to the
 *                   notification's own copy and the conversation contact.
 *
 * Scoped to the user's current organization (multi-tenant model). Read state
 * is returned untouched — opening the page does NOT mark anything read; the UI
 * marks a single mention read only when the user clicks through to it.
 */

export type MentionKind = "mention" | "assignment";

export interface MentionFeedRow {
    /** Notification id — also used by the UI to mark this entry read on click. */
    id: string;
    kind: MentionKind;
    /** Display name of the teammate who acted, when known (null for assignments). */
    actorName: string | null;
    /** Conversation / contact name, when resolvable. */
    conversationName: string | null;
    /** The internal note body (mention) or the notification copy (assignment). */
    note: string;
    /** Deep link to the conversation thread. */
    link: string | null;
    isRead: boolean;
    createdAt: number;
}

type MentionMetadata = {
    conversationId?: string;
    messageId?: string;
};

function readMetadata(metadata: unknown): MentionMetadata {
    if (!metadata || typeof metadata !== "object") return {};
    const m = metadata as Record<string, unknown>;
    return {
        conversationId:
            typeof m.conversationId === "string" ? m.conversationId : undefined,
        messageId: typeof m.messageId === "string" ? m.messageId : undefined,
    };
}

export const feed = query({
    args: {},
    handler: async (ctx): Promise<MentionFeedRow[]> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        // Scope to the active organization (multi-tenant: notifications can span
        // several orgs a user belongs to).
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        const orgId = session?.currentOrganizationId;
        if (!orgId) return [];

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .take(80);

        const relevant = notifications.filter(
            (n) =>
                n.organizationId === orgId &&
                (n.type === "MENTION" || n.type === "ASSIGNMENT"),
        );

        const rows: MentionFeedRow[] = [];

        for (const n of relevant) {
            const kind: MentionKind = n.type === "ASSIGNMENT" ? "assignment" : "mention";
            const meta = readMetadata(n.metadata);

            let actorName: string | null = null;
            let conversationName: string | null = null;
            let note = n.message;

            // The internal note (mention only) holds the real body + author.
            if (meta.messageId) {
                const message = await ctx.db.get(meta.messageId as Id<"messages">);
                if (message) {
                    note = message.content || note;
                    if (message.senderId) {
                        const author = await ctx.db.get(message.senderId);
                        actorName = author?.name || author?.email || null;
                    }
                }
            }

            // Resolve the conversation contact name for the headline.
            if (meta.conversationId) {
                const conversation = await ctx.db.get(
                    meta.conversationId as Id<"conversations">,
                );
                if (conversation?.contactId) {
                    const contact = await ctx.db.get(conversation.contactId);
                    conversationName = contact?.name || contact?.phone || null;
                }
            }

            rows.push({
                id: n._id,
                kind,
                actorName,
                conversationName,
                note,
                link: n.link ?? null,
                isRead: n.isRead,
                createdAt: n.createdAt,
            });
        }

        return rows;
    },
});
