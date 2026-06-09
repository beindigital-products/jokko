import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireMembership, requirePermission } from "./lib/auth";
import { createNotification } from "./notifications";
import { paginationOptsValidator } from "convex/server";

// ============================================
// Queries
// ============================================

export const list = query({
    args: {
        conversationId: v.optional(v.id("conversations")),
        organizationId: v.optional(v.id("organizations")), // Optional security check
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        if (!args.conversationId) return { page: [], isDone: true, continueCursor: "" };

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        // Security check
        if (args.organizationId && conversation.organizationId !== args.organizationId) {
            throw new Error("Access denied");
        }

        // Require membership
        await requireMembership(ctx, conversation.organizationId);

        // List messages
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId!))
            .order("desc") // Newest first
            .paginate(args.paginationOpts);

        return {
            ...messages,
            page: await Promise.all(messages.page.map(async (msg) => {
                // Enrich if needed (e.g. sender info, media url signing)
                let mediaUrl = msg.mediaUrl;
                if (msg.mediaStorageId) {
                    const url = await ctx.storage.getUrl(msg.mediaStorageId);
                    if (url) mediaUrl = url;
                }

                const reactions = await ctx.db
                    .query("messageReactions")
                    .withIndex("by_message", (q) => q.eq("messageId", msg._id))
                    .collect();

                return {
                    ...msg,
                    id: msg._id,
                    timestamp: msg._creationTime, // Use creation time as timestamp
                    mediaUrl,
                    reactions: reactions.map((r) => ({
                        userId: r.userId,
                        emoji: r.emoji,
                        createdAt: r.createdAt,
                    })),
                };
            }))
        };
    },
});

// ============================================
// Reactions (V1.5+)
// ============================================

/**
 * Toggle a reaction on a message. Same emoji from the same user removes it.
 * A different emoji replaces it. No WhatsApp Cloud sync yet — reactions
 * are an internal team annotation on the conversation timeline.
 */
export const react = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const conversation = await ctx.db.get(message.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        const { userId } = await requirePermission(
            ctx,
            conversation.organizationId,
            "messages:send",
        );

        if (!args.emoji || args.emoji.trim().length === 0) {
            throw new Error("Emoji is required");
        }
        if (args.emoji.length > 8) {
            throw new Error("Reaction emoji is too long");
        }

        const existing = await ctx.db
            .query("messageReactions")
            .withIndex("by_message_user", (q) =>
                q.eq("messageId", args.messageId).eq("userId", userId),
            )
            .first();

        if (existing) {
            if (existing.emoji === args.emoji) {
                await ctx.db.delete(existing._id);
                return { action: "removed" as const };
            }
            await ctx.db.patch(existing._id, { emoji: args.emoji });
            return { action: "replaced" as const };
        }

        await ctx.db.insert("messageReactions", {
            organizationId: conversation.organizationId,
            messageId: args.messageId,
            userId,
            emoji: args.emoji,
            createdAt: Date.now(),
        });
        return { action: "added" as const };
    },
});

/**
 * Explicit unreact — useful if UI wants a discrete "remove" affordance
 * beyond the toggle behaviour of react().
 */
export const unreact = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const conversation = await ctx.db.get(message.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        const { userId } = await requirePermission(
            ctx,
            conversation.organizationId,
            "messages:send",
        );

        const existing = await ctx.db
            .query("messageReactions")
            .withIndex("by_message_user", (q) =>
                q.eq("messageId", args.messageId).eq("userId", userId),
            )
            .first();

        if (existing) await ctx.db.delete(existing._id);
    },
});

export const preview = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return [];

        await requireMembership(ctx, conversation.organizationId);

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .take(5);

        return messages.reverse().map(msg => ({
            id: msg._id,
            content: msg.content || `[${msg.type}]`,
            type: msg.type,
            direction: msg.direction,
            timestamp: msg._creationTime,
        }));
    },
});

