import { cn } from "@/lib/utils"

/** Bordered analytics panel (white surface, generous padding). */
export function AnalyticsCard({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                "rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6",
                className,
            )}
        >
            {children}
        </div>
    )
}

/** Mono uppercase card label. */
export function AnalyticsEyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
            {children}
        </div>
    )
}
