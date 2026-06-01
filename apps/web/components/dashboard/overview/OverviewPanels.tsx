import Link from "next/link"
import { ArrowUpRight, MessageCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { Chip } from "../primitives/Chip"
import { StatusDot } from "../primitives/StatusDot"
import { Metric } from "../primitives/Metric"
import { UsageCard, type UsageCardTone } from "../primitives/UsageCard"

// ── shared types ──────────────────────────────────────────────────────────

export type PresenceStatus = "online" | "busy" | "away" | "offline"

export interface OverviewKpi {
    eyebrow: string
    value: string
    trend?: string
    trendDirection?: "up" | "down" | "neutral"
}

export interface AttentionItem {
    key: string
    label: string
    value: number
    tone: "accent" | "warn" | "danger" | "neutral"
    hint?: string
    cta?: string
    href?: string
}

export interface TeamMemberPresence {
    id: string
    name: string
    initials: string
    color?: AvatarColor
    status: PresenceStatus
    role?: string
    openCount: number
}

export interface RecentConversation {
    id: string
    name: string
    initials: string
    color?: AvatarColor
    preview: string
    time: string
    unread?: boolean
    href?: string
}

export interface ChannelHealth {
    id: string
    name: string
    phone: string
    quality: "GREEN" | "YELLOW" | "RED"
    volume: number
}

export interface UsageItem {
    label: string
    value: string
    total: string
    sub?: string
    tone?: UsageCardTone
}

// ── panel shell ─────────────────────────────────────────────────────────────

export function Panel({
    title,
    action,
    children,
    className,
}: {
    title?: string
    action?: React.ReactNode
    children: React.ReactNode
    className?: string
}) {
    return (
        <section
            className={cn(
                "flex flex-col rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]",
                className,
            )}
        >
            {title || action ? (
                <header className="flex items-center justify-between gap-2 border-b border-[var(--ink-200)] px-4 py-2.5">
                    {title ? (
                        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                            {title}
                        </h2>
                    ) : (
                        <span />
                    )}
                    {action}
                </header>
            ) : null}
            <div className="flex-1 p-4">{children}</div>
        </section>
    )
}

function PanelLink({ href = "#", children }: { href?: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-0.5 text-[11px] font-medium text-[var(--accent)] hover:underline"
        >
            {children}
        </Link>
    )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
    return <p className="py-6 text-center text-[12px] text-[var(--ink-soft)]">{children}</p>
}

// ── KPI row ─────────────────────────────────────────────────────────────────

export function OverviewKpis({ kpis }: { kpis: OverviewKpi[] }) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((k) => (
                <div
                    key={k.eyebrow}
                    className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-4"
                >
                    <Metric {...k} />
                </div>
            ))}
        </div>
    )
}

// ── attention queue (operational cockpit) ────────────────────────────────────

const ATTENTION_ACCENT: Record<AttentionItem["tone"], { bar: string; value: string }> = {
    accent: { bar: "bg-[var(--accent)]", value: "text-[var(--ink-900)]" },
    warn: { bar: "bg-[var(--status-warn)]", value: "text-[var(--status-warn)]" },
    danger: { bar: "bg-[var(--status-danger)]", value: "text-[var(--status-danger)]" },
    neutral: { bar: "bg-[var(--ink-300)]", value: "text-[var(--ink-900)]" },
}

