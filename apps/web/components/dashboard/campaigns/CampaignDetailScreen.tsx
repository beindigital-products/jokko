"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "../primitives/Icon"
import {
    WaChatFrame,
    WhatsAppBubble,
    highlightBody,
    type WaButton,
    type WaMedia,
} from "../primitives/WhatsAppBubble"

// ── Types ───────────────────────────────────────────────────────────────────────

export type CampaignDetailStatus =
    | "draft"
    | "scheduled"
    | "sending"
    | "paused"
    | "completed"
    | "cancelled"

type Tone = "mute" | "accent" | "good" | "warn" | "hot"

export type CampaignAction =
    | "edit"
    | "delete"
    | "cancel"
    | "reschedule"
    | "sendnow"
    | "pause"
    | "resume"
    | "compare"
    | "duplicate"
    | "retry"

export interface CampaignTimelineEvent {
    label: string
    time: string
    tone: Tone
}

export interface CampaignExclusion {
    label: string
    n: number
}

export interface CampaignDetailData {
    name: string
    status: CampaignDetailStatus
    statusLabel: string
    tpl: string
    sender: string
    audienceLabel: string
    startLabel: string
    eligible: number
    sent: number
    delivered: number
    read: number
    failed: number
    replies: number
    cost: string
    costNote: string
    progress?: { done: number; total: number; etaLabel: string; paused: boolean }
    countdown?: { etaLabel: string }
    // template preview
    header: "none" | "text" | "image" | "doc" | "video"
    headerText?: string
    body: string
    sample: string
    footer?: string
    buttons: string[]
    // audience
    segment: string
    segCount: number
    excl: CampaignExclusion[]
    timeline: CampaignTimelineEvent[]
    senderQuality?: string
}

interface CampaignDetailScreenProps {
    data: CampaignDetailData
    role?: "OWNER" | "ADMIN" | "AGENT"
    onBack?: () => void
    onAction?: (action: CampaignAction) => void
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

const nf = (n: number) => n.toLocaleString("fr-FR")
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)

const TONE_FG: Record<Tone, string> = {
    mute: "var(--ink-soft)",
    accent: "var(--accent)",
    good: "var(--status-good)",
    warn: "var(--status-warn)",
    hot: "var(--status-danger)",
}

const STATUS_TONE: Record<CampaignDetailStatus, Tone | "outline"> = {
    draft: "outline",
    scheduled: "outline",
    sending: "accent",
    paused: "warn",
    completed: "good",
    cancelled: "hot",
}

const READ_FILL = "#2B0F8F" // darkest accent step for the "read" funnel/segment

function StatusPill({ status, label }: { status: CampaignDetailStatus; label: string }) {
    const tone = STATUS_TONE[status]
    const sq = status === "draft" || status === "cancelled"
    if (tone === "outline") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-700)]">
                {!sq ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-400)]" /> : null}
                {label}
            </span>
        )
    }
    const fg = TONE_FG[tone]
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ color: fg, background: `color-mix(in srgb, ${fg} 12%, white)` }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: fg }} />
            {label}
        </span>
    )
}

// ── Sections ────────────────────────────────────────────────────────────────────

function CdCard({
    eyebrow,
    title,
    right,
    children,
}: {
    eyebrow?: string
    title?: ReactNode
    right?: ReactNode
    children: ReactNode
}) {
    return (
        <div className="rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-5 pb-5 pt-[18px]">
            <div className="mb-4 flex items-baseline justify-between gap-3">
                <div>
                    {eyebrow ? (
                        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                            {eyebrow}
                        </div>
                    ) : null}
                    {title ? (
                        <div className={cn("text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink-900)]", eyebrow && "mt-1")}>
                            {title}
                        </div>
                    ) : null}
                </div>
                {right}
            </div>
            {children}
        </div>
    )
}

