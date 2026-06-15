"use client"

import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { Chip, type ChipTone } from "../primitives/Chip"

export interface ContactTag {
    label: string
    tone?: ChipTone
}

/** Shared grid columns for the Contacts table header + rows (matches the v3
 * Campaigns/Templates table rhythm: select · name · phone/email · tags · added · more). */
export const CONTACTS_COLS =
    "24px minmax(0,1.7fr) minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,0.8fr) 32px"

interface ContactRowProps {
    name: string
    initials: string
    color?: AvatarColor
    phone: string
    email?: string
    tags?: ContactTag[]
    lastExchange?: string
    selected?: boolean
    onToggleSelect?: (selected: boolean) => void
    onRowClick?: () => void
    onMore?: () => void
}

/**
 * ContactRow — one broadcast-style grid row for the Contacts table: selectable
 * checkbox + avatar + name/phone + phone/email + tags + last exchange + "...".
 * Shares the v3 table look with Campaigns/Templates (paper-warm header, px-8,
 * border-b ink-100, hover paper-warm).
 */
export function ContactRow({
    name,
    initials,
    color = "violet",
    phone,
    email,
    tags = [],
    lastExchange = "—",
    selected,
    onToggleSelect,
    onRowClick,
    onMore,
}: ContactRowProps) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onRowClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onRowClick?.()
                }
            }}
            className={cn(
                "grid items-center gap-x-5 border-b border-[var(--ink-100)] px-8 py-3 transition-colors hover:bg-[var(--paper-warm)]/50",
                "cursor-pointer focus:outline-none focus-visible:bg-[var(--paper-warm)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]",
            )}
            style={{ gridTemplateColumns: CONTACTS_COLS, minHeight: 64 }}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={selected ?? false}
                    onChange={(e) => onToggleSelect?.(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[var(--ink-300)]"
                    aria-label={`Sélectionner ${name}`}
                />
            </div>
            <div className="flex min-w-0 items-center gap-2.5">
                <Avatar initials={initials} color={color} />
                <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-[var(--ink-900)]">{name}</div>
                    <div className="font-mono text-[10px] text-[var(--ink-soft)]">{phone}</div>
                </div>
            </div>
            <div className="min-w-0">
                <div className="truncate font-mono text-[11px] text-[var(--ink-700)]">{phone}</div>
                {email ? <div className="truncate text-[11px] text-[var(--ink-soft)]">{email}</div> : null}
            </div>
            <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                    <Chip key={t.label} tone={t.tone ?? "neutral"}>
                        {t.label}
                    </Chip>
                ))}
            </div>
            <div className="text-[12px] text-[var(--ink-700)]">{lastExchange}</div>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onMore?.()
                    }}
                    className="rounded p-1 text-[var(--ink-400)] transition hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]"
                    aria-label="Plus d'actions"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}
