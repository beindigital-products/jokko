/**
 * Access status — query publique qui retourne en un seul appel l'état du
 * trial, du plan sélectionné, et la map de droits d'accès pour toutes les
 * features référencées dans `lib/planFeatures`.
 *
 * Consommée par le hook `useAccessStatus` / `useFeatureAccess` côté client.
 */

import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { createNotification } from "./notifications";
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
export const backfillTrial = internalMutation({
    args: {},
    handler: async (ctx) => {
        // internalMutation: run once from the Convex CLI / dashboard, never from
        // a client. (Was a public mutation that scanned + patched ALL orgs —
        // any authed user could trigger a full-table write.)
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
 * Dev-only : état de la boîte de réception d'un compte pour préparer/vérifier
 * un test QA — équipe (pour les @mentions), nombre de raccourcis, et les
 * dernières notifications MENTION de l'org (pour confirmer qu'un mention a bien
 * notifié la bonne personne). internalQuery → CLI / dashboard uniquement.
 */
export const inspectInboxDev = internalQuery({
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
        const orgId = session?.currentOrganizationId;
        if (!orgId) return { error: "Aucune organisation courante" };
        const org = await ctx.db.get(orgId);

        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect();
        const team = await Promise.all(
            memberships.map(async (m) => {
                const u = await ctx.db.get(m.userId);
                return {
                    userId: m.userId,
                    name: u?.name ?? u?.email ?? "?",
                    email: u?.email ?? null,
                    role: m.role,
                    isCurrentUser: m.userId === user._id,
                };
            }),
        );

        const shortcuts = await ctx.db
            .query("shortcuts")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect();

        const mentions = await ctx.db
            .query("notifications")
            .withIndex("by_org", (q) => q.eq("organizationId", orgId))
            .collect();
        const recentMentions = mentions
            .filter((n) => n.type === "MENTION")
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 8)
            .map((n) => ({
                forUserId: n.userId,
                title: n.title,
                message: n.message,
                link: n.link ?? null,
                isRead: n.isRead,
                createdAt: n.createdAt,
            }));

        return {
            orgId,
            orgName: org?.name ?? null,
            teamSize: team.length,
            team,
            shortcutsCount: shortcuts.length,
            shortcuts: shortcuts.slice(0, 10).map((s) => ({ shortcut: s.shortcut, type: s.type ?? "TEXT" })),
            recentMentionNotifications: recentMentions,
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

/**
 * Dev-only : seed des données réalistes pour QA de la boîte de réception sur
 * l'org courante d'un user — un coéquipier (pour tester les @mentions) et
 * quelques raccourcis (pour tester le popup `/`). Idempotent.
 */
export const seedInboxTestDataDev = internalMutation({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", email))
            .first();
        if (!user) throw new Error(`Utilisateur ${email} introuvable`);
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();
        const orgId = session?.currentOrganizationId;
        if (!orgId) throw new Error("Aucune organisation courante");
        const now = Date.now();

        // 1. Coéquipier "Awa Diop" (user + membership AGENT). Sans compte auth :
        //    suffisant pour apparaître dans le picker et recevoir une notification.
        const teammateEmail = "awa.diop+qa@jokko.co";
        let teammate = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", teammateEmail))
            .first();
        if (!teammate) {
            const id = await ctx.db.insert("users", {
                name: "Awa Diop",
                email: teammateEmail,
                image: "https://i.pravatar.cc/150?u=awa-qa",
                createdAt: now,
                updatedAt: now,
            });
            teammate = await ctx.db.get(id);
        }
        if (!teammate) throw new Error("Échec création coéquipier");

        const existingMembership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", teammate!._id).eq("organizationId", orgId),
            )
            .first();
        if (!existingMembership) {
            await ctx.db.insert("memberships", {
                userId: teammate._id,
                organizationId: orgId,
                role: "AGENT",
                status: "OFFLINE",
                maxConversations: 10,
                activeConversations: 0,
                lastSeenAt: now,
                joinedAt: now,
            });
        }

        // 2. Raccourcis (si l'org n'en a aucun).
        const existingShortcuts = await ctx.db
            .query("shortcuts")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect();
        let shortcutsSeeded = 0;
        if (existingShortcuts.length === 0) {
            const samples = [
                { shortcut: "/bonjour", text: "Bonjour 👋 Merci de nous avoir contactés, comment puis-je vous aider ?" },
                { shortcut: "/merci", text: "Merci beaucoup pour votre message, je reviens vers vous très vite." },
                { shortcut: "/horaires", text: "Nous sommes disponibles du lundi au vendredi, de 9h à 18h." },
            ];
            for (const s of samples) {
                await ctx.db.insert("shortcuts", {
                    organizationId: orgId,
                    shortcut: s.shortcut,
                    text: s.text,
                    type: "TEXT",
                    createdAt: now,
                    updatedAt: now,
                });
                shortcutsSeeded += 1;
            }
        }

        return {
            ok: true,
            orgId,
            teammate: { userId: teammate._id, name: teammate.name, email: teammate.email },
            membershipCreated: !existingMembership,
            shortcutsSeeded,
            shortcutsTotal: existingShortcuts.length + shortcutsSeeded,
        };
    },
});

/**
 * Dev-only : simule un coéquipier (`authorEmail`) qui poste une note interne
 * mentionnant `recipientEmail`, sur la conversation donnée (ou la plus récente
 * de l'org). Réplique fidèlement le chemin de `messages.addInternalNote`
 * (message interne + createNotification MENTION), pour tester le côté
 * réception/accès depuis le compte mentionné. NE PAS utiliser en prod.
 */
export const simulateMentionDev = internalMutation({
    args: {
        authorEmail: v.string(),
        recipientEmail: v.string(),
        conversationId: v.optional(v.id("conversations")),
        content: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const author = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.authorEmail))
            .first();
        const recipient = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.recipientEmail))
            .first();
        if (!author) throw new Error(`Auteur ${args.authorEmail} introuvable`);
        if (!recipient) throw new Error(`Destinataire ${args.recipientEmail} introuvable`);

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", recipient._id))
            .first();
        const orgId = session?.currentOrganizationId;
        if (!orgId) throw new Error("Pas d'org courante pour le destinataire");

        let conversation = args.conversationId ? await ctx.db.get(args.conversationId) : null;
        if (!conversation) {
            conversation = await ctx.db
                .query("conversations")
                .withIndex("by_org_last_message", (q) => q.eq("organizationId", orgId))
                .order("desc")
                .first();
        }
        if (!conversation) throw new Error("Aucune conversation dans l'org");

        const content = (args.content ?? "@" + recipient.name + " peux-tu jeter un œil à ce client stp ?").trim();

        const messageId = await ctx.db.insert("messages", {
            organizationId: conversation.organizationId,
            conversationId: conversation._id,
            senderId: author._id,
            type: "TEXT",
            content,
            direction: "OUTBOUND",
            status: "SENT",
            isInternal: true,
            mentions: [{ userId: recipient._id, name: recipient.name ?? "?" }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        const authorName = author.name || author.email || "Un coéquipier";
        const contact = conversation.contactId ? await ctx.db.get(conversation.contactId) : null;
        const where = contact?.name || contact?.phone || "une conversation";
        await createNotification(ctx, {
            organizationId: conversation.organizationId,
            userId: recipient._id,
            type: "MENTION",
            title: `${authorName} vous a mentionné`,
            message: `Sur ${where} : ${content.slice(0, 140)}`,
            link: `/dashboard/conversations/${conversation._id}`,
            metadata: { conversationId: String(conversation._id), messageId: String(messageId) },
        });

        return {
            ok: true,
            conversationId: conversation._id,
            messageId,
            notifiedUserId: recipient._id,
            link: `/dashboard/conversations/${conversation._id}`,
        };
    },
});

/**
 * Dev-only : crée UNE conversation d'exemple (contact + quelques messages
 * client/agent) sur l'org courante d'un compte, pour tester l'inbox / le
 * brouillon IA en QA. Idempotent : ne fait rien si l'org a déjà une
 * conversation. NE PAS utiliser en prod.
 */
export const seedSampleConversationDev = internalMutation({
    args: { email: v.string() },
    handler: async (ctx, { email }) => {
        const user = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", email))
            .first();
        if (!user) throw new Error(`Utilisateur ${email} introuvable`);
        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();
        const orgId = session?.currentOrganizationId;
        if (!orgId) throw new Error("Aucune organisation courante");

        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_org_last_message", (q) => q.eq("organizationId", orgId))
            .first();
        if (existing) {
            return { ok: true, skipped: true, conversationId: existing._id };
        }

        const now = Date.now();
        const phone = "+221770000123";
        const contactId = await ctx.db.insert("contacts", {
            organizationId: orgId, name: "Awa Ndiaye", phone, searchName: "awa ndiaye",
            isWhatsApp: true, tags: [], createdAt: now, updatedAt: now,
        });
        const conversationId = await ctx.db.insert("conversations", {
            organizationId: orgId, contactId, channel: "WHATSAPP", status: "OPEN",
            lastMessageAt: now, lastMessageDirection: "INBOUND",
            preview: "Vous livrez à Dakar ?", unreadCount: 1,
            createdAt: now, updatedAt: now, tags: [],
        });
        const turns: Array<{ dir: "INBOUND" | "OUTBOUND"; text: string }> = [
            { dir: "INBOUND", text: "Bonjour, j'ai une question sur vos tarifs." },
            { dir: "OUTBOUND", text: "Bonjour Awa ! Avec plaisir, que souhaitez-vous savoir ?" },
            { dir: "INBOUND", text: "Vous livrez à Dakar ?" },
        ];
        let t = now - turns.length * 60_000;
        for (const turn of turns) {
            await ctx.db.insert("messages", {
                organizationId: orgId, conversationId,
                contactId: turn.dir === "INBOUND" ? contactId : undefined,
                senderId: turn.dir === "OUTBOUND" ? user._id : undefined,
                type: "TEXT", content: turn.text, direction: turn.dir,
                status: "DELIVERED", createdAt: t, updatedAt: t,
            });
            t += 60_000;
        }
        return { ok: true, skipped: false, conversationId };
    },
});
