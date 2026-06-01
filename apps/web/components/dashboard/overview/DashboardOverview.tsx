"use client"

import Link from "next/link"
import { AlertTriangle, FileText, Plus, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import {
    AttentionCard,
    CampaignsCard,
    FlowsCard,
    OnboardingCard,
    OverviewKpis,
    TeamActivityCard,
    type AttentionRow,
    type CampaignRow,
    type FlowRow,
    type OnboardingStep,
    type OverviewKpi,
    type TeamActivityRow,
} from "./OverviewPanels"

export interface DashboardOverviewData {
    greetingName: string
    dateLabel: string
    subtitle?: string
    kpis: OverviewKpi[]
    attention: { title: string; slaLabel?: string; rows: AttentionRow[] }
    team: TeamActivityRow[]
    campaigns: { rows: CampaignRow[]; total?: string }
    flows: { items: FlowRow[]; activeLabel?: string; total24h?: string }
    onboarding?: { steps: OnboardingStep[]; progressLabel?: string; headline?: string }
}

interface DashboardOverviewProps {
    data?: DashboardOverviewData
    loading?: boolean
    trial?: { state: "active" | "expired"; daysLeft?: number } | null
    basePath?: string
}

function TrialBanner({
    trial,
    basePath,
}: {
    trial: { state: "active" | "expired"; daysLeft?: number }
    basePath: string
}) {
    const expired = trial.state === "expired"
    return (
        <div
            className={cn(
                "mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
                expired
                    ? "border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)]"
                    : "border-[var(--status-warn)]/30 bg-[var(--status-warn-soft)]",
            )}
        >
            <div className="flex items-center gap-2.5">
                <AlertTriangle
                    className={cn(
                        "h-4 w-4 shrink-0",
                        expired ? "text-[var(--status-danger)]" : "text-[var(--status-warn)]",
                    )}
                />
                <p className="text-[13px] text-[var(--ink-900)]">
                    {expired
                        ? "Votre période d'essai est terminée. Choisissez un plan pour continuer."
                        : `Période d'essai · ${trial.daysLeft} jour${(trial.daysLeft ?? 0) > 1 ? "s" : ""} restant${(trial.daysLeft ?? 0) > 1 ? "s" : ""}.`}
                </p>
            </div>
            <Link
                href={`${basePath}/billing`}
                className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
                {expired ? "Choisir un plan" : "Gérer le plan"}
            </Link>
        </div>
    )
}

function Skel({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-xl bg-[var(--ink-100)]", className)} />
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
                        <HeaderButton icon={Plus}>Nouvelle campagne</HeaderButton>
                        <HeaderButton icon={FileText}>Nouveau modèle</HeaderButton>
                        <HeaderButton icon={Users} variant="primary">
                            Inviter un coéquipier
                        </HeaderButton>
                    </>
                }
            />

            <div className="flex-1 overflow-y-auto bg-[var(--paper-warm)]/30 px-7 pb-8 pt-10">
                {trial ? <TrialBanner trial={trial} basePath={basePath} /> : null}

                {loading || !data ? (
                    <OverviewSkeleton />
                ) : (
                    <div className="space-y-4">
                        <OverviewKpis kpis={data.kpis} />

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
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
