"use client"

import { Avatar, type AvatarColor } from "../primitives/Avatar"
import { Chip, type ChipTone } from "../primitives/Chip"
import { HeaderButton } from "../shell/HeaderButton"

export interface ConversationHeaderChip {
    label: string
    tone?: ChipTone
}

interface ConversationHeaderProps {
    name: string
    initials: string
    color?: AvatarColor
    phone?: string
    chips?: ConversationHeaderChip[]
    onReassign?: () => void
    onResolve?: () => void
}

/**
 * ConversationHeader — top bar of the thread column. Avatar + contact info
 * left, action buttons right (Réassigner / Résoudre).
 */
export function ConversationHeader({
    name,
    initials,
    color = "violet",
    phone,
    chips = [],
    onReassign,
    onResolve,
}: ConversationHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-[var(--ink-200)] px-5 py-3">
            <div className="flex items-center gap-2.5">
                <Avatar initials={initials} color={color} />
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-[var(--ink-900)]">
                            {name}
                        </span>
                        {phone ? (
                            <span className="font-mono text-[11px] text-[var(--ink-soft)]">
                                {phone}
                            </span>
                        ) : null}
                    </div>
                    {chips.length > 0 ? (
                        <div className="mt-0.5 flex items-center gap-1.5">
                            {chips.map((c) => (
                                <Chip key={c.label} tone={c.tone ?? "neutral"}>
                                    {c.label}
                                </Chip>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <HeaderButton onClick={onReassign}>Réassigner</HeaderButton>
                <HeaderButton onClick={onResolve} variant="primary">
                    Résoudre
                </HeaderButton>
            </div>
        </div>
    )
}
