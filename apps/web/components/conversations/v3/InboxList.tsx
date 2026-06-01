"use client"

import { useMemo } from "react"

import {
    ConversationList,
    type ConversationListEntry,
    type ConversationListFilter,
} from "@/components/dashboard/inbox"
import {
    useConversations,
    type ConversationFilter,
    type ConversationSummary,
} from "@/hooks/useConversations"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import { formatListTime } from "@/lib/dashboard/format-time"

interface InboxListProps {
    selectedId?: string
    onSelect: (id: string) => void
}

const FILTERS: { key: ConversationFilter; label: string }[] = [
    { key: "all", label: "Tout" },
    { key: "unread", label: "Non lu" },
    { key: "unassigned", label: "Non assigné" },
    { key: "mine", label: "Moi" },
    { key: "archived", label: "Archivés" },
]

function toEntry(c: ConversationSummary): ConversationListEntry {
    const name = c.contact.name || c.contact.phone
    const outbound = c.lastMessageDirection === "OUTBOUND"
    const snippet = c.lastMessageText
        ? outbound
            ? `Vous : ${c.lastMessageText}`
            : c.lastMessageText
        : "Pas encore de message"
    return {
        id: c.id,
        contactName: name,
        initials: initialsFromName(c.contact.name, c.contact.phone),
        color: avatarColorFromString(name),
        snippet,
        timestamp: formatListTime(c.lastMessageAt),
        tags: (c.tags ?? []).slice(0, 2).map((t) => ({ label: t.toUpperCase() })),
        unread: c.unreadCount > 0,
        unreadCount: c.unreadCount,
    }
}

/**
 * InboxList — wired container for the conversation list column.
 * Maps `useConversations()` (Convex, realtime) to the presentational
 * `ConversationList`. Server-side filters + search, deterministic avatar
 * colors from the contact name (Q2=a).
 */
export function InboxList({ selectedId, onSelect }: InboxListProps) {
    const {
        conversations,
        filter,
        setFilter,
        setSearch,
        unreadCount,
        isLoading,
    } = useConversations()

    const filters: ConversationListFilter[] = useMemo(
        () =>
            FILTERS.map((f) => ({
                key: f.key,
                label: f.label,
                // Only "Non lu" has a count we can trust without extra queries.
                count: f.key === "unread" ? unreadCount || undefined : undefined,
            })),
        [unreadCount],
    )

    const entries = useMemo(
        () => conversations.map(toEntry),
        [conversations],
    )

    return (
        <ConversationList
            className="w-full"
            filters={filters}
            activeFilter={filter}
            onFilterChange={(key) => setFilter(key as ConversationFilter)}
            entries={entries}
            activeEntryId={selectedId}
            onEntryClick={onSelect}
            onSearch={setSearch}
            loading={isLoading}
            emptyLabel="Aucune conversation dans cette vue."
        />
    )
}
