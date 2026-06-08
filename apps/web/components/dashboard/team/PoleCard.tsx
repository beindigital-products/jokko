import type { Pole } from "./types"

/**
 * A single pole card (colored bar + name + members/open-conv meta). When
 * `onClick` is provided the card becomes a button that opens the configure
 * modal (matches the `Jokko Desktop.html` clickable pole cards).
 */
export function PoleCard({ pole, onClick }: { pole: Pole; onClick?: () => void }) {
    const inner = (
        <>
            <span className="h-9 w-1 shrink-0 rounded-sm" style={{ background: pole.color }} />
            <div className="flex-1 text-left">
                <div className="text-[14px] font-semibold tracking-tight text-[var(--ink-900)]">
                    {pole.name}
                </div>
                <div className="mt-0.5 font-mono text-[11.5px] text-[var(--ink-soft)]">
                    {pole.members} membres · {pole.conv} conv. ouvertes
                </div>
            </div>
        </>
    )
    const className =
        "flex min-w-[220px] items-center gap-3 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-4 py-3"
    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={`${className} text-left transition-colors hover:border-[var(--ink-300)] hover:bg-[var(--paper-warm)]`}
            >
                {inner}
            </button>
        )
    }
    return <div className={className}>{inner}</div>
}
