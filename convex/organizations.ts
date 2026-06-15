/**
 *   ___                        _          _   _                 
 *  / _ \ _ __ __ _  __ _ _ __ (_)______ _| |_(_) ___  _ __  ___ 
 * | | | | '__/ _` |/ _` | '_ \| |_  / _` | __| |/ _ \| '_ \/ __|
 * | |_| | | | (_| | (_| | | | | |/ / (_| | |_| | (_) | | | \__ \
 *  \___/|_|  \__, |\__,_|_| |_|_/___\__,_|\__|_|\___/|_| |_|___/
 *            |___/                                              
 *
 * ORGANIZATIONS FUNCTIONS
 *
 * CRUD operations for organizations.
 * - listMine: Returns all organizations the user is a member of.
 * - get: Internal helper to fetch an organization by ID.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rateLimiter } from "./lib/rateLimits";
import { enforceChannelDowngrade } from "./lib/planEnforcement";

export const listMine = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const orgs = await Promise.all(
            memberships.map(async (m) => {
                const org = await ctx.db.get(m.organizationId);
                if (!org) return null;
                // Strip sensitive fields before returning to client
                const { whatsapp, stripe, ...safeOrg } = org;
                return {
                    ...safeOrg,
                    whatsapp: whatsapp ? {
                        phoneNumberId: whatsapp.phoneNumberId,
                        businessAccountId: whatsapp.businessAccountId,
                    } : undefined,
                };
            })
        );

        return orgs.filter((org) => org !== null);
    },
});

export const get = query({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Vérifier que l'utilisateur est membre de l'organisation
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.id)
            )
            .first();

        if (!membership) {
            throw new Error("Unauthorized: Not a member of this organization");
        }

        const org = await ctx.db.get(args.id);
        if (!org) return null;

        // Exclure le token d'accès WhatsApp de la réponse
        const { whatsapp, ...safeOrg } = org;
        return {
            ...safeOrg,
            whatsapp: whatsapp ? {
                phoneNumberId: whatsapp.phoneNumberId,
                businessAccountId: whatsapp.businessAccountId,
                webhookVerifyToken: whatsapp.webhookVerifyToken,
                // accessToken volontairement exclu
            } : undefined,
        };
    }
});

/**
 * Create OR update the user's current onboarding organization.
 *
 * Idempotent : if the user already has an active organization (via
 * `userSessions.currentOrganizationId`) and owns it, this mutation patches
 * the existing org instead of inserting a new one. Lets the BUSINESS_INFO
 * onboarding step be re-submitted (back-navigation, retry) without
 * orphaning organizations and memberships.
 *
 * Slug ownership : the pre-existing uniqueness check (slug belongs to one
 * of MY orgs vs. someone else's) is preserved and reused — no separate
 * `updateOrgDuringOnboarding` mutation needed.
 */
