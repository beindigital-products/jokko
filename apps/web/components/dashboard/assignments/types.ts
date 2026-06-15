// ── Assignments screen types ───────────────────────────────────────────────

export type AssignmentStrategy = "rr" | "pole" | "chan" | "kw"

export interface StrategyOption {
    id: AssignmentStrategy
    label: string
    sub: string
    selected: boolean
}

export interface ChannelRoute {
    city: string
    number: string
    dest: string
    destSub: string
}

export type AgentLoadState = "over" | "ok" | "low" | "off"

export interface AgentLoad {
    id: string
    name: string
    pole: string
    open: number
    cap: number
    state: AgentLoadState
}

export interface SlaMetric {
    label: string
    value: string
    stat: string
    statTone: "good" | "warn"
}

export interface FallbackOption {
    label: string
    enabled: boolean
}

export interface AssignmentsData {
    autoEnabled: boolean
    activeSinceLabel: string
    strategies: StrategyOption[]
    channels: ChannelRoute[]
    agents: AgentLoad[]
    slas: SlaMetric[]
    slaAlert: string
    fallbackDesc: string
    fallbackOptions: FallbackOption[]
}
