'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    MessageSquare,
    Users,
    FileText,
    Workflow,
    ArrowRight,
    Loader2,
    Sparkles,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentOrg } from '@/hooks/use-current-org';
import { usePlanLimits } from '@/hooks/usePlans';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

interface CompletionStepProps {
    onComplete: () => void;
}

const QUICK_ACTIONS = [
    {
        title: 'Envoyer un message',
        description: 'Démarrez une conversation WhatsApp',
        href: '/dashboard/conversations',
        icon: MessageSquare,
        gradient: 'from-[#14532d] to-[#059669]',
    },
    {
        title: 'Inviter l\'équipe',
        description: 'Ajoutez des agents à votre espace',
        href: '/dashboard/team',
        icon: Users,
        gradient: 'from-[#166534] to-[#0d9488]',
    },
    {
        title: 'Créer un modèle',
        description: 'Préparez vos messages WhatsApp',
        href: '/dashboard/modeles',
        icon: FileText,
        gradient: 'from-[#15803d] to-[#10b981]',
    },
    {
        title: 'Explorer les flux',
        description: 'Automatisez vos réponses',
        href: '/dashboard/flows',
        icon: Workflow,
        gradient: 'from-[#14532d] to-[#34d399]',
    },
];

export function CompletionStep({}: CompletionStepProps) {
    const router = useRouter();
    const { currentOrg } = useCurrentOrg();
    const { currentPlan } = usePlanLimits();
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const createCheckout = useAction(api.stripe_actions.createCheckoutSession);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

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

    return (
        <div className="space-y-7">
            <div className="text-center space-y-3">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--status-good-soft)] ring-8 ring-[var(--status-good-soft)]/50"
                >
                    <CheckCircle className="w-8 h-8 text-[var(--status-good)]" strokeWidth={2.5} />
                </motion.div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink-900)] tracking-tight">
                        {currentOrg?.name ? `${currentOrg.name} est prêt !` : 'Tout est prêt !'}
                    </h2>
                    <p className="mt-1.5 text-sm text-[var(--ink-500)] max-w-md mx-auto">
                        Votre espace Jokko est configuré. Voici comment commencer.
                    </p>
                </div>
            </div>

            {currentPlan && (
                <div className="flex justify-center">
                    <div className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 border text-xs font-medium',
                        isPaidPlan
                            ? 'bg-[var(--status-good-soft)] border-[var(--status-good)]/30 text-[var(--status-good)]'
                            : 'bg-[var(--paper-warm)] border-[var(--ink-200)] text-[var(--ink-600)]'
                    )}>
                        <Sparkles className="h-3.5 w-3.5" />
                        Plan {currentPlan.name}
                        {isPaidPlan && currentPlan.monthlyPriceFCFA > 0 && (
                            <span className="opacity-75">
                                — {new Intl.NumberFormat('fr-FR').format(
                                    billingInterval === 'year'
                                        ? currentPlan.yearlyMonthlyPriceFCFA
                                        : currentPlan.monthlyPriceFCFA
                                )} F CFA/mois
                            </span>
                        )}
                    </div>
                </div>
            )}

            {isPaidPlan && !currentOrg?.stripe?.status && (
                <div className="rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-muted)]/50 p-5 text-center space-y-3">
                    <p className="text-sm text-[var(--ink-900)]">
                        Activez votre abonnement pour débloquer toutes les fonctionnalités du plan <strong>{currentPlan?.name}</strong>.
                    </p>
                    <Button
                        onClick={handleActivateSubscription}
                        disabled={checkoutLoading}
                        className="h-10 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-hover)] text-white rounded-xl shadow-sm hover:shadow-md transition-all"
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
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <motion.button
                            key={action.href}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: 0.1 + index * 0.05 }}
                            onClick={() => router.push(action.href)}
                            className="group flex flex-col items-start gap-2 rounded-xl border border-[var(--ink-200)] bg-white p-4 text-left hover:border-[var(--accent-muted)] hover:bg-[var(--accent-muted)]/30 hover:shadow-sm transition-all"
                        >
                            <div className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm shadow-[var(--accent-glow)] group-hover:scale-105 transition-transform',
                                action.gradient
                            )}>
                                <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-[var(--ink-900)]">{action.title}</div>
                                <div className="text-[11px] text-[var(--ink-500)] leading-tight mt-0.5">{action.description}</div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <Button
                onClick={() => router.push('/dashboard')}
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:from-[var(--accent-hover)] hover:to-[var(--accent-hover)] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all group"
            >
                Accéder au dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
        </div>
    );
}
