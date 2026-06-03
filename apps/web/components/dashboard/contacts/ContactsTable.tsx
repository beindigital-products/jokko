"use client"

import { ContactRow } from "./ContactRow"
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

const COLUMNS = ["", "NOM", "TÉLÉPHONE · EMAIL", "TAGS", "DERNIER ÉCHANGE"]

export function ContactsTable({
    entries,
    selectedIds,
    onToggleSelect,
    onRowClick,
    onRowMore,
}: ContactsTableProps) {
    return (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
            <thead>
                <tr className="border-y border-[var(--ink-200)]">
                    {COLUMNS.map((h) => (
                        <th
                            key={h || "select"}
                            className="px-2 py-2.5 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]"
                        >
                            {h}
                        </th>
                    ))}
                    <th />
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink-100)]">
                {entries.map((e) => (
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
                ))}
            </tbody>
        </table>
        </div>
    )
}
