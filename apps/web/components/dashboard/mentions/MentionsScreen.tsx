"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "../shell/PageHeader"
import { MentionsFeed } from "./MentionsFeed"
import type { MentionItem, MentionsData } from "./types"

interface MentionsScreenProps {
    data?: MentionsData
    /** While true, shows skeleton cards instead of the feed / empty state. */
    loading?: boolean
    /** Fired when a card is opened (page marks the notification read + navigates). */
    onOpen?: (item: MentionItem) => void
}

function MentionsFeedSkeleton() {
    return (
        <div className="flex max-w-[800px] flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[104px] rounded-xl" />
            ))}
        </div>
    )
}

/**
 * MentionsScreen — v3 "Mentions" page (Inbox · mentions). Composes the
 * PageHeader + MentionsFeed. Recreates `screens-admin.jsx` ScreenMentions.
 * Pure presentational (data + loading + onOpen are driven by the page).
 */
export function MentionsScreen({ data, loading, onOpen }: MentionsScreenProps) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow="Inbox · mentions"
                title="Mentions"
                description="Là où vous êtes attendue : @mentions, assignations, réponses à vos notes internes."
            />

            <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-8 pt-6 sm:px-8 sm:pt-10">
                {loading || !data ? (
                    <MentionsFeedSkeleton />
                ) : (
                    <MentionsFeed items={data.items} onOpen={onOpen} />
                )}
            </div>
        </div>
    )
}
