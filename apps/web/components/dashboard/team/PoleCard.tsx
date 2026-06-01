import type { Pole } from "./types"

/** A single pole card (colored bar + name + members/open-conv meta). */
export function PoleCard({ pole }: { pole: Pole }) {
    return (
        <div className="flex min-w-[220px] items-center gap-3 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-4 py-3">
            <span className="h-9 w-1 shrink-0 rounded-sm" style={{ background: pole.color }} />
            <div className="flex-1">
                <div className="text-[14px] font-semibold tracking-tight text-[var(--ink-900)]">
                    {pole.name}
                </div>
                <div className="mt-0.5 font-mono text-[11.5px] text-[var(--ink-soft)]">
                    {pole.members} membres · {pole.conv} conv. ouvertes
                </div>
            </div>
        </div>
    )
}
