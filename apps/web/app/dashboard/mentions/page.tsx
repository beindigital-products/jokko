"use client"

import { useMutation, useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
    MentionsScreen,
    type MentionItemType,
    type MentionsData,
} from "@/components/dashboard/mentions"
import { mapMentionsFeed, type MentionFeedRow } from "@/lib/dashboard/mentions-feed"

/**
 * Mentions — production wiring of the v3 "Mentions" page. Pulls the dedicated
 * `mentions.feed` Convex query (the user's MENTION + ASSIGNMENT notifications,
 * enriched with the real note / author / conversation), maps it through the
 * pure `mapMentionsFeed` helper, and renders the presentational
 * `<MentionsScreen/>`.
 *
 * Opening a card marks ONLY that entry read (clearing the sidebar badge one at
 * a time); landing on the page leaves everything as-is.
 */
export default function MentionsPage() {
    const rows = useQuery(api.mentions.feed)
    const markAsRead = useMutation(api.notifications.markAsRead)

    const loading = rows === undefined
    const data = buildMentionsData(rows as MentionFeedRow[] | undefined)

    const handleOpen = (item: MentionItemType) => {
        if (item.unread && item.notificationId) {
            // Fire-and-forget — the action's <Link> handles navigation.
            void markAsRead({
                notificationId: item.notificationId as Id<"notifications">,
            }).catch(() => {})
        }
    }

    return (
        // Full-bleed: escape the layout's `p-3 sm:p-4 lg:p-6` padding and own the
        // viewport height so the screen's internal header + scroll fill the area
        // (mirrors the overview / conversations full-bleed technique).
        <div className="-m-3 h-[calc(100vh-3rem)] sm:-m-4 lg:-m-6">
            <MentionsScreen data={data} loading={loading} onOpen={handleOpen} />
        </div>
    )
}

/**
 * Assemble `MentionsData` from the (possibly-undefined) query result. Lives at
 * module scope so the `Date.now()` read stays out of the component render body
 * (mirrors `buildOverviewData` in the cockpit page).
 */
function buildMentionsData(rows: MentionFeedRow[] | undefined): MentionsData {
    const now = Date.now()
    return mapMentionsFeed(rows ?? [], now)
}