export const create = mutation({
    args: {
        name: v.string(),
        slug: v.optional(v.string()),
        businessSector: v.string(),
        website: v.optional(v.string()),
        phone: v.optional(v.string()),
        timezone: v.string(),
        locale: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Slug ownership check — applies to both create and update paths.
        if (args.slug) {
            const existing = await ctx.db
                .query("organizations")
                .withIndex("by_slug", (q) => q.eq("slug", args.slug))
                .first();

            if (existing) {
                const membership = await ctx.db
                    .query("memberships")
                    .withIndex("by_user_org", (q) =>
                        q.eq("userId", userId).eq("organizationId", existing._id)
                    )
                    .first();

                if (!membership) {
                    throw new Error("Ce nom d'espace (slug) est déjà pris.");
                }
            }
        }

        // ─── Upsert : if the user has a current org and owns it, patch it.
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (session?.currentOrganizationId) {
            const currentOrg = await ctx.db.get(session.currentOrganizationId);
            if (currentOrg && currentOrg.ownerId === userId) {
                // PATCH path — re-submit during onboarding.
                await ctx.db.patch(currentOrg._id, {
                    name: args.name,
                    slug: args.slug ?? currentOrg.slug,
                    businessSector: args.businessSector,
                    website: args.website,
                    phone: args.phone,
                    timezone: args.timezone,
                    locale: args.locale,
                    updatedAt: Date.now(),
                });
                await ctx.db.patch(session._id, {
                    lastActivityAt: Date.now(),
                });
                return currentOrg._id;
            }
        }

        // ─── Insert path — only enforce the rate limit when actually creating
        // a brand-new organization. Edits during onboarding are unbounded.
        await rateLimiter.limit(ctx, "createOrganization", { key: userId, throws: true });

        const now = Date.now();
        const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours

        const orgId = await ctx.db.insert("organizations", {
            name: args.name,
            slug: args.slug,
            businessSector: args.businessSector,
            website: args.website,
            phone: args.phone,
            timezone: args.timezone,
            locale: args.locale,
            onboardingStep: "PLAN_SELECT",
            ownerId: userId,
            plan: "FREE",
            hasSelectedPlan: false,
            trialStartedAt: now,
            trialEndsAt: now + TRIAL_DURATION_MS,
            settings: {
                assignment: {
                    autoAssignEnabled: true,
                    maxConcurrentChats: 5,
                    excludeOfflineAgents: true
                }
            },
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("memberships", {
            userId,
            organizationId: orgId,
            role: "OWNER",
            status: "ONLINE",
            maxConversations: 100,
            activeConversations: 0,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
        });

        // Auto-switch to new org.
        if (session) {
            await ctx.db.patch(session._id, {
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        } else {
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        }

        return orgId;
    },
});

// ============================================
// Update Organization Plan (onboarding step 2)
// ============================================
export const updateOrgPlan = mutation({
    args: {
        plan: v.union(
            v.literal("FREE"),
            v.literal("STARTER"),
            v.literal("BUSINESS"),
            v.literal("PRO"),
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        if (!session?.currentOrganizationId) {
            throw new Error("Aucune organisation active");
        }

        const org = await ctx.db.get(session.currentOrganizationId);
        if (!org || org.ownerId !== userId) {
            throw new Error("Seul le propriétaire peut changer le plan");
        }

        await ctx.db.patch(session.currentOrganizationId, {
            plan: args.plan,
            updatedAt: Date.now(),
        });

        // Si le nouveau plan a des quotas inférieurs, désactiver les canaux
        // excédentaires, mettre en pause les broadcasts concernés et notifier.
        // Sans ça, un downgrade via UI bypasserait toutes les limites.
        await enforceChannelDowngrade(ctx, session.currentOrganizationId, args.plan);
    },
});

// ============================================
// Update Organization Profile
// ============================================
export const updateOrganization = mutation({
    args: {
        name: v.optional(v.string()),
        businessSector: v.optional(v.string()),
        website: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        timezone: v.optional(v.string()),
        logo: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        const orgId = session?.currentOrganizationId;
        if (!orgId) throw new Error("Aucune organisation active");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", orgId)
            )
            .first();

        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            throw new Error("Permissions insuffisantes");
        }

        const updates: Record<string, any> = { updatedAt: Date.now() };
        if (args.name !== undefined) updates.name = args.name;
        if (args.businessSector !== undefined) updates.businessSector = args.businessSector;
        if (args.website !== undefined) updates.website = args.website;
        if (args.phone !== undefined) updates.phone = args.phone;
        if (args.address !== undefined) updates.address = args.address;
        if (args.timezone !== undefined) updates.timezone = args.timezone;
        if (args.logo !== undefined) updates.logo = args.logo;

        await ctx.db.patch(orgId, updates);
        return { success: true };
    },
});

// ============================================
// Update Organization Settings (auto-reply, business hours)
// ============================================
export const updateOrgSettings = mutation({
    args: {
        autoReplyEnabled: v.optional(v.boolean()),
        autoReplyMessage: v.optional(v.string()),
        businessHours: v.optional(v.object({
            enabled: v.boolean(),
            timezone: v.optional(v.string()),
            schedule: v.optional(v.array(v.object({
                day: v.string(),
                enabled: v.boolean(),
                start: v.optional(v.string()),
                end: v.optional(v.string()),
            }))),
        })),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        const orgId = session?.currentOrganizationId;
        if (!orgId) throw new Error("Aucune organisation active");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", orgId)
            )
            .first();

        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            throw new Error("Permissions insuffisantes");
        }

        const org = await ctx.db.get(orgId);
        if (!org) throw new Error("Organisation introuvable");

        const currentSettings = org.settings || {};
        const newSettings: Record<string, any> = { ...currentSettings };

        if (args.autoReplyEnabled !== undefined) newSettings.autoReplyEnabled = args.autoReplyEnabled;
        if (args.autoReplyMessage !== undefined) newSettings.autoReplyMessage = args.autoReplyMessage;
        if (args.businessHours !== undefined) newSettings.businessHours = args.businessHours;

        await ctx.db.patch(orgId, {
            settings: newSettings,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

// ============================================
// Get Organization Settings
// ============================================
export const getOrgSettings = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

        const orgId = session?.currentOrganizationId;
        if (!orgId) return null;

        const org = await ctx.db.get(orgId);
        if (!org) return null;

        return {
            name: org.name,
            businessSector: org.businessSector,
            website: org.website,
            phone: org.phone,
            address: org.address,
            timezone: org.timezone,
            logo: org.logo,
            settings: org.settings,
        };
    },
});

export const checkSlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (!existing) return true;

        // Si le slug appartient déjà à une org de l'utilisateur, c'est OK
        const userId = await getAuthUserId(ctx);
        if (!userId) return false;

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", existing._id)
            )
            .first();

        return !!membership;
    },
});
