import { Reply, ExternalLink } from "lucide-react"

import { Avatar } from "../primitives/Avatar"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import type { MentionItem as MentionItemType } from "./types"

interface MentionItemProps {
    item: MentionItemType
}

/**
 * MentionItem — a single card in the Mentions feed. Shows avatar + actor
 * name + verb + conversation name, a left-accented blockquote for the note,
 * and two action buttons + relative timestamp. Recreates the design's
 * `card` with 14 px gap between avatar and content column.
 */
export function MentionItem({ item }: MentionItemProps) {
    return (
        <div className="flex gap-3.5 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-4 py-[14px]">
            {/* Avatar */}
            <Avatar
                initials={initialsFromName(item.who)}
                color={avatarColorFromString(item.who)}
                size="md"
            />

            {/* Content column */}
            <div className="min-w-0 flex-1">
                {/* Headline: who + verb + conv */}
                <div
                    className="text-[13.5px] leading-snug tracking-[-0.005em] text-[var(--ink-900)]"
                >
                    <span className="font-semibold">{item.who}</span>
                    <span className="text-[var(--ink-500)]"> {item.text} </span>
                    <span className="font-semibold">{item.conv}</span>
                </div>

                {/* Quoted note */}
                <div
                    className="mt-2 rounded-r-md text-[13px] leading-snug tracking-[-0.005em] text-[var(--ink-700)]"
                    style={{
                        paddingTop: 8,
                        paddingBottom: 8,
                        paddingLeft: 12,
                        paddingRight: 12,
                        borderLeft: "2px solid var(--accent)",
                        background: "var(--paper-warm)",
                    }}
                >
                    {item.note}
                </div>

                {/* Actions row */}
                <div className="mt-2 flex items-center gap-2.5">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                    >
                        <Reply className="h-3.5 w-3.5" />
                        Répondre
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ouvrir la conversation
                    </button>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Relative time */}
                    <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)] tabular-nums">
                        {item.time}
                    </span>
                </div>
            </div>
        </div>
    )
}
