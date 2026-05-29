import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
    summary: string
    page: string
    onPrev?: () => void
    onNext?: () => void
    prevDisabled?: boolean
    nextDisabled?: boolean
    className?: string
}

export function Pagination({
    summary,
    page,
    onPrev,
    onNext,
    prevDisabled,
    nextDisabled,
    className,
}: PaginationProps) {
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
