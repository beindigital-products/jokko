import { v } from "convex/values";
import { mutation, query, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasPermission, type Role } from "./lib/permissions";
import { requirePermission } from "./lib/auth";
import { requirePlanFeature } from "./lib/planFeatures";
import { getMessageCostFCFA, calculateBroadcastCost } from "@jokko/core/whatsapp-pricing";

// Per-template variable mapping ({{N}} → contact field or fixed value). Shared
// validator for `create` / `update` and the table schema. `src` is a contact
// field ("first" | "last" | "company" | "city") or "fixed".
const templateVariablesValidator = v.array(
    v.object({
        token: v.string(),
        src: v.string(),
        fixed: v.optional(v.string()),
    }),
);

type TemplateVariable = { token: string; src: string; fixed?: string };

/**
 * Resolve a saved variable mapping into WhatsApp template `components` for one
 * contact. Tokens are sorted by their {{N}} index so the body parameters land in
 * order. `src` reads a contact field (with sensible fallbacks); "fixed" uses the
 * stored literal. Returns `[]` when there are no variables (Meta then sends the
 * template as-is). Header variables aren't collected by the wizard yet, so only
 * a "body" component is produced.
 */
function buildTemplateComponents(
    vars: TemplateVariable[] | undefined,
    contact: { name?: string; firstName?: string; lastName?: string; company?: string; city?: string },
): Array<Record<string, unknown>> {
    if (!vars || vars.length === 0) return [];

    const firstNameOf = () => {
        if (contact.firstName && contact.firstName.trim()) return contact.firstName.trim();
        if (contact.name && contact.name.trim()) return contact.name.trim().split(/\s+/)[0];
        return "";
    };
    const lastNameOf = () => {
        if (contact.lastName && contact.lastName.trim()) return contact.lastName.trim();
        if (contact.name && contact.name.trim()) {
            const parts = contact.name.trim().split(/\s+/);
            return parts.length > 1 ? parts.slice(1).join(" ") : "";
        }
        return "";
    };

    const resolve = (vr: TemplateVariable): string => {
        switch (vr.src) {
            case "fixed":
                return vr.fixed ?? "";
            case "first":
                return firstNameOf();
            case "last":
                return lastNameOf();
            case "company":
                return contact.company?.trim() ?? "";
            case "city":
                return contact.city?.trim() ?? "";
            default:
                // Unknown source → fall back to the literal if present, else the
                // contact's first name (best-effort, never undefined).
                return (vr.fixed && vr.fixed.trim()) || firstNameOf();
        }
    };

    // Keep the WhatsApp body parameters in {{1}},{{2}}… order regardless of the
    // order the mapping was stored in.
    const tokenIndex = (token: string): number => {
        const m = /\{\{(\d+)\}\}/.exec(token);
        return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
    };
    const ordered = [...vars].sort((a, b) => tokenIndex(a.token) - tokenIndex(b.token));

    return [
        {
            type: "body",
            parameters: ordered.map((vr) => ({ type: "text", text: resolve(vr) })),
        },
    ];
}

// List broadcasts for the current organization
export const list = query({
    args: {
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        // Get user's current organization from session
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            return [];
        }

        const organizationId = session.currentOrganizationId;

        // Fetch broadcasts
        // TODO: Implement search if needed, for now just list all by org
        const broadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .collect();

        // Fetch the org's contacts once, then compute each broadcast's eligible
        // audience against it (same logic as `get`'s totalAudience) — cheaper than
        // re-scanning per row.
        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();
        const audienceFor = (config: (typeof broadcasts)[number]["audienceConfig"]): number => {
            if (config.type === "TAGS" && config.tags && config.tags.length > 0) {
                return contacts.filter((c) => c.tags && c.tags.some((t) => config.tags!.includes(t))).length;
            }
            if (config.type === "COUNTRIES" && config.countries && config.countries.length > 0) {
                return contacts.filter((c) => config.countries!.some((p) => c.phone.startsWith(p))).length;
            }
            return contacts.length;
        };

        // Enrich with template name + category (for cost estimate), channel name
        // and eligible-audience count. `Promise.all` keeps the template lookups cheap.
        const enrichedBroadcasts = await Promise.all(
            broadcasts.map(async (b) => {
                const template = await ctx.db.get(b.templateId);
                let channelName: string | null = null;
                if (b.whatsappChannelId) {
                    const channel = await ctx.db.get(b.whatsappChannelId);
                    channelName = channel?.label ?? null;
                }
                return {
                    ...b,
                    templateName: template?.name || "Unknown Template",
                    templateCategory: template?.category ?? null,
                    channelName,
                    audienceCount: audienceFor(b.audienceConfig),
                };
            })
        );

        // Filter by search if provided (client-side style filtering for now as name is not indexed for search yet or we use simple filter)
        if (args.search) {
            const lowerSearch = args.search.toLowerCase();
            return enrichedBroadcasts.filter(b =>
                b.name.toLowerCase().includes(lowerSearch) ||
                b.templateName.toLowerCase().includes(lowerSearch)
            );
        }

        return enrichedBroadcasts;
    },
});

