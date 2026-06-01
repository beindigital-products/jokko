"use client"

import { Fragment } from "react"
import { ArrowUpRight, Download, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { Avatar } from "../primitives/Avatar"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import { StatusDonut, VolumeChart, type StatusSlice, type VolumePoint } from "./AnalyticsCharts"

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
    channels: { key: keyof Omit<VolumePoint, "day">; label: string; color: string }[]
    topAgents: AgentRow[]
    status: StatusSlice[]
    heatmap: HeatPoint
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6",
                className,
            )}
        >
            {children}
        </div>
    )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
            {children}
        </div>
    )
}

export function AnalyticsScreen({ data }: { data: AnalyticsData }) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow="Insights · 30 derniers jours"
                title="Analytics"
                description="Volume, temps de réponse, taux de résolution, performance des agents et campagnes."
                actions={
                    <>
                        <HeaderButton icon={SlidersHorizontal}>30 derniers jours</HeaderButton>
                        <HeaderButton icon={Download}>Exporter</HeaderButton>
                    </>
                }
            />

            <div className="flex-1 space-y-5 overflow-y-auto bg-[var(--paper-warm)]/30 px-7 py-7">
                {/* KPI row */}
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                    {data.kpis.map((k) => (
                        <Card key={k.label}>
                            <Eyebrow>{k.label}</Eyebrow>
                            <div className="mt-3 font-display text-[34px] font-bold leading-none tabular-nums tracking-tight text-[var(--ink-900)]">
                                {k.value}
                            </div>
                            <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[var(--status-good)]">
                                <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                                <span className="font-mono tabular-nums">{k.delta}</span>
                                <span className="text-[var(--ink-soft)]">{k.sub ?? "vs mois préc."}</span>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Volume + top agents */}
                <div className="grid gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <div className="mb-5 flex items-baseline justify-between gap-3">
                            <div>
                                <Eyebrow>Volume conversations</Eyebrow>
                                <div className="mt-1 font-editorial text-[20px] tracking-tight text-[var(--ink-900)]">
                                    30 derniers jours · par canal
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 text-[11.5px] text-[var(--ink-700)]">
                                {data.channels.map((c) => (
                                    <span key={c.key} className="flex items-center gap-1.5">
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ background: c.color }}
                                        />
                                        {c.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <VolumeChart data={data.volume} />
                    </Card>

                    <Card>
                        <Eyebrow>Top agents · 30j</Eyebrow>
                        <div className="mt-3.5 flex flex-col gap-3">
                            {data.topAgents.map((a, i) => (
                                <div key={a.id} className="flex items-center gap-3">
                                    <span className="w-4 font-mono text-[11px] text-[var(--ink-soft)]">
                                        {i + 1}
                                    </span>
                                    <Avatar
                                        initials={initialsFromName(a.name)}
                                        color={avatarColorFromString(a.name)}
                                        size="sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[13px] font-medium tracking-tight text-[var(--ink-900)]">
                                            {a.name}
                                        </div>
                                        <div className="font-mono text-[11px] text-[var(--ink-soft)]">
                                            {a.conv} conv · {a.time} · {a.csat}★
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Status + heatmap */}
                <div className="grid gap-5 lg:grid-cols-2">
                    <Card>
                        <Eyebrow>Répartition par statut</Eyebrow>
                        <div className="mt-3 flex items-center gap-6">
                            <StatusDonut data={data.status} />
                            <ul className="flex-1 space-y-2.5">
                                {data.status.map((s) => (
                                    <li key={s.key} className="flex items-center gap-2.5 text-[13px]">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                            style={{ background: s.color }}
                                        />
                                        <span className="flex-1 tracking-tight text-[var(--ink-900)]">{s.label}</span>
                                        <span className="font-mono text-[12px] font-medium tabular-nums text-[var(--ink-700)]">
                                            {s.value}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>

                    <Card>
                        <Eyebrow>Heures de pointe</Eyebrow>
                        <Heatmap data={data.heatmap} />
                    </Card>
                </div>
            </div>
        </div>
    )
}

function Heatmap({ data }: { data: HeatPoint }) {
    return (
        <div className="mt-4">
            <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `20px repeat(${data.hours.length}, 1fr)` }}
            >
                <div />
                {data.hours.map((h) => (
                    <div
                        key={h}
                        className="text-center font-mono text-[10px] text-[var(--ink-soft)]"
                    >
                        {h}
                    </div>
                ))}
                {data.days.map((d, di) => (
                    <Fragment key={di}>
                        <div className="flex items-center justify-end font-mono text-[10px] text-[var(--ink-soft)]">
                            {d}
                        </div>
                        {data.rows[di].map((v, hi) => (
                            <div
                                key={hi}
                                className="h-[22px] rounded"
                                style={{ background: `rgba(105, 56, 239, ${0.08 + v * 0.8})` }}
                            />
                        ))}
                    </Fragment>
                ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11.5px] text-[var(--ink-500)]">
                <span>
                    Peak : <b className="text-[var(--ink-900)]">{data.peakLabel}</b>
                </span>
                {data.hint ? (
                    <>
                        <span className="text-[var(--ink-400)]">·</span>
                        <span>{data.hint}</span>
                    </>
                ) : null}
            </div>
        </div>
    )
}
