import { MentionItem } from "./MentionItem"
import type { MentionItem as MentionItemType } from "./types"

interface MentionsFeedProps {
    items: MentionItemType[]
    /** Forwarded to each card so the page can mark the entry read on open. */
    onOpen?: (item: MentionItemType) => void
}

/**
 * MentionsFeed — scrollable list of MentionItem cards, constrained to
 * maxWidth 800 (matching the design). Renders an empty-state prompt when
 * `items` is empty.
 */
export function MentionsFeed({ items, onOpen }: MentionsFeedProps) {
    if (items.length === 0) {
        return (
            <div className="flex max-w-[800px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--ink-200)] bg-[var(--paper-white)] py-16 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    Aucune mention
                </p>
                <p className="mt-2 text-sm text-[var(--ink-500)]">
                    Vous n&apos;avez pas encore été mentionné, assigné ou cité dans une note.
                </p>
            </div>
        )
    }

    return (
        <div className="flex max-w-[800px] flex-col gap-2.5">
            {items.map((item) => (
                <MentionItem key={item.id} item={item} onOpen={onOpen} />
            ))}
        </div>
    )
}