export const get = query({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) return null;

        // Check organization access
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized access to this broadcast");
        }

        const template = await ctx.db.get(broadcast.templateId);

        // Channel name
        let channelName: string | null = null;
        if (broadcast.whatsappChannelId) {
            const channel = await ctx.db.get(broadcast.whatsappChannelId);
            channelName = channel?.label ?? null;
        }

        // Total audience count (same logic as estimateAudience)
        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_organization", (q) => q.eq("organizationId", broadcast.organizationId))
            .collect();

        let totalAudience = contacts.length;
        const config = broadcast.audienceConfig;
        if (config.type === "TAGS" && config.tags && config.tags.length > 0) {
            totalAudience = contacts.filter((c) =>
                c.tags && c.tags.some((t) => config.tags!.includes(t))
            ).length;
        } else if (config.type === "COUNTRIES" && config.countries && config.countries.length > 0) {
            totalAudience = contacts.filter((c) =>
                config.countries!.some((prefix) => c.phone.startsWith(prefix))
            ).length;
        }

        return {
            ...broadcast,
            template,
            channelName,
            totalAudience,
        };
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        templateId: v.id("templates"),
        scheduledAt: v.optional(v.number()),
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
        audienceConfig: v.object({
            type: v.union(v.literal("ALL"), v.literal("TAGS"), v.literal("COUNTRIES")),
            tags: v.optional(v.array(v.id("tags"))),
            countries: v.optional(v.array(v.string())),
        }),
        templateVariables: v.optional(templateVariablesValidator),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            throw new Error("No organization selected");
        }

        // Feature gate plan : broadcasts réservé BUSINESS+
        await requirePlanFeature(ctx, session.currentOrganizationId, "broadcasts");

        // Permission check: only ADMIN+ can create broadcasts
        const membership = await ctx.db.query("memberships")
            .withIndex("by_user_org", q => q.eq("userId", userId).eq("organizationId", session.currentOrganizationId!))
            .first();
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Permission refusée: seuls les admins peuvent créer des broadcasts");
        }

        // Plan gate: the org must have at least one active WhatsApp channel
        // allowed by its current plan. Prevents creating broadcasts when all
        // channels have been disabled after a downgrade.
        const channels = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org", (q) => q.eq("organizationId", session.currentOrganizationId!))
            .collect();
        const hasActiveChannel = channels.some((c) => c.status === "active");
        if (!hasActiveChannel) {
            throw new Error(
                "Aucun canal WhatsApp actif. Activez ou reconnectez un canal avant de créer un broadcast.",
            );
        }
        if (args.whatsappChannelId) {
            const target = channels.find((c) => c._id === args.whatsappChannelId);
            if (!target || target.status !== "active") {
                throw new Error("Le canal sélectionné n'est pas actif pour votre plan.");
            }
        }

        // Validation: scheduledAt doit être au moins 5 minutes dans le futur
        if (args.scheduledAt && args.scheduledAt <= Date.now() + 5 * 60 * 1000) {
            throw new Error("La date de planification doit être au moins 5 minutes dans le futur");
        }

        const id = await ctx.db.insert("broadcasts", {
            organizationId: session.currentOrganizationId,
            name: args.name,
            templateId: args.templateId,
            audienceConfig: args.audienceConfig,
            templateVariables: args.templateVariables,
            whatsappChannelId: args.whatsappChannelId,
            status: args.scheduledAt ? "SCHEDULED" : "DRAFT",
            scheduledAt: args.scheduledAt,
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            failedCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Log activity
        await ctx.db.insert("broadcastActivities", {
            broadcastId: id,
            type: "created",
            message: `Campagne "${args.name}" créée`,
            createdAt: Date.now(),
        });

        if (args.scheduledAt) {
            await ctx.db.insert("broadcastActivities", {
                broadcastId: id,
                type: "scheduled",
                message: `Campagne planifiée pour le ${new Date(args.scheduledAt).toLocaleDateString("fr-FR")}`,
                createdAt: Date.now(),
            });
        }

        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("broadcasts"),
        name: v.optional(v.string()),
        templateId: v.optional(v.id("templates")),
        scheduledAt: v.optional(v.number()),
        status: v.optional(v.string()),
        audienceConfig: v.optional(v.object({
            type: v.union(v.literal("ALL"), v.literal("TAGS"), v.literal("COUNTRIES")),
            tags: v.optional(v.array(v.id("tags"))),
            countries: v.optional(v.array(v.string())),
        })),
        templateVariables: v.optional(templateVariablesValidator),
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) throw new Error("Broadcast not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized");
        }

        // RBAC: require ADMIN or OWNER
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", broadcast.organizationId))
            .first();
        if (!membership || !hasPermission(membership.role as Role, "broadcasts:create")) {
            throw new Error("Permission denied");
        }

        // Validation: scheduledAt doit être au moins 5 minutes dans le futur
        if (args.scheduledAt && args.scheduledAt <= Date.now() + 5 * 60 * 1000) {
            throw new Error("La date de planification doit être au moins 5 minutes dans le futur");
        }

        const updates: any = {
            updatedAt: Date.now(),
        };

        if (args.name !== undefined) updates.name = args.name;
        if (args.templateId !== undefined) updates.templateId = args.templateId;
        if (args.scheduledAt !== undefined) updates.scheduledAt = args.scheduledAt;
        if (args.status !== undefined) updates.status = args.status;
        if (args.audienceConfig !== undefined) updates.audienceConfig = args.audienceConfig;
        if (args.templateVariables !== undefined) updates.templateVariables = args.templateVariables;
        if (args.whatsappChannelId !== undefined) updates.whatsappChannelId = args.whatsappChannelId;

        const statusChanged = args.status && args.status !== broadcast.status;

        await ctx.db.patch(args.id, updates);

        // Log activity for status changes
        if (statusChanged) {
            if (args.status === 'SENDING') {
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: args.id,
                    type: "sending_started",
                    message: "Envoi de la campagne démarré",
                    createdAt: Date.now(),
                });
            } else if (args.status === 'SCHEDULED') {
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: args.id,
                    type: "scheduled",
                    message: "Campagne planifiée",
                    createdAt: Date.now(),
                });
            } else if (args.status === 'CANCELLED') {
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: args.id,
                    type: "cancelled",
                    message: "Campagne annulée",
                    createdAt: Date.now(),
                });
            }
        }

        // TRIGGER SENDING IF STATUS -> SENDING
        if (statusChanged && args.status === 'SENDING') {
            await ctx.scheduler.runAfter(0, internal.broadcasts.sendBroadcast, {
                broadcastId: args.id,
                organizationId: broadcast.organizationId
            });
        }
    },
});

