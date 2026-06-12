import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireMembership, requirePermission } from "./lib/auth";
import { canSeeAllConversations } from "./lib/permissions";
import { getAuthUserId } from "@convex-dev/auth/server";
import { enqueueConversationEvent } from "./crm/enqueue";
import { formatConversationPreview } from "./lib/messagePreview";

// ============================================
// Queries
// ============================================

// Safety ceiling for the inbox list scan. The query reads the most-recent
// conversations (ordered by lastMessageAt) and enriches each (contact +
// assignee), so an unbounded `.collect()` would hit Convex's read limit on a
// very large tenant. 1000 is well above any realistic active inbox, so it's a
// no-op for normal use and a guard against a pathological scan. Proper
// server-side pagination + a search index is the follow-up for huge tenants.
const CONVERSATION_LIST_LIMIT = 1000;

export const list = query({
    args: {
        organizationId: v.id("organizations"),
        filter: v.union(
            v.literal("all"),
            v.literal("unread"),
            v.literal("unassigned"),
            v.literal("archived"),
            v.literal("mine"),
            v.literal("star")
        ),
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { userId, membership } = await requireMembership(ctx, args.organizationId);

        let conversations;

        // Apply basic status filtering
        if (args.filter === "archived") {
            conversations = await ctx.db
                .query("conversations")
                .withIndex("by_org_status", (q) =>
                    q.eq("organizationId", args.organizationId).eq("status", "ARCHIVED")
                )
                .order("desc") // Most recent first
                .take(CONVERSATION_LIST_LIMIT);
        } else {
            // Active conversations (OPEN, SNOOZED, etc.)
            // We probably want to exclude ARCHIVED unless explicitly requested.
            // If sorting by lastMessageAt, using by_org_last_message is best.
            conversations = await ctx.db
                .query("conversations")
                .withIndex("by_org_last_message", (q) =>
                    q.eq("organizationId", args.organizationId)
                )
                .order("desc")
                .take(CONVERSATION_LIST_LIMIT);

            // Filter out ARCHIVED/RESOLVED since we are not in 'archived' mode
            conversations = conversations.filter(c => c.status !== "ARCHIVED" && c.status !== "RESOLVED");
        }

        // Advanced filtering in memory
        // (Convex doesn't support complex multi-field filtering efficiently yet without specific indexes)
        // NB : search is applied AFTER enrichment below, since it matches on the
        // contact name/phone which we only resolve during enrichment.

        // 2. Filter tabs
        let filtered = conversations;

        if (args.filter === "unread") {
            filtered = filtered.filter(c => c.unreadCount > 0);
        } else if (args.filter === "unassigned") {
            filtered = filtered.filter(c => !c.assignedTo);
        } else if (args.filter === "mine") {
            filtered = filtered.filter(c => c.assignedTo === userId);
        }

        // 3. Permissions (Agent visibility)
        if (!canSeeAllConversations(membership.role)) {
            // Agents only see unassigned or assigned to them
            filtered = filtered.filter(c => !c.assignedTo || c.assignedTo === userId);
        }

        // Enrich with Contact and Last Message data
        const enriched = await Promise.all(
            filtered.map(async (c) => {
                const contact = c.contactId ? await ctx.db.get(c.contactId) : null;
                // Get last message content if preview is missing or stale?
                // Schema has `preview` field.

                // Get assignee info
                const assignee = c.assignedTo ? await ctx.db.get(c.assignedTo) : null;

                return {
                    ...c,
                    contact: contact ? {
                        _id: contact._id,
                        name: contact.name || contact.phone, // Fallback
                        phoneNumber: contact.phone,
                        waId: contact.phone, // Assuming phone is WA ID
                        profilePicture: null, // Add to schema if needed
                        lastContactedAt: c.lastMessageAt,
                        isBlocked: contact.isBlocked || false,
                    } : null,
                    assignedTo: assignee ? {
                        _id: assignee._id,
                        user: {
                            name: assignee.name,
                            email: assignee.email,
                            image: assignee.image
                        }
                    } : null
                };
            })
        );

        // Search — match on contact name, phone (raw + digits), tags, preview.
        let result = enriched;
        if (args.search) {
            const q = args.search.toLowerCase().trim();
            const qDigits = q.replace(/\D/g, "");
            result = result.filter((c) => {
                const name = (c.contact?.name ?? "").toLowerCase();
                const phone = (c.contact?.phoneNumber ?? "").toLowerCase();
                const phoneDigits = phone.replace(/\D/g, "");
                const tags = (c.tags ?? []).join(" ").toLowerCase();
                const preview = (c.preview ?? "").toLowerCase();
                return (
                    name.includes(q) ||
                    phone.includes(q) ||
                    (qDigits.length > 0 && phoneDigits.includes(qDigits)) ||
                    tags.includes(q) ||
                    preview.includes(q)
                );
            });
        }

        // Sort by lastMessageAt desc
        result.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

        return result;
    },
});

