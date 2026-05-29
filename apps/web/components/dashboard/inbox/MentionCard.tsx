"use client"

import { CornerDownLeft } from "lucide-react"

import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { HeaderButton } from "../shell/HeaderButton"

interface MentionCardProps {
    author: string
    initials: string
    color?: AvatarColor
    action: string
    target: string
    message: string
    timestamp: string
    onReply?: () => void
    onOpen?: () => void
}

/**
 * MentionCard — feed row for /inbox/mentions. Avatar + "{author} {action}
 * {target}" line + quoted message + reply/open actions + timestamp.
 */
export function MentionCard({
    author,
    initials,
    color = "violet",
    action,
    target,
    message,
    timestamp,
    onReply,
    onOpen,
}: MentionCardProps) {
    return (
        <article className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-4">
            <div className="flex items-start gap-3">
                <Avatar initials={initials} color={color} />
                <div className="min-w-0 flex-1">
                    <div className="text-[13px]">
                        <span className="font-semibold text-[var(--ink-900)]">{author}</span>{" "}
                        <span className="text-[var(--ink-soft)]">{action}</span>{" "}
                        <span className="font-semibold text-[var(--ink-900)]">{target}</span>
                    </div>
                    <div className="mt-2 rounded-md border-l-2 border-[var(--accent)] bg-[var(--paper-warm)] px-3 py-2 text-[12px]">
                        {message}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HeaderButton icon={CornerDownLeft} onClick={onReply}>
                                Répondre
                            </HeaderButton>
                            <HeaderButton onClick={onOpen}>
                                Ouvrir la conversation
                            </HeaderButton>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--ink-soft)]">
                            {timestamp}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    )
}