// ===================================
// SENDING LOGIC
// ===================================

export const sendSingleToContact = internalMutation({
    args: {
        broadcastId: v.id("broadcasts"),
        organizationId: v.id("organizations"),
        contactId: v.id("contacts"),
        phone: v.string(),
        templateName: v.string(),
        languageCode: v.string(),
        components: v.optional(v.array(v.record(v.string(), v.any()))),
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
    },
    handler: async (ctx, args) => {
        // 1. Find OPEN Conversation (using composite index)
        let conversation = await ctx.db
            .query("conversations")
            .withIndex("by_org_contact", q =>
                q.eq("organizationId", args.organizationId)
                    .eq("contactId", args.contactId)
                    .eq("status", "OPEN")
            )
            .first();

        if (!conversation) {
            // Check if we should re-open a closed one or create new?
            // To align with webhook which creates new on no-open, we create new.
            // But for "Chat" UI, we might prefer one conversation per contact.
            // Let's assume Session model: Create new Open.

            const conversationId = await ctx.db.insert("conversations", {
                organizationId: args.organizationId,
                contactId: args.contactId,
                channel: "WHATSAPP",
                whatsappChannelId: args.whatsappChannelId,
                status: "RESOLVED", // Broadcast-initiated: don't show as assignable
                lastMessageAt: Date.now(),
                lastMessageDirection: "OUTBOUND",
                unreadCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tags: [],
            });
            conversation = await ctx.db.get(conversationId);
        }

        if (!conversation) return; // Should not happen

        // 2. Create Message Record
        const messageId = await ctx.db.insert("messages", {
            organizationId: args.organizationId,
            conversationId: conversation._id,
            contactId: args.contactId,
            senderId: undefined, // System/Bot
            type: "TEMPLATE", // Or SYSTEM? "TEMPLATE" isn't in schema enum list commonly, but "SYSTEM"? 
            // Schema has "type: v.string()", so "TEMPLATE" is fine.
            content: `Template: ${args.templateName}`,
            direction: "OUTBOUND",
            status: "PENDING",
            broadcastId: args.broadcastId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // 3. Schedule Send
        await ctx.scheduler.runAfter(0, internal.whatsapp_actions.sendMessage, {
            messageId,
            organizationId: args.organizationId,
            whatsappChannelId: args.whatsappChannelId,
            to: args.phone,
            type: "template",
            template: {
                name: args.templateName,
                language: { code: args.languageCode },
                components: args.components || []
            }
        });

        // 4. Update Broadcast Stats
        const broadcast = await ctx.db.get(args.broadcastId);
        if (broadcast) {
            await ctx.db.patch(args.broadcastId, {
                sentCount: broadcast.sentCount + 1,
                updatedAt: Date.now()
            });
        }

        // 5. Update Conversation preview
        await ctx.db.patch(conversation._id, {
            lastMessageAt: Date.now(),
            lastMessageDirection: "OUTBOUND",
            preview: `📤 ${args.templateName}`,
            updatedAt: Date.now()
        });
    }
});

export const getBroadcastInternal = internalQuery({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) return null;
        const template = await ctx.db.get(broadcast.templateId);
        return {
            ...broadcast,
            template
        };
    }
});

