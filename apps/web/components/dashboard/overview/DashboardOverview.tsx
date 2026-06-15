"use client"

import { useState } from "react"
import { FileText, Plus, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Banner } from "../primitives/Banner"
import { trialBannerContent } from "@/components/billing/trial-banner-content"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { OverviewKpis } from "./OverviewKpis"
import { AttentionCard } from "./AttentionCard"
import { TeamActivityCard } from "./TeamActivityCard"
import { CampaignsCard } from "./CampaignsCard"
import { FlowsCard } from "./FlowsCard"
import { OnboardingCard } from "./OnboardingCard"
import { MarketingCreditBar } from "./MarketingCreditBar"
import type {
    AttentionRow,
    CampaignRow,
    FlowRow,
    MarketingCredit,
    OnboardingStep,
    OverviewKpi,
    TeamActivityRow,
} from "./types"

export interface DashboardOverviewData {
    greetingName: string
    dateLabel: string
    subtitle?: string
    kpis: OverviewKpi[]
    attention: { title: string; slaLabel?: string; rows: AttentionRow[] }
    team: TeamActivityRow[]
    campaigns: { rows: CampaignRow[]; total?: string }
    flows: { items: FlowRow[]; activeLabel?: string; total24h?: string }
    marketingCredit?: MarketingCredit
    onboarding?: { steps: OnboardingStep[]; progressLabel?: string; headline?: string }
}

interface DashboardOverviewProps {
    data?: DashboardOverviewData
    loading?: boolean
    trial?: { state: "active" | "expired"; daysLeft?: number } | null
    basePath?: string
    /** Opens the recharge dialog from the marketing-credit bar (else links to billing). */
    onRecharge?: () => void
}

/**
 * The trial / plan-status strip at the top of the cockpit. Renders the shared
 * Banner primitive (same neutral → reminder → urgent → expired escalation as the
 * billing TrialBanner, via the shared `trialBannerContent` helper) so the trial
 * state reads consistently across the app. Driven by the `trial` prop.
 */
function OverviewTrialBanner({
    trial,
    basePath,
}: {
    trial: { state: "active" | "expired"; daysLeft?: number }
    basePath: string
}) {
    const [dismissed, setDismissed] = useState(false)
    if (dismissed) return null

    const content = trialBannerContent({
        expired: trial.state === "expired",
        days: trial.daysLeft ?? 0,
    })

    return (
        <Banner
            className="mb-4"
            data-state={content.dataState}
            tone={content.tone}
            eyebrow={content.eyebrow}
            left={content.left}
            progress={content.progress}
            title={content.title}
            body={content.body}
            cta={content.cta}
            ctaTone={content.ctaTone}
            ctaHref={`${basePath}/billing`}
            secondaryCta={content.secondaryCta}
            secondaryHref={content.secondaryCta ? `${basePath}/team` : undefined}
            dismissible={content.dismissible}
            onDismiss={content.dismissible ? () => setDismissed(true) : undefined}
        />
    )
}

function Skel({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-xl bg-[var(--ink-200)]", className)} />
}

function OverviewSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <Skel key={i} className="h-[88px]" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                <Skel className="h-[360px]" />
                <Skel className="h-[360px]" />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <Skel key={i} className="h-[220px]" />
                ))}
            </div>
        </div>
    )
}

/**
 * DashboardOverview — v3 cockpit "Tableau de bord". Daily operational
 * snapshot: 5 KPIs, the attention triage list, team activity, recent
 * campaigns, active flows and the onboarding checklist. Recreates the
 * `Jokko Desktop.html` ScreenDashboard design. Pure presentational.
 */
export function DashboardOverview({
    data,
    loading,
    trial,
    basePath = "/dashboard",
    onRecharge,
}: DashboardOverviewProps) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={
                    data
                        ? `Bonjour ${data.greetingName} · ${data.dateLabel}`
                        : "Tableau de bord"
                }
                title="Tableau de bord"
                description={
                    data?.subtitle ??
                    "Ce qui demande votre attention ce matin, et un coup d'œil sur l'activité de l'équipe."
                }
                actions={
                    <>
                        <HeaderButton icon={Plus} href={`${basePath}/campagnes/new`}>
                            Nouvelle campagne
                        </HeaderButton>
                        <HeaderButton icon={FileText} href={`${basePath}/modeles`}>
                            Nouveau modèle
                        </HeaderButton>
                        <HeaderButton icon={Users} variant="primary" href={`${basePath}/team`}>
                            Inviter un coéquipier
                        </HeaderButton>
                    </>
                }
            />

            <div className="flex-1 overflow-y-auto bg-[var(--paper-warm)]/30 px-4 pb-8 pt-6 sm:px-7 sm:pt-10">
                {trial ? <OverviewTrialBanner trial={trial} basePath={basePath} /> : null}

                {loading || !data ? (
                    <OverviewSkeleton />
                ) : (
                    <div className="space-y-4">
                        <OverviewKpis kpis={data.kpis} />

                        {data.marketingCredit ? (
                            <MarketingCreditBar
                                credit={data.marketingCredit}
                                onRecharge={onRecharge}
                                rechargeHref={`${basePath}/billing`}
                            />
                        ) : null}

                        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                            <AttentionCard
                                title={data.attention.title}
                                slaLabel={data.attention.slaLabel}
                                rows={data.attention.rows}
                                seeAllHref={`${basePath}/conversations`}
                            />
                            <TeamActivityCard rows={data.team} />
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            <CampaignsCard rows={data.campaigns.rows} total={data.campaigns.total} />
                            <FlowsCard
                                items={data.flows.items}
                                activeLabel={data.flows.activeLabel}
                                total24h={data.flows.total24h}
                            />
                            {data.onboarding ? (
                                <OnboardingCard
                                    steps={data.onboarding.steps}
                                    progressLabel={data.onboarding.progressLabel}
                                    headline={data.onboarding.headline}
                                />
                            ) : (
                                <div />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
