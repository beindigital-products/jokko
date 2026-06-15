"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckSquare, ExternalLink, Search, Square, UserPlus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar } from "@/components/dashboard/primitives/Avatar"
import { Chip } from "@/components/dashboard/primitives/Chip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"

export interface QueueConversation {
    id: string
    message: string
    time: string
    lastMessageAt: number
    business: string
    phone: string
    priority: string
    assignedTo?: string | null
    assigneeName?: string | null
    departmentId?: string | null
}

export interface QueueAgent {
    id: string
    memberId: string
    fullName: string
    department: string
    online: boolean
    load: number
    maxLoad: number
}

interface AssignmentQueueProps {
    conversations: QueueConversation[]
    agents: QueueAgent[]
    onAssign: (conversationId: string, memberId: string) => void
    onBulkAssign: (conversationIds: string[], memberId: string) => void
    basePath?: string
}

/** Relative wait time + tone, from the last inbound message timestamp. */
function waitLabel(lastMessageAt: number, now: number): { text: string; tone: "good" | "warn" | "danger" } {
    const min = Math.max(0, Math.floor((now - lastMessageAt) / 60000))
    if (min < 5) return { text: `${min} min`, tone: "good" }
    if (min < 30) return { text: `${min} min`, tone: "warn" }
    if (min < 60) return { text: `${min} min`, tone: "danger" }
    const h = Math.floor(min / 60)
    if (h < 24) return { text: `${h} h`, tone: "danger" }
    return { text: `${Math.floor(h / 24)} j`, tone: "danger" }
}

/**
 * AssignmentQueue — the operational core of the Assignations page, restyled to
 * v3 (Cobalt × paper × ink). Two tabs (non assignées / assignées) with search,
 * single + bulk manual assignment via the agent dropdown, and a deep link to
 * the conversation thread. Wired from the page (queries + mutations).
 */
