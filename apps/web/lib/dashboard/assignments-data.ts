import type {
    AgentLoad,
    AgentLoadState,
    ChannelRoute,
    FallbackOption,
    SlaMetric,
    StrategyOption,
} from "@/components/dashboard/assignments/types"

// ── Inputs (mirror the relevant Convex query shapes) ───────────────────────

/** Subset of an `api.assignments.getAgentsList` row used by the load view. */
export interface AgentsListItem {
    id: string
    fullName: string
    department: string
    load: number
    maxLoad: number
    status: string // "En ligne" | "Occupé" | "Absent" | "Hors ligne"
}

/** Subset of an `api.channels.list` row used by the routing preview. */
export interface ChannelListItem {
    label: string
    displayPhoneNumber: string
    pole?: { name: string } | null
    primaryTeam?: { name: string } | null
}

export interface AssignmentSettingsLike {
    autoAssignEnabled?: boolean
    maxConcurrentChats?: number
    excludeOfflineAgents?: boolean
}

// ── Agent load ─────────────────────────────────────────────────────────────

/**
 * Classifies an agent's load into the four design states:
 *   off  — offline (not taking new conversations)
 *   over — at or above capacity
 *   ok   — online with active conversations
 *   low  — online and free
 */
export function agentLoadState(item: { status: string; load: number; maxLoad: number }): AgentLoadState {
    if (item.status === "Hors ligne") return "off"
    if (item.maxLoad > 0 && item.load >= item.maxLoad) return "over"
    if (item.load > 0) return "ok"
    return "low"
}

/** Maps `getAgentsList` rows → the AgentLoadCard's `AgentLoad[]`. */
export function mapAgentLoad(agents: AgentsListItem[]): AgentLoad[] {
    return agents.map((a) => ({
        id: a.id,
        name: a.fullName,
        pole: a.department || "Général",
        open: a.load,
        cap: a.maxLoad > 0 ? a.maxLoad : 1,
        state: agentLoadState(a),
    }))
}

// ── Channel routing (read-only preview) ────────────────────────────────────

/** Maps `channels.list` rows → the ChannelRoutingCard's `ChannelRoute[]`. */
export function mapChannelRoutes(channels: ChannelListItem[]): ChannelRoute[] {
    return channels.map((ch) => {
        const dest = ch.pole?.name ?? ch.primaryTeam?.name ?? "Tous les agents"
        const destSub = ch.pole ? "Pôle dédié" : ch.primaryTeam ? "Équipe dédiée" : "Round-robin global"
        return {
            city: ch.label,
            number: ch.displayPhoneNumber,
            dest,
            destSub,
        }
    })
}

// ── SLA (read-only preview) ────────────────────────────────────────────────

/** Builds the SLA tiles from the stats `avgResponseTime` (resolution is TBD). */
export function mapSlaMetrics(avgResponseTime: string | undefined): SlaMetric[] {
    const avg = avgResponseTime && avgResponseTime.trim() ? avgResponseTime : null
    return [
        {
            label: "Première réponse",
            value: avg ?? "—",
            stat: avg ? `Moyenne ${avg}` : "Aucune donnée",
            statTone: "good",
        },
        {
            label: "Résolution",
            value: "—",
            stat: "Bientôt disponible",
            statTone: "good",
        },
    ]
}

// ── Fallback (read-only preview, reflects the one backed setting) ───────────

export function mapFallbackOptions(settings: AssignmentSettingsLike): FallbackOption[] {
    return [
        { label: "Ne pas assigner aux agents hors ligne", enabled: !!settings.excludeOfflineAgents },
        { label: "Redistribuer si l'agent reste hors ligne", enabled: !!settings.autoAssignEnabled },
        { label: "Notifier le manager (à venir)", enabled: false },
    ]
}

// ── Strategy (read-only preview; routing strategy is not org-stored yet) ────

export function mapStrategies(): StrategyOption[] {
    return [
        {
            id: "rr",
            label: "Round-robin entre tous les agents en ligne",
            sub: "Distribution équitable. Stratégie active par défaut.",
            selected: true,
        },
        {
            id: "pole",
            label: "Round-robin par pôle",
            sub: "Selon le numéro WhatsApp ou le mot-clé du message.",
            selected: false,
        },
        {
            id: "chan",
            label: "Par numéro WhatsApp",
            sub: "Chaque numéro est dédié à un agent ou un pôle.",
            selected: false,
        },
        {
            id: "kw",
            label: "Par mot-clé / intention",
            sub: "Détection automatique + bascule au pôle adapté.",
            selected: false,
        },
    ]
}
