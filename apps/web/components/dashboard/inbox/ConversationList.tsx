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
}: ConversationListProps) {
    return (
        <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-[var(--ink-200)]">
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
                {entries.map((e) => (
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
                ))}
            </ul>
        </div>
    )
}
