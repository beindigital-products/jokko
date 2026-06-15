"use client"

import { useState } from "react"
import { useAction, useQuery } from "convex/react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { useCurrentOrg } from "@/hooks/use-current-org"
import { useChannels } from "@/hooks/useChannels"
import { usePlans, usePlanLimits, useTrialStatus } from "@/hooks/usePlans"
import { formatLimit, isUnlimited, type PlanKey } from "@/lib/plan-utils"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/dashboard/shell"
import { PlanCard, UsageStrip } from "@/components/dashboard/billing"
import { mapPlan, mapUsage, type BillingPlanInput } from "@/lib/dashboard/billing-data"
import { CreditWalletCardConnected } from "./_components/credit-wallet-card-connected"
import { TrialBanner } from "@/components/billing/trial-banner"

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback
}

function BillingSkeleton() {
    return (
        <div className="flex h-full w-full flex-col bg-[var(--paper-white)]">
            <div className="border-b border-[var(--ink-200)] px-8 pb-5 pt-7">
                <Skeleton className="h-3 w-44" />
                <Skeleton className="mt-2 h-7 w-44" />
                <Skeleton className="mt-2 h-4 w-96" />
            </div>
            <div className="space-y-5 px-8 pt-10">
                <Skeleton className="h-[140px] w-full rounded-xl" />
                <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-[120px] rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-[220px] w-full rounded-xl" />
            </div>
        </div>
    )
}

function AccessDenied() {
    return (
        <div className="flex h-full w-full items-center justify-center bg-[var(--paper-white)] p-8">
            <div className="max-w-sm text-center">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                    Accès refusé
                </p>
                <h1 className="mt-1 font-display text-[22px] font-bold tracking-tight text-[var(--ink-900)]">
                    Réservé à l&apos;équipe d&apos;administration
                </h1>
                <p className="mt-2 text-sm text-[var(--ink-500)]">
                    Vous n&apos;avez pas les autorisations nécessaires pour gérer la facturation.
                </p>
            </div>
        </div>
    )
}

export default function BillingPage() {
    const role = useQuery(api.users.currentUserRole)
    const creditBalance = useQuery(api.credits.getBalance)
    const { currentOrg } = useCurrentOrg()
    const usageStats = useQuery(
        api.billing.getUsageStats,
        currentOrg?._id ? { organizationId: currentOrg._id } : "skip",
    )
    const membersData = useQuery(api.team.listMembers, {})
    const { channels } = useChannels()
    const { plans: planDefs } = usePlans()
    const { currentPlan: currentPlanData } = usePlanLimits()
    const trial = useTrialStatus()

    const createCheckout = useAction(api.stripe_actions.createCheckoutSession)
    const createPortal = useAction(api.stripe_actions.createPortalSession)

    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
    const [loadingPortal, setLoadingPortal] = useState(false)
    const [interval, setInterval] = useState<"month" | "year">("month")

    const handleUpgrade = async (planKey: "STARTER" | "BUSINESS" | "PRO") => {
        setLoadingPlan(planKey)
        try {
            const { url } = await createCheckout({ planKey, interval })
            window.location.assign(url)
        } catch (error) {
            toast.error("Erreur", { description: getErrorMessage(error, "Impossible de créer la session de paiement.") })
            setLoadingPlan(null)
        }
    }

    const handlePortal = async () => {
        setLoadingPortal(true)
        try {
            const { url } = await createPortal()
            window.location.assign(url)
        } catch (error) {
            toast.error("Erreur", { description: getErrorMessage(error, "Impossible d'accéder au portail.") })
            setLoadingPortal(false)
        }
    }

    if (role === undefined || creditBalance === undefined) return <BillingSkeleton />
    if (role === "AGENT") return <AccessDenied />

    const currentPlan = (currentOrg?.plan || "FREE") as PlanKey
    const hasSubscription = !!currentOrg?.stripe?.subscriptionId
    const planDef = planDefs.find((p) => p.key === currentPlan)

    const planInput: BillingPlanInput = {
        key: currentPlan,
        name: planDef?.name ?? currentPlan,
        monthlyPriceFCFA: planDef?.monthlyPriceFCFA,
        maxAgents: currentPlanData?.maxAgents ?? planDef?.maxAgents ?? 1,
        maxWhatsappChannels: currentPlanData?.maxWhatsappChannels ?? planDef?.maxWhatsappChannels ?? 1,
        maxConversationsPerMonth: currentPlanData?.maxConversationsPerMonth ?? planDef?.maxConversationsPerMonth ?? 0,
    }

    const activeChannels = channels.filter((c) => c.status !== "disabled" && c.status !== "banned").length
    const plan = mapPlan(planInput, currentOrg?.stripe)
    const usage = mapUsage(planInput, {
        conversations: usageStats?.serviceConversationsCount ?? 0,
        seats: membersData?.nonOwnerCount ?? 0,
        channels: activeChannels,
    })

    const eyebrow = `Compte · ${currentPlan === "FREE" ? "Gratuit" : planInput.name} · facturation`

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={eyebrow}
                title="Facturation"
                description="Plan, consommation et crédit campagnes. Paiement sécurisé via Stripe & Wave."
                actions={
                    hasSubscription ? (
                        <button
                            type="button"
                            onClick={handlePortal}
                            disabled={loadingPortal}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-60"
                        >
                            {loadingPortal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Gérer l&apos;abonnement
                        </button>
                    ) : undefined
                }
            />

            <div className="flex-1 space-y-5 overflow-y-auto bg-[var(--paper-warm)]/30 px-8 pb-8 pt-8">
                {(trial.isTrialing || !trial.hasSelectedPlan) && <TrialBanner variant="page" />}

                <PlanCard
                    plan={plan}
                    primary={
                        hasSubscription
                            ? { label: "Gérer l'abonnement", onClick: handlePortal, loading: loadingPortal }
                            : undefined
                    }
                />

                <UsageStrip usage={usage} />

                <CreditWalletCardConnected />

                {!hasSubscription && (
                    <PlanPicker
                        planDefs={planDefs}
                        interval={interval}
                        onIntervalChange={setInterval}
                        onChoose={handleUpgrade}
                        loadingPlan={loadingPlan}
                        trialAvailable={!currentOrg?.stripe?.trialUsed}
                    />
                )}
            </div>
        </div>
    )
}

