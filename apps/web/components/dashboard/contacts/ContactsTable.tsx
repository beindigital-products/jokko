"use client"

import { ContactRow, CONTACTS_COLS } from "./ContactRow"
import type { ContactTag } from "./ContactRow"
import type { AvatarColor } from "../primitives/Avatar"

export interface ContactsTableEntry {
    id: string
    name: string
    initials: string
    color?: AvatarColor
    phone: string
    email?: string
    tags?: ContactTag[]
    lastExchange?: string
}

interface ContactsTableProps {
    entries: ContactsTableEntry[]
    selectedIds?: Set<string>
    onToggleSelect?: (id: string, selected: boolean) => void
    onRowClick?: (id: string) => void
    onRowMore?: (id: string) => void
}

/**
 * ContactsTable — v3 contacts list. Same grid table look as the Campaigns /
 * Templates lists (mono uppercase header on paper-warm, px-8 gutters, ink-100
 * row dividers, paper-warm hover) so every list screen reads identically.
 */
export function ContactsTable({
    entries,
    selectedIds,
    onToggleSelect,
    onRowClick,
    onRowMore,
}: ContactsTableProps) {
    return (
        <div className="overflow-x-auto">
            <div className="min-w-[720px]">
                <div
                    className="grid items-center gap-x-5 border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-8 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]"
                    style={{ gridTemplateColumns: CONTACTS_COLS, height: 38 }}
                >
                    <div />
                    <div>Nom</div>
                    <div>Téléphone · Email</div>
                    <div>Tags</div>
                    <div>Ajouté</div>
                    <div />
                </div>
                {entries.length === 0 ? (
                    <div className="px-8 py-16 text-center text-[13px] text-[var(--ink-soft)]">
                        Aucun contact.
                    </div>
                ) : (
                    entries.map((e) => (
                        <ContactRow
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
                            onRowClick={() => onRowClick?.(e.id)}
                            onMore={() => onRowMore?.(e.id)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
