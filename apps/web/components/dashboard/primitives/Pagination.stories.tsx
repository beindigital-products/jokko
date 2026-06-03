import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { Pagination } from "./Pagination"

/**
 * Pagination — shared footer for every dashboard list. `pages` mode for
 * client-sliced tables, `loadMore` mode for Convex cursor lists / feeds.
 */
const meta = {
    title: "Primitives/Pagination",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

// ── pages mode (prev / next) ────────────────────────────────────────────────

export const Pages: Story = {
    name: "Pages — default",
    render: () => (
        <div className="max-w-[640px]">
            <Pagination summary="12 sur 2 408 · 0 sélectionné" page="1 / 201" />
        </div>
    ),
}

export const PagesFirst: Story = {
    name: "Pages — first (prev disabled)",
    render: () => (
        <div className="max-w-[640px]">
            <Pagination summary="1–30 sur 2 408" page="1 / 81" prevDisabled />
        </div>
    ),
}

export const PagesLast: Story = {
    name: "Pages — last (next disabled)",
    render: () => (
        <div className="max-w-[640px]">
            <Pagination summary="2 401–2 408 sur 2 408" page="81 / 81" nextDisabled />
        </div>
    ),
}

// ── loadMore mode ("Charger plus") ──────────────────────────────────────────

export const LoadMore: Story = {
    name: "Load more — has more",
    render: () => (
        <Pagination
            mode="loadMore"
            hasMore
            onLoadMore={() => {}}
            label="Charger plus de contacts"
            summary="30 sur 150"
        />
    ),
}

export const LoadMoreLoading: Story = {
    name: "Load more — loading",
    render: () => (
        <Pagination mode="loadMore" hasMore loading onLoadMore={() => {}} label="Charger plus de contacts" />
    ),
}

export const LoadMoreEnd: Story = {
    name: "Load more — end (summary only)",
    render: () => <Pagination mode="loadMore" hasMore={false} summary="150 sur 150 · tout est chargé" />,
}

export const LoadMoreCompact: Story = {
    name: "Load more — compact pill (threads)",
    render: () => (
        <Pagination mode="loadMore" size="sm" hasMore onLoadMore={() => {}} label="Charger les messages précédents" />
    ),
}

// ── interactive ─────────────────────────────────────────────────────────────

const TOTAL = 60
const STEP = 15

export const LoadMorePlayground: Story = {
    name: "Load more — interactive",
    render: function LoadMoreDemo() {
        const [visible, setVisible] = useState(STEP)
        const hasMore = visible < TOTAL
        return (
            <div className="max-w-[420px] space-y-3">
                <ul className="space-y-1">
                    {Array.from({ length: Math.min(visible, TOTAL) }, (_, i) => (
                        <li
                            key={i}
                            className="rounded-md border border-[var(--ink-100)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] text-[var(--ink-700)]"
                        >
                            Élément {i + 1}
                        </li>
                    ))}
                </ul>
                <Pagination
                    mode="loadMore"
                    hasMore={hasMore}
                    onLoadMore={() => setVisible((v) => v + STEP)}
                    summary={`${Math.min(visible, TOTAL)} sur ${TOTAL}`}
                />
            </div>
        )
    },
}
