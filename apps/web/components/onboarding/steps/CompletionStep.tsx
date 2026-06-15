'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Check,
    Users,
    FileText,
    ArrowRight,
    Loader2,
    Sparkles,
    CreditCard,
    MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { usePlanLimits } from '@/hooks/usePlans';
import { useChannels } from '@/hooks/useChannels';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { tenantHost } from '@/lib/root-domain';

interface CompletionStepProps {
    onComplete: () => void;
}

// v3 — secondary action rows (per PDF). Quick action 2x2 grid replaced by
// inline rows. Inviter équipe + Créer modèle. The "Envoyer un message"
// + "Explorer les flux" CTAs from v2 are folded into the primary
// "Ouvrir mes conversations" final button.
const SECONDARY_ACTIONS = [
    {
        title: "Inviter votre équipe",
        href: '/dashboard/team',
        icon: Users,
        cta: "Inviter",
    },
    {
        title: "Créer votre premier modèle",
        href: '/dashboard/modeles',
        icon: FileText,
        cta: "Créer",
    },
] as const;

export function CompletionStep({}: CompletionStepProps) {
    const router = useRouter();
    const { currentOrg } = useCurrentOrg();
    const { currentPlan } = usePlanLimits();
    const { channels } = useChannels();
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const createCheckout = useAction(api.stripe_actions.createCheckoutSession);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const primaryChannel = channels.find((c) => !c.disabledAt) ?? channels[0];
    const hasWhatsApp = !!primaryChannel;

    useEffect(() => {
        completeOnboarding().catch(() => {});
    }, [completeOnboarding]);

    const isPaidPlan = currentOrg?.plan && currentOrg.plan !== 'FREE';
    const billingInterval = (typeof window !== 'undefined'
        ? sessionStorage.getItem('jokko_billing_interval')
        : null) as 'month' | 'year' | null;

    const handleActivateSubscription = async () => {
        if (!currentOrg?.plan) return;
        setCheckoutLoading(true);
        try {
            const { url } = await createCheckout({
                planKey: currentOrg.plan,
                interval: billingInterval || 'month',
            });
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            setCheckoutLoading(false);
        }
    };

    const trialDaysLeft = currentOrg?.trialEndsAt
        ? Math.max(0, Math.ceil((currentOrg.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
        : 14;

    return (
        <div className="space-y-7">
            {/* v3 — violet halo check (replaces green status-good blob per PDF) */}
            <div className="text-center space-y-3">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
                    className="relative mx-auto flex h-16 w-16 items-center justify-center"
                >
                    <span className="absolute inset-0 rounded-full bg-[var(--accent-muted)]" aria-hidden />
                    <span className="absolute inset-2 rounded-full bg-[var(--paper-white)]" aria-hidden />
                    <Check className="relative h-7 w-7 text-[var(--accent)]" strokeWidth={2.5} />
                </motion.div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink-900)] tracking-tight">
                        Votre espace est prêt
                    </h2>
                    <p className="mt-1.5 text-sm text-[var(--ink-500)] max-w-md mx-auto">
                        Bienvenue dans Jokko. Vous avez {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} d&apos;essai sur le plan {currentPlan?.name ?? 'Business'} — sans carte bancaire.
                    </p>
                </div>
            </div>

            {/* v3 — checklist (4 items) per PDF screen 10 / 10b */}
            <ul className="space-y-3.5">
                <ChecklistItem title="Compte créé" />
                {currentOrg ? (
                    <ChecklistItem
                        title="Organisation configurée"
                        subtitle={`${currentOrg.name} · ${tenantHost(currentOrg.slug)}`}
                    />
                ) : null}
                {currentPlan ? (
                    <ChecklistItem
                        title={`Plan ${currentPlan.name}`}
                        subtitle={`Essai gratuit · ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}`}
                    />
                ) : null}
                {hasWhatsApp && primaryChannel ? (
                    <ChecklistItem
                        title="Numéro WhatsApp connecté"
                        subtitle={`${primaryChannel.displayPhoneNumber}${primaryChannel.verifiedName ? ` · ${primaryChannel.verifiedName}` : ''}`}
                    />
                ) : (
                    /* Variant : pas de WA connecté (PDF screen 10b) */
                    <ActionRow
                        icon={MessageCircle}
                        title="Connecter votre numéro WhatsApp"
                        subtitle="Recommandé — sans cela, vous ne pourrez pas envoyer de messages."
                        cta="Connecter"
                        onClick={() => router.push('/dashboard/settings?tab=channels')}
                    />
                )}
            </ul>

            {/* Activation Stripe — gardé conditionnel pour les plans payants
                qui n'ont pas encore checkout (fonctionnel, pas que visuel) */}
            {isPaidPlan && !currentOrg?.stripe?.status ? (
                <div className="rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-muted)]/40 p-5 text-center space-y-3">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Plan {currentPlan?.name}
                        {currentPlan && currentPlan.monthlyPriceFCFA > 0 ? (
                            <span className="text-[var(--ink-500)]">
                                · {new Intl.NumberFormat('fr-FR').format(
                                    billingInterval === 'year'
                                        ? currentPlan.yearlyMonthlyPriceFCFA
                                        : currentPlan.monthlyPriceFCFA
                                )} F CFA/mois
                            </span>
                        ) : null}
                    </div>
                    <p className="text-sm text-[var(--ink-900)]">
                        Activez votre abonnement pour débloquer toutes les fonctionnalités du plan <strong>{currentPlan?.name}</strong>.
                    </p>
                    <Button
                        onClick={handleActivateSubscription}
                        disabled={checkoutLoading}
                        variant="accent"
                    >
                        {checkoutLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Activer l&apos;abonnement
                    </Button>
                    <p className="text-[11px] text-[var(--ink-500)]">
                        Vous pouvez aussi activer plus tard depuis Facturation.
                    </p>
                </div>
            ) : null}

            {/* v3 — 2 secondary actions inline (per PDF). Plus de quick action cards. */}
            <ul className="space-y-2">
                {SECONDARY_ACTIONS.map((action) => (
                    <ActionRow
                        key={action.href}
                        icon={action.icon}
                        title={action.title}
                        cta={action.cta}
                        onClick={() => router.push(action.href)}
                    />
                ))}
            </ul>

            {/* v3 — primary CTA "Ouvrir mes conversations →" (UA = pas "Inbox") */}
            <Button
                onClick={() => router.push('/dashboard/conversations')}
                size="lg"
                variant="accent"
                className="group h-12 w-full text-base"
            >
                Ouvrir mes conversations
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────

function ChecklistItem({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]">
                <Check className="h-3 w-3 text-white" strokeWidth={2.75} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[var(--ink-900)]">{title}</div>
                {subtitle ? (
                    <div className="mt-0.5 font-mono text-xs text-[var(--ink-500)] truncate">{subtitle}</div>
                ) : null}
            </div>
        </li>
    );
}

function ActionRow({
    icon: Icon,
    title,
    subtitle,
    cta,
    onClick,
}: {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    title: string;
    subtitle?: string;
    cta: string;
    onClick: () => void;
}) {
    return (
        <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--ink-300)] bg-[var(--paper-white)]">
                <Icon className="h-3 w-3 text-[var(--ink-400)]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--ink-900)]">{title}</span>
                    <button
                        type="button"
                        onClick={onClick}
                        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                        {cta}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>
                {subtitle ? (
                    <div className="mt-0.5 text-xs text-[var(--ink-500)]">{subtitle}</div>
                ) : null}
            </div>
        </li>
    );
}