export const getById = query({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        // We don't verify organizationId here strictly, but usually we should.
        // For now, assume if you have ID you can read (with permissions check).
        const conversation = await ctx.db.get(args.id);
        if (!conversation) return null;

        // Check membership/permission
        const { userId, membership } = await requireMembership(ctx, conversation.organizationId);

        if (!canSeeAllConversations(membership.role) && conversation.assignedTo && conversation.assignedTo !== userId) {
            // Agent can only view conversations assigned to them or unassigned
            return null;
        }

        const contact = conversation.contactId ? await ctx.db.get(conversation.contactId) : null;
        const assignee = conversation.assignedTo ? await ctx.db.get(conversation.assignedTo) : null;

        return {
            ...conversation,
            contact: contact ? {
                _id: contact._id,
                name: contact.name,
                phoneNumber: contact.phone,
                waId: contact.phone,
                profilePicture: null,
                lastContactedAt: conversation.lastMessageAt,
                isBlocked: contact.isBlocked || false,
            } : null,
            assignedTo: assignee ? {
                _id: assignee._id,
                user: {
                    name: assignee.name,
                    email: assignee.email,
                    image: assignee.image
                }
            } : null
        };
    },
});

// List conversations by contact (history)
export const listByContact = query({
    args: {
        contactId: v.id("contacts"),
        organizationId: v.id("organizations")
    },
    handler: async (ctx, args) => {
        await requireMembership(ctx, args.organizationId);

        // Fetch conversations for this contact
        // Using filter because we might not have a perfect index for (organizationId, contactId)
        // Schema has index("by_organization", ["organizationId"])
        // We can filter by contactId on that.
        // Or if we added the optional index mention in plan, we'd use it.
        // For now, filter is fine for reasonably sized organizations.
        // Actually schema has:
        // .index("by_organization", ["organizationId"])
        // And usually fetching by filtering `contactId` on that index is acceptable if selectivity is high.

        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .filter(q => q.eq(q.field("contactId"), args.contactId))
            .order("desc") // Newest first
            .collect();

        return conversations.map(c => ({
            _id: c._id,
            status: c.status,
            createdAt: c.createdAt,
            lastMessageAt: c.lastMessageAt,
            preview: c.preview,
            channel: c.channel
        }));
    }
});

// ============================================
// Mutations
// ============================================

export const resolve = mutation({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.id);
        if (!conversation) throw new Error("Conversation failed");

        await requirePermission(ctx, conversation.organizationId, "conversations:update");

        // Decrement active conversations for the assignee
        if (conversation.assignedTo && conversation.status === "OPEN") {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user_org", (q) =>
                    q.eq("userId", conversation.assignedTo!).eq("organizationId", conversation.organizationId)
                )
                .first();

            if (membership && (membership.activeConversations || 0) > 0) {
                await ctx.db.patch(membership._id, {
                    activeConversations: (membership.activeConversations || 0) - 1,
                });
            }
        }

        await ctx.db.patch(args.id, {
            status: "RESOLVED",
            updatedAt: Date.now()
        });

        // Push vers les CRM connectés en mode "out"/"two" (no-op si aucune
        // connexion active poussante — la garde vit dans enqueueConversationEvent).
        if (conversation.contactId) {
            await enqueueConversationEvent(ctx, {
                organizationId: conversation.organizationId,
                eventType: "conversation_resolved",
                contactId: conversation.contactId,
                conversationId: args.id,
                occurredAtMs: Date.now(),
            });
        }
    },
});

