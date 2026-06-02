/**
 * Pure mappers that assemble the v3 cockpit "Tableau de bord" overview from
 * already-fetched Convex query results. No React, no Convex value imports — only
 * structural input types. Each function takes one (or a few) query result(s) and
 * returns the matching slice of `DashboardOverviewData`, so the page can compose
 * them and so every transformation is unit-testable in isolation.
 *
 * `now` is injectable everywhere a "time ago" is computed, keeping the functions
 * deterministic for tests (no implicit `Date.now()`).
 */

import type {
    AttentionRow,
    AttentionState,
    CampaignRow,
    CampaignStatus,
    FlowRow,
    MarketingCredit,
    OnboardingStep,
    OverviewKpi,
    TeamActivityRow,
} from "@/components/dashboard/overview/types"

// ───────────────────────────────────────────────────────────────────────────
// Structural input shapes (a subset of the real Convex return types — the page
// validates field names by passing the genuine `FunctionReturnType<…>` results).
// ───────────────────────────────────────────────────────────────────────────

export interface DashboardStatsInput {
    stats: Array<{
        title: string
        value: string
        description: string
        trend?: "up" | "down"
        trendValue?: string
    }>
    chartData: {
        inboundMessages: number
        outboundMessages: number
        responseRate: number
        totalConversations: number
        openConversations: number
        resolvedConversations: number
    }
}

export interface PresenceMemberInput {
    _id: string
    role: "OWNER" | "ADMIN" | "AGENT"
    status: "ONLINE" | "BUSY" | "AWAY" | "OFFLINE"
    activeConversations: number
    maxConversations: number
    poleId?: string | null
    user: { name?: string | null; email?: string | null; image?: string | null }
}

export interface ConversationListItemInput {
    _id: string
    channel: string
    preview?: string | null
    tags?: string[] | null
    lastMessageAt: number
    contact: { name?: string | null; phoneNumber?: string | null } | null
}

export interface BroadcastListItemInput {
    _id: string
    name: string
    status: "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "FAILED" | "CANCELLED"
    sentCount: number
    deliveredCount: number
    readCount: number
}

export interface FlowListItemInput {
    _id: string
    name: string
    isActive: boolean
}

export interface CreditTransactionInput {
    amount: number
    type: "RECHARGE" | "USAGE" | "BONUS" | "REFUND" | "ADJUSTMENT"
    createdAt: number
}

export interface OnboardingChecklistInput {
    steps: Array<{ key: string; done: boolean }>
    completed: number
    total: number
}

export interface PoleLike {
    _id: string
    name: string
}

// ───────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────

/**
 * Rough FCFA cost of one WhatsApp marketing conversation, used to translate a
 * credit balance into "≈ N conversations". The exact rate is country-specific
 * (see `@jokko/core/whatsapp-pricing`); 60 is a reasonable West-Africa average.
 */
export const FCFA_PER_MARKETING_CONVERSATION = 60

// ───────────────────────────────────────────────────────────────────────────
// Small helpers
// ───────────────────────────────────────────────────────────────────────────