export const sendBroadcast = internalAction({
    args: {
        broadcastId: v.id("broadcasts"),
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        // Chunked + resumable sender. Each invocation sends one CHUNK of the
        // audience then self-schedules the next, re-reading status between
        // chunks. A pause flips status → PAUSED so the next chunk stops here,
        // preserving the cursor (sentCount) for resume. Also keeps each action
        // invocation well within Convex's time budget on large audiences.
        const CHUNK = 50;

        // 1. Fetch Broadcast & Template
        const broadcast = await ctx.runQuery(internal.broadcasts.getBroadcastInternal, { id: args.broadcastId });
        if (!broadcast || !broadcast.template) return;

        // Pause / cancel guard — only proceed while actively SENDING.
        if (broadcast.status !== "SENDING") return;

        // 2. Fetch + filter audience, deterministically ordered so sentCount is
        //    a valid resume cursor across chunks.
        const contacts = await ctx.runQuery(internal.contacts.listAllForOrg, { organizationId: args.organizationId });
        const config = broadcast.audienceConfig;
        let targetContacts = contacts;
        if (config.type === 'TAGS' && config.tags && config.tags.length > 0) {
            targetContacts = contacts.filter((c: any) =>
                c.tags && c.tags.some((t: any) => config.tags!.includes(t))
            );
        } else if (config.type === 'COUNTRIES' && config.countries && config.countries.length > 0) {
            targetContacts = contacts.filter((c: any) =>
                config.countries!.some((prefix: string) => c.phone.startsWith(prefix))
            );
        }
        targetContacts = [...targetContacts].sort((a: any, b: any) =>
            a._id < b._id ? -1 : a._id > b._id ? 1 : 0,
        );

        const cursor = broadcast.sentCount ?? 0;

        // 3. First chunk only: deduct credits for the full audience + lock total.
        //    Idempotent via the broadcast's `creditsDeducted` flag so a crash-
        //    and-rerun at cursor 0 never double-charges the org.
        if (cursor === 0) {
            const { totalCostFCFA } = calculateBroadcastCost(targetContacts.map((c: any) => c.phone));
            const debit = await ctx.runMutation(internal.broadcasts.deductBroadcastCredits, {
                broadcastId: args.broadcastId,
                organizationId: args.organizationId,
                amount: totalCostFCFA,
                audienceTotal: targetContacts.length,
            });
            if (!debit.ok) {
                await ctx.runMutation(internal.broadcasts.markFailed, {
                    id: args.broadcastId,
                    reason: debit.reason === "insufficient_credits"
                        ? "Crédits insuffisants pour envoyer cette campagne"
                        : "Impossible de débiter les crédits de la campagne",
                });
                return;
            }
        }

        const total = broadcast.audienceTotal ?? targetContacts.length;

        // 4. Send this chunk (capped at the locked audience total). Resolve the
        //    saved variable mapping into per-recipient WhatsApp components so
        //    templates with {{N}} placeholders carry real values.
        const chunk = targetContacts.slice(cursor, Math.min(cursor + CHUNK, total));
        const vars = broadcast.templateVariables as TemplateVariable[] | undefined;
        for (const contact of chunk) {
            const components = buildTemplateComponents(vars, contact);
            await ctx.runMutation(internal.broadcasts.sendSingleToContact, {
                broadcastId: args.broadcastId,
                organizationId: args.organizationId,
                contactId: contact._id,
                phone: contact.phone,
                templateName: broadcast.template.name,
                languageCode: broadcast.template.language,
                components,
                whatsappChannelId: broadcast.whatsappChannelId,
            });
        }

        // 5. Continue, complete, or stop (paused / cancelled mid-flight).
        const fresh = await ctx.runQuery(internal.broadcasts.getBroadcastInternal, { id: args.broadcastId });
        if (!fresh) return;
        if ((fresh.sentCount ?? 0) >= total) {
            await ctx.runMutation(internal.broadcasts.markCompleted, { id: args.broadcastId });
        } else if (fresh.status === "SENDING") {
            await ctx.scheduler.runAfter(0, internal.broadcasts.sendBroadcast, {
                broadcastId: args.broadcastId,
                organizationId: args.organizationId,
            });
        }
        // else PAUSED / CANCELLED → stop; sentCount cursor preserved for resume.
    }
});