// ============================================
// Mutations
// ============================================

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.optional(v.string()),
        type: v.string(), // "TEXT", "IMAGE", etc.
        mediaUrl: v.optional(v.string()),
        mediaStorageId: v.optional(v.id("_storage")),
        mediaType: v.optional(v.string()),
        fileName: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        replyToId: v.optional(v.id("messages")),
        isForwarded: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        const { userId } = await requirePermission(ctx, conversation.organizationId, "messages:send");

        // Create message
        const messageId = await ctx.db.insert("messages", {
            organizationId: conversation.organizationId,
            conversationId: args.conversationId,
            senderId: userId,
            contactId: conversation.contactId, // Outbound message to this contact

            type: args.type,
            content: args.content,
            mediaUrl: args.mediaUrl,
            mediaStorageId: args.mediaStorageId,
            mediaType: args.mediaType,
            fileName: args.fileName,
            fileSize: args.fileSize,

            direction: "OUTBOUND",
            status: "PENDING", // Will be updated by backend/webhook

            replyToId: args.replyToId,
            isForwarded: args.isForwarded,

            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Update conversation (last message, update time)
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
            lastMessageDirection: "OUTBOUND",
            preview: args.content || (args.type === "TEXT" ? args.content : `[${args.type}]`),
            updatedAt: Date.now(),
        });

        const org = await ctx.db.get(conversation.organizationId);
        if (org?.demo?.outboundMode === "local_only") {
            await ctx.db.patch(messageId, {
                status: "SENT",
                externalId: `demo:local:${messageId}`,
                updatedAt: Date.now(),
            });
            return messageId;
        }

        // Trigger WhatsApp Send
        let replyToWhatsAppId: string | undefined;
        if (args.replyToId) {
            const parentMsg = await ctx.db.get(args.replyToId);
            // Try different field names for WhatsApp Message ID
            replyToWhatsAppId = (parentMsg as any)?.waMessageId || (parentMsg as any)?.whatsappId || (parentMsg as any)?.providerMessageId;
        }

        if (args.type === "TEXT" && args.content) {
            const contact = await ctx.db.get(conversation.contactId!);
            if (contact && contact.phone) {
                await ctx.scheduler.runAfter(0, internal.whatsapp_actions.sendMessage, {
                    messageId,
                    organizationId: conversation.organizationId,
                    whatsappChannelId: conversation.whatsappChannelId,
                    to: contact.phone,
                    text: args.content,
                    type: "text",
                    replyToWhatsAppId
                });
            }
        } else if (["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"].includes(args.type)) {
            const contact = await ctx.db.get(conversation.contactId!);
            if (contact && contact.phone) {
                let mediaUrl: string | null | undefined = args.mediaUrl;
                if (!mediaUrl && args.mediaStorageId) {
                    mediaUrl = await ctx.storage.getUrl(args.mediaStorageId);
                    console.log(`[DEBUG] Resolved media URL for storageId ${args.mediaStorageId}: ${mediaUrl}`);
                }

                if (mediaUrl) {
                    console.log(`[DEBUG] Scheduling WhatsApp message for type ${args.type} with mimeType ${args.mediaType}`);
                    await ctx.scheduler.runAfter(0, internal.whatsapp_actions.sendMessage, {
                        messageId,
                        organizationId: conversation.organizationId,
                        whatsappChannelId: conversation.whatsappChannelId,
                        to: contact.phone,
                        type: args.type.toLowerCase(),
                        mediaUrl: mediaUrl as string,
                        caption: args.content,
                        mimeType: args.mediaType,
                        fileName: args.fileName,
                        replyToWhatsAppId
                    });
                }
            }
        }

        return messageId;
    },
});

/**
 * addInternalNote — creates a team-only internal note on a conversation.
 *
 * Unlike `send`, this NEVER schedules a WhatsApp delivery and never
 * overwrites the customer-facing conversation preview/lastMessage — it is
 * a private note visible only to the team (Front/Intercom pattern). It
 * carries optional @mentions of teammates.
 *
 * The mentioned users currently discover the note when they open the
 * conversation. Proactive delivery (in-app notification + email) is wired
 * separately — see the TODO below.
 */
