import type { StatusSlice, VolumePoint } from "./AnalyticsCharts"

export interface AnalyticsKpi {
    label: string
    value: string
    delta: string
    sub?: string
}

export interface AgentRow {
    id: string
    name: string
    conv: number
    time: string
    csat: string
}

export interface ChannelLegend {
    key: keyof Omit<VolumePoint, "day">
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
