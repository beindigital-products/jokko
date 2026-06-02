import type { BannerCtaTone, BannerTone } from "@/components/dashboard/primitives/Banner"

/**
 * Shared, pure mapping from a trial's state to the {@link Banner} content.
 * Single source of truth behind both the billing TrialBanner (live, wired to
 * `useTrialStatus`) and the dashboard Overview banner (presentational, driven by
 * a prop) so the two never drift. Callers supply hrefs, variant and onDismiss.
 *
 * Escalation: neutral (J≥10) → reminder (J3–9) → urgent (J≤2) → expired.
 */

export interface TrialBannerInput {
    /** Trial has ended (envoi suspendu). */
    expired: boolean
    /** Days left in the trial (ignored when expired). */
    days: number
}

export interface TrialBannerContent {
    /** `data-state` attribute for tests / analytics. */
    dataState: "neutre" | "rappel" | "urgent" | "expired"
    tone: BannerTone
    eyebrow: string
    /** Right-side text in the eyebrow row. */
    left: string
    /** Elapsed fraction 0–1 for the slim progress bar. */
    progress: number
    title: string
    body: string
    cta: string
    ctaTone: BannerCtaTone
    /** Present only on the expired state. */
    secondaryCta?: string
    /** Whether a "Plus tard" dismiss affordance applies. */
    dismissible: boolean
}

const TOTAL_TRIAL_DAYS = 14

/** Map a trial's `{ expired, days }` to the Banner content fields. */
export function trialBannerContent({ expired, days }: TrialBannerInput): TrialBannerContent {
    if (expired) {
        return {
            dataState: "expired",
            tone: "expired",
            eyebrow: "Essai expiré",
            left: "Envoi suspendu",
            progress: 1,
            title: "Essai terminé",
            body: "Vous voyez encore vos données, mais l'envoi est suspendu. Activez votre abonnement pour reprendre.",
            cta: "Activer mon abonnement",
            ctaTone: "danger",
            secondaryCta: "Demander à l'admin",
            dismissible: false,
        }
    }

    const d = Math.max(0, days)
    const dayN = Math.min(TOTAL_TRIAL_DAYS, Math.max(1, TOTAL_TRIAL_DAYS - d))
    const eyebrow = `Essai · jour ${dayN} / ${TOTAL_TRIAL_DAYS}`
    const left = `${d} jour${d > 1 ? "s" : ""} restant${d > 1 ? "s" : ""}`
    const progress = Math.min(1, Math.max(0, (TOTAL_TRIAL_DAYS - d) / TOTAL_TRIAL_DAYS))

    if (d <= 2) {
        return {
            dataState: "urgent",
            tone: "urgent",
            eyebrow,
            left,
            progress,
            title: `Plus que ${d} jour${d > 1 ? "s" : ""}`,
            body: "À l'expiration, l'envoi de nouveaux messages sera bloqué.",
            cta: "Activer maintenant",
            ctaTone: "danger",
            dismissible: false,
        }
    }

    if (d <= 9) {
        return {
            dataState: "rappel",
            tone: "reminder",
            eyebrow,
            left,
            progress,
            title: `Plus que ${d} jours d'essai`,
            body: "Activez votre abonnement pour ne pas interrompre l'envoi de messages.",
            cta: "Activer mon abonnement",
            ctaTone: "ink",
            dismissible: true,
        }
    }

    return {
        dataState: "neutre",
        tone: "neutral",
        eyebrow,
        left,
        progress,
        title: "Bienvenue dans Jokko",
        body: "Aucune limite pendant l'essai. Choisissez un plan quand vous serez prêt.",
        cta: "Choisir un plan",
        ctaTone: "primary",
        dismissible: true,
    }
}
