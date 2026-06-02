import { cn } from "@/lib/utils"
import { StateIllustration, type IllustrationName } from "./StateIllustration"

interface EmptyStateProps {
    /** Mono-line illustration shown in the rounded tile. */
    illustration?: IllustrationName
    eyebrow?: string
    title: React.ReactNode
    body?: React.ReactNode
    /** Primary action (e.g. a button). */
    primary?: React.ReactNode
    /** Secondary action (e.g. a link). */
    secondary?: React.ReactNode
    /** Tighter spacing + smaller illustration, for in-panel empties. */
    dense?: boolean
    className?: string
}

/**
 * EmptyState — the one canonical empty-state layout: an illustration tile, an
 * optional eyebrow, a display title, an explaining body, and a useful action.
 * "Le vide raconte… jamais un cul-de-sac." Recreates `EmptyBlock` from the
 * design's states kit. Pure presentational.
 */
export function EmptyState({
    illustration,
    eyebrow,
    title,
    body,
    primary,
    secondary,
    dense = false,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-1 flex-col items-center justify-center text-center",
                dense ? "gap-2 px-7 py-6" : "gap-3.5 px-8 py-10",
                className,
            )}
        >
            {illustration ? (
                <div
                    className={cn(
                        "flex items-center justify-center border border-[var(--ink-100)] bg-[var(--paper-warm)]",
                        dense ? "mb-1.5 h-[92px] w-[92px]" : "mb-2.5 h-[124px] w-[124px]",
                    )}
                >
                    <StateIllustration name={illustration} size={dense ? 64 : 84} />
                </div>
            ) : null}

            {eyebrow ? (
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    {eyebrow}
                </div>
            ) : null}

            <div
                className={cn(
                    "max-w-[380px] font-display font-bold leading-tight tracking-tight text-[var(--ink-900)]",
                    dense ? "text-[24px]" : "text-[30px]",
                )}
            >
                {title}
            </div>

            {body ? (
                <div className="max-w-[420px] text-[13.5px] leading-relaxed text-[var(--ink-500)]">{body}</div>
            ) : null}

            {primary || secondary ? (
                <div className="mt-2 flex items-center gap-2">
                    {primary}
                    {secondary}
                </div>
            ) : null}
        </div>
    )
}
