import { Settings, Plug, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Chip } from "../primitives/Chip"
import type { Integration } from "./types"
import { IntegrationLogo } from "./IntegrationLogo"
import { IntegrationStatusBadge } from "./IntegrationStatusBadge"

interface IntegrationCardProps {
    integration: Integration
    onConfigure?: (id: string) => void
    onConnect?: (id: string) => void
    onDisconnect?: (id: string) => void
}

/**
 * IntegrationCard — one card in the 3-column integrations grid.
 * The whole card is clickable (connected → configure, else → connect).
 * Connected cards expose a direct disconnect button; coming-soon cards are inert.
 */
export function IntegrationCard({ integration, onConfigure, onConnect, onDisconnect }: IntegrationCardProps) {
    const { id, name, desc, cat, on, health, last } = integration
    const comingSoon = integration.available === false
    const clickable = !comingSoon
    const onCardClick = () => {
        if (comingSoon) return
        if (on) onConfigure?.(id)
        else onConnect?.(id)
    }

    return (
        <div
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? onCardClick : undefined}
            onKeyDown={
                clickable
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              onCardClick()
                          }
                      }
                    : undefined
            }
            className={cn(
                "relative rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6 transition-shadow",
                comingSoon
                    ? "opacity-80"
                    : "cursor-pointer hover:shadow-sm focus:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
            )}
        >
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

                {comingSoon ? <Chip tone="neutral">Bientôt</Chip> : <IntegrationStatusBadge on={on} health={health} />}
            </div>

            {/* Description */}
            <p className="min-h-[36px] text-[12.5px] leading-relaxed tracking-tight text-[var(--ink-500)]">{desc}</p>

            {/* Footer: last-sync label + CTA */}
            <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[var(--ink-100)] pt-3">
                <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] tabular-nums text-[var(--ink-soft)]">
                    {last}
                </span>

                {comingSoon ? (
                    <span className="shrink-0 rounded-md border border-[var(--ink-200)] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--ink-soft)]">
                        Bientôt
                    </span>
                ) : on ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onConfigure?.(id)
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                        >
                            <Settings className="h-3 w-3" strokeWidth={2} />
                            Configurer
                        </button>
                        <button
                            type="button"
                            title="Déconnecter"
                            aria-label={`Déconnecter ${name}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                onDisconnect?.(id)
                            }}
                            className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-500)] transition-colors hover:border-[var(--status-danger)] hover:text-[var(--status-danger)]"
                        >
                            <LogOut className="h-[14px] w-[14px]" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onConnect?.(id)
                        }}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-2.5 py-1 text-[12px] font-medium text-white transition-colors hover:bg-[var(--ink-700)]"
                    >
                        <Plug className="h-3 w-3" strokeWidth={2} />
                        Connecter
                    </button>
                )}
            </div>
        </div>
    )
}