export const reopen = mutation({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.id);
        if (!conversation) throw new Error("Conversation failed");

        await requirePermission(ctx, conversation.organizationId, "conversations:update");

        // Increment active conversations for the assignee if re-opening
        if (conversation.assignedTo && conversation.status !== "OPEN") {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user_org", (q) =>
                    q.eq("userId", conversation.assignedTo!).eq("organizationId", conversation.organizationId)
                )
                .first();

            if (membership) {
                await ctx.db.patch(membership._id, {
                    activeConversations: (membership.activeConversations || 0) + 1,
                });
            }
        }

        await ctx.db.patch(args.id, { status: "OPEN" });
    },
});

export const archive = mutation({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.id);
        if (!conversation) throw new Error("Conversation failed");

        await requirePermission(ctx, conversation.organizationId, "conversations:update"); // close/delete logic

        // Decrement active conversations for the assignee
        if (conversation.assignedTo && conversation.status === "OPEN") {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user_org", (q) =>
                    q.eq("userId", conversation.assignedTo!).eq("organizationId", conversation.organizationId)
                )
                .first();

            if (membership && (membership.activeConversations || 0) > 0) {
                await ctx.db.patch(membership._id, {
                    activeConversations: (membership.activeConversations || 0) - 1,
                });
            }
        }

        await ctx.db.patch(args.id, { status: "ARCHIVED" });
    },
});

export const markAsRead = mutation({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.id);
        if (!conversation) return; // Silent fail

        // No need strict permission check for read mark, just auth
        await requireMembership(ctx, conversation.organizationId);

        await ctx.db.patch(args.id, { unreadCount: 0 });
    }
});

export const togglePin = mutation({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.id);
        if (!conversation) throw new Error("Conversation not found");

        await requireMembership(ctx, conversation.organizationId);

        await ctx.db.patch(args.id, {
            isPinned: !conversation.isPinned,
            updatedAt: Date.now(),
        });
    },
});

export const assignToMe = mutation({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.id);
        if (!conversation) throw new Error("Conversation not found");

        const { userId, membership } = await requireMembership(ctx, conversation.organizationId);

        // Already assigned to someone
        if (conversation.assignedTo) {
            throw new Error("Conversation already assigned");
        }

        await ctx.db.patch(args.id, {
            assignedTo: userId,
            assignedAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Increment active conversations for the assignee
        await ctx.db.patch(membership._id, {
            activeConversations: (membership.activeConversations || 0) + 1,
        });

        // Push "conversation_assigned" vers les CRM poussants (no-op sinon).
        if (conversation.contactId) {
            await enqueueConversationEvent(ctx, {
                organizationId: conversation.organizationId,
                eventType: "conversation_assigned",
                contactId: conversation.contactId,
                conversationId: args.id,
                occurredAtMs: Date.now(),
                metadata: { assignedTo: userId },
            });
        }
    },
});

export const getSidebarStats = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        // Get current selected organization from session
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) return null;

        const organizationId = session.currentOrganizationId;

        // Fetch counts
        // 1. Unread assigned to me
        // We can't index this perfectly without a specific index. 
        // For now, fetch my active conversations and count.
        // Assuming "by_org_last_message" and filtering in memory is okay for per-user load.
        // Better: if we had "by_assignee" index.
        // Schema wasn't fully visible but usually we have indexes.
        // Let's use `list` logic's optimization or just iterate.
        // Given `list` does `by_org_last_message`, let's do that.

        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_org_last_message", (q) =>
                q.eq("organizationId", organizationId)
            )
            .collect();

        const unreadCount = conversations.filter(
            c => c.assignedTo === userId && (c.unreadCount || 0) > 0 && c.status !== "ARCHIVED" && c.status !== "RESOLVED"
        ).length;

        // 2. Unassigned (for Assignments tab if needed, though user asked for 'Conversations' badge)
        // Similar filter
        const unassignedCount = conversations.filter(
            c => !c.assignedTo && c.status !== "ARCHIVED" && c.status !== "RESOLVED"
        ).length;

        // Global unread (all conversations) - maybe for admin?
        const allUnreadCount = conversations.filter(
            c => (c.unreadCount || 0) > 0 && c.status !== "ARCHIVED" && c.status !== "RESOLVED"
        ).length;

        return {
            unread: unreadCount,
            unassigned: unassignedCount,
            allUnread: allUnreadCount
        };
    },
});
// ... (previous stats query)