/**
 * Debit the campaign's full audience cost EXACTLY ONCE and lock the audience
 * total, in a single atomic mutation. Idempotent via the broadcast's
 * `creditsDeducted` flag: if the chunked sender is re-run at cursor 0 after a
 * crash, the second call sees the flag and does not re-charge. Returns a
 * `reason` on failure so the caller can mark the broadcast FAILED.
 */
export const deductBroadcastCredits = internalMutation({
    args: {
        broadcastId: v.id("broadcasts"),
        organizationId: v.id("organizations"),
        amount: v.number(),
        audienceTotal: v.number(),
    },
    handler: async (ctx, args) => {
        const broadcast = await ctx.db.get(args.broadcastId);
        if (!broadcast) return { ok: false as const, reason: "not_found" };

        // Already charged (idempotent replay) — just ensure the total is locked.
        if (broadcast.creditsDeducted) {
            if (broadcast.audienceTotal == null) {
                await ctx.db.patch(args.broadcastId, {
                    audienceTotal: args.audienceTotal,
                    updatedAt: Date.now(),
                });
            }
            return { ok: true as const, alreadyCharged: true };
        }

        if (args.amount > 0) {
            const org = await ctx.db.get(args.organizationId);
            if (!org) return { ok: false as const, reason: "org_not_found" };
            const balance = org.creditBalance ?? 0;
            if (balance < args.amount) {
                return { ok: false as const, reason: "insufficient_credits" };
            }
            const newBalance = balance - args.amount;
            await ctx.db.patch(args.organizationId, { creditBalance: newBalance });
            await ctx.db.insert("creditTransactions", {
                organizationId: args.organizationId,
                amount: -args.amount,
                type: "USAGE",
                description: `Campagne "${broadcast.name}" — ${args.audienceTotal} messages, ${args.amount.toLocaleString()} FCFA`,
                referenceId: args.broadcastId,
                balanceAfter: newBalance,
                createdAt: Date.now(),
            });
        }

        await ctx.db.patch(args.broadcastId, {
            creditsDeducted: true,
            audienceTotal: args.audienceTotal,
            updatedAt: Date.now(),
        });
        return { ok: true as const };
    },
});