export function AssignmentQueue({
    conversations,
    agents,
    onAssign,
    onBulkAssign,
    basePath = "/dashboard",
}: AssignmentQueueProps) {
    const [search, setSearch] = useState("")
    const [tab, setTab] = useState<"unassigned" | "assigned">("unassigned")
    const [bulkMode, setBulkMode] = useState(false)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const now = Date.now()

    const agentsByDept = useMemo(() => {
        const acc: Record<string, QueueAgent[]> = {}
        for (const a of agents) {
            const dept = a.department || "Général"
            ;(acc[dept] ??= []).push(a)
        }
        return acc
    }, [agents])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return conversations
        return conversations.filter(
            (c) =>
                (c.business || "").toLowerCase().includes(q) ||
                (c.phone || "").toLowerCase().includes(q) ||
                (c.message || "").toLowerCase().includes(q),
        )
    }, [conversations, search])

    const unassigned = filtered.filter((c) => !c.assignedTo)
    const assigned = filtered.filter((c) => c.assignedTo)
    const rows = tab === "unassigned" ? unassigned : assigned

    const toggleSelect = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    const handleBulk = (memberId: string) => {
        if (selected.size === 0) return
        onBulkAssign([...selected], memberId)
        setSelected(new Set())
        setBulkMode(false)
    }

    const AssignMenu = ({
        label,
        align = "end",
        onPick,
    }: {
        label: React.ReactNode
        align?: "end" | "start"
        onPick: (memberId: string) => void
    }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                >
                    <UserPlus className="h-3.5 w-3.5" />
                    {label}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="max-h-[300px] w-[240px] overflow-y-auto">
                {agents.length === 0 ? (
                    <div className="p-2 text-center text-xs text-[var(--ink-soft)]">Aucun agent disponible</div>
                ) : (
                    Object.entries(agentsByDept).map(([dept, list], i) => (
                        <div key={dept}>
                            {i > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                                {dept}
                            </DropdownMenuLabel>
                            {list.map((a) => (
                                <DropdownMenuItem
                                    key={a.id}
                                    onClick={() => onPick(a.memberId)}
                                    className="cursor-pointer"
                                >
                                    <span
                                        className={cn(
                                            "mr-2 h-2 w-2 shrink-0 rounded-full",
                                            a.online ? "bg-[var(--status-good)]" : "bg-[var(--ink-300)]",
                                        )}
                                    />
                                    <span className="flex-1 truncate text-[13px]">{a.fullName}</span>
                                    {a.maxLoad > 0 && a.load >= a.maxLoad && (
                                        <span className="ml-auto text-[10px] font-medium text-[var(--status-danger)]">
                                            Plein
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <div className="overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-[var(--ink-200)] px-[22px] py-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1">
                        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                            File d&apos;attribution
                        </div>
                        <div className="mt-1 font-editorial text-[20px] leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                            Conversations à router vers vos agents
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setBulkMode((v) => !v)
                            setSelected(new Set())
                        }}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
                            bulkMode
                                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                : "border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
                        )}
                    >
                        <CheckSquare className="h-3.5 w-3.5" />
                        Attribution en lot
                    </button>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par nom, téléphone, message…"
                        className="flex-1 bg-transparent text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] focus:outline-none"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch("")} aria-label="Effacer">
                            <X className="h-3.5 w-3.5 text-[var(--ink-400)] hover:text-[var(--ink-700)]" />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-[var(--paper-warm)] p-1">
                    {(
                        [
                            { key: "unassigned" as const, label: "Non assignées", count: unassigned.length },
                            { key: "assigned" as const, label: "Assignées", count: assigned.length },
                        ]
                    ).map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={cn(
                                "flex-1 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                                tab === t.key
                                    ? "bg-[var(--paper-white)] text-[var(--ink-900)] shadow-sm"
                                    : "text-[var(--ink-500)] hover:text-[var(--ink-900)]",
                            )}
                        >
                            {t.label}{" "}
                            <span className="font-mono text-[11px] text-[var(--ink-soft)]">({t.count})</span>
                        </button>
                    ))}
                </div>

                {/* Bulk bar */}
                {bulkMode && selected.size > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-2">
                        <span className="text-[12px] font-medium text-[var(--ink-900)]">
                            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
                        </span>
                        <div className="ml-auto">
                            <AssignMenu label="Assigner à…" onPick={handleBulk} />
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="max-h-[460px] divide-y divide-[var(--ink-100)] overflow-y-auto">
                {rows.length === 0 ? (
                    <div className="px-[22px] py-12 text-center">
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                            File vide
                        </p>
                        <p className="mt-2 text-[13px] text-[var(--ink-500)]">
                            {search
                                ? "Aucun résultat pour cette recherche."
                                : tab === "unassigned"
                                  ? "Aucune conversation en attente d'attribution."
                                  : "Aucune conversation assignée pour le moment."}
                        </p>
                    </div>
                ) : (
                    rows.map((c) => {
                        const wait = !c.assignedTo ? waitLabel(c.lastMessageAt, now) : null
                        return (
                            <div
                                key={c.id}
                                className="flex items-center gap-3 px-[22px] py-3 transition-colors hover:bg-[var(--paper-warm)]"
                            >
                                {bulkMode && (
                                    <button
                                        type="button"
                                        onClick={() => toggleSelect(c.id)}
                                        className="shrink-0"
                                        aria-label={selected.has(c.id) ? "Désélectionner" : "Sélectionner"}
                                    >
                                        {selected.has(c.id) ? (
                                            <CheckSquare className="h-4 w-4 text-[var(--accent)]" />
                                        ) : (
                                            <Square className="h-4 w-4 text-[var(--ink-300)]" />
                                        )}
                                    </button>
                                )}

                                <Avatar
                                    initials={initialsFromName(c.business || c.phone)}
                                    color={avatarColorFromString(c.business || c.phone || "?")}
                                    size="sm"
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink-900)]">
                                            {c.business || c.phone}
                                        </span>
                                        {c.priority === "urgent" && <Chip tone="danger">Urgent</Chip>}
                                        {wait && (
                                            <span
                                                className={cn(
                                                    "shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                                                    wait.tone === "good" && "bg-[var(--status-good)]/12 text-[var(--status-good)]",
                                                    wait.tone === "warn" && "bg-[var(--status-warn)]/12 text-[var(--status-warn)]",
                                                    wait.tone === "danger" && "bg-[var(--status-danger)]/12 text-[var(--status-danger)]",
                                                )}
                                            >
                                                {wait.text}
                                            </span>
                                        )}
                                        <span className="ml-auto shrink-0 font-mono text-[10.5px] text-[var(--ink-soft)]">
                                            {c.time}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-[12px] text-[var(--ink-500)]">{c.message}</p>
                                    {c.assignedTo && c.assigneeName && (
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-good)]" />
                                            <span className="text-[11px] font-medium text-[var(--ink-700)]">
                                                {c.assigneeName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {!bulkMode && (
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <Link
                                            href={`${basePath}/conversations/${c.id}`}
                                            aria-label="Ouvrir la conversation"
                                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-400)] transition-colors hover:bg-[var(--paper-white)] hover:text-[var(--ink-700)]"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Link>
                                        <AssignMenu
                                            label={c.assignedTo ? "Réassigner" : "Assigner"}
                                            onPick={(memberId) => onAssign(c.id, memberId)}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
