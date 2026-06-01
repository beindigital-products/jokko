import Link from "next/link"
import { Check, ChevronRight, Zap } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar } from "../primitives/Avatar"
import { Chip } from "../primitives/Chip"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"

// ── shared types ──────────────────────────────────────────────────────────

export type DeltaTone = "good" | "warn" | "mute"

export interface OverviewKpi {
    label: string
    value: string
    delta?: string
    deltaTone?: DeltaTone
    sub: string
}

export type AttentionState = "unassigned" | "stale" | "breach"
export interface AttentionRow {
    id: string
    who: string
    last: string
    channel: string
    tags: string[]
    wait: string
    state: AttentionState
}

export type AgentState = "typing" | "online" | "busy" | "away"
export interface TeamActivityRow {
    id: string
    name: string
    busy: string
    state: AgentState
    pole: string
    load: number
}

export type CampaignStatus = "sending" | "completed" | "paused"
export interface CampaignRow {
    id: string
    name: string
    delivered: string
    read: string
    deliveredPct: number
    status: CampaignStatus
}

export interface FlowRow {
    id: string
    name: string
    runs: number
    period: string
}

export interface OnboardingStep {
    label: string
    done: boolean
}

// ── shared bits ─────────────────────────────────────────────────────────────

const DELTA_COLOR: Record<DeltaTone, string> = {
    good: "text-[var(--status-good)]",
    warn: "text-[var(--status-warn)]",
    mute: "text-[var(--ink-soft)]",
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]",
                className,
            )}
        >
            {children}
        </div>
    )
}

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]",
                className,
            )}
        >
            {children}
        </div>
    )
}

/** Display sub-title used inside cards (editorial, italic per the design). */
function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "font-editorial text-[20px] leading-tight tracking-tight text-[var(--ink-900)]",
                className,
            )}
        >
            {children}
        </div>
    )
}

function MiniBtn({
    children,
    tone = "ghost",
    href,
}: {
    children: React.ReactNode
    tone?: "ghost" | "primary"
    href?: string
}) {
    const cls = cn(
        "inline-flex h-[26px] items-center rounded-md px-2.5 text-[12px] font-medium transition-colors",
        tone === "primary"
            ? "bg-[var(--ink-900)] text-white hover:brightness-95"
            : "border border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
    )
    return href ? (
        <Link href={href} className={cls}>
            {children}
        </Link>
    ) : (
        <button type="button" className={cls}>
            {children}
        </button>
    )
}

// ── 1 · KPI row (5 metrics) ───────────────────────────────────────────────────

export function OverviewKpis({ kpis }: { kpis: OverviewKpi[] }) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k) => (
                <Card key={k.label} className="px-4 py-3.5">
                    <Eyebrow className="text-[9.5px]">{k.label}</Eyebrow>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-[30px] font-bold leading-none tabular-nums tracking-tight text-[var(--ink-900)]">
                            {k.value}
                        </span>
                        {k.delta ? (
                            <span
                                className={cn(
                                    "font-mono text-[11px] font-semibold tabular-nums",
                                    DELTA_COLOR[k.deltaTone ?? "good"],
                                )}
                            >
                                {k.delta}
                            </span>
                        ) : null}
                    </div>
                    <div className="mt-1.5 truncate text-[11px] text-[var(--ink-soft)]">{k.sub}</div>
                </Card>
            ))}
        </div>
    )
}

// ── 2 · Attention list (the operational triage table) ─────────────────────────

const WAIT_COLOR: Record<AttentionState, string> = {
    unassigned: "text-[var(--ink-500)]",
    stale: "text-[var(--status-warn)]",
    breach: "text-[var(--status-danger)]",
}
const WAIT_PREFIX: Record<AttentionState, string> = {
    unassigned: "Sans assigné · ",
    stale: "En attente · ",
    breach: "SLA dépassé · ",
}

