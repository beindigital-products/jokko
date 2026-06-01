"use client"

import { PageHeader } from "../shell/PageHeader"
import { MentionsFeed } from "./MentionsFeed"
import type { MentionsData } from "./types"

/**
 * MentionsScreen — v3 "Mentions" page (Inbox · mentions). Composes the
 * PageHeader + MentionsFeed. Recreates `screens-admin.jsx` ScreenMentions.
 * Pure presentational.
 */
export function MentionsScreen({ data }: { data: MentionsData }) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow="Inbox · mentions"
                title="Mentions"
                description="Là où vous êtes attendue : @mentions, assignations, réponses à vos notes internes."
            />

            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-10 space-y-4">
                <MentionsFeed items={data.items} />
            </div>
        </div>
    )
}
