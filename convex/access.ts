/**
 * Access status — query publique qui retourne en un seul appel l'état du
 * trial, du plan sélectionné, et la map de droits d'accès pour toutes les
 * features référencées dans `lib/planFeatures`.
 *
 * Consommée par le hook `useAccessStatus` / `useFeatureAccess` côté client.
 */

import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
    featureUnlockSource,
    getTrialEndsAt,
    hasChosenPlan,
    isTrialing,
} from "./lib/planHelpers";
import { FEATURES, type FeatureKey, type PlanKey } from "./lib/planFeatures";

type FeatureStatus = {
    accessible: boolean;
    source: "trial" | "plan" | "locked";
    minPlan: PlanKey;
    label: string;
};

export const getAccessStatus = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        if (!session?.currentOrganizationId) return null;

        const org = await ctx.db.get(session.currentOrganizationId);
        if (!org) return null;

        const now = Date.now();
        const trialEndsAt = getTrialEndsAt(org);
        const trialing = isTrialing(org, now);

        const features: Record<FeatureKey, FeatureStatus> = {} as any;
        for (const key of Object.keys(FEATURES) as FeatureKey[]) {
            const def = FEATURES[key];
            const source = featureUnlockSource(org, key, now);
            features[key] = {
                accessible: source !== "locked",
                source,
                minPlan: def.minPlan,
                label: def.label,
            };
        }

        return {
            plan: org.plan as PlanKey,
            hasSelectedPlan: hasChosenPlan(org),
            isTrialing: trialing,
            trialStartedAt: org.trialStartedAt ?? org.createdAt ?? null,
            trialEndsAt: trialEndsAt ?? null,
            trialDaysLeft: trialEndsAt
                ? Math.max(0, Math.ceil((trialEndsAt - now) / (24 * 60 * 60 * 1000)))
                : 0,
            features,
        };
    },
});

/**
 * Backfill : remplit trialStartedAt / trialEndsAt sur les orgs existantes
 * qui n'ont pas encore ces champs. Idempotent.
 */
export const backfillTrial = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const orgs = await ctx.db.query("organizations").collect();
        const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
        let patched = 0;

        for (const org of orgs) {
            if (org.trialStartedAt && org.trialEndsAt) continue;
            const startedAt = org.trialStartedAt ?? org.createdAt ?? Date.now();
            await ctx.db.patch(org._id, {
                trialStartedAt: startedAt,
                trialEndsAt: startedAt + TRIAL_MS,
                hasSelectedPlan: org.hasSelectedPlan ?? org.plan !== "FREE",
                updatedAt: Date.now(),
            });
            patched += 1;
        }

        return { patched };
    },
});

/**
 * Dev-only : force l'expiration du trial pour tester le lock post-trial.
 * Ne pas exposer en prod — à utiliser depuis le dashboard Convex / CLI.
 */
export const expireTrialDev = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.organizationId),
            )
            .first();
        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            throw new Error("Réservé aux OWNER/ADMIN");
        }

        const now = Date.now();
        await ctx.db.patch(args.organizationId, {
            trialStartedAt: now - 20 * 24 * 60 * 60 * 1000,
            trialEndsAt: now - 6 * 24 * 60 * 60 * 1000,
            updatedAt: now,
        });
        return { ok: true };
    },
});

/**
 * Dev-only : réinitialise un trial de 14 jours sur l'org courante.
 */
export const resetTrialDev = mutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.organizationId),
            )
            .first();
        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            throw new Error("Réservé aux OWNER/ADMIN");
        }

        const now = Date.now();
        await ctx.db.patch(args.organizationId, {
            trialStartedAt: now,
            trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
            updatedAt: now,
        });
        return { ok: true };
    },
});

/**
 * Dev-only : inspecte l'état d'abonnement / WhatsApp d'un compte par email.
 * internalQuery → appelable uniquement depuis la CLI / le dashboard Convex,
 * jamais depuis le client. À lancer via `convex run access:inspectAccountDev`.
 */
