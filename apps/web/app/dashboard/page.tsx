"use client"

import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"

import { api } from "@/convex/_generated/api"
import { useCurrentOrg } from "@/hooks/use-current-org"
import {
    DashboardOverview,
    type DashboardOverviewData,
} from "@/components/dashboard/overview/DashboardOverview"
import {
    formatDateLabel,
    greetingNameFrom,
    mapAttention,
    mapCampaigns,
    mapFlows,
    mapKpis,
    mapMarketingCredit,
    mapOnboarding,
    mapTeam,
} from "@/lib/dashboard/overview-data"

/**
 * Tableau de bord — production wiring of the v3 cockpit. Pulls the real Convex
 * queries, assembles them through the pure mappers in
 * `lib/dashboard/overview-data.ts`, and hands a single `DashboardOverviewData`
 * to the presentational `<DashboardOverview/>`.
 *
 * The trial banner is intentionally NOT rendered here: the dashboard layout
 * (`dashboard-layout-client.tsx`) already shows it, so we omit the `trial` prop
 * to avoid a double banner.
 */
export default function DashboardPage() {
    const { currentOrg } = useCurrentOrg()
    const orgId = currentOrg?._id

    const me = useQuery(api.users.me)
    const stats = useQuery(api.analytics.getAppDashboardStats)
    const overview = useQuery(api.analytics.getDashboardOverview)
    const presence = useQuery(
        api.presence.listWithPresence,
        orgId ? { organizationId: orgId } : "skip",
    )
    const unassigned = useQuery(
        api.conversations.list,
        orgId ? { organizationId: orgId, filter: "unassigned" as const } : "skip",
    )
    const broadcasts = useQuery(api.broadcasts.list, {})
    const flows = useQuery(api.flows.list, {})
    const creditBalance = useQuery(api.credits.getBalance)
    const creditTransactions = useQuery(api.credits.getTransactions, { limit: 50 })
    const onboarding = useQuery(api.dashboard.getOnboardingChecklist)

    // Essential queries gate the skeleton. Everything else degrades to empty.
    const loading = stats === undefined || overview === undefined

    const data = buildOverviewData({
        me,
        stats,
        presence,
        unassigned,
        broadcasts,
        flows,
        creditBalance,
        creditTransactions,
        onboarding,
    })

    return (
        // Full-bleed route (see isFullBleedRoute in the dashboard layout): rendered
        // straight into #main-content, so `h-full` fills the box exactly.
        <div className="h-full">
            <DashboardOverview data={data} loading={loading} basePath="/dashboard" />
        </div>
    )
}

type MeResult = FunctionReturnType<typeof api.users.me>
type StatsResult = FunctionReturnType<typeof api.analytics.getAppDashboardStats>
type PresenceResult = FunctionReturnType<typeof api.presence.listWithPresence>
type ConversationsResult = FunctionReturnType<typeof api.conversations.list>
type BroadcastsResult = FunctionReturnType<typeof api.broadcasts.list>
type FlowsResult = FunctionReturnType<typeof api.flows.list>
type CreditTransactionsResult = FunctionReturnType<typeof api.credits.getTransactions>
type OnboardingResult = FunctionReturnType<typeof api.dashboard.getOnboardingChecklist>

/**
 * Assemble `DashboardOverviewData` from the (possibly-undefined / null) query
 * results. Returns `undefined` until the two essential queries have resolved so
 * `<DashboardOverview/>` keeps showing its skeleton; once resolved it renders
 * cleanly even for a brand-new org with no data.
 */
function buildOverviewData(args: {
    me: MeResult | undefined
    stats: StatsResult | undefined
    presence: PresenceResult | undefined
    unassigned: ConversationsResult | undefined
    broadcasts: BroadcastsResult | undefined
    flows: FlowsResult | undefined
    creditBalance: number | null | undefined
    creditTransactions: CreditTransactionsResult | undefined
    onboarding: OnboardingResult | undefined
}): DashboardOverviewData | undefined {
    const { stats } = args
    if (!stats) return undefined

    const now = Date.now()
    const presence = args.presence ?? []
    const broadcasts = args.broadcasts ?? []
    const flows = args.flows ?? []
    const transactions = args.creditTransactions ?? []
    const balance = args.creditBalance ?? 0

    return {
        greetingName: greetingNameFrom(args.me?.name),
        dateLabel: formatDateLabel(now),
        kpis: mapKpis(stats, presence),
        attention: mapAttention(args.unassigned ?? [], now),
        team: mapTeam(presence),
        campaigns: mapCampaigns(broadcasts),
        flows: mapFlows(flows),
        marketingCredit: mapMarketingCredit(balance, transactions, now),
        onboarding: args.onboarding ? mapOnboarding(args.onboarding) : undefined,
    }
}
