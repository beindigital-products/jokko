"use client"

import { cn } from "@/lib/utils"

export interface FilterPillItem {
    key: string
    label: string
    count?: number | string
}

interface FilterPillsProps {
    items: FilterPillItem[]
    activeKey: string
    onChange?: (key: string) => void
    trailing?: React.ReactNode
}

/**
 * FilterPills — filter tabs row. Active pill = ink-900 fill / white,
 * inactive = paper-warm / ink-700. Optional right-side trailing slot
 * for a search input alongside the pills.
 */
export function FilterPills({ items, activeKey, onChange, trailing }: FilterPillsProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-8 pt-5 pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
                {items.map((it) => {
                    const active = it.key === activeKey
                    return (
                        <button
                            key={it.key}
                            type="button"
                            onClick={() => onChange?.(it.key)}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                                active
                                    ? "bg-[var(--ink-900)] text-white"
                                    : "bg-[var(--paper-warm)] text-[var(--ink-700)] hover:bg-[var(--ink-100)]",
                            )}
                        >
                            {it.label}
                            {it.count != null ? (
                                <span
                                    className={cn(
                                        "font-mono text-[10px]",
                                        active ? "text-white/70" : "text-[var(--ink-soft)]",
                                    )}
                                >
                                    {it.count}
                                </span>
                            ) : null}
                        </button>
                    )
                })}
            </div>
            {trailing}
        </div>
    )
}