export const inspectAccountDev = internalQuery({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", email))
            .first();
        if (!user) return { error: `Utilisateur ${email} introuvable` };

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();
        const orgId = session?.currentOrganizationId ?? null;
        const org = orgId ? await ctx.db.get(orgId) : null;

        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) => q.eq("userId", user._id))
            .collect();

        return {
            userId: user._id,
            email: user.email ?? email,
            currentOrgId: orgId,
            org: org
                ? {
                      name: org.name,
                      plan: org.plan,
                      hasSelectedPlan: org.hasSelectedPlan ?? null,
                      trialEndsAt: org.trialEndsAt ?? null,
                      isTrialing: typeof org.trialEndsAt === "number" ? Date.now() < org.trialEndsAt : null,
                      stripeStatus: org.stripe?.status ?? null,
                      demoOutboundMode: org.demo?.outboundMode ?? null,
                      whatsapp: org.whatsapp
                          ? {
                                hasPhoneNumberId: !!org.whatsapp.phoneNumberId,
                                hasAccessToken: !!org.whatsapp.accessToken,
                            }
                          : null,
                  }
                : null,
            memberships: memberships.map((m) => ({ orgId: m.organizationId, role: m.role })),
        };
    },
});

/**
 * Dev-only : provisionne le compte d'un email comme **abonné payant** sur son
 * organisation courante (plan choisi + abonnement Stripe "active" simulé), ce
 * qui retire le bandeau d'essai et débloque les features gatées par plan.
 *
 * `localOnlyOutbound: true` active aussi le mode `demo.outboundMode = "local_only"`
 * : les messages sortants passent en SENT localement sans appeler l'API
 * WhatsApp (cf. messages.send) — indispensable pour tester l'envoi sans
 * numéro WhatsApp réel ni fenêtre 24 h ouverte. NB : l'abonnement seul NE
 * débloque PAS l'envoi WhatsApp (l'envoi n'est pas gaté par le plan).
 *
 * internalMutation → CLI / dashboard uniquement. NE PAS utiliser en prod.
 */
export const provisionTestAccountDev = internalMutation({
    args: {
        email: v.string(),
        plan: v.optional(
            v.union(
                v.literal("STARTER"),
                v.literal("BUSINESS"),
                v.literal("PRO"),
                v.literal("ENTERPRISE"),
            ),
        ),
        localOnlyOutbound: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.email))
            .first();
        if (!user) throw new Error(`Utilisateur ${args.email} introuvable`);

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();
        const orgId = session?.currentOrganizationId;
        if (!orgId) throw new Error("Aucune organisation courante sur la session de ce user");
        const org = await ctx.db.get(orgId);
        if (!org) throw new Error("Organisation introuvable");

        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const plan = args.plan ?? "BUSINESS";

        const patch: Record<string, unknown> = {
            plan,
            hasSelectedPlan: true,
            stripe: {
                customerId: org.stripe?.customerId ?? `cus_dev_${orgId}`,
                subscriptionId: org.stripe?.subscriptionId ?? `sub_dev_${orgId}`,
                priceId: org.stripe?.priceId,
                status: "active",
                currentPeriodEnd: now + THIRTY_DAYS,
                trialUsed: true,
            },
            updatedAt: now,
        };

        if (args.localOnlyOutbound) {
            patch.demo = {
                kind: org.demo?.kind ?? "APP_REVIEW",
                seedVersion: org.demo?.seedVersion ?? "test-account",
                seededAt: org.demo?.seededAt ?? now,
                outboundMode: "local_only",
                notes: "Compte de test : envoi local (aucun appel WhatsApp). Repasser en whatsapp_api / retirer pour la prod.",
            };
        }

        await ctx.db.patch(orgId, patch);

        return {
            ok: true,
            orgId,
            orgName: org.name,
            plan,
            stripeStatus: "active",
            localOnlyOutbound: !!args.localOnlyOutbound,
        };
    },
});