// ============================================
// Deletion
// ============================================

export const remove = mutation({
    args: { id: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.id);
        if (!conversation) return; // Already deleted?

        await requirePermission(ctx, conversation.organizationId, "conversations:update"); // Use update or specific delete permission?

        // 1. Delete all messages
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.id))
            .collect();

        for (const msg of messages) {
            await ctx.db.delete(msg._id);
        }

        // 2. Delete conversation
        await ctx.db.delete(args.id);
    },
});

export const clearHistory = mutation({
    args: {
        contactId: v.id("contacts"),
        organizationId: v.id("organizations"),
        excludeIds: v.optional(v.array(v.id("conversations")))
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.organizationId)
            )
            .first();

        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Insufficient permissions. Only Admins and Owners can clear history.");
        }

        // Fetch conversations for this contact
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .filter(q => q.eq(q.field("contactId"), args.contactId))
            .collect();

        // Filter out excluded (e.g. current open conversation)
        const toDelete = conversations.filter(c => !args.excludeIds?.includes(c._id));

        for (const c of toDelete) {
            // Delete messages
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", c._id))
                .collect();

            for (const msg of messages) {
                await ctx.db.delete(msg._id);
            }

            // Delete conversation
            await ctx.db.delete(c._id);
        }
    },
});

export const getOrCreate = mutation({
    args: {
        contactId: v.id("contacts"),
    },
    handler: async (ctx, args) => {
        const contact = await ctx.db.get(args.contactId);
        if (!contact) throw new Error("Contact not found");

        await requireMembership(ctx, contact.organizationId);

        // Check for existing open conversation
        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", contact.organizationId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("contactId"), args.contactId),
                    q.neq(q.field("status"), "RESOLVED"),
                    q.neq(q.field("status"), "ARCHIVED")
                )
            )
            .first();

        if (existing) {
            return existing._id;
        }

        // Create new conversation if no active one found
        const conversationId = await ctx.db.insert("conversations", {
            organizationId: contact.organizationId,
            contactId: args.contactId,
            channel: "WHATSAPP",
            status: "OPEN",
            unreadCount: 0,
            lastMessageAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Nouvelle conversation → push "conversation_opened" vers les CRM
        // connectés en mode poussant (no-op sinon, garde dans enqueue).
        await enqueueConversationEvent(ctx, {
            organizationId: contact.organizationId,
            eventType: "conversation_opened",
            contactId: args.contactId,
            conversationId,
            occurredAtMs: Date.now(),
        });

        return conversationId;
    },
});

/**
 * Maintenance: re-derive every conversation's `preview` from its last message
 * using the current `formatConversationPreview` rules. Useful after changing the
 * preview format (e.g. audio → "Message vocal (m:ss)") so existing rows update
 * without waiting for a new message. Internal-only; run via the dashboard/CLI.
 */
export const refreshPreviews = internalMutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .collect();
        let updated = 0;
        for (const conversation of conversations) {
            const lastMessage = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
                .order("desc")
                .first();
            if (!lastMessage) continue;
            const preview = formatConversationPreview({ type: lastMessage.type, content: lastMessage.content });
            if (preview !== conversation.preview) {
                await ctx.db.patch(conversation._id, { preview });
                updated += 1;
            }
        }
        return { updated, total: conversations.length };
    },
});