export function AttentionCard({
    title,
    slaLabel,
    rows,
    seeAllHref,
}: {
    title: string
    slaLabel?: string
    rows: AttentionRow[]
    seeAllHref?: string
}) {
    return (
        <Card>
            <div className="flex items-center gap-3 border-b border-[var(--ink-200)] px-[18px] py-3.5">
                <div className="min-w-0 flex-1">
                    <Eyebrow>Demande votre attention</Eyebrow>
                    <CardTitle className="mt-1">{title}</CardTitle>
                </div>
                {slaLabel ? <Chip tone="warn">{slaLabel}</Chip> : null}
                <MiniBtn href={seeAllHref}>Voir tout</MiniBtn>
            </div>
            {rows.length === 0 ? (
                <p className="px-[18px] py-8 text-center text-[12.5px] text-[var(--ink-soft)]">
                    Rien à traiter. Tout est à jour 🎉
                </p>
            ) : (
                <div>
                    {rows.map((c, i) => (
                        <div
                            key={c.id}
                            className={cn(
                                "grid items-center gap-3 px-[18px] py-3",
                                i < rows.length - 1 && "border-b border-[var(--ink-100)]",
                            )}
                            style={{ gridTemplateColumns: "32px 1.4fr 1fr 1fr auto" }}
                        >
                            <Avatar
                                initials={initialsFromName(c.who)}
                                color={avatarColorFromString(c.who)}
                                size="md"
                            />
                            <div className="min-w-0">
                                <div className="truncate text-[13px] font-medium tracking-tight text-[var(--ink-900)]">
                                    {c.who}
                                </div>
                                <div className="truncate text-[12px] text-[var(--ink-soft)]">{c.last}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Chip tone="neutral">{c.channel}</Chip>
                                {c.tags.map((t) => (
                                    <Chip key={t} tone="neutral">
                                        {t}
                                    </Chip>
                                ))}
                            </div>
                            <div
                                className={cn(
                                    "font-mono text-[11.5px] tabular-nums",
                                    WAIT_COLOR[c.state],
                                )}
                            >
                                {WAIT_PREFIX[c.state]}
                                {c.wait}
                            </div>
                            <div className="flex gap-1">
                                <MiniBtn>Assigner</MiniBtn>
                                <MiniBtn tone="primary">Ouvrir</MiniBtn>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}

// ── 3 · Team activity ─────────────────────────────────────────────────────────

const AGENT_STATUS = (a: TeamActivityRow): "online" | "busy" | "away" | undefined => {
    if (a.state === "online" || a.state === "typing") return "online"
    if (a.state === "busy") return "busy"
    if (a.state === "away") return "away"
    return undefined
}

export function TeamActivityCard({ rows }: { rows: TeamActivityRow[] }) {
    return (
        <Card>
            <div className="border-b border-[var(--ink-200)] px-[18px] py-3.5">
                <Eyebrow>Équipe en activité</Eyebrow>
                <CardTitle className="mt-1">Qui prend la main</CardTitle>
            </div>
            {rows.length === 0 ? (
                <p className="px-[18px] py-8 text-center text-[12.5px] text-[var(--ink-soft)]">
                    Aucun coéquipier en ligne.
                </p>
            ) : (
                <div>
                    {rows.map((a, i) => (
                        <div
                            key={a.id}
                            className={cn(
                                "flex items-center gap-3 px-[18px] py-2.5",
                                i < rows.length - 1 && "border-b border-[var(--ink-100)]",
                            )}
                        >
                            <Avatar
                                initials={initialsFromName(a.name)}
                                color={avatarColorFromString(a.name)}
                                size="sm"
                                status={AGENT_STATUS(a)}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] font-medium tracking-tight text-[var(--ink-900)]">
                                    {a.name}
                                </div>
                                <div
                                    className={cn(
                                        "truncate text-[11.5px]",
                                        a.state === "typing" ? "text-[var(--accent)]" : "text-[var(--ink-soft)]",
                                    )}
                                >
                                    {a.state === "typing" ? (
                                        <span className="font-mono">écrit · </span>
                                    ) : null}
                                    {a.busy !== "—"
                                        ? a.busy
                                        : a.state === "away"
                                          ? "absent"
                                          : "disponible"}
                                </div>
                            </div>
                            <Chip tone="neutral">{a.pole}</Chip>
                            <span className="w-7 text-right font-mono text-[11px] tabular-nums text-[var(--ink-500)]">
                                {a.load}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}

// ── 4 · Recent campaigns ──────────────────────────────────────────────────────

const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; mark: string; color: string }> = {
    sending: { label: "en cours", mark: "●", color: "text-[var(--accent)]" },
    completed: { label: "terminée", mark: "✓", color: "text-[var(--status-good)]" },
    paused: { label: "pause", mark: "‖", color: "text-[var(--status-warn)]" },
}

export function CampaignsCard({ rows, total }: { rows: CampaignRow[]; total?: string }) {
    return (
        <Card className="px-[18px] py-4">
            <div className="flex items-baseline justify-between">
                <Eyebrow>Campagnes récentes</Eyebrow>
                {total ? (
                    <span className="font-mono text-[10.5px] text-[var(--ink-soft)]">{total}</span>
                ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-3">
                {rows.map((c) => {
                    const s = CAMPAIGN_STATUS[c.status]
                    return (
                        <div key={c.id}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-2">
                                <span className="truncate text-[12.5px] font-medium tracking-tight text-[var(--ink-900)]">
                                    {c.name}
                                </span>
                                <span className={cn("shrink-0 font-mono text-[10.5px]", s.color)}>
                                    {s.mark} {s.label}
                                </span>
                            </div>
                            <div className="h-[3px] overflow-hidden rounded-full bg-[var(--ink-100)]">
                                <div
                                    className={cn(
                                        "h-full rounded-full",
                                        c.status === "paused"
                                            ? "bg-[var(--status-warn)]"
                                            : "bg-[var(--accent)]",
                                    )}
                                    style={{ width: `${c.deliveredPct}%` }}
                                />
                            </div>
                            <div className="mt-1.5 font-mono text-[11px] text-[var(--ink-soft)]">
                                {c.delivered} livrés · {c.read} lus
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}

// ── 5 · Active flows ──────────────────────────────────────────────────────────

export function FlowsCard({
    items,
    activeLabel,
    total24h,
}: {
    items: FlowRow[]
    activeLabel?: string
    total24h?: string
}) {
    return (
        <Card className="px-[18px] py-4">
            <div className="flex items-baseline justify-between">
                <Eyebrow>Flows actifs</Eyebrow>
                {activeLabel ? (
                    <span className="font-mono text-[10.5px] text-[var(--ink-soft)]">{activeLabel}</span>
                ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
                {items.map((f) => (
                    <div key={f.id} className="flex items-center gap-2.5">
                        <Zap className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                        <span className="flex-1 truncate text-[12.5px] font-medium tracking-tight text-[var(--ink-900)]">
                            {f.name}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-500)]">
                            {f.runs}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--ink-soft)]">/{f.period}</span>
                    </div>
                ))}
            </div>
            {total24h ? (
                <div className="mt-3.5 flex justify-between border-t border-[var(--ink-100)] pt-3 text-[11px] text-[var(--ink-500)]">
                    <span>Total 24h</span>
                    <span className="font-mono font-semibold text-[var(--ink-900)]">{total24h}</span>
                </div>
            ) : null}
        </Card>
    )
}

// ── 6 · Onboarding checklist ──────────────────────────────────────────────────

export function OnboardingCard({
    steps,
    progressLabel,
    headline,
}: {
    steps: OnboardingStep[]
    progressLabel?: string
    headline?: string
}) {
    return (
        <Card className="bg-gradient-to-b from-[var(--accent)]/[0.04] to-transparent px-[18px] py-4">
            <div className="flex items-baseline justify-between">
                <Eyebrow>Mise en route</Eyebrow>
                {progressLabel ? (
                    <span className="font-mono text-[10.5px] font-semibold text-[var(--accent)]">
                        {progressLabel}
                    </span>
                ) : null}
            </div>
            {headline ? <CardTitle className="mt-1 text-[18px]">{headline}</CardTitle> : null}
            <div className="mt-3.5 flex flex-col gap-2">
                {steps.map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                        <span
                            className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                                s.done
                                    ? "border-[var(--status-good)] bg-[var(--status-good)]"
                                    : "border-[var(--ink-300)] bg-transparent",
                            )}
                        >
                            {s.done ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
                        </span>
                        <span
                            className={cn(
                                "flex-1 text-[12.5px] tracking-tight",
                                s.done
                                    ? "text-[var(--ink-soft)] line-through"
                                    : "text-[var(--ink-900)]",
                            )}
                        >
                            {s.label}
                        </span>
                        {!s.done ? <ChevronRight className="h-3.5 w-3.5 text-[var(--accent)]" /> : null}
                    </div>
                ))}
            </div>
        </Card>
    )
}
