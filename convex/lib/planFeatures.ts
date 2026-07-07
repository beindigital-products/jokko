/**
 * Re-export du manifest de features depuis `lib/planFeatures` pour que Convex
 * et le client utilisent exactement les mêmes constantes. Ajoute les helpers
 * serveur `requirePlanFeature` / `requirePlanFeatureInAction`.
 *
 * Règles de gating appliquées dans `planHelpers.hasFeatureAccess()`.
 */

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
    FEATURE_MIN_PLAN,
    planIncludesFeature,
    type PlanFeature,
    type PlanKey,
} from "@jokko/core/planFeatures";

export {
    FEATURES,
    FEATURE_MIN_PLAN,
    FEATURE_LABELS,
    PLAN_LABEL,
    PLAN_ORDER,
    PLAN_RANK,
    planIncludesFeature,
    planRank,
    minPlanForFeature,
} from "@jokko/core/planFeatures";
export type { FeatureKey, PlanFeature, PlanKey } from "@jokko/core/planFeatures";

/** Trial/plan state needed to decide feature access (mirrors planHelpers). */
type TrialState = {
    plan?: string;
    trialEndsAt?: number;
    hasSelectedPlan?: boolean;
    createdAt?: number;
    stripeStatus?: string;
};

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

/** Inlined copies of planHelpers.isTrialing / hasChosenPlan to avoid a circular
 *  import (planHelpers already imports from this module). Keep in sync. */
function orgIsTrialing(org: TrialState, now: number): boolean {
    if (typeof org.trialEndsAt === "number") return now < org.trialEndsAt;
    if (typeof org.createdAt === "number") return now < org.createdAt + TRIAL_MS;
    return false;
}
function orgHasChosenPlan(org: TrialState): boolean {
    if (org.hasSelectedPlan === true) return true;
    return org.plan !== "FREE" && org.plan != null;
}
/** Abonnement Stripe actif ("active" ou "trialing"). */
function orgHasActiveStripe(org: TrialState): boolean {
    return org.stripeStatus === "active" || org.stripeStatus === "trialing";
}
/** Accès payant : plan choisi ET (ENTERPRISE manuel OU abonnement Stripe actif). */
function orgHasPaidAccess(org: TrialState): boolean {
    if (!orgHasChosenPlan(org)) return false;
    if (org.plan === "ENTERPRISE") return true;
    return orgHasActiveStripe(org);
}

/**
 * Gating serveur unifié — applique exactement la règle de `hasFeatureAccess` :
 *   - trial actif → tout déverrouillé
 *   - trial expiré + aucun plan choisi (FREE sentinel) → tout verrouillé
 *   - trial expiré + plan choisi → accès si planRank(plan) >= planRank(min)
 *
 * (Avant : ignorait le trial → les utilisateurs en essai étaient bloqués côté
 * serveur sur flows/broadcasts/CRM/IA alors que le front les leur ouvrait.)
 */
function assertFeature(org: TrialState, feature: PlanFeature, now: number): void {
    if (orgIsTrialing(org, now)) return;
    if (!orgHasPaidAccess(org)) {
        throw new Error(
            "Votre période d'essai est terminée. Finalisez votre abonnement via /dashboard/billing (paiement Stripe) pour débloquer cette fonctionnalité.",
        );
    }
    if (!planIncludesFeature((org.plan ?? "FREE") as PlanKey, feature)) {
        const min = FEATURE_MIN_PLAN[feature];
        throw new Error(
            `Fonctionnalité réservée au plan ${min} ou supérieur. Votre plan actuel : ${org.plan}. Passez à ${min} pour y accéder.`,
        );
    }
}

/**
 * Throw si l'org n'a pas accès à la feature (en tenant compte du trial).
 */
export async function requirePlanFeature(
    ctx: QueryCtx | MutationCtx,
    organizationId: Id<"organizations">,
    feature: PlanFeature,
    now: number = Date.now(),
): Promise<void> {
    const org = await ctx.db.get(organizationId);
    if (!org) throw new Error("Organization not found");
    // Aplatit `stripe.status` (imbriqué sur le Doc) vers `stripeStatus` (plat sur
    // TrialState) : sans ce mapping, le gate « plans via Stripe » lirait undefined
    // et verrouillerait un plan payant pourtant adossé à un abonnement actif.
    assertFeature(
        {
            plan: org.plan,
            trialEndsAt: org.trialEndsAt,
            hasSelectedPlan: org.hasSelectedPlan,
            createdAt: org.createdAt,
            stripeStatus: org.stripe?.status,
        },
        feature,
        now,
    );
}

/**
 * Variante pour les actions Convex : l'action n'a pas accès à ctx.db, elle passe
 * l'état trial/plan récupéré via une internalQuery.
 */
export async function requirePlanFeatureInAction(
    org: TrialState | string,
    feature: PlanFeature,
    now: number = Date.now(),
): Promise<void> {
    // Rétro-compat : un appelant peut passer juste le plan (string).
    const state: TrialState = typeof org === "string" ? { plan: org } : org;
    assertFeature(state, feature, now);
}

/**
 * Variante booléenne (même règle que `assertFeature`) pour les appelants qui
 * doivent dégrader gracieusement au lieu de throw — ex. une action de fond qui
 * saute simplement une étape IA quand l'org n'y a pas droit (évite de brûler le
 * budget OpenAI partagé pour un plan non éligible).
 */
export function planFeatureAllowed(
    org: TrialState,
    feature: PlanFeature,
    now: number = Date.now(),
): boolean {
    if (orgIsTrialing(org, now)) return true;
    if (!orgHasPaidAccess(org)) return false;
    return planIncludesFeature((org.plan ?? "FREE") as PlanKey, feature);
}
