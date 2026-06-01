"use client"

import { Plus, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { Chip } from "../primitives/Chip"

export type CampaignStatus = "sending" | "scheduled" | "completed" | "draft" | "paused"

export interface CampaignRow {
    id: string
    name: string
    status: CampaignStatus
    tpl: string
    audience: string
    delivered: string
    read: string
    cost: string
    start: string
    /** progress 0..1 for sending/paused (bar under the name). */
    progress?: number
    /** small hint under the name (draft / scheduled). */
    hint?: string
    hintTone?: "mute" | "accent"
}

export interface CampaignsKpi {
    label: string
    value: string
    delta: string
}

export interface CampaignsData {
    count: string
    kpis: CampaignsKpi[]
    campaigns: CampaignRow[]
}

const COLS =
    "minmax(0,2.2fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,0.9fr) minmax(0,0.7fr)"

const STATUS_CHIP: Record<CampaignStatus, { tone: "accent" | "neutral" | "good" | "warn"; label: string }> = {
    sending: { tone: "accent", label: "En cours" },
    scheduled: { tone: "neutral", label: "Planifiée" },
    completed: { tone: "good", label: "Terminée" },
    draft: { tone: "neutral", label: "Brouillon" },
    paused: { tone: "warn", label: "En pause" },
}

export function CampaignsScreen({ data }: { data: CampaignsData }) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Diffusion · ${data.count}`}
                title="Campagnes"
                description="Diffusions massives sur templates approuvés Meta. Audiences segmentées, planification, suivi livraison + ROI."
                actions={
                    <>
                        <HeaderButton icon={SlidersHorizontal}>Filtres</HeaderButton>
                        <HeaderButton icon={Plus} variant="primary">
                            Nouvelle campagne
                        </HeaderButton>
                    </>
                }
            />

            {/* KPI strip */}
            <div className="grid shrink-0 grid-cols-2 gap-6 border-b border-[var(--ink-200)] px-8 py-6 lg:grid-cols-4">
                {data.kpis.map((k) => (
                    <div key={k.label}>
                        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                            {k.label}
                        </div>
                        <div className="mt-2 font-display text-[30px] font-bold leading-none tabular-nums tracking-tight text-[var(--ink-900)]">
                            {k.value}
                        </div>
                        <div className="mt-1.5 font-mono text-[11.5px] text-[var(--ink-500)]">{k.delta}</div>
                    </div>
                ))}
            </div>

            {/* Campaigns table */}
            <div className="flex-1 overflow-y-auto">
                <div
                    className="grid items-center gap-x-5 border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-8 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]"
                    style={{ gridTemplateColumns: COLS, height: 38 }}
                >
                    <div>Campagne</div>
                    <div>Statut · démarrage</div>
                    <div>Modèle</div>
                    <div className="text-right">Audience</div>
                    <div className="text-right">Livrés</div>
                    <div className="text-right">Lus</div>
                    <div className="text-right">Coût</div>
                </div>

                {data.campaigns.map((c) => {
                    const s = STATUS_CHIP[c.status]
                    return (
                        <div
                            key={c.id}
                            className="grid items-start gap-x-5 border-b border-[var(--ink-100)] px-8 py-3.5 transition-colors hover:bg-[var(--paper-warm)]/50"
                            style={{ gridTemplateColumns: COLS, minHeight: 72 }}
                        >
                            <div className="min-w-0">
                                <div className="truncate text-[13.5px] font-medium tracking-tight text-[var(--ink-900)]">
                                    {c.name}
                                </div>
                                {c.progress != null && c.progress > 0 && c.progress < 1 ? (
                                    <div className="mt-1.5 h-[3px] max-w-[240px] overflow-hidden rounded-full bg-[var(--ink-100)]">
                                        <div
                                            className={cn(
                                                "h-full rounded-full",
                                                c.status === "paused"
                                                    ? "bg-[var(--status-warn)]"
                                                    : "bg-[var(--accent)]",
                                            )}
                                            style={{ width: `${c.progress * 100}%` }}
                                        />
                                    </div>
                                ) : c.hint ? (
                                    <div
                                        className={cn(
                                            "mt-1 text-[11.5px]",
                                            c.hintTone === "accent"
                                                ? "font-mono text-[var(--accent)]"
                                                : "text-[var(--ink-soft)]",
                                        )}
                                    >
                                        {c.hint}
                                    </div>
                                ) : null}
                            </div>
                            <div>
                                <Chip tone={s.tone}>{s.label}</Chip>
                                <div className="mt-1 text-[11.5px] text-[var(--ink-soft)]">{c.start}</div>
                            </div>
                            <div className="truncate text-[12.5px] text-[var(--ink-500)]">{c.tpl}</div>
                            <div className="text-right text-[13px] font-medium tabular-nums text-[var(--ink-900)]">
                                {c.audience}
                            </div>
                            <div className="text-right text-[13px] tabular-nums text-[var(--ink-500)]">
                                {c.delivered}
                            </div>
                            <div className="text-right text-[13px] tabular-nums text-[var(--ink-900)]">
                                {c.read}
                            </div>
                            <div className="text-right font-mono text-[12px] tabular-nums text-[var(--ink-500)]">
                                {c.cost}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
