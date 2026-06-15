"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { Chip, type ChipTone } from "../primitives/Chip"

export interface MentionMember {
    id: string
    name: string
    initials: string
    color?: AvatarColor
    role?: string
    roleTone?: ChipTone
    online?: boolean
}

interface MentionPickerProps {
    members: MentionMember[]
    /** Current query — when set, the list is filtered by case-insensitive
     *  prefix/contains match. Pass `""` to show all. */
    query?: string
    activeId?: string
    onSelect?: (member: MentionMember) => void
    onHover?: (id: string) => void
    className?: string
}

/**
 * MentionPicker — floating popover triggered by typing `@` in the
 * composer's note mode. Compact list of team members (avatar + name +
 * role chip + online dot). Keyboard hint footer (↑↓ ↵ Esc).
 *
 * Positioning is the consumer's responsibility — render inside a
 * `position: relative` parent and place absolutely above the caret.
 */
export function MentionPicker({
    members,
    query = "",
    activeId,
    onSelect,
    onHover,
    className,
}: MentionPickerProps) {
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return members
        return members.filter((m) => m.name.toLowerCase().includes(q))
    }, [members, query])

    return (
        <div
            role="listbox"
            aria-label="Mentionner un coéquipier"
            className={cn(
                "w-[280px] overflow-hidden rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-lg",
                className,
            )}
        >
            <div className="flex items-center justify-between border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                    Mentionner
                </span>
                <span className="font-mono text-[10px] text-[var(--ink-soft)]">
                    @{query}
                </span>
            </div>
            <ul className="max-h-[220px] overflow-y-auto py-1">
                {filtered.length === 0 ? (
                    <li className="px-3 py-4 text-center text-[12px] text-[var(--ink-soft)]">
                        Personne ne correspond à « @{query} ».
                    </li>
                ) : null}
                {filtered.map((m) => {
                    const active = m.id === activeId
                    return (
                        <li key={m.id} role="option" aria-selected={active}>
                            <button
                                type="button"
                                onClick={() => onSelect?.(m)}
                                onMouseEnter={() => onHover?.(m.id)}
                                className={cn(
                                    "flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                    active
                                        ? "bg-[var(--accent-muted)]/60"
                                        : "hover:bg-[var(--paper-warm)]",
                                )}
                            >
                                <Avatar
                                    initials={m.initials}
                                    color={m.color}
                                    size="sm"
                                    status={m.online ? "online" : undefined}
                                />
                                <span className="flex-1 truncate text-[12.5px] font-medium text-[var(--ink-900)]">
                                    {m.name}
                                </span>
                                {m.role ? (
                                    <Chip tone={m.roleTone ?? "neutral"}>{m.role}</Chip>
                                ) : null}
                            </button>
                        </li>
                    )
                })}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-3 py-1.5 font-mono text-[10px] text-[var(--ink-soft)]">
                <span>↑↓ Naviguer · ↵ Sélectionner</span>
                <span>Esc Fermer</span>
            </div>
        </div>
    )
}
