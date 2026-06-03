import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Pagination — the shared footer for every dashboard list. Two modes:
 *
 *   - `pages` (default): a left summary + prev/next page indicator. For
 *     full-array, client-sliced tables ("◂ 1 / 201 ▸"). This is the original
 *     API, kept intact so existing callers keep working without a `mode` prop.
 *
 *   - `loadMore`: a centered "Charger plus" button (spinner + disabled while
 *     loading, hidden when there's nothing left) with an optional summary line.
 *     For Convex cursor lists (`usePaginatedQuery`) and any append-style feed.
 *     `size="sm"` renders the compact pill used inside message threads.
 */
interface PagesProps {
    mode?: "pages"
    /** Left-aligned summary, e.g. "12 sur 2 408 · 0 sélectionné". */
    summary: string
    /** Page indicator, e.g. "1 / 201". */
    page: string
    onPrev?: () => void
    onNext?: () => void
    prevDisabled?: boolean
    nextDisabled?: boolean
    className?: string
}

interface LoadMoreProps {
    mode: "loadMore"
    /** Whether more items remain — the button is hidden when false. */
    hasMore?: boolean
    /** Spinner + disabled while the next page is being fetched. */
    loading?: boolean
    onLoadMore?: () => void
    /** Button label (default "Charger plus"). */
    label?: string
    /** Label shown while loading (default "Chargement…"). */
    loadingLabel?: string
    /** Optional mono caption under the button, e.g. "15 sur 60". */
    summary?: string
    /** "md" = list-footer button (default), "sm" = compact pill (threads). */
    size?: "sm" | "md"
    className?: string
}

export type PaginationProps = PagesProps | LoadMoreProps

export function Pagination(props: PaginationProps) {
    if (props.mode === "loadMore") {
        return <LoadMorePagination {...props} />
    }
    return <PagesPagination {...props} />
}

function PagesPagination({
    summary,
    page,
    onPrev,
    onNext,
    prevDisabled,
    nextDisabled,
    className,
}: PagesProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between text-[11px] text-[var(--ink-soft)]",
                className,
            )}
        >
            <span>{summary}</span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={prevDisabled}
                    aria-label="Page précédente"
                    className="rounded-md border border-[var(--ink-200)] p-1 hover:bg-[var(--paper-warm)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="font-mono">{page}</span>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={nextDisabled}
                    aria-label="Page suivante"
                    className="rounded-md border border-[var(--ink-200)] p-1 hover:bg-[var(--paper-warm)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}

function LoadMorePagination({
    hasMore,
    loading,
    onLoadMore,
    label = "Charger plus",
    loadingLabel = "Chargement…",
    summary,
    size = "md",
    className,
}: LoadMoreProps) {
    // Nothing left to load and nothing to caption → render nothing so callers
    // can drop it in unconditionally.
    if (!hasMore && !summary) return null

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            {hasMore ? (
                <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loading}
                    className={cn(
                        "inline-flex items-center gap-1.5 border border-[var(--ink-200)] bg-[var(--paper-white)] font-medium transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-50",
                        size === "sm"
                            ? "rounded-full px-3 py-1 text-[11px] text-[var(--ink-soft)]"
                            : "rounded-md px-3 py-1.5 text-[12.5px] text-[var(--ink-700)]",
                    )}
                >
                    {loading ? (
                        <Loader2 className={cn("animate-spin", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
                    ) : null}
                    {loading ? loadingLabel : label}
                </button>
            ) : null}
            {summary ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    {summary}
                </span>
            ) : null}
        </div>
    )
}