/** Humanise a wait duration: "à l'instant" / "8 min" / "1h 04m". */
export function humanizeWait(ms: number): string {
    if (ms < 60_000) return "à l'instant"
    const totalMinutes = Math.floor(ms / 60_000)
    if (totalMinutes < 60) return `${totalMinutes} min`
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`
}

/** Triage state from how long a conversation has been waiting. */
export function attentionStateFromWaitMs(ms: number): AttentionState {
    const minutes = ms / 60_000
    if (minutes > 60) return "breach"
    if (minutes > 20) return "stale"
    return "unassigned"
}

/** Friendly channel label from a raw conversation channel ("WHATSAPP" → "WhatsApp"). */
export function channelLabel(channel: string | null | undefined): string {
    switch ((channel ?? "").toUpperCase()) {
        case "WHATSAPP":
            return "WhatsApp"
        case "SMS":
            return "SMS"
        case "":
            return "WhatsApp"
        default:
            // Title-case unknown channels (e.g. "EMAIL" → "Email").
            return channel!.charAt(0).toUpperCase() + channel!.slice(1).toLowerCase()
    }
}

const ROLE_LABEL: Record<PresenceMemberInput["role"], string> = {
    OWNER: "Owner",
    ADMIN: "Admin",
    AGENT: "Agent",
}

/** First name from a full name (fallbacks handled by the caller). */
export function firstName(name: string | null | undefined): string {
    const trimmed = (name ?? "").trim()
    if (!trimmed) return ""
    return trimmed.split(/\s+/)[0]
}

// ───────────────────────────────────────────────────────────────────────────
// KPIs
// ───────────────────────────────────────────────────────────────────────────

/**
 * The 5 cockpit KPIs (French). Online = presence ONLINE or BUSY. Deltas are
 * deliberately omitted unless a real trend value is available; the only honest
 * trend we have today is the "Taux de Réponse" stat from `stats[]`.
 */
export function mapKpis(
    stats: DashboardStatsInput,
    presence: PresenceMemberInput[],
): OverviewKpi[] {
    const c = stats.chartData
    const onlineCount = presence.filter(
        (m) => m.status === "ONLINE" || m.status === "BUSY",
    ).length
    const totalMembers = presence.length

    // The dashboard stats include a "Taux de Réponse" entry with a real trend —
    // surface it on the matching KPI when present (good if up, warn if down).
    const rateStat = stats.stats.find((s) => /taux/i.test(s.title))
    const rateDelta =
        rateStat?.trendValue && rateStat.trend
            ? {
                  delta: rateStat.trendValue,
                  deltaTone: (rateStat.trend === "up" ? "good" : "warn") as
                      | "good"
                      | "warn",
              }
            : {}

    return [
        {
            label: "Conversations reçues",
            value: c.inboundMessages.toLocaleString("fr-FR"),
            sub: "30 derniers jours",
        },
        {
            label: "Réponses envoyées",
            value: c.outboundMessages.toLocaleString("fr-FR"),
            sub: "30 derniers jours",
        },
        {
            label: "Taux de réponse",
            value: `${c.responseRate}%`,
            sub: "messages sortants / entrants",
            ...rateDelta,
        },
        {
            label: "Agents en ligne",
            value: `${onlineCount} / ${totalMembers}`,
            deltaTone: "mute",
            sub: "présence temps réel",
        },
        {
            label: "Non résolues",
            value: c.openConversations.toLocaleString("fr-FR"),
            deltaTone: "warn",
            sub: "conversations ouvertes",
        },
    ]
}

// ───────────────────────────────────────────────────────────────────────────
// Attention list
// ───────────────────────────────────────────────────────────────────────────

export interface AttentionSection {
    title: string
    slaLabel?: string
    rows: AttentionRow[]
}

/**
 * The triage list — unassigned / waiting conversations. Feed it the result of
 * `conversations.list` with the "unassigned" filter; it takes up to `limit`
 * (default 5), humanises the wait, and escalates the state by wait duration.
 */
export function mapAttention(
    conversations: ConversationListItemInput[],
    now: number = Date.now(),
    limit = 5,
): AttentionSection {
    const rows: AttentionRow[] = conversations.slice(0, limit).map((conv) => {
        const waitMs = Math.max(0, now - conv.lastMessageAt)
        const who =
            (conv.contact?.name && conv.contact.name.trim()) ||
            (conv.contact?.phoneNumber && conv.contact.phoneNumber.trim()) ||
            "Contact inconnu"
        const last = (conv.preview && conv.preview.trim()) || "Nouvelle conversation"
        return {
            id: conv._id,
            who,
            last,
            channel: channelLabel(conv.channel),
            tags: conv.tags ?? [],
            wait: humanizeWait(waitMs),
            state: attentionStateFromWaitMs(waitMs),
        }
    })

    return {
        title:
            rows.length === 0
                ? "Tout est à jour"
                : `${rows.length} conversation${rows.length > 1 ? "s" : ""} à traiter`,
        slaLabel: "SLA 3m",
        rows,
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Team activity
// ───────────────────────────────────────────────────────────────────────────

const PRESENCE_TO_AGENT_STATE: Record<
    PresenceMemberInput["status"],
    TeamActivityRow["state"]
> = {
    ONLINE: "online",
    BUSY: "busy",
    AWAY: "away",
    OFFLINE: "away",
}

/**
 * Team activity rows from `presence.listWithPresence`. Sorted by load desc and
 * capped at `limit` (default 6). `pole` resolves the member's pole name when a
 * lookup map is provided, otherwise falls back to the role label. `busy` is "—"
 * (we have no current-contact data on the membership).
 */
export function mapTeam(
    members: PresenceMemberInput[],
    poleNameById?: Record<string, string>,
    limit = 6,
): TeamActivityRow[] {
    return [...members]
        .sort((a, b) => b.activeConversations - a.activeConversations)
        .slice(0, limit)
        .map((m) => {
            const poleName = m.poleId ? poleNameById?.[m.poleId] : undefined
            return {
                id: m._id,
                name: (m.user.name && m.user.name.trim()) || m.user.email || "Coéquipier",
                busy: "—",
                state: PRESENCE_TO_AGENT_STATE[m.status],
                pole: poleName ?? ROLE_LABEL[m.role],
                load: m.activeConversations,
            }
        })
}

/** Build a `poleId → name` lookup from a poles list (convenience for `mapTeam`). */
export function poleNameMap(poles: PoleLike[] | null | undefined): Record<string, string> {
    const map: Record<string, string> = {}
    for (const p of poles ?? []) map[p._id] = p.name
    return map
}

// ───────────────────────────────────────────────────────────────────────────
// Campaigns
// ───────────────────────────────────────────────────────────────────────────

export interface CampaignsSection {
    rows: CampaignRow[]
    total?: string
}

function campaignStatus(status: BroadcastListItemInput["status"]): CampaignStatus {
    if (status === "SENDING") return "sending"
    if (status === "COMPLETED") return "completed"
    return "paused"
}

/**
 * The 3 most recent broadcasts. `broadcasts.list` already returns newest-first,
 * so we just take the head. Percentages are derived from `sentCount`.
 */
export function mapCampaigns(
    broadcasts: BroadcastListItemInput[],
    limit = 3,
): CampaignsSection {
    const shown = broadcasts.slice(0, limit)
    const rows: CampaignRow[] = shown.map((b) => {
        const delivered = b.deliveredCount > 0 ? b.deliveredCount : b.sentCount
        const readPct = b.sentCount > 0 ? Math.round((b.readCount / b.sentCount) * 100) : 0
        const deliveredPct =
            b.sentCount > 0 ? Math.round((b.deliveredCount / b.sentCount) * 100) : 0
        return {
            id: b._id,
            name: b.name,
            delivered: `${delivered}`,
            read: `${readPct}%`,
            deliveredPct,
            status: campaignStatus(b.status),
        }
    })

    return {
        rows,
        total: `${rows.length} / ${broadcasts.length}`,
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Flows
// ───────────────────────────────────────────────────────────────────────────

export interface FlowsSection {
    items: FlowRow[]
    activeLabel?: string
    total24h?: string
}

/**
 * Active automations. HONEST GAP: there is no execution/run-count data in the
 * schema (no `flowRuns` table), so `runs` is 0 and `period` is empty — we do not
 * invent run numbers. `total24h` is omitted for the same reason.
 */
export function mapFlows(flows: FlowListItemInput[], limit = 4): FlowsSection {
    const active = flows.filter((f) => f.isActive)
    const items: FlowRow[] = active.slice(0, limit).map((f) => ({
        id: f._id,
        name: f.name,
        runs: 0,
        period: "",
    }))

    return {
        items,
        activeLabel: `${active.length} actif${active.length > 1 ? "s" : ""}`,
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Marketing credit
// ───────────────────────────────────────────────────────────────────────────

/** Sum of |amount| for USAGE transactions within the calendar month of `now`. */
export function usageSpentThisMonth(
    transactions: CreditTransactionInput[],
    now: number = Date.now(),
): number {
    const ref = new Date(now)
    const year = ref.getFullYear()
    const month = ref.getMonth()
    let spent = 0
    for (const t of transactions) {
        if (t.type !== "USAGE") continue
        const d = new Date(t.createdAt)
        if (d.getFullYear() === year && d.getMonth() === month) {
            spent += Math.abs(t.amount)
        }
    }
    return spent
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`

/**
 * The WhatsApp marketing-credit bar (FCFA, not euros). `balance` is the org
 * credit balance; `spent` is this month's USAGE total. HONEST GAP: no monthly
 * budget or auto-top-up is stored, so the "budget" is the total loaded
 * (spent + balance) and there is no auto-top-up pill.
 */
export function mapMarketingCredit(
    balance: number,
    transactions: CreditTransactionInput[],
    now: number = Date.now(),
): MarketingCredit {
    const spent = usageSpentThisMonth(transactions, now)
    const totalLoaded = spent + balance
    const pct = totalLoaded > 0 ? Math.round((spent / totalLoaded) * 100) : 0
    const conversations = Math.floor(
        balance / FCFA_PER_MARKETING_CONVERSATION,
    ).toLocaleString("fr-FR")
    const low = balance < 1000

    return {
        balance: fcfa(balance),
        conversations,
        spent: fcfa(spent),
        budget: fcfa(totalLoaded),
        pct,
        runwayLabel: "Crédit marketing disponible",
        low,
        lowLabel: low ? "Solde bas — rechargez avant la prochaine campagne" : undefined,
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Onboarding
// ───────────────────────────────────────────────────────────────────────────

const ONBOARDING_LABELS: Record<string, string> = {
    whatsapp: "Connecter un numéro WhatsApp",
    team: "Inviter l'équipe",
    template: "Créer un premier modèle",
    templateMeta: "Soumettre 1 modèle à Meta",
    automation: "Configurer une automatisation",
    crm: "Connecter un CRM",
}

export interface OnboardingSection {
    steps: OnboardingStep[]
    progressLabel?: string
    headline?: string
}

/** Map the onboarding checklist query into French-labelled steps + progress. */
export function mapOnboarding(checklist: OnboardingChecklistInput): OnboardingSection {
    const steps: OnboardingStep[] = checklist.steps.map((s) => ({
        label: ONBOARDING_LABELS[s.key] ?? s.key,
        done: s.done,
    }))
    const remaining = checklist.total - checklist.completed

    return {
        steps,
        progressLabel: `${checklist.completed} / ${checklist.total}`,
        headline:
            remaining > 0
                ? `Encore ${remaining} étape${remaining > 1 ? "s" : ""}.`
                : "Tout est prêt !",
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Header bits
// ───────────────────────────────────────────────────────────────────────────

/** Today, formatted FR like "jeudi 24 mai 2026". */
export function formatDateLabel(now: number = Date.now()): string {
    return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(now))
}

/** Greeting first name with a friendly fallback. */
export function greetingNameFrom(name: string | null | undefined): string {
    return firstName(name) || "à vous"
}
