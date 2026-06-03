"use client"

import { Check, Mail, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { Chip, type ChipTone } from "../primitives/Chip"
import type { ContactTag } from "./ContactRow"

interface ContactCardProps {
    name: string
    initials: string
    color?: AvatarColor
    phone: string
    email?: string
    tags?: ContactTag[]
    lastExchange?: string
    selected?: boolean
    onToggleSelect?: (selected: boolean) => void
    onCardClick?: () => void
    onMore?: () => void
}

/**
 * ContactCard — card-disposition counterpart to {@link ContactRow}. Same data
 * as a table row (avatar + name/phone/email + tags + last exchange) laid out
 * as a self-contained selectable tile for the grid view.
 */
export function ContactCard({
    name,
    initials,
    color = "violet",
    phone,
    email,
    tags = [],
    lastExchange = "—",
    selected,
    onToggleSelect,
    onCardClick,
    onMore,
}: ContactCardProps) {
    return (
        <div
            onClick={onCardClick}
            className={cn(
                "group relative cursor-pointer rounded-xl border bg-[var(--paper-white)] p-4 transition-colors",
                selected
                    ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                    : "border-[var(--ink-200)] hover:bg-[var(--paper-warm)]/60",
            )}
        >
            {/* Top-right controls (out of flow → the avatar/name header stays
                aligned with the email / tags / footer below). Select + more. */}
            <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                    type="button"
                    aria-label={selected ? "Désélectionner" : "Sélectionner"}
                    aria-pressed={selected}
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleSelect?.(!selected)
                    }}
                    className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition",
                        selected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white opacity-100"
                            : "border-[var(--ink-300)] bg-[var(--paper-white)] text-transparent opacity-0 group-hover:opacity-100",
                    )}
                >
                    {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </button>
                <button
                    type="button"
                    aria-label="Plus d'actions"
                    onClick={(e) => {
                        e.stopPropagation()
                        onMore?.()
                    }}
                    className="rounded p-1 text-[var(--ink-400)] opacity-0 transition hover:bg-[var(--paper-warm)] group-hover:opacity-100"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="flex items-center gap-3 pr-12">
                <Avatar initials={initials} color={color} size="lg" />
                <div className="min-w-0">
                    <div className="truncate text-[14px] font-semibold text-[var(--ink-900)]">
                        {name}
                    </div>
                    <div className="font-mono text-[11px] text-[var(--ink-soft)]">
                        {phone}
                    </div>
                </div>
            </div>

            {email ? (
                <div className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)]">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{email}</span>
                </div>
            ) : null}

            {tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1">
                    {tags.map((t) => (
                        <Chip key={t.label} tone={(t.tone ?? "neutral") as ChipTone}>
                            {t.label}
                        </Chip>
                    ))}
                </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between border-t border-[var(--ink-100)] pt-3">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    Ajouté
                </span>
                <span className="text-[11px] text-[var(--ink-700)]">{lastExchange}</span>
            </div>
        </div>
    )
}