export function AttentionQueue({ items }: { items: AttentionItem[] }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {items.map((it) => {
                const c = ATTENTION_ACCENT[it.tone]
                return (
                    <div
                        key={it.key}
                        className="relative overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-4"
                    >
                        <span className={cn("absolute inset-y-0 left-0 w-1", c.bar)} />
                        <div className="flex items-baseline justify-between">
                            <span className={cn("font-display text-[26px] font-bold tabular-nums", c.value)}>
                                {it.value}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[12.5px] font-medium text-[var(--ink-900)]">{it.label}</p>
                        {it.hint ? (
                            <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]">{it.hint}</p>
                        ) : null}
                        {it.cta ? (
                            <Link
                                href={it.href ?? "#"}
                                className="mt-2 inline-flex items-center gap-0.5 text-[11px] font-medium text-[var(--accent)] hover:underline"
                            >
                                {it.cta} <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

// ── team presence ─────────────────────────────────────────────────────────────

const PRESENCE_LABEL: Record<PresenceStatus, string> = {
    online: "En ligne",
    busy: "Occupé",
    away: "Absent",
    offline: "Hors ligne",
}

export function TeamPresencePanel({ members }: { members: TeamMemberPresence[] }) {
    const online = members.filter((m) => m.status === "online").length
    return (
        <Panel
            title="Équipe en ligne"
            action={
                <span className="font-mono text-[10px] text-[var(--ink-soft)]">
                    {online}/{members.length}
                </span>
            }
        >
            {members.length === 0 ? (
                <EmptyHint>Aucun coéquipier. Invitez votre équipe.</EmptyHint>
            ) : (
                <ul className="space-y-2.5">
                    {members.map((m) => (
                        <li key={m.id} className="flex items-center gap-2.5">
                            <Avatar
                                initials={m.initials}
                                color={m.color}
                                size="md"
                                status={m.status === "offline" ? undefined : m.status}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-[12.5px] font-medium text-[var(--ink-900)]">
                                        {m.name}
                                    </span>
                                    {m.role ? <Chip tone="neutral">{m.role}</Chip> : null}
                                </div>
                                <span className="text-[11px] text-[var(--ink-soft)]">
                                    {PRESENCE_LABEL[m.status]}
                                </span>
                            </div>
                            <span className="font-mono text-[11px] text-[var(--ink-soft)]">
                                {m.openCount} ouv.
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    )
}

// ── recent conversations ──────────────────────────────────────────────────────

export function RecentConversationsPanel({
    items,
    seeAllHref,
}: {
    items: RecentConversation[]
    seeAllHref?: string
}) {
    return (
        <Panel
            title="Conversations récentes"
            action={<PanelLink href={seeAllHref}>Tout voir</PanelLink>}
        >
            {items.length === 0 ? (
                <EmptyHint>Aucune conversation pour l&apos;instant.</EmptyHint>
            ) : (
                <ul className="-mx-1.5">
                    {items.map((c) => (
                        <li key={c.id}>
                            <Link
                                href={c.href ?? "#"}
                                className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[var(--paper-warm)]"
                            >
                                <Avatar initials={c.initials} color={c.color} size="md" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-[12.5px] font-medium text-[var(--ink-900)]">
                                            {c.name}
                                        </span>
                                        <span className="shrink-0 font-mono text-[10px] text-[var(--ink-soft)]">
                                            {c.time}
                                        </span>
                                    </div>
                                    <span className="block truncate text-[11.5px] text-[var(--ink-soft)]">
                                        {c.preview}
                                    </span>
                                </div>
                                {c.unread ? <StatusDot tone="good" size="md" /> : null}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Panel>
    )
}

// ── WhatsApp channel health ───────────────────────────────────────────────────

const QUALITY: Record<ChannelHealth["quality"], { tone: "good" | "warn" | "danger"; label: string }> = {
    GREEN: { tone: "good", label: "Green" },
    YELLOW: { tone: "warn", label: "Yellow" },
    RED: { tone: "danger", label: "Red" },
}

export function ChannelHealthPanel({
    channels,
    manageHref,
}: {
    channels: ChannelHealth[]
    manageHref?: string
}) {
    return (
        <Panel
            title="Santé des canaux WhatsApp"
            action={<PanelLink href={manageHref}>Gérer</PanelLink>}
        >
            {channels.length === 0 ? (
                <EmptyHint>Aucun numéro connecté. Connectez WhatsApp Business.</EmptyHint>
            ) : (
                <ul className="space-y-2.5">
                    {channels.map((ch) => {
                        const q = QUALITY[ch.quality]
                        return (
                            <li key={ch.id} className="flex items-center gap-2.5">
                                <span
                                    className={cn(
                                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                        q.tone === "good" && "bg-[var(--status-good-soft)] text-[var(--status-good)]",
                                        q.tone === "warn" && "bg-[var(--status-warn-soft)] text-[var(--status-warn)]",
                                        q.tone === "danger" && "bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
                                    )}
                                >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <span className="block truncate text-[12.5px] font-medium text-[var(--ink-900)]">
                                        {ch.name}
                                    </span>
                                    <span className="font-mono text-[11px] text-[var(--ink-soft)]">{ch.phone}</span>
                                </div>
                                <Chip tone={q.tone}>{q.label}</Chip>
                                <span className="w-10 text-right font-mono text-[11px] text-[var(--ink-soft)]">
                                    {ch.volume}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}
        </Panel>
    )
}

// ── plan usage strip ──────────────────────────────────────────────────────────

export function UsageStrip({ items }: { items: UsageItem[] }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {items.map((u) => (
                <UsageCard key={u.label} {...u} />
            ))}
        </div>
    )
}
