"use client"

import { cn } from "@/lib/utils"

export interface SettingsTab {
    key: string
    label: string
    count?: number | string
}

interface SettingsTabsNavProps {
    tabs: SettingsTab[]
    activeKey: string
    onChange?: (key: string) => void
}

/**
 * SettingsTabsNav — vertical tabs panel (left side of /settings page).
 * Active = paper-warm bg + ink border. Count badge in mono on the right.
 */
export function SettingsTabsNav({ tabs, activeKey, onChange }: SettingsTabsNavProps) {
    return (
        <nav className="space-y-0.5 border-r border-[var(--ink-200)] py-5 pl-6 pr-2 text-[13px]">
            {tabs.map((t) => {
                const active = t.key === activeKey
                return (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => onChange?.(t.key)}
                        className={cn(
                            "block w-full rounded-md px-2.5 py-1.5 text-left",
                            active
                                ? "border border-[var(--ink-200)] bg-[var(--paper-warm)] font-semibold text-[var(--ink-900)]"
                                : "text-[var(--ink-soft)] hover:bg-[var(--paper-warm)]/60",
                        )}
                    >
                        {t.label}
                        {t.count != null ? (
                            <span className="ml-1.5 font-mono text-[10px] text-[var(--ink-soft)]">
                                {t.count}
                            </span>
                        ) : null}
                    </button>
                )
            })}
        </nav>
    )
}