/**
 * Pause an in-flight send. The currently-running chunk finishes; the next
 * scheduled chunk sees PAUSED and stops, preserving the sentCount cursor.
 */
export const pauseBroadcast = mutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) throw new Error("Broadcast not found");
        await requirePermission(ctx, broadcast.organizationId, "broadcasts:send");
        if (broadcast.status !== "SENDING") {
            throw new Error("Seule une campagne en cours d'envoi peut être mise en pause");
        }
        await ctx.db.patch(args.id, { status: "PAUSED", updatedAt: Date.now() });
        return { ok: true };
    },
});

/** Resume a paused send — continues from the sentCount cursor. */
export const resumeBroadcast = mutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) throw new Error("Broadcast not found");
        await requirePermission(ctx, broadcast.organizationId, "broadcasts:send");
        if (broadcast.status !== "PAUSED") {
            throw new Error("Seule une campagne en pause peut être reprise");
        }
        await ctx.db.patch(args.id, { status: "SENDING", updatedAt: Date.now() });
        await ctx.scheduler.runAfter(0, internal.broadcasts.sendBroadcast, {
            broadcastId: args.id,
            organizationId: broadcast.organizationId,
        });
        return { ok: true };
    },
});

export const markFailed = internalMutation({
    args: {
        id: v.id("broadcasts"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "FAILED",
            updatedAt: Date.now(),
        });

        await ctx.db.insert("broadcastActivities", {
            broadcastId: args.id,
            type: "failures",
            message: args.reason,
            createdAt: Date.now(),
        });
    },
});

export const markCompleted = internalMutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const broadcast = await ctx.db.get(args.id);
        await ctx.db.patch(args.id, {
            status: "COMPLETED",
            completedAt: Date.now()
        });

        // Log completion activity
        await ctx.db.insert("broadcastActivities", {
            broadcastId: args.id,
            type: "completed",
            message: `Campagne terminée — ${broadcast?.sentCount ?? 0} envoyés, ${broadcast?.failedCount ?? 0} échecs`,
            createdAt: Date.now(),
        });

        // Log failures if any
        if (broadcast && broadcast.failedCount > 0) {
            await ctx.db.insert("broadcastActivities", {
                broadcastId: args.id,
                type: "failures",
                message: `${broadcast.failedCount} message(s) en échec`,
                createdAt: Date.now(),
            });
        }
    }
});

export const processScheduled = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        // Use status index to avoid full table scan
        const broadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_status", q => q.eq("status", "SCHEDULED"))
            .collect();

        for (const broadcast of broadcasts) {
            if (broadcast.scheduledAt && broadcast.scheduledAt <= now) {
                // Update to SENDING
                await ctx.db.patch(broadcast._id, { status: "SENDING" });

                // Trigger Send
                await ctx.scheduler.runAfter(0, internal.broadcasts.sendBroadcast, {
                    broadcastId: broadcast._id,
                    organizationId: broadcast.organizationId
                });
            }
        }
    }
});

export const deleteBroadcast = mutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) throw new Error("Broadcast not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized");
        }

        // Permission check: only ADMIN+ can delete broadcasts
        const membership = await ctx.db.query("memberships")
            .withIndex("by_user_org", q => q.eq("userId", userId).eq("organizationId", broadcast.organizationId))
            .first();
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Permission refusée: seuls les admins peuvent supprimer des broadcasts");
        }

        await ctx.db.delete(args.id);
    },
});

