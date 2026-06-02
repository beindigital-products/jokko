"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

import { ConversationListItem } from "./ConversationListItem"
import type { ConversationTag } from "./ConversationListItem"
import type { AvatarColor } from "../primitives/Avatar"

export interface ConversationListEntry {
    id: string
    contactName: string
    initials: string
    color?: AvatarColor
    snippet: string
    timestamp: string
    tags?: ConversationTag[]
    unread?: boolean
    unreadCount?: number
}

export interface ConversationListFilter {
    key: string
    label: string
    count?: number | string
}

interface ConversationListProps {
    title?: string
    eyebrow?: string
    filters: ConversationListFilter[]
    activeFilter: string
    onFilterChange?: (key: string) => void
    entries: ConversationListEntry[]
    activeEntryId?: string
    onEntryClick?: (id: string) => void
    onSearch?: (q: string) => void
    /** Override root layout (width, border). Defaults to a fixed 340px
     *  column — consumers in a responsive shell can pass e.g. "w-full". */
    className?: string
    /** Shown below the header while data loads. */
    loading?: boolean
    /** Empty-state message when there are no entries (and not loading). */
    emptyLabel?: string
}

/**
 * ConversationList — full middle column of the inbox view :
 * eyebrow + h1 + search + filter tabs + scrollable list.
 */
export function ConversationList({
    title = "Conversations",
    eyebrow = "Boîte de réception",
    filters,
    activeFilter,
    onFilterChange,
    entries,
    activeEntryId,
    onEntryClick,
    onSearch,
    className,
    loading,
    emptyLabel = "Aucune conversation.",
}: ConversationListProps) {
    return (
        <div
            className={cn(
                "flex h-full w-full flex-col border-r border-[var(--ink-200)] lg:w-[340px] lg:shrink-0",
                className,
            )}
        >
            <div className="border-b border-[var(--ink-200)] px-5 pt-7 pb-3">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                    {eyebrow}
                </p>
                <h1 className="mt-1 font-display text-[24px] font-bold tracking-tight text-[var(--ink-900)]">
                    {title}
                </h1>
                <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                    <input
                        type="search"
                        placeholder="Filtrer par nom, tag, numéro…"
                        onChange={(e) => onSearch?.(e.target.value)}
                        className="flex-1 bg-transparent text-[12px] placeholder:text-[var(--ink-400)] focus:outline-none"
                    />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {filters.map((f) => {
                        const active = f.key === activeFilter
                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => onFilterChange?.(f.key)}
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                                    active
                                        ? "bg-[var(--ink-900)] text-white"
                                        : "bg-[var(--paper-warm)] text-[var(--ink-700)]",
                                )}
                            >
                                {f.label}
                                {f.count != null ? (
                                    <span
                                        className={cn(
                                            "font-mono text-[9px]",
                                            active ? "text-white/70" : "text-[var(--ink-soft)]",
                                        )}
                                    >
                                        {f.count}
                                    </span>
                                ) : null}
                            </button>
                        )
                    })}
                </div>
            </div>
            <ul className="flex-1 divide-y divide-[var(--ink-100)] overflow-y-auto">
                {loading ? (
                    <li className="px-4 py-3">
                        <div className="space-y-3">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[var(--ink-100)]" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--ink-100)]" />
                                        <div className="h-2.5 w-1/2 animate-pulse rounded bg-[var(--ink-100)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </li>
                ) : entries.length === 0 ? (
                    <li className="px-4 py-10 text-center text-[12px] text-[var(--ink-soft)]">
                        {emptyLabel}
                    </li>
                ) : (
                    entries.map((e) => (
                        <ConversationListItem
                            key={e.id}
                            contactName={e.contactName}
                            initials={e.initials}
                            color={e.color}
                            snippet={e.snippet}
                            timestamp={e.timestamp}
                            tags={e.tags}
                            unread={e.unread}
                            unreadCount={e.unreadCount}
                            active={e.id === activeEntryId}
                            onClick={() => onEntryClick?.(e.id)}
                        />
                    ))
                )}
            </ul>
        </div>
    )
}
