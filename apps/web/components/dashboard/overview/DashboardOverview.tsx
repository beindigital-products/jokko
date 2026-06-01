"use client"

import Link from "next/link"
import { AlertTriangle, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { ActivityChart, StatusDonut, type ActivityPoint, type StatusSlice } from "./OverviewCharts"
import {
    AttentionQueue,
    ChannelHealthPanel,
    OverviewKpis,
    Panel,
    RecentConversationsPanel,
    TeamPresencePanel,
    UsageStrip,
    type AttentionItem,
    type ChannelHealth,
    type OverviewKpi,
    type RecentConversation,
    type TeamMemberPresence,
    type UsageItem,
} from "./OverviewPanels"

export interface DashboardOverviewData {
    greetingName: string
    dateLabel: string
    period: "today" | "7d"
    kpis: OverviewKpi[]
    attention: AttentionItem[]
    activity: ActivityPoint[]
    statusBreakdown: StatusSlice[]
    team: TeamMemberPresence[]
    recent: RecentConversation[]
    channels: ChannelHealth[]
    usage: UsageItem[]
}

interface DashboardOverviewProps {
    data?: DashboardOverviewData
    loading?: boolean
    role?: "OWNER" | "ADMIN" | "AGENT"
    trial?: { state: "active" | "expired"; daysLeft?: number } | null
    onPeriodChange?: (p: "today" | "7d") => void
    basePath?: string
}

function PeriodToggle({
    value,
    onChange,
}: {
    value: "today" | "7d"
    onChange?: (p: "today" | "7d") => void
}) {
    const opts: { key: "today" | "7d"; label: string }[] = [
        { key: "today", label: "Aujourd'hui" },
        { key: "7d", label: "7 jours" },
    ]
    return (
        <div className="flex items-center gap-0.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-0.5">
            {opts.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    onClick={() => onChange?.(o.key)}
                    className={cn(
                        "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                        value === o.key
                            ? "bg-[var(--paper-white)] text-[var(--ink-900)] shadow-sm"
                            : "text-[var(--ink-soft)] hover:text-[var(--ink-900)]",
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    )
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
                "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
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

function StatusLegend({ data }: { data: StatusSlice[] }) {
    const total = data.reduce((acc, d) => acc + d.value, 0) || 1
    return (
        <ul className="mt-3 space-y-1.5">
            {data.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-[12px]">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 text-[var(--ink-700)]">{s.label}</span>
                    <span className="font-mono text-[var(--ink-soft)]">
                        {Math.round((s.value / total) * 100)}%
                    </span>
                </li>
            ))}
        </ul>
    )
}

function Skel({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-lg bg-[var(--ink-100)]", className)} />
}

function OverviewSkeleton() {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <Skel key={i} className="h-[92px]" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <Skel key={i} className="h-[110px]" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                <Skel className="h-[240px] lg:col-span-2" />
                <Skel className="h-[240px]" />
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
 * DashboardOverview — v3 "cockpit du jour" landing page. Daily operational
 * snapshot (today / 7 days): KPIs, the attention queue, 7-day activity +
 * status split, team presence, recent conversations, channel health and
 * plan usage. Distinct from Analytics (30-day deep dive). Pure
 * presentational — wire it from `app/dashboard/page.tsx`.
 */
export function DashboardOverview({
    data,
    loading,
    role = "OWNER",
    trial,
    onPeriodChange,
    basePath = "/dashboard",
}: DashboardOverviewProps) {
    const isAdmin = role !== "AGENT"

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[var(--paper-warm)]/40">
            <PageHeader
                eyebrow="PILOTAGE · TABLEAU DE BORD"
                title={`Bonjour ${data?.greetingName ?? ""} 👋`}
                description={data?.dateLabel}
                actions={
                    <>
                        <PeriodToggle value={data?.period ?? "today"} onChange={onPeriodChange} />
                        <HeaderButton icon={Plus} variant="primary">
                            Nouvelle campagne
                        </HeaderButton>
                    </>
                }
            />

            <div className="flex-1 overflow-y-auto px-8 py-6">
                {loading || !data ? (
                    <OverviewSkeleton />
                ) : (
                    <div className="space-y-5">
                        {trial ? <TrialBanner trial={trial} basePath={basePath} /> : null}

                        <OverviewKpis kpis={data.kpis} />

                        <AttentionQueue items={data.attention} />

                        <div className="grid gap-4 lg:grid-cols-3">
                            <Panel title="Activité · 7 jours" className="lg:col-span-2">
                                <ActivityChart data={data.activity} />
                            </Panel>
                            <Panel title="Répartition des conversations">
                                <StatusDonut data={data.statusBreakdown} />
                                <StatusLegend data={data.statusBreakdown} />
                            </Panel>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            {isAdmin ? <TeamPresencePanel members={data.team} /> : null}
                            <div className={cn(!isAdmin && "lg:col-span-2")}>
                                <RecentConversationsPanel
                                    items={data.recent}
                                    seeAllHref={`${basePath}/conversations`}
                                />
                            </div>
                            {isAdmin ? (
                                <ChannelHealthPanel
                                    channels={data.channels}
                                    manageHref={`${basePath}/settings`}
                                />
                            ) : null}
                        </div>

                        {isAdmin ? <UsageStrip items={data.usage} /> : null}
                    </div>
                )}
            </div>
        </div>
    )
}