export const archiveBroadcast = mutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const broadcast = await ctx.db.get(args.id);
        if (!broadcast) throw new Error("Broadcast not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== broadcast.organizationId) {
            throw new Error("Unauthorized");
        }

        // Permission check: only ADMIN+ can archive broadcasts
        const membership = await ctx.db.query("memberships")
            .withIndex("by_user_org", q => q.eq("userId", userId).eq("organizationId", broadcast.organizationId))
            .first();
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Permission refusée: seuls les admins peuvent archiver des broadcasts");
        }

        await ctx.db.patch(args.id, {
            status: "CANCELLED",
            updatedAt: Date.now(),
        });
    },
});

export const duplicate = mutation({
    args: { id: v.id("broadcasts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const original = await ctx.db.get(args.id);
        if (!original) throw new Error("Broadcast not found");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId !== original.organizationId) {
            throw new Error("Unauthorized");
        }

        // RBAC: require ADMIN or OWNER
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", original.organizationId))
            .first();
        if (!membership || !hasPermission(membership.role as Role, "broadcasts:create")) {
            throw new Error("Permission denied");
        }

        const newId = await ctx.db.insert("broadcasts", {
            organizationId: original.organizationId,
            name: `${original.name} (Copie)`,
            templateId: original.templateId,
            audienceConfig: original.audienceConfig,
            status: "DRAFT", // Reset to draft
            // Reset stats
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            repliedCount: 0,
            failedCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return newId;
    },
});

// ===================================
// AUDIENCE ESTIMATION
// ===================================

/**
 * Audience options for the campaign wizard: the "Tous les contacts" (ALL) bucket
 * plus one bucket per tag, each with its eligible-contact count. One contacts
 * fetch, reused — feeds the wizard's audience step (mapped to audienceConfig).
 */
export const audienceOptions = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return { all: 0, tags: [] };

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        if (!session?.currentOrganizationId) return { all: 0, tags: [] };
        const organizationId = session.currentOrganizationId;

        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();
        const tags = await ctx.db
            .query("tags")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        return {
            all: contacts.length,
            tags: tags.map((t) => ({
                id: t._id,
                name: t.name,
                count: contacts.filter((c) => c.tags && c.tags.includes(t._id)).length,
            })),
        };
    },
});

export const estimateAudience = query({
    args: {
        audienceConfig: v.object({
            type: v.union(v.literal("ALL"), v.literal("TAGS"), v.literal("COUNTRIES")),
            tags: v.optional(v.array(v.id("tags"))),
            countries: v.optional(v.array(v.string())),
        }),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            return { count: 0, estimatedCost: 0, creditBalance: 0, costPerMessage: 0 };
        }

        const organizationId = session.currentOrganizationId;

        // Get credit balance
        const org = await ctx.db.get(organizationId);
        const creditBalance = org?.creditBalance ?? 0;

        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .collect();

        const config = args.audienceConfig;

        let targetContacts = contacts;

        if (config.type === "TAGS" && config.tags && config.tags.length > 0) {
            targetContacts = contacts.filter((c) =>
                c.tags && c.tags.some((t) => config.tags!.includes(t))
            );
        } else if (config.type === "COUNTRIES" && config.countries && config.countries.length > 0) {
            targetContacts = contacts.filter((c) =>
                config.countries!.some((prefix) => c.phone.startsWith(prefix))
            );
        }

        // Calculate cost based on each contact's country
        const { totalCostFCFA } = calculateBroadcastCost(targetContacts.map(c => c.phone));
        const avgCostPerMessage = targetContacts.length > 0
            ? Math.ceil(totalCostFCFA / targetContacts.length)
            : 0;

        return {
            count: targetContacts.length,
            estimatedCost: totalCostFCFA,
            creditBalance,
            costPerMessage: avgCostPerMessage,
        };
    },
});

// ===================================
// RETRY FAILED MESSAGES
// ===================================