/** Delivery funnel — narrowing bars relative to the eligible audience. */
function CdFunnel({ data }: { data: CampaignDetailData }) {
    const base = data.eligible || 1
    const rows = [
        { k: "Éligibles", v: data.eligible, fill: "var(--ink-100)", ink: "var(--ink-700)" as string, rate: null as number | null },
        { k: "Envoyés", v: data.sent, fill: "var(--accent-muted)", ink: "var(--accent)", rate: null },
        { k: "Livrés", v: data.delivered, fill: "var(--accent)", ink: "#fff", rate: pct(data.delivered, data.sent) },
        { k: "Lus", v: data.read, fill: READ_FILL, ink: "#fff", rate: pct(data.read, data.delivered) },
    ]
    return (
        <div className="flex flex-col gap-3">
            {rows.map((r) => {
                const w = Math.max(data.sent ? (r.v / base) * 100 : r.k === "Éligibles" ? 100 : 0, r.v ? 7 : 0)
                return (
                    <div key={r.k} className="flex items-center gap-3.5">
                        <div className="w-[86px] shrink-0 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">
                            {r.k}
                        </div>
                        <div className="relative h-[30px] flex-1 overflow-hidden rounded-[7px] bg-[var(--paper-warm)]">
                            <div
                                className="flex h-full items-center rounded-[7px] pl-3 transition-[width] duration-300"
                                style={{ width: `${w}%`, minWidth: r.v ? 56 : 0, background: r.fill }}
                            >
                                <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: r.ink }}>
                                    {nf(r.v)}
                                </span>
                            </div>
                        </div>
                        <div className="w-16 shrink-0 text-right font-mono text-[12px] tabular-nums text-[var(--ink-500)]">
                            {r.rate != null ? `${r.rate}%` : ""}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/** Status distribution — one segmented bar of what was sent. */
function CdDistribution({ data }: { data: CampaignDetailData }) {
    const inTransit = Math.max(data.sent - data.delivered - data.failed, 0)
    const deliveredUnread = Math.max(data.delivered - data.read, 0)
    const segs = [
        { k: "Lus", v: data.read, col: READ_FILL, dark: false },
        { k: "Livrés non lus", v: deliveredUnread, col: "var(--accent)", dark: false },
        { k: "En transit", v: inTransit, col: "var(--accent-muted)", dark: true },
        { k: "Échecs", v: data.failed, col: "var(--status-danger)", dark: false },
    ].filter((s) => s.v > 0)
    const total = segs.reduce((a, s) => a + s.v, 0) || 1
    return (
        <div className="flex flex-col gap-3">
            <div className="flex h-3.5 overflow-hidden rounded-full bg-[var(--paper-warm)]">
                {segs.map((s) => (
                    <div key={s.k} style={{ width: `${(s.v / total) * 100}%`, background: s.col }} />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
                {segs.map((s) => (
                    <div key={s.k} className="flex items-center gap-1.5">
                        <span
                            className="h-[9px] w-[9px] rounded-[3px]"
                            style={{ background: s.col, boxShadow: s.dark ? "inset 0 0 0 1px rgba(10,10,10,0.12)" : "none" }}
                        />
                        <span className="text-[12px] text-[var(--ink-500)]">{s.k}</span>
                        <span className="font-mono text-[12px] font-semibold tabular-nums text-[var(--ink-900)]">{nf(s.v)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function headerToMedia(data: CampaignDetailData): WaMedia | null {
    switch (data.header) {
        case "image":
            return { kind: "image" }
        case "video":
            return { kind: "video", duration: "0:20" }
        case "doc":
            return { kind: "document", filename: `${data.headerText || "document"}.pdf`, pages: 2, size: "240 ko" }
        default:
            return null
    }
}

function ActionGhost({
    icon,
    children,
    onClick,
    danger,
}: {
    icon: IconName
    children: ReactNode
    onClick: () => void
    danger?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-medium transition",
                danger
                    ? "border-[var(--status-danger)]/28 text-[var(--status-danger)] hover:bg-[var(--status-danger-soft)]"
                    : "border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
            )}
        >
            <Icon name={icon} size={14} />
            {children}
        </button>
    )
}

function ActionPrimary({ icon, children, onClick }: { icon: IconName; children: ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white transition hover:bg-[var(--ink-700)]"
        >
            <Icon name={icon} size={14} color="#fff" />
            {children}
        </button>
    )
}

/** Header actions, by status — hidden (read-only pill) for AGENT. */
function CdActions({
    data,
    role,
    onAction,
}: {
    data: CampaignDetailData
    role: "OWNER" | "ADMIN" | "AGENT"
    onAction?: (a: CampaignAction) => void
}) {
    if (role === "AGENT") {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[12px] text-[var(--ink-500)]">
                <Icon name="eye" size={12} />
                Lecture seule
            </span>
        )
    }
    switch (data.status) {
        case "draft":
            return (
                <>
                    <ActionGhost icon="trash" danger onClick={() => onAction?.("delete")}>Supprimer</ActionGhost>
                    <ActionPrimary icon="edit" onClick={() => onAction?.("edit")}>Reprendre la configuration</ActionPrimary>
                </>
            )
        case "scheduled":
            return (
                <>
                    <ActionGhost icon="close" danger onClick={() => onAction?.("cancel")}>Annuler</ActionGhost>
                    <ActionGhost icon="clock" onClick={() => onAction?.("reschedule")}>Modifier la planification</ActionGhost>
                    <ActionPrimary icon="send" onClick={() => onAction?.("sendnow")}>Envoyer maintenant</ActionPrimary>
                </>
            )
        case "sending":
            return (
                <>
                    <ActionGhost icon="close" danger onClick={() => onAction?.("cancel")}>Annuler</ActionGhost>
                    <ActionPrimary icon="pause" onClick={() => onAction?.("pause")}>Mettre en pause</ActionPrimary>
                </>
            )
        case "paused":
            return (
                <>
                    <ActionGhost icon="close" danger onClick={() => onAction?.("cancel")}>Annuler</ActionGhost>
                    <ActionPrimary icon="play" onClick={() => onAction?.("resume")}>Reprendre</ActionPrimary>
                </>
            )
        case "completed":
            return (
                <>
                    <ActionGhost icon="switch" onClick={() => onAction?.("compare")}>Comparer</ActionGhost>
                    <ActionGhost icon="archive" onClick={() => onAction?.("duplicate")}>Dupliquer</ActionGhost>
                    {data.failed > 0 ? (
                        <ActionPrimary icon="rotate" onClick={() => onAction?.("retry")}>Relancer les échecs</ActionPrimary>
                    ) : null}
                </>
            )
        case "cancelled":
            return <ActionGhost icon="archive" onClick={() => onAction?.("duplicate")}>Dupliquer</ActionGhost>
        default:
            return null
    }
}

// ── Screen ──────────────────────────────────────────────────────────────────────

/**
 * CampaignDetailScreen — v3 full-screen campaign detail, recreated from the
 * design handoff `screen-campaign-detail.jsx`. Status-driven header + actions
 * (AGENT read-only), a KPI band, a progress/countdown strip, a delivery funnel
 * + status distribution, an activity timeline, and the template preview /
 * audience / sender rail. Presentational — Convex wiring lives in the route.
 */
export function CampaignDetailScreen({ data, role = "OWNER", onBack, onAction }: CampaignDetailScreenProps) {
    const hasSend = data.sent > 0
    const isDraft = data.status === "draft"
    const prog = data.progress

    const metrics = [
        { k: "Audience éligible", v: data.eligible ? nf(data.eligible) : "—", d: "contacts ciblés" },
        { k: "Envoyés", v: hasSend ? nf(data.sent) : "—", d: hasSend ? `${pct(data.sent, data.eligible)}% de l’audience` : "pas encore" },
        { k: "Livrés", v: hasSend ? nf(data.delivered) : "—", d: hasSend ? `${pct(data.delivered, data.sent)}% livraison` : "—" },
        { k: "Lus", v: hasSend ? nf(data.read) : "—", d: hasSend ? `${pct(data.read, data.delivered)}% lecture` : "—" },
        { k: "Échecs", v: hasSend ? nf(data.failed) : "—", d: hasSend ? `${pct(data.failed, data.sent)}% taux d’échec` : "—", hot: data.failed > 0 },
        { k: "Coût Meta", v: data.cost, d: data.costNote },
    ]
    const waButtons: WaButton[] = data.buttons.filter((b) => b.trim()).map((label) => ({ label }))

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-[var(--ink-200)] px-7 pb-5 pt-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11.5px] tracking-[0.04em] text-[var(--ink-500)] transition hover:text-[var(--ink-900)]"
                        >
                            <Icon name="arrow-left" size={13} />
                            Campagnes
                        </button>
                        <span className="h-3 w-px shrink-0 bg-[var(--ink-200)]" />
                        <StatusPill status={data.status} label={data.statusLabel} />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <CdActions data={data} role={role} onAction={onAction} />
                    </div>
                </div>
                <div className="min-w-0">
                    <h1 className="font-editorial text-[30px] leading-[1.08] tracking-[-0.01em] text-[var(--ink-900)]">{data.name}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] text-[var(--ink-500)]">
                        {(
                            [
                                { i: "doc", t: data.tpl },
                                { i: "whatsapp", t: data.sender },
                                { i: "users", t: data.audienceLabel },
                                { i: "clock", t: data.startLabel },
                            ] as { i: IconName; t: string }[]
                        ).map((m, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5">
                                {i > 0 ? <span className="text-[var(--ink-300)]">·</span> : null}
                                <Icon name={m.i} size={12} color="var(--ink-soft)" />
                                {m.t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI band */}
            <div className="grid grid-cols-2 gap-5 border-b border-[var(--ink-200)] px-7 py-5 sm:grid-cols-3 lg:grid-cols-6">
                {metrics.map((m) => (
                    <div key={m.k}>
                        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">{m.k}</div>
                        <div
                            className="mt-2 whitespace-nowrap font-editorial text-[28px] leading-none tracking-[-0.01em]"
                            style={{ color: m.hot ? "var(--status-danger)" : "var(--ink-900)" }}
                        >
                            {m.v}
                        </div>
                        <div className="mt-1.5 truncate font-mono text-[11px] text-[var(--ink-500)]">{m.d}</div>
                    </div>
                ))}
            </div>

            {/* Progress / countdown */}
            {prog || data.countdown ? (
                <div className="flex items-center gap-4 border-b border-[var(--ink-200)] px-7 py-4">
                    <StatusPill
                        status={prog ? (prog.paused ? "paused" : "sending") : "scheduled"}
                        label={prog ? (prog.paused ? "En pause" : "Envoi en cours") : "Planifiée"}
                    />
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--ink-100)]">
                        <div
                            className="h-full rounded-full transition-[width] duration-300"
                            style={{
                                width: `${prog ? (prog.done / prog.total) * 100 : 0}%`,
                                background: prog && prog.paused ? "var(--status-warn)" : "var(--accent)",
                            }}
                        />
                    </div>
                    <div className="shrink-0 font-mono text-[12px] text-[var(--ink-700)]">
                        {prog ? (
                            <>
                                {nf(prog.done)} / {nf(prog.total)} · <span className="text-[var(--ink-500)]">{prog.etaLabel}</span>
                            </>
                        ) : (
                            <span className="text-[var(--accent)]">{data.countdown!.etaLabel}</span>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-7 pb-10 pt-[22px]">
                <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1.55fr_1fr]">
                    {/* Left */}
                    <div className="flex min-w-0 flex-col gap-[22px]">
                        {hasSend ? (
                            <CdCard
                                eyebrow="Livraison"
                                title="Entonnoir d’envoi"
                                right={
                                    data.replies > 0 ? (
                                        <span className="rounded-full bg-[var(--status-good-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--status-good)]">
                                            {nf(data.replies)} réponses
                                        </span>
                                    ) : null
                                }
                            >
                                <CdFunnel data={data} />
                                <div className="my-4 h-px bg-[var(--ink-100)]" />
                                <div className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                                    Répartition des statuts
                                </div>
                                <CdDistribution data={data} />
                            </CdCard>
                        ) : (
                            <CdCard eyebrow="Livraison" title="Pas encore d’envoi">
                                <div className="flex items-center gap-3 py-1 text-[13px] text-[var(--ink-500)]">
                                    <Icon name={isDraft ? "edit" : data.status === "cancelled" ? "close" : "clock"} size={18} color="var(--ink-soft)" />
                                    {isDraft
                                        ? "Configuration à terminer avant de pouvoir diffuser."
                                        : data.status === "cancelled"
                                          ? "Campagne annulée avant tout envoi — aucune conversation facturée."
                                          : "Les métriques de livraison apparaîtront au démarrage de l’envoi."}
                                </div>
                            </CdCard>
                        )}

                        <CdCard eyebrow="Activité" title="Chronologie">
                            <div className="flex flex-col">
                                {data.timeline.map((e, i) => (
                                    <div key={i} className="flex gap-3.5" style={{ paddingBottom: i < data.timeline.length - 1 ? 18 : 0 }}>
                                        <div className="flex shrink-0 flex-col items-center">
                                            <span
                                                className="mt-0.5 h-[11px] w-[11px] rounded-full"
                                                style={{ background: TONE_FG[e.tone], boxShadow: "0 0 0 3px var(--paper-white)" }}
                                            />
                                            {i < data.timeline.length - 1 ? <span className="mt-0.5 w-px flex-1 bg-[var(--ink-200)]" /> : null}
                                        </div>
                                        <div className="-mt-px min-w-0 flex-1">
                                            <div
                                                className="text-[13.5px] font-medium tracking-[-0.005em]"
                                                style={{ color: e.tone === "hot" ? "var(--status-danger)" : "var(--ink-900)" }}
                                            >
                                                {e.label}
                                            </div>
                                            <div className="mt-0.5 font-mono text-[11px] text-[var(--ink-soft)]">{e.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CdCard>
                    </div>

                    {/* Right */}
                    <div className="flex min-w-0 flex-col gap-[22px]">
                        <CdCard
                            eyebrow="Modèle"
                            title={data.tpl}
                            right={
                                <span className="rounded-md bg-[var(--status-good-soft)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--status-good)]">
                                    Approuvé Meta
                                </span>
                            }
                        >
                            <WaChatFrame>
                                <WhatsAppBubble
                                    media={headerToMedia(data)}
                                    body={
                                        <>
                                            {data.header === "text" && data.headerText ? (
                                                <div className="mb-1 font-semibold text-[var(--ink-900)]">{data.headerText}</div>
                                            ) : null}
                                            {highlightBody(data.body, () => data.sample)}
                                        </>
                                    }
                                    footer={data.footer || undefined}
                                    buttons={waButtons.length ? waButtons : undefined}
                                />
                            </WaChatFrame>
                        </CdCard>

                        <CdCard eyebrow="Audience" title="Segment & exclusions">
                            <div className="flex items-center justify-between gap-3 border-b border-[var(--ink-100)] pb-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <Icon name="users" size={15} color="var(--accent)" />
                                    <span className="truncate text-[13px] font-medium text-[var(--ink-900)]">{data.segment}</span>
                                </div>
                                <span className="shrink-0 font-mono text-[12.5px] text-[var(--ink-500)]">
                                    {data.segCount ? nf(data.segCount) : "—"}
                                </span>
                            </div>
                            {data.excl.length > 0 ? (
                                <div className="flex flex-col gap-2.5 py-3">
                                    {data.excl.map((x) => (
                                        <div key={x.label} className="flex items-center justify-between gap-3">
                                            <span className="flex items-center gap-2 text-[12.5px] text-[var(--ink-500)]">
                                                <Icon name="minus" size={12} color="var(--status-danger)" />
                                                {x.label}
                                            </span>
                                            <span className="font-mono text-[12px] text-[var(--ink-soft)]">−{nf(x.n)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-3 text-[12.5px] text-[var(--ink-soft)]">Aucune exclusion — audience à définir.</div>
                            )}
                            <div className="flex items-center justify-between gap-3 border-t border-[var(--ink-100)] pt-3">
                                <span className="text-[12.5px] font-semibold text-[var(--ink-900)]">Éligibles après filtres</span>
                                <span className="font-mono text-[13px] font-semibold text-[var(--accent)]">
                                    {data.eligible ? nf(data.eligible) : "—"}
                                </span>
                            </div>
                        </CdCard>

                        <CdCard eyebrow="Émetteur" title="Numéro WhatsApp">
                            <div className="flex items-center gap-3">
                                <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-[var(--paper-warm)]">
                                    <Icon name="whatsapp" size={16} color="#25D366" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-mono text-[13px] font-medium text-[var(--ink-900)]">{data.sender}</div>
                                    <div className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">
                                        {data.senderQuality || "Qualité élevée · limite 10k / jour"}
                                    </div>
                                </div>
                            </div>
                        </CdCard>
                    </div>
                </div>
            </div>
        </div>
    )
}
