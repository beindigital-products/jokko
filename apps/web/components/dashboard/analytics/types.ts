import type { StatusSlice, VolumePoint } from "./AnalyticsCharts"

export interface AnalyticsKpi {
    label: string
    value: string
    /** Optional change pill; omit when there's no prior-period comparison. */
    delta?: string
    trend?: "up" | "down"
    sub?: string
}

export interface AgentRow {
    id: string
    name: string
    conv: number
    time: string
    /** Satisfaction score — optional (not tracked by the backend yet). */
    csat?: string
}

export interface ChannelLegend {
    key: string
    label: string
    color: string
}

export interface HeatPoint {
    /** 7 rows (days) × 7 cols (hours), each 0..1 intensity. */
    rows: number[][]
    hours: string[]
    days: string[]
    peakLabel: string
    hint?: string
}

export interface AnalyticsData {
    kpis: AnalyticsKpi[]
    volume: VolumePoint[]
    channels: ChannelLegend[]
    topAgents: AgentRow[]
    status: StatusSlice[]
    heatmap: HeatPoint
}
