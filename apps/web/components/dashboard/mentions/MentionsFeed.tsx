"use client"

import { useState } from "react"

import { Pagination } from "../primitives"
import { MentionItem } from "./MentionItem"
import type { MentionItem as MentionItemType } from "./types"

/** Items revealed initially and per "Charger plus" click. */
const PAGE = 15

interface MentionsFeedProps {
    items: MentionItemType[]
    /** Forwarded to each card so the page can mark the entry read on open. */
    onOpen?: (item: MentionItemType) => void
}

/**
 * MentionsFeed — scrollable list of MentionItem cards, constrained to
 * maxWidth 800 (matching the design). Renders an empty-state prompt when
 * `items` is empty, and windows long feeds behind a shared "Charger plus"
 * Pagination footer (client-side — the whole feed is already in memory).
 */
export function MentionsFeed({ items, onOpen }: MentionsFeedProps) {
    const [visible, setVisible] = useState(PAGE)

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

    const shown = items.slice(0, visible)
    const hasMore = items.length > visible

    return (
        <div className="flex max-w-[800px] flex-col gap-2.5">
            {shown.map((item) => (
                <MentionItem key={item.id} item={item} onOpen={onOpen} />
            ))}
            <Pagination
                mode="loadMore"
                hasMore={hasMore}
                onLoadMore={() => setVisible((v) => v + PAGE)}
                label="Charger plus de mentions"
                summary={items.length > PAGE ? `${shown.length} sur ${items.length}` : undefined}
                className="pt-2"
            />
        </div>
    )
}
