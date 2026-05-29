"use client"

import { MoreHorizontal } from "lucide-react"

import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { Chip, type ChipTone } from "../primitives/Chip"

interface UserMenuProps {
    name: string
    initials: string
    color?: AvatarColor
    role?: string
    roleTone?: ChipTone
    subtitle?: string
    online?: boolean
    onClick?: () => void
}

/**
 * UserMenu — sidebar bottom user card. Avatar + name + role chip + subtitle
 * + "..." trigger. Used for the current user + their permissions hint.
 */
export function UserMenu({
    name,
    initials,
    color = "emerald",
    role,
    roleTone = "accent",
    subtitle,
    online,
    onClick,
}: UserMenuProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-2 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-2 py-2 text-left hover:bg-[var(--paper-warm)] transition-colors"
        >
            <Avatar
                initials={initials}
                color={color}
                size="md"
                status={online ? "online" : undefined}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-[var(--ink-900)]">
                        {name}
                    </span>
                    {role ? <Chip tone={roleTone}>{role}</Chip> : null}
                </div>
                {subtitle ? (
                    <div className="text-[11px] text-[var(--ink-soft)]">{subtitle}</div>
                ) : null}
            </div>
            <MoreHorizontal className="h-3.5 w-3.5 text-[var(--ink-400)]" />
        </button>
    )
}
