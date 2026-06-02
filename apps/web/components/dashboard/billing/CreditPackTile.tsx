import { cn } from "@/lib/utils"
import type { CreditPack } from "./types"

/**
 * CreditPackTile — one pre-set top-up amount (e.g. €100 ≈ 3 100 conv.).
 * Selected state matches the design's accent-bordered highlight.
 */
export function CreditPackTile({ pack }: { pack: CreditPack }) {
    return (
        <button
            type="button"
            aria-pressed={pack.selected}
            className={cn(
                "rounded-[10px] border px-2 py-3.5 text-center transition-colors",
                pack.selected
                    ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                    : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:bg-[var(--paper-warm)]",
            )}
        >
            <div className="font-display text-[22px] font-bold tabular-nums tracking-tight text-[var(--ink-900)]">
                {pack.amount}
            </div>
            <div className="mt-1 text-[11px] text-[var(--ink-soft)]">{pack.note}</div>
        </button>
    )
}
