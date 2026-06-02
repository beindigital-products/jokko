"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrialStatus } from "@/hooks/usePlans";

// ── Tones ──────────────────────────────────────────────────────────────────

type Tone = "neutral" | "reminder" | "urgent" | "expired";
type CtaTone = "primary" | "ink" | "danger" | "ghost";

/** Per-tone background / foreground / border — from the design's trial-banner. */
const TONE: Record<Tone, { bg: string; fg: string; border: string }> = {
    neutral: { bg: "rgba(105,56,239,0.05)", fg: "#4F1FCF", border: "rgba(105,56,239,0.26)" },
    reminder: { bg: "rgba(105,56,239,0.08)", fg: "#4F1FCF", border: "rgba(105,56,239,0.26)" },
    urgent: { bg: "rgba(220,56,56,0.05)", fg: "#B82828", border: "rgba(220,56,56,0.30)" },
    expired: { bg: "rgba(220,56,56,0.08)", fg: "#B82828", border: "rgba(220,56,56,0.32)" },
};

// ── CTA button ───────────────────────────────────────────────────────────────

function CtaButton({
    tone,
    href,
    fg,
    border,
    className,
    children,
}: {
    tone: CtaTone;
    href: string;
    fg: string;
    border: string;
    className?: string;
    children: React.ReactNode;
}) {
    const base =
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors";
    const byTone: Record<CtaTone, string> = {
        primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
        ink: "bg-[var(--ink-900)] text-white hover:brightness-110",
        danger: "bg-[#DC3838] text-white shadow-[0_1px_2px_rgba(180,32,32,0.30),0_6px_18px_-6px_rgba(220,56,56,0.45)] hover:bg-[#c62f2f]",
        ghost: "border bg-transparent hover:bg-black/[0.03]",
    };
    return (
        <Link
            href={href}
            className={cn(base, byTone[tone], className)}
            style={tone === "ghost" ? { color: fg, borderColor: border } : undefined}
        >
            {children}
        </Link>
    );
}

// ── Presentational view ──────────────────────────────────────────────────────

export interface TrialBannerViewProps {
    tone: Tone;
    variant?: "page" | "sidebar";
    eyebrow: string;
    /** Right-side "N jours restants" text in the eyebrow row. */
    left?: string;
    /** Elapsed fraction 0–1 for the slim progress bar. */
    progress?: number;
    title: string;
    body: string;
    cta: string;
    ctaTone?: CtaTone;
    ctaHref?: string;
    /** Optional secondary action (e.g. "Demander à l'admin" on expired). */
    secondaryCta?: string;
    secondaryHref?: string;
    /** Shows a "Plus tard" dismiss button when no secondary action. */
    dismissible?: boolean;
    onDismiss?: () => void;
    className?: string;
}

/**
 * TrialBannerView — typography-led, icon-free trial banner. Left accent bar,
 * mono eyebrow + slim progress + "N jours restants", editorial title with an
 * inline body, and the action(s) on the right. Recreates the design's
 * `trial-banner.jsx` (4 tones). Pure presentational.
 */
