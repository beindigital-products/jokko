"use client"

import { MoreHorizontal } from "lucide-react"
import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { Chip, type ChipTone } from "../primitives/Chip"

export interface ContactTag {
    label: string
    tone?: ChipTone
}

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
 * ContactRow — `tr` for the Contacts table. Selectable checkbox + avatar
 * + name/email + phone + tags + last exchange + "...".
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
        <tr
            className="cursor-pointer hover:bg-[var(--paper-warm)]/60"
            onClick={onRowClick}
        >
            <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={selected ?? false}
                    onChange={(e) => onToggleSelect?.(e.target.checked)}
                    className="h-3 w-3 rounded border-[var(--ink-300)]"
                />
            </td>
            <td className="px-2 py-3">
                <div className="flex items-center gap-2.5">
                    <Avatar initials={initials} color={color} />
                    <div>
                        <div className="text-[13px] font-semibold text-[var(--ink-900)]">
                            {name}
                        </div>
                        <div className="font-mono text-[10px] text-[var(--ink-soft)]">
                            {phone}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-2 py-3">
                <div className="font-mono text-[11px]">{phone}</div>
                {email ? (
                    <div className="text-[11px] text-[var(--ink-soft)]">{email}</div>
                ) : null}
            </td>
            <td className="px-2 py-3">
                <div className="flex flex-wrap gap-1">
                    {tags.map((t) => (
                        <Chip key={t.label} tone={t.tone ?? "neutral"}>
                            {t.label}
                        </Chip>
                    ))}
                </div>
            </td>
            <td className="px-2 py-3 text-[12px] text-[var(--ink-700)]">{lastExchange}</td>
            <td className="px-2 py-3 text-right">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onMore?.()
                    }}
                    className="rounded p-1 text-[var(--ink-400)] hover:bg-[var(--paper-warm)]"
                    aria-label="Plus d'actions"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    )
}
