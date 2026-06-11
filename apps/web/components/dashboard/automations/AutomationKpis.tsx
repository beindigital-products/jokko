import type { AutomationsKpi } from "./types"

/** Borderless 4-up KPI strip under the automations header. */
export function AutomationKpis({ kpis }: { kpis: AutomationsKpi[] }) {
    return (
        <div className="grid shrink-0 grid-cols-2 gap-6 border-b border-[var(--ink-200)] px-8 py-6 lg:grid-cols-4">
            {kpis.map((k) => (
                <div key={k.label}>
                    <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        {k.label}
                    </div>
                    <div className="mt-2 font-display text-[30px] font-bold leading-none tabular-nums tracking-tight text-[var(--ink-900)]">
                        {k.value}
                    </div>
                    <div className="mt-1.5 font-mono text-[11.5px] text-[var(--ink-500)]">{k.delta}</div>
                </div>
            ))}
        </div>
    )
}