export function TrialBannerView({
    tone,
    variant = "page",
    eyebrow,
    left,
    progress,
    title,
    body,
    cta,
    ctaTone = "primary",
    ctaHref = "/dashboard/billing",
    secondaryCta,
    secondaryHref = "/dashboard/billing",
    dismissible,
    onDismiss,
    className,
}: TrialBannerViewProps) {
    const t = TONE[tone];

    if (variant === "sidebar") {
        return (
            <div
                data-testid="trial-banner"
                data-trial-state={tone}
                className={cn("relative overflow-hidden rounded-lg border px-3 py-2.5", className)}
                style={{ background: t.bg, borderColor: t.border }}
            >
                <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: t.fg }} />
                <div
                    className="font-mono text-[9px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: t.fg }}
                >
                    {eyebrow}
                    {left ? <span className="text-[var(--ink-soft)]"> · {left}</span> : null}
                </div>
                <div className="mt-1 font-editorial text-[14px] leading-tight tracking-tight text-[var(--ink-900)]">
                    {title}
                </div>
                <CtaButton tone={ctaTone} href={ctaHref} fg={t.fg} border={t.border} className="mt-2 h-8 w-full">
                    {cta}
                </CtaButton>
            </div>
        );
    }

    return (
        <div
            data-testid="trial-banner"
            data-trial-state={tone}
            className={cn(
                "relative flex flex-col gap-3 overflow-hidden rounded-xl border py-3.5 pl-7 pr-4 sm:flex-row sm:items-center sm:gap-7",
                className,
            )}
            style={{ background: t.bg, borderColor: t.border }}
        >
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: t.fg }} />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
                    <span
                        className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em]"
                        style={{ color: t.fg }}
                    >
                        {eyebrow}
                    </span>
                    {progress != null ? (
                        <span
                            className="hidden h-[3px] w-[100px] overflow-hidden rounded-full sm:block"
                            style={{ background: "rgba(10,10,10,0.08)" }}
                        >
                            <span
                                className="block h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, background: t.fg }}
                            />
                        </span>
                    ) : null}
                    {left ? (
                        <span className="text-[11px] tracking-[0.04em] text-[var(--ink-soft)]">{left}</span>
                    ) : null}
                </div>

                <div className="mt-1.5 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3.5">
                    <span className="font-editorial text-[20px] leading-tight tracking-tight text-[var(--ink-900)] sm:shrink-0 sm:text-[22px]">
                        {title}
                    </span>
                    <span className="truncate text-[13px] text-[var(--ink-soft)]">{body}</span>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <CtaButton tone={ctaTone} href={ctaHref} fg={t.fg} border={t.border}>
                    {cta}
                </CtaButton>
                {secondaryCta ? (
                    <CtaButton tone="ghost" href={secondaryHref} fg={t.fg} border={t.border}>
                        {secondaryCta}
                    </CtaButton>
                ) : dismissible ? (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="h-9 px-2.5 text-[12.5px] tracking-tight text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-700)]"
                    >
                        Plus tard
                    </button>
                ) : null}
            </div>
        </div>
    );
}

// ── Connected banner ─────────────────────────────────────────────────────────

type TrialBannerProps = {
    variant?: "sidebar" | "page";
    className?: string;
};

/**
 * TrialBanner — wires `useTrialStatus` to the 4-tone TrialBannerView.
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

    // Fallback : org sans trialEndsAt → accueil neutre (jamais "expiré").
    if (trialEndsAt == null && !isTrialing) {
        return (
            <TrialBannerView
                variant={variant}
                className={className}
                tone="neutral"
                eyebrow="Essai · 14 jours"
                progress={0}
                title="Bienvenue dans Jokko"
                body="Aucune limite pendant l'essai. Choisissez un plan quand vous serez prêt."
                cta="Choisir un plan"
                ctaTone="primary"
                dismissible
                onDismiss={onDismiss}
            />
        );
    }

    if (!isTrialing) {
        return (
            <TrialBannerView
                variant={variant}
                className={className}
                tone="expired"
                eyebrow="Essai expiré"
                left="Envoi suspendu"
                progress={1}
                title="Essai terminé"
                body="Vous voyez encore vos données, mais l'envoi est suspendu. Activez votre abonnement pour reprendre."
                cta="Activer mon abonnement"
                ctaTone="danger"
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
            <TrialBannerView
                variant={variant}
                className={className}
                tone="urgent"
                eyebrow={eyebrow}
                left={left}
                progress={progress}
                title={`Plus que ${days} jour${days > 1 ? "s" : ""}`}
                body="À l'expiration, l'envoi de nouveaux messages sera bloqué."
                cta="Activer maintenant"
                ctaTone="danger"
            />
        );
    }

    if (days <= 9) {
        return (
            <TrialBannerView
                variant={variant}
                className={className}
                tone="reminder"
                eyebrow={eyebrow}
                left={left}
                progress={progress}
                title={`Plus que ${days} jours d'essai`}
                body="Activez votre abonnement pour ne pas interrompre l'envoi de messages."
                cta="Activer mon abonnement"
                ctaTone="ink"
                dismissible
                onDismiss={onDismiss}
            />
        );
    }

    return (
        <TrialBannerView
            variant={variant}
            className={className}
            tone="neutral"
            eyebrow={eyebrow}
            left={left}
            progress={progress}
            title="Bienvenue dans Jokko"
            body="Aucune limite pendant l'essai. Choisissez un plan quand vous serez prêt."
            cta="Choisir un plan"
            ctaTone="primary"
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
