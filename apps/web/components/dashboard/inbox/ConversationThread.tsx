"use client"

import { Fragment } from "react"
import { MessageBubble } from "./MessageBubble"

export interface ThreadMessage {
    id: string
    side: "in" | "out"
    body: React.ReactNode
    timestamp?: string
    deliveryStatus?: "sent" | "delivered" | "read"
    /** Render rich media edge-to-edge (no bubble bg/padding). */
    bare?: boolean
}

export interface ThreadDayGroup {
    /** Label for the day separator (eg "Aujourd'hui · 24 mai 2026") */
    day: string
    messages: ThreadMessage[]
}

interface ConversationThreadProps {
    groups: ThreadDayGroup[]
    header?: React.ReactNode
    composer?: React.ReactNode
}

/**
 * ConversationThread — middle column body : header slot, scrollable
 * day-grouped bubbles, composer slot. Compose with ConversationHeader
 * + MessageComposer (kept as separate components for reuse).
 */
export function ConversationThread({
    groups,
    header,
    composer,
}: ConversationThreadProps) {
    return (
        <div className="flex min-w-0 flex-1 flex-col">
            {header}
            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--paper-warm)]/40 px-5 py-4">
                {groups.map((g, gi) => (
                    <Fragment key={gi}>
                        <div className="text-center">
                            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                                {g.day}
                            </span>
                        </div>
                        {g.messages.map((m) => (
                            <MessageBubble
                                key={m.id}
                                side={m.side}
                                timestamp={m.timestamp}
                                deliveryStatus={m.deliveryStatus}
                                bare={m.bare}
                            >
                                {m.body}
                            </MessageBubble>
                        ))}
                    </Fragment>
                ))}
            </div>
            {composer}
        </div>
    )
}
