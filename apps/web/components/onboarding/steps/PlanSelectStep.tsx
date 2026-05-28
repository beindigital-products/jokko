'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Zap, Store, Building2, ArrowRight } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePlans } from '@/hooks/usePlans';
import { formatLimit } from '@/lib/plan-utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanSelectStepProps {
    onComplete: () => void;
}

// v3 — ghost-style icons in a subtle accent-muted pastille (per PDF spec).
// Drop the green gradient blobs.
const PLAN_CONFIG = {
    STARTER: { icon: Zap },
    BUSINESS: { icon: Store },
    PRO: { icon: Building2 },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

export function PlanSelectStep({ onComplete }: PlanSelectStepProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanKey>('BUSINESS');
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
    const [isLoading, setIsLoading] = useState(false);

    const { plans: planDefs, isLoading: plansLoading } = usePlans();
    const updateOrgPlan = useMutation(api.organizations.updateOrgPlan);

    const displayPlans = planDefs
        .filter((p) => PLAN_CONFIG[p.key as PlanKey])
        .map((p) => {
            const config = PLAN_CONFIG[p.key as PlanKey];
            return {
                key: p.key as PlanKey,
                name: p.name,
                description: p.description,
                priceMonthly: p.monthlyPriceFCFA,
                priceYearlyMonthly: p.yearlyMonthlyPriceFCFA,
                popular: p.popular,
                features: [
                    `${formatLimit(p.maxAgents)} agent${p.maxAgents > 1 ? 's' : ''}`,
                    `${formatLimit(p.maxWhatsappChannels)} canal${p.maxWhatsappChannels > 1 ? 'aux' : ''} WhatsApp`,
                    `${formatLimit(p.maxConversationsPerMonth)} conversations/mois`,
                    ...p.features.filter((f) => f.included).slice(0, 2).map((f) => f.label),
                ],
                icon: config.icon,
            };
        });

    const handleSelectPlan = async (planKey: PlanKey) => {
        setIsLoading(true);
        try {
            await updateOrgPlan({ plan: planKey });
            sessionStorage.setItem('jokko_billing_interval', billingInterval);
            onComplete();
        } catch (error) {
            console.error('Failed to update plan:', error);
            setIsLoading(false);
        }
    };

    if (plansLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-center">
                    <Skeleton className="h-10 w-48 rounded-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-80 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-[var(--ink-200)] bg-[var(--paper-warm)] p-1">
                    <button
                        onClick={() => setBillingInterval('month')}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                            billingInterval === 'month'
                                ? 'bg-white text-[var(--ink-900)] shadow-sm'
                                : 'text-[var(--ink-500)] hover:text-[var(--ink-700)]'
                        )}
                    >
                        Mensuel
                    </button>
                    <button
                        onClick={() => setBillingInterval('year')}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                            billingInterval === 'year'
                                ? 'bg-white text-[var(--ink-900)] shadow-sm'
                                : 'text-[var(--ink-500)] hover:text-[var(--ink-700)]'
                        )}
                    >
                        Annuel
                        <span className="ml-1.5 text-[10px] font-bold text-[var(--status-good)]">-20%</span>
                    </button>
                </div>
            </div>

            <div className="grid gap-5 lg:gap-6 md:grid-cols-3">
                {displayPlans.map((plan, index) => {
                    const Icon = plan.icon;
                    const isSelected = selectedPlan === plan.key;
                    const price = billingInterval === 'month'
                        ? plan.priceMonthly
                        : plan.priceYearlyMonthly;

                    return (
                        <motion.button
                            key={plan.key}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.06, ease: [0.32, 0.72, 0, 1] }}
                            onClick={() => setSelectedPlan(plan.key)}
                            disabled={isLoading}
                            aria-pressed={isSelected}
                            className={cn(
                                'relative flex flex-col rounded-2xl border bg-[var(--paper-white)] p-6 lg:p-7 text-left transition-all duration-200',
                                isSelected
                                    ? 'border-[var(--accent)] ring-4 ring-[var(--accent-muted)] shadow-sm'
                                    : 'border-[var(--ink-200)] hover:border-[var(--ink-300)] hover:shadow-sm',
                            )}
                        >
                            {plan.popular ? (
                                /* v3 — minimal pill : near-black bg, violet dot, mono caps */
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink-900)] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-white">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                    Recommandé
                                </span>
                            ) : null}

                            <div className="flex items-center gap-3 mb-5">
                                {/* v3 — ghost icon. Gris par défaut, violet uniquement
                                    pour le plan recommandé (Business). */}
                                <div
                                    className={cn(
                                        "flex h-11 w-11 items-center justify-center rounded-xl",
                                        plan.popular
                                            ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                                            : "bg-[var(--paper-warm)] text-[var(--ink-500)]",
                                    )}
                                >
                                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-semibold text-[var(--ink-900)]">{plan.name}</h3>
                                    <p className="text-xs text-[var(--ink-500)] truncate">{plan.description}</p>
                                </div>
                            </div>

                            <div className="mb-5">
                                <span className="text-3xl font-bold text-[var(--ink-900)] tracking-tight">
                                    {new Intl.NumberFormat('fr-FR').format(price)}
                                </span>
                                <span className="text-sm text-[var(--ink-500)] ml-1">F CFA</span>
                                <div className="text-xs text-[var(--ink-500)] mt-0.5">
                                    {billingInterval === 'month' ? 'par mois' : '/mois, facturé annuellement'}
                                </div>
                            </div>

                            <ul className="space-y-2.5 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--ink-600)]">
                                        <Check className="h-4 w-4 shrink-0 text-[var(--accent)] mt-0.5" strokeWidth={2.5} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* v3 — per-card CTA inside the card (outline / filled selon état) */}
                            <div
                                className={cn(
                                    "mt-6 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                                    isSelected
                                        ? "bg-[var(--accent)] text-white"
                                        : "border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)]",
                                )}
                            >
                                {isSelected ? (
                                    <>
                                        <Check className="h-4 w-4" strokeWidth={2.5} />
                                        Sélectionné
                                    </>
                                ) : (
                                    `Choisir ${plan.name}`
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* v3 — CTA seule (pas de plan gratuit, l'essai 14 j s'applique sur
                tous les plans sans carte). */}
            <div className="border-t border-[var(--ink-200)] pt-5 flex justify-end">
                <Button
                    onClick={() => handleSelectPlan(selectedPlan)}
                    disabled={isLoading}
                    variant="accent"
                    className="group"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            Continuer avec {displayPlans.find(p => p.key === selectedPlan)?.name}
                            <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
