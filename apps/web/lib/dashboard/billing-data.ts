import { formatLimit, isUnlimited } from "@/lib/plan-utils"
import type { BillingData, UsageMeter } from "@/components/dashboard/billing"

/**
 * billing-data — pure mappers turning real Convex plan/usage data into the v3
 * `BillingData` plan hero + usage strip. Side-effect free → unit-testable.
 *
 * Everything is in **FCFA** (the real currency — the design's "€" mock is
 * cosmetic). The credit wallet + recharge are wired separately by
 * `CreditWalletCardConnected`; invoices have no backend yet, so the page routes
 * "Gérer l'abonnement" to the Stripe customer portal instead of a fake table.
 */

export interface BillingPlanInput {
    key: string
    /** Display name, e.g. "Pro". */
    name: string
    monthlyPriceFCFA?: number
    maxAgents: number
    maxWhatsappChannels: number
    maxConversationsPerMonth: number
}

export interface StripeState {
    status?: string | null
    subscriptionId?: string | null
}

export interface UsageCounts {
    conversations: number
    seats: number
    channels: number
    /** Media storage, in MB (used vs plan cap; max = -1 → unlimited). */
    storageMB?: { used: number; max: number }
}

/** "149000" → "149 000" (deterministic, locale-independent). */
function group(n: number): string {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function mapPlan(plan: BillingPlanInput, stripe?: StripeState): BillingData["plan"] {
    const isFree = plan.key === "FREE"
    const seats = formatLimit(plan.maxAgents)
    const numbers = formatLimit(plan.maxWhatsappChannels)

    let renewalNote: string
    if (isFree) {
        renewalNote = "Aucun abonnement actif. Passez à un plan payant pour débloquer plus de sièges et de numéros."
    } else {
        switch (stripe?.status) {
            case "trialing":
                renewalNote = "Essai gratuit en cours — aucun paiement avant la fin de la période."
                break
            case "past_due":
                renewalNote = "Paiement en retard — mettez à jour votre moyen de paiement pour éviter l'interruption."
                break
            case "canceled":
                renewalNote = "Abonnement annulé — réactivez-le pour continuer à utiliser ce plan."
                break
            case "active":
                renewalNote = "Renouvellement automatique · paiement actif via Stripe."
                break
            default:
                renewalNote = "Abonnement actif."
        }
    }

    return {
        name: isFree ? "Gratuit" : plan.name,
        tagline: `jusqu'à ${seats} sièges · ${numbers} numéro${plan.maxWhatsappChannels > 1 ? "s" : ""}`,
        price: isFree || !plan.monthlyPriceFCFA ? "Gratuit" : `${group(plan.monthlyPriceFCFA)} FCFA`,
        priceUnit: isFree || !plan.monthlyPriceFCFA ? "" : "/ mois",
        renewalNote,
    }
}

function meter(label: string, value: number, limit: number, cost: string): UsageMeter {
    const unlimited = isUnlimited(limit)
    return {
        label,
        value: group(value),
        total: unlimited ? "∞" : group(limit),
        fraction: unlimited || limit <= 0 ? 0 : Math.min(1, value / limit),
        cost,
    }
}

export function mapUsage(plan: BillingPlanInput, counts: UsageCounts): UsageMeter[] {
    const meters = [
        meter("Conversations Meta", counts.conversations, plan.maxConversationsPerMonth, "inclus"),
        meter("Sièges", counts.seats, plan.maxAgents, "inclus"),
        meter("Numéros WhatsApp", counts.channels, plan.maxWhatsappChannels, "inclus"),
    ]
    if (counts.storageMB) {
        const { used, max } = counts.storageMB
        const unlimited = isUnlimited(max)
        meters.push({
            label: "Stockage média",
            value: `${group(used)} Mo`,
            total: unlimited ? "∞" : `${group(max)} Mo`,
            fraction: unlimited || max <= 0 ? 0 : Math.min(1, used / max),
            cost: "inclus",
        })
    }
    return meters
}
