"use client"

import { ContactCard } from "./ContactCard"
import type { ContactsTableEntry } from "./ContactsTable"

interface ContactsGridProps {
    entries: ContactsTableEntry[]
    selectedIds?: Set<string>
    onToggleSelect?: (id: string, selected: boolean) => void
    onCardClick?: (id: string) => void
    onCardMore?: (id: string) => void
}

/**
 * ContactsGrid — card-disposition view of the contacts list. Same data shape
 * as {@link ContactsTable} ({@link ContactsTableEntry}), rendered as a
 * responsive grid of {@link ContactCard} tiles.
 */
export function ContactsGrid({
    entries,
    selectedIds,
    onToggleSelect,
    onCardClick,
    onCardMore,
}: ContactsGridProps) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e) => (
                <ContactCard
                    key={e.id}
                    name={e.name}
                    initials={e.initials}
                    color={e.color}
                    phone={e.phone}
                    email={e.email}
                    tags={e.tags}
                    lastExchange={e.lastExchange}
                    selected={selectedIds?.has(e.id)}
                    onToggleSelect={(sel) => onToggleSelect?.(e.id, sel)}
                    onCardClick={() => onCardClick?.(e.id)}
                    onMore={() => onCardMore?.(e.id)}
                />
            ))}
        </div>
    )
}
