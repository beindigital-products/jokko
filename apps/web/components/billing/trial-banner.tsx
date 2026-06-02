"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrialStatus } from "@/hooks/usePlans";
import { Banner } from "@/components/dashboard/primitives/Banner";

type TrialBannerProps = {
    variant?: "sidebar" | "page";
    className?: string;
};

/**
 * TrialBanner — wires `useTrialStatus` to the shared Banner primitive (4 tons).
 *
 * Visibilité (Q3=b) : masqué dès qu'un plan payant est sélectionné. Le ton
 * monte avec les jours restants : neutral (J≥10) → reminder (J3-9) →
 * urgent (J≤2) → expired (post-J0). "Plus tard" masque pour la session.
 */
export function TrialBanner({ variant = "page", className }: TrialBannerProps) {
    const { isTrialing, trialDaysLeft, trialEndsAt, hasSelectedPlan, isLoading } = useTrialStatus();
    const [dismissed, setDismissed] = useState(false);

    if (isLoading || hasSelectedPlan || dismissed) return null;

    const onDismiss = () => setDismissed(true);
    const billing = "/dashboard/billing";

    // Fallback : org sans trialEndsAt → accueil neutre (jamais "expiré").
    if (trialEndsAt == null && !isTrialing) {
        return (
            <Banner
                variant={variant}
                className={className}
                data-state="neutre"
                tone="neutral"
                eyebrow="Essai · 14 jours"
                progress={0}
                title="Bienvenue dans Jokko"
                body="Aucune limite pendant l'essai. Choisissez un plan quand vous serez prêt."
                cta="Choisir un plan"
                ctaTone="primary"
                ctaHref={billing}
                dismissible
                onDismiss={onDismiss}
            />
        );
    }

    if (!isTrialing) {
        return (
            <Banner
                variant={variant}
                className={className}
                data-state="expired"
                tone="expired"
                eyebrow="Essai expiré"
                left="Envoi suspendu"
                progress={1}
                title="Essai terminé"
                body="Vous voyez encore vos données, mais l'envoi est suspendu. Activez votre abonnement pour reprendre."
                cta="Activer mon abonnement"
                ctaTone="danger"
                ctaHref={billing}
                secondaryCta="Demander à l'admin"
                secondaryHref="/dashboard/team"
            />
        );
    }

    const days = Math.max(0, trialDaysLeft);
    const dayN = Math.min(14, Math.max(1, 14 - days));
    const eyebrow = `Essai · jour ${dayN} / 14`;
    const left = `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}`;
    const progress = Math.min(1, Math.max(0, (14 - days) / 14));

    if (days <= 2) {
        return (
            <Banner
                variant={variant}
                className={className}
                data-state="urgent"
                tone="urgent"
                eyebrow={eyebrow}
                left={left}
                progress={progress}
                title={`Plus que ${days} jour${days > 1 ? "s" : ""}`}
                body="À l'expiration, l'envoi de nouveaux messages sera bloqué."
                cta="Activer maintenant"
                ctaTone="danger"
                ctaHref={billing}
            />
        );
    }

    if (days <= 9) {
        return (
            <Banner
                variant={variant}
                className={className}
                data-state="rappel"
                tone="reminder"
                eyebrow={eyebrow}
                left={left}
                progress={progress}
                title={`Plus que ${days} jours d'essai`}
                body="Activez votre abonnement pour ne pas interrompre l'envoi de messages."
                cta="Activer mon abonnement"
                ctaTone="ink"
                ctaHref={billing}
                dismissible
                onDismiss={onDismiss}
            />
        );
    }

    return (
        <Banner
            variant={variant}
            className={className}
            data-state="neutre"
            tone="neutral"
            eyebrow={eyebrow}
            left={left}
            progress={progress}
            title="Bienvenue dans Jokko"
            body="Aucune limite pendant l'essai. Choisissez un plan quand vous serez prêt."
            cta="Choisir un plan"
            ctaTone="primary"
            ctaHref={billing}
            dismissible
            onDismiss={onDismiss}
        />
    );
}

/**
 * Inline pill showing "N j restants" — used in the sidebar header next to
 * the plan label. Stays subtle even at urgent ton.
 */
export function TrialCountdownPill({ className }: { className?: string }) {
    const { isTrialing, trialDaysLeft, isLoading } = useTrialStatus();
    if (isLoading || !isTrialing) return null;

    const tone =
        trialDaysLeft <= 2
            ? "urgent"
            : trialDaysLeft <= 9
                ? "rappel"
                : "neutre";

    const toneClasses: Record<"neutre" | "rappel" | "urgent", string> = {
        neutre: "border-[var(--ink-200)] bg-[var(--paper-warm)] text-[var(--ink-600)]",
        rappel: "border-[var(--status-warn)]/30 bg-[var(--status-warn-soft)] text-[var(--status-warn)]",
        urgent: "border-[var(--status-danger)]/40 bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
    };

    return (
        <span
            data-testid="trial-countdown"
            data-trial-state={tone}
            className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide",
                toneClasses[tone],
                className,
            )}
        >
            <Clock className="h-3 w-3" />
            Essai · {trialDaysLeft} j
        </span>
    );
}