// ── Plan picker (shown to non-subscribed orgs) ───────────────────────────────

type PlanDef = ReturnType<typeof usePlans>["plans"][number]
const PICKABLE = new Set(["STARTER", "BUSINESS", "PRO"])

function PlanPicker({
    planDefs,
    interval,
    onIntervalChange,
    onChoose,
    loadingPlan,
    trialAvailable,
}: {
    planDefs: PlanDef[]
    interval: "month" | "year"
    onIntervalChange: (i: "month" | "year") => void
    onChoose: (key: "STARTER" | "BUSINESS" | "PRO") => void
    loadingPlan: string | null
    trialAvailable: boolean
}) {
    const group = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    const plans = planDefs.filter((p) => PICKABLE.has(p.key))

    return (
        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-[14px] font-semibold tracking-tight text-[var(--ink-900)]">Choisir un plan</h3>
                    {trialAvailable ? (
                        <p className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">7 jours d&apos;essai gratuit sur tous les plans</p>
                    ) : null}
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[var(--paper-warm)] p-1">
                    {(["month", "year"] as const).map((i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onIntervalChange(i)}
                            className={cn(
                                "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                                interval === i
                                    ? "bg-[var(--paper-white)] text-[var(--ink-900)] shadow-sm"
                                    : "text-[var(--ink-soft)] hover:text-[var(--ink-700)]",
                            )}
                        >
                            {i === "month" ? "Mensuel" : "Annuel"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((p) => {
                    const priceFCFA = interval === "month" ? p.monthlyPriceFCFA : p.yearlyMonthlyPriceFCFA
                    const loading = loadingPlan === p.key
                    const features = [
                        `${formatLimit(p.maxAgents)} agent${p.maxAgents > 1 ? "s" : ""}`,
                        `${formatLimit(p.maxWhatsappChannels)} numéro${p.maxWhatsappChannels > 1 ? "s" : ""} WhatsApp`,
                        `${isUnlimited(p.maxConversationsPerMonth) ? "Conversations illimitées" : `${formatLimit(p.maxConversationsPerMonth)} conversations/mois`}`,
                        `Support ${p.supportLevel.toLowerCase()}`,
                    ]
                    return (
                        <div
                            key={p.key}
                            className={cn(
                                "flex flex-col rounded-xl border p-4",
                                p.popular ? "border-[var(--accent)]" : "border-[var(--ink-200)]",
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-semibold text-[var(--ink-900)]">{p.name}</span>
                                {p.popular ? (
                                    <span className="rounded-full bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent)]">
                                        Populaire
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="font-display text-[26px] font-bold tabular-nums text-[var(--ink-900)]">
                                    {group(priceFCFA)}
                                </span>
                                <span className="text-[12px] text-[var(--ink-soft)]">FCFA / mois</span>
                            </div>
                            <ul className="mt-4 flex-1 space-y-2">
                                {features.map((f) => (
                                    <li key={f} className="flex items-center gap-2 text-[12.5px] text-[var(--ink-700)]">
                                        <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                onClick={() => onChoose(p.key as "STARTER" | "BUSINESS" | "PRO")}
                                disabled={loading}
                                className={cn(
                                    "mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition-colors disabled:opacity-60",
                                    p.popular
                                        ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                                        : "bg-[var(--ink-900)] text-white hover:bg-[var(--ink-700)]",
                                )}
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                {trialAvailable ? "Démarrer l'essai" : "Choisir"}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
