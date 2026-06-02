"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrialStatus } from "@/hooks/usePlans";
import { Banner } from "@/components/dashboard/primitives/Banner";
import { trialBannerContent } from "./trial-banner-content";

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

    // Branches expiré → urgent → rappel → neutre : contenu centralisé dans le
    // helper partagé (même mapping que la bannière de l'Overview).
    const content = trialBannerContent({ expired: !isTrialing, days: Math.max(0, trialDaysLeft) });

    return (
        <Banner
            variant={variant}
            className={className}
            data-state={content.dataState}
            tone={content.tone}
            eyebrow={content.eyebrow}
            left={content.left}
            progress={content.progress}
            title={content.title}
            body={content.body}
            cta={content.cta}
            ctaTone={content.ctaTone}
            ctaHref={billing}
            secondaryCta={content.secondaryCta}
            secondaryHref={content.secondaryCta ? "/dashboard/team" : undefined}
            dismissible={content.dismissible}
            onDismiss={content.dismissible ? onDismiss : undefined}
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