export const addInternalNote = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        mentions: v.optional(
            v.array(
                v.object({
                    userId: v.id("users"),
                    name: v.string(),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        // Any team member can leave an internal note.
        const { userId } = await requireMembership(ctx, conversation.organizationId);

        const content = args.content.trim();
        if (!content) throw new Error("Note vide");

        const messageId = await ctx.db.insert("messages", {
            organizationId: conversation.organizationId,
            conversationId: args.conversationId,
            senderId: userId,
            // No contactId — a note is not addressed to the contact.
            type: "TEXT",
            content,
            // Internal notes never leave Jokko.
            direction: "OUTBOUND",
            status: "SENT",
            isInternal: true,
            mentions: args.mentions,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // NOTE: we intentionally do NOT patch conversation.preview /
        // lastMessageDirection here — an internal note must not masquerade
        // as the last customer message in the inbox list.

        // Notify each mentioned teammate (except the author) so they can
        // access the note from the bell / notifications page (the click
        // navigates to the conversation via `link`). Email delivery stays
        // deferred — see sendMentionEmail TODO below.
        if (args.mentions && args.mentions.length > 0) {
            const author = await ctx.db.get(userId);
            const authorName = author?.name || author?.email || "Un coéquipier";
            const contact = conversation.contactId
                ? await ctx.db.get(conversation.contactId)
                : null;
            const where = contact?.name || contact?.phone || "une conversation";
            const seen = new Set<string>();
            for (const m of args.mentions) {
                if (m.userId === userId) continue; // don't notify yourself
                if (seen.has(m.userId)) continue;
                seen.add(m.userId);
                // SECURITY: only notify users who are actually members of this
                // org. The mentions array is client-supplied; without this a
                // caller could push a MENTION (leaking the contact name + a
                // 140-char note excerpt + deep link) to an arbitrary userId.
                const mentionIsMember = await ctx.db
                    .query("memberships")
                    .withIndex("by_user_org", (q) =>
                        q.eq("userId", m.userId).eq("organizationId", conversation.organizationId),
                    )
                    .first();
                if (!mentionIsMember) continue;
                await createNotification(ctx, {
                    organizationId: conversation.organizationId,
                    userId: m.userId,
                    type: "MENTION",
                    title: `${authorName} vous a mentionné`,
                    message: `Sur ${where} : ${content.slice(0, 140)}`,
                    link: `/dashboard/conversations/${args.conversationId}`,
                    metadata: {
                        conversationId: String(args.conversationId),
                        messageId: String(messageId),
                    },
                });
                // TODO(mentions-email): sendMentionEmail({ to: <user email>, ... })
                //   convex/lib/email.ts — proactive email still deferred.
            }
        }

        return messageId;
    },
});

export const retry = mutation({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const conversation = await ctx.db.get(message.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        await requirePermission(ctx, conversation.organizationId, "messages:send");

        // Reset status
        await ctx.db.patch(args.messageId, { status: "PENDING", updatedAt: Date.now() });

        const org = await ctx.db.get(conversation.organizationId);
        if (org?.demo?.outboundMode === "local_only") {
            await ctx.db.patch(args.messageId, {
                status: "SENT",
                externalId: message.externalId || `demo:local:${args.messageId}`,
                updatedAt: Date.now(),
            });
            return;
        }

        // Trigger WhatsApp
        const contact = await ctx.db.get(conversation.contactId!);

        let replyToWhatsAppId: string | undefined;
        if (message.replyToId) {
            const parentMsg = await ctx.db.get(message.replyToId);
            replyToWhatsAppId = (parentMsg as any)?.waMessageId || (parentMsg as any)?.whatsappId || (parentMsg as any)?.providerMessageId;
        }

        if (contact && contact.phone) {
            if (message.type === "TEXT" && message.content) {
                await ctx.scheduler.runAfter(0, internal.whatsapp_actions.sendMessage, {
                    messageId: message._id,
                    organizationId: message.organizationId,
                    whatsappChannelId: conversation.whatsappChannelId,
                    to: contact.phone,
                    text: message.content,
                    type: "text",
                    replyToWhatsAppId
                });
            } else if (["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"].includes(message.type)) {
                let mediaUrl: string | null | undefined = message.mediaUrl;
                if (!mediaUrl && message.mediaStorageId) {
                    mediaUrl = await ctx.storage.getUrl(message.mediaStorageId);
                }

                if (mediaUrl) {
                    await ctx.scheduler.runAfter(0, internal.whatsapp_actions.sendMessage, {
                        messageId: message._id,
                        organizationId: message.organizationId,
                        whatsappChannelId: conversation.whatsappChannelId,
                        to: contact.phone,
                        type: message.type.toLowerCase(),
                        mediaUrl: mediaUrl,
                        caption: message.content,
                        mimeType: message.mediaType,
                        fileName: message.fileName,
                        replyToWhatsAppId
                    });
                }
            }
        }
    },
});


export const getConversationMedia = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        await requireMembership(ctx, conversation.organizationId);

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) =>
                q.or(
                    q.eq(q.field("type"), "IMAGE"),
                    q.eq(q.field("type"), "VIDEO"),
                    q.eq(q.field("type"), "DOCUMENT"),
                    q.eq(q.field("type"), "AUDIO")
                )
            )
            .order("desc") // Most recent first
            .take(100); // Limit to last 100 media items for performance

        const enriched = await Promise.all(messages.map(async (msg) => {
            let mediaUrl = msg.mediaUrl;
            if (msg.mediaStorageId) {
                const url = await ctx.storage.getUrl(msg.mediaStorageId);
                if (url) mediaUrl = url;
            }
            return {
                ...msg,
                mediaUrl
            };
        }));

        return enriched;
    }
});
