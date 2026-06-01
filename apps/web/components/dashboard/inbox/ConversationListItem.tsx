"use client"

import { cn } from "@/lib/utils"
import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { Chip, type ChipTone } from "../primitives/Chip"

export interface ConversationTag {
    label: string
    tone?: ChipTone
}

interface ConversationListItemProps {
    contactName: string
    initials: string
    color?: AvatarColor
    snippet: string
    timestamp: string
    tags?: ConversationTag[]
    unread?: boolean
    unreadCount?: number
    active?: boolean
    onClick?: () => void
}

export function ConversationListItem({
    contactName,
    initials,
    color = "violet",
    snippet,
    timestamp,
    tags = [],
    unread,
    unreadCount,
    active,
    onClick,
}: ConversationListItemProps) {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                data-testid="conversation-item"
                className={cn(
                    "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors",
                    active
                        ? "bg-[var(--accent-muted)]/40 border-l-2 border-l-[var(--accent)]"
                        : "hover:bg-[var(--paper-warm)]",
                )}
            >
                <Avatar initials={initials} color={color} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <span
                            className={cn(
                                "truncate text-[13px]",
                                unread ? "font-bold" : "font-semibold",
                            )}
                        >
                            {contactName}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--ink-soft)]">
                            {timestamp}
                        </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px] text-[var(--ink-soft)]">
                        {snippet}
                    </p>
                    {tags.length > 0 || (unreadCount && unreadCount > 0) ? (
                        <div className="mt-1.5 flex items-center gap-1">
                            {tags.map((t) => (
                                <Chip key={t.label} tone={t.tone ?? "neutral"}>
                                    {t.label}
                                </Chip>
                            ))}
                            {unreadCount && unreadCount > 0 ? (
                                <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 font-mono text-[9px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </button>
        </li>
    )
}
