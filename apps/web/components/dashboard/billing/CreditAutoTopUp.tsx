import { cn } from "@/lib/utils"

/**
 * CreditAutoTopUp — visual toggle row for automatic credit top-up.
 * Presentational only (the switch reflects `enabled`, no handler).
 */
export function CreditAutoTopUp({
    description,
    enabled,
}: {
    description: string
    enabled: boolean
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3.5 py-3">
            <span
                className={cn(
                    "relative h-4 w-7 shrink-0 rounded-full transition-colors",
                    enabled ? "bg-[var(--accent)]" : "bg-[var(--ink-300)]",
                )}
            >
                <span
                    className={cn(
                        "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all",
                        enabled ? "left-3.5" : "left-0.5",
                    )}
                />
            </span>
            <p className="flex-1 text-[12.5px] leading-snug text-[var(--ink-700)]">{description}</p>
        </div>
    )
}
