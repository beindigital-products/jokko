import Link from "next/link"
import { Reply, ExternalLink } from "lucide-react"

import { Avatar } from "../primitives/Avatar"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import type { MentionItem as MentionItemType } from "./types"

interface MentionItemProps {
    item: MentionItemType
    /**
     * Called when the user opens this entry (Répondre / Ouvrir la conversation).
     * The page uses it to mark the backing notification read before navigating.
     */
    onOpen?: (item: MentionItemType) => void
}

const ACTION_CLASS =
    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"

/** One card action — a real link when the item has an href, else an inert button. */
function MentionAction({
    item,
    onOpen,
    icon: Icon,
    label,
}: {
    item: MentionItemType
    onOpen?: (item: MentionItemType) => void
    icon: typeof Reply
    label: string
}) {
    if (item.href) {
        return (
            <Link href={item.href} onClick={() => onOpen?.(item)} className={ACTION_CLASS}>
                <Icon className="h-3.5 w-3.5" />
                {label}
            </Link>
        )
    }
    return (
        <button type="button" className={ACTION_CLASS}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    )
}

/**
 * MentionItem — a single card in the Mentions feed. Shows avatar + actor
 * name + verb + conversation name, a left-accented blockquote for the note,
 * and two action buttons + relative timestamp. When `item.href` is set the
 * actions become real links (and `onOpen` fires so the page can mark the
 * notification read); an accent dot flags entries that are still unread.
 */
export function MentionItem({ item, onOpen }: MentionItemProps) {
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
                <div className="text-[13.5px] leading-snug tracking-[-0.005em] text-[var(--ink-900)]">
                    <span className="font-semibold">{item.who}</span>
                    <span className="text-[var(--ink-500)]"> {item.text} </span>
                    {item.conv ? <span className="font-semibold">{item.conv}</span> : null}
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
                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <MentionAction item={item} onOpen={onOpen} icon={Reply} label="Répondre" />
                    <MentionAction
                        item={item}
                        onOpen={onOpen}
                        icon={ExternalLink}
                        label="Ouvrir la conversation"
                    />

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Unread accent */}
                    {item.unread ? (
                        <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                            aria-label="Non lue"
                        />
                    ) : null}

                    {/* Relative time */}
                    <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--ink-soft)] tabular-nums">
                        {item.time}
                    </span>
                </div>
            </div>
        </div>
    )
}
