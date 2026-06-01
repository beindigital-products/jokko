import { Settings, Plug } from "lucide-react"

import type { Integration } from "./types"
import { IntegrationLogo } from "./IntegrationLogo"
import { IntegrationStatusBadge } from "./IntegrationStatusBadge"

interface IntegrationCardProps {
    integration: Integration
    onConfigure?: (id: string) => void
    onConnect?: (id: string) => void
}

/**
 * IntegrationCard — one card in the 3-column integrations grid.
 * Shows the branded logo, name + category eyebrow, description, last-sync
 * timestamp, and a context-aware CTA (Configurer vs Connecter).
 */
export function IntegrationCard({
    integration,
    onConfigure,
    onConnect,
}: IntegrationCardProps) {
    const { id, name, desc, cat, on, health, last } = integration

    return (
        <div className="relative cursor-pointer rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6 transition-shadow hover:shadow-sm">
            {/* Header: logo + name/category + status badge */}
            <div className="mb-3 flex items-start gap-3">
                <IntegrationLogo id={id} name={name} />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[14.5px] font-semibold leading-snug tracking-tight text-[var(--ink-900)]">
                            {name}
                        </span>
                    </div>
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                        {cat}
                    </span>
                </div>

                <IntegrationStatusBadge on={on} health={health} />
            </div>

            {/* Description */}
            <p className="min-h-[36px] text-[12.5px] leading-relaxed tracking-tight text-[var(--ink-500)]">
                {desc}
            </p>

            {/* Footer: last-sync label + CTA */}
            <div className="mt-3.5 flex items-center justify-between border-t border-[var(--ink-100)] pt-3">
                <span className="font-mono text-[10.5px] tabular-nums text-[var(--ink-soft)]">
                    {last}
                </span>

                {on ? (
                    <button
                        type="button"
                        onClick={() => onConfigure?.(id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                    >
                        <Settings className="h-3 w-3" strokeWidth={2} />
                        Configurer
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => onConnect?.(id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-2.5 py-1 text-[12px] font-medium text-white transition-colors hover:bg-[var(--ink-700)]"
                    >
                        <Plug className="h-3 w-3" strokeWidth={2} />
                        Connecter
                    </button>
                )}
            </div>
        </div>
    )
}
