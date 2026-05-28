"use client";

import Link from "next/link";
import { Clock, Lock, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrialStatus } from "@/hooks/usePlans";
import { cn } from "@/lib/utils";

type TrialBannerProps = {
    variant?: "sidebar" | "page";
    className?: string;
};

/**
 * Trial banner — v3, 4 tons.
 *
 * Cycle 14 jours d'essai (spec PDF section 07) avec ton qui évolue :
 *   - `neutre` (J≥10)      : présence discrète, juste un rappel des jours restants
 *   - `rappel` (J3-9)      : ton ambré, CTA visible
 *   - `urgent` (J≤2)       : ton danger, CTA prominent
 *   - `expired` (post-J0)  : ton bloquant, CTA bloquant
 *
 * Visibilité (Q3=b) :
 *   - Plan payant sélectionné → null (l'org a déjà tranché)
 *   - Aucun plan choisi (sentinel `FREE` côté schema) → bandeau actif
 *     jusqu'à sélection d'un plan
 *
 * Fallback `trialEndsAt=null` (Skeptic review) :
 *   - Si trialEndsAt n'existe pas (ex: org enterprise manuelle), on tombe en
 *     'neutre' au lieu d'un faux "expiré" rouge.
 */
export function TrialBanner({ variant = "page", className }: TrialBannerProps) {
    const { isTrialing, trialDaysLeft, trialEndsAt, hasSelectedPlan, isLoading } =
        useTrialStatus();

    if (isLoading) return null;

    // Q3=(b) : on masque dès qu'un plan payant est sélectionné.
    if (hasSelectedPlan) return null;

    // Fallback : org sans trialEndsAt → neutre (jamais expired).
    if (trialEndsAt == null && !isTrialing) {
        return (
            <TonePresenter
                tone="neutre"
                variant={variant}
                className={className}
                title="Essai 14 jours"
                description="Découvrez toutes les fonctionnalités. Choisissez un plan quand vous serez prêt."
            />
        );
    }

    if (!isTrialing) {
        // Expired bloquant.
        return (
            <TonePresenter
                tone="expired"
                variant={variant}
                className={className}
                title="Essai expiré — envois suspendus"
                description="Vos conversations restent consultables. Réactivez en 1 clic pour reprendre l'envoi."
                cta="Activer mon abonnement"
            />
        );
    }

    // Active trial : tone selon jours restants.
    const tone =
        trialDaysLeft <= 2
            ? "urgent"
            : trialDaysLeft <= 9
                ? "rappel"
                : "neutre";

    const titles = {
        urgent: `Votre essai se termine dans ${trialDaysLeft} jour${trialDaysLeft > 1 ? "s" : ""}`,
        rappel: `Essai · ${trialDaysLeft} jours restants`,
        neutre: `Essai 14 jours · ${trialDaysLeft} jours restants`,
    } as const;

    const descriptions = {
        urgent: "À l'expiration, l'envoi de nouveaux messages sera bloqué. Réactivez en 1 clic pour continuer.",
        rappel: "Choisissez un plan pour ne pas perdre l'accès à vos automatisations.",
        neutre: "Toutes les fonctionnalités sont déverrouillées pendant l'essai.",
    } as const;

    return (
        <TonePresenter
            tone={tone}
            variant={variant}
            className={className}
            title={titles[tone]}
            description={descriptions[tone]}
            cta={tone === "neutre" ? "Choisir un plan" : "Activer mon abonnement"}
        />
    );
}

// ── Presenter ────────────────────────────────────────────────────────────

type Tone = "neutre" | "rappel" | "urgent" | "expired";

function TonePresenter({
    tone,
    variant,
    className,
    title,
    description,
    cta = "Choisir un plan",
}: {
    tone: Tone;
    variant: "sidebar" | "page";
    className?: string;
    title: string;
    description: string;
    cta?: string;
}) {
    const Icon = tone === "expired" ? Lock : tone === "urgent" ? AlertTriangle : tone === "rappel" ? Clock : Sparkles;
    const toneClasses: Record<Tone, string> = {
        neutre: "border-[var(--ink-200)] bg-[var(--paper-warm)] text-[var(--ink-700)]",
        rappel: "border-[var(--status-warn)]/30 bg-[var(--status-warn-soft)] text-[var(--ink-900)]",
        urgent: "border-[var(--status-danger)]/40 bg-[var(--status-danger-soft)] text-[var(--ink-900)]",
        expired: "border-[var(--ink-900)]/15 bg-[var(--ink-900)] text-[var(--paper-warm)]",
    };
    const iconColor: Record<Tone, string> = {
        neutre: "text-[var(--accent)]",
        rappel: "text-[var(--status-warn)]",
        urgent: "text-[var(--status-danger)]",
        expired: "text-[var(--paper-warm)]",
    };

    return (
        <div
            data-testid="trial-banner"
            data-trial-state={tone}
            className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                toneClasses[tone],
                variant === "sidebar" && "text-xs",
                className,
            )}
        >
            <Icon
                className={cn(
                    "mt-0.5 shrink-0",
                    iconColor[tone],
                    variant === "sidebar" ? "h-4 w-4" : "h-5 w-5",
                )}
                strokeWidth={2}
            />
            <div className="flex-1 min-w-0">
                <div className="font-semibold">{title}</div>
                <p className={cn("opacity-80", variant === "sidebar" ? "text-[11px]" : "text-sm")}>
                    {description}
                </p>
                {/* CTA omitted on neutre+sidebar to keep it discreet */}
                {!(tone === "neutre" && variant === "sidebar") ? (
                    <Button
                        asChild
                        size="sm"
                        variant={tone === "expired" ? "default" : "outline"}
                        className={cn(
                            "mt-2 h-7",
                            tone === "expired" && "bg-[var(--paper-warm)] text-[var(--ink-900)] hover:bg-white",
                        )}
                    >
                        <Link href="/dashboard/billing">{cta}</Link>
                    </Button>
                ) : null}
            </div>
        </div>
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
