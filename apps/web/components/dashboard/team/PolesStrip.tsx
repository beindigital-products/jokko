import { Plus } from "lucide-react"

import { PoleCard } from "./PoleCard"
import type { Pole } from "./types"

/** Poles band under the team header: pole cards + "new pole" affordance. */
export function PolesStrip({ poles }: { poles: Pole[] }) {
    return (
        <div className="shrink-0 border-b border-[var(--ink-200)] px-8 py-6">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                Pôles
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
                {poles.map((p) => (
                    <PoleCard key={p.id} pole={p} />
                ))}
                <button
                    type="button"
                    className="flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--ink-300)] px-4 text-[13px] text-[var(--ink-soft)] hover:bg-[var(--paper-warm)]"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau pôle
                </button>
            </div>
        </div>
    )
}
