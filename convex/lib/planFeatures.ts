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
    if (!orgHasChosenPlan(org)) {
        throw new Error(
            "Votre période d'essai est terminée. Choisissez un plan depuis /dashboard/billing pour débloquer cette fonctionnalité.",
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
    assertFeature(org as TrialState, feature, now);
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
