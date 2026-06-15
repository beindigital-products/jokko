import type { Integration } from "./types"
import { IntegrationCard } from "./IntegrationCard"

interface IntegrationSectionProps {
    /** Optional section heading (e.g. "CRM"). Omit to render grid directly. */
    title?: string
    integrations: Integration[]
    onConfigure?: (id: string) => void
    onConnect?: (id: string) => void
    onDisconnect?: (id: string) => void
}

/**
 * IntegrationSection — labelled group with mono uppercase eyebrow + 3-col
 * grid of IntegrationCards. Used to visually group integrations by category
 * when "Tous" is the active filter; hidden when a specific category is active.
 */
export function IntegrationSection({
    title,
    integrations,
    onConfigure,
    onConnect,
    onDisconnect,
}: IntegrationSectionProps) {
    if (integrations.length === 0) return null

    return (
        <div>
            {title ? (
                <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    {title}
                </p>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-3">
                {integrations.map((it) => (
                    <IntegrationCard
                        key={it.id}
                        integration={it}
                        onConfigure={onConfigure}
                        onConnect={onConnect}
                        onDisconnect={onDisconnect}
                    />
                ))}
            </div>
        </div>
    )
}