export const retryFailed = mutation({
    args: {
        broadcastId: v.id("broadcasts"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            throw new Error("No organization selected");
        }

        const organizationId = session.currentOrganizationId;

        // Permission check: only ADMIN+ can retry
        const membership = await ctx.db.query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", organizationId))
            .first();
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
            throw new Error("Permission refusée: seuls les admins peuvent relancer des broadcasts");
        }

        const broadcast = await ctx.db.get(args.broadcastId);
        if (!broadcast) throw new Error("Broadcast not found");
        if (broadcast.organizationId !== organizationId) {
            throw new Error("Unauthorized");
        }

        // Get the template for re-sending
        const template = await ctx.db.get(broadcast.templateId);
        if (!template) throw new Error("Template not found");

        // Find failed messages for this broadcast (no by_broadcast index, use filter)
        const failedMessages = await ctx.db
            .query("messages")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("broadcastId"), args.broadcastId),
                    q.eq(q.field("status"), "FAILED")
                )
            )
            .collect();

        let retriedCount = 0;

        for (const msg of failedMessages) {
            if (!msg.contactId) continue;

            const contact = await ctx.db.get(msg.contactId);
            if (!contact) continue;

            await ctx.scheduler.runAfter(0, internal.broadcasts.sendSingleToContact, {
                broadcastId: args.broadcastId,
                organizationId,
                contactId: contact._id,
                phone: contact.phone,
                templateName: template.name,
                languageCode: template.language,
                components: [],
                whatsappChannelId: broadcast.whatsappChannelId,
            });

            retriedCount++;
        }

        // Reset failedCount and update status
        const updates: Record<string, unknown> = {
            failedCount: 0,
            updatedAt: Date.now(),
        };
        if (broadcast.status === "COMPLETED" || broadcast.status === "FAILED") {
            updates.status = "SENDING";
        }
        await ctx.db.patch(args.broadcastId, updates);

        return { retriedCount };
    },
});

// ===================================
// ACTIVITY TIMELINE
// ===================================

export const getActivity = query({
    args: {
        broadcastId: v.id("broadcasts"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            throw new Error("No organization selected");
        }

        const broadcast = await ctx.db.get(args.broadcastId);
        if (!broadcast) throw new Error("Broadcast not found");
        if (broadcast.organizationId !== session.currentOrganizationId) {
            throw new Error("Unauthorized access to this broadcast");
        }

        const activities: Array<{
            type: string;
            timestamp: number;
            message: string;
        }> = [];

        // Created
        activities.push({
            type: "created",
            timestamp: broadcast.createdAt,
            message: "Campagne créée",
        });

        // Scheduled
        if (broadcast.scheduledAt) {
            const scheduledDate = new Date(broadcast.scheduledAt).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
            });
            activities.push({
                type: "scheduled",
                timestamp: broadcast.scheduledAt,
                message: `Planifiée pour le ${scheduledDate}`,
            });
        }

        // Sending started
        if (broadcast.status === "SENDING" || broadcast.status === "COMPLETED" || broadcast.status === "FAILED") {
            activities.push({
                type: "sending_started",
                timestamp: broadcast.updatedAt,
                message: "Envoi démarré",
            });
        }

        // Completed
        if (broadcast.completedAt) {
            activities.push({
                type: "completed",
                timestamp: broadcast.completedAt,
                message: `Envoi terminé — ${broadcast.sentCount} messages envoyés`,
            });
        }

        // Failures
        if (broadcast.failedCount > 0) {
            activities.push({
                type: "failures",
                timestamp: broadcast.updatedAt,
                message: `${broadcast.failedCount} messages en échec`,
            });
        }

        // Sort by timestamp descending
        activities.sort((a, b) => b.timestamp - a.timestamp);

        return { activities };
    },
});

// ===================================
// EXPORT BROADCASTS
// ===================================

export const exportBroadcasts = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            return [];
        }

        const organizationId = session.currentOrganizationId;

        const broadcasts = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .order("desc")
            .collect();

        const result = await Promise.all(
            broadcasts.map(async (b) => {
                const template = await ctx.db.get(b.templateId);
                return {
                    name: b.name,
                    templateName: template?.name || "Unknown Template",
                    status: b.status,
                    sentCount: b.sentCount,
                    deliveredCount: b.deliveredCount,
                    readCount: b.readCount,
                    repliedCount: b.repliedCount,
                    failedCount: b.failedCount,
                    createdAt: new Date(b.createdAt).toISOString(),
                    completedAt: b.completedAt ? new Date(b.completedAt).toISOString() : "",
                };
            })
        );

        return result;
    },
});
