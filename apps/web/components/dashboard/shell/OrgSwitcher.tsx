"use client"

import { ChevronDown } from "lucide-react"

interface OrgSwitcherProps {
    name: string
    initial: string
    plan?: string
    seats?: string
    onClick?: () => void
}

/**
 * OrgSwitcher — sidebar top org card. Black squircle with initial,
 * org name + plan/seats meta in mono. Chevron suggests dropdown.
 */
export function OrgSwitcher({ name, initial, plan, seats, onClick }: OrgSwitcherProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-2 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-2 text-left hover:bg-[var(--paper-warm)] transition-colors"
        >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink-900)] text-xs font-bold text-white">
                {initial}
            </span>
            <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-[var(--ink-900)]">
                    {name}
                </div>
                {plan || seats ? (
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        {[plan, seats].filter(Boolean).join(" · ")}
                    </div>
                ) : null}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--ink-400)]" />
        </button>
    )
}
