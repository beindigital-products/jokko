import { Search } from "lucide-react"

import type { FilterCategory } from "./types"

const ALL_CATEGORIES: FilterCategory[] = [
    "Tous",
    "CRM",
    "Prod.",
    "Messagerie",
    "Paiement",
    "E-commerce",
    "API",
]

interface CategoryFilterBarProps {
    active: FilterCategory
    onSelect: (cat: FilterCategory) => void
}

/**
 * CategoryFilterBar — horizontal pill filter row + search input.
 * Sits between the PageHeader and the integrations grid, separated
 * by a hairline bottom border.
 */
export function CategoryFilterBar({ active, onSelect }: CategoryFilterBarProps) {
    return (
        <div className="flex items-center gap-2 border-b border-[var(--ink-200)] px-7 py-3.5">
            {ALL_CATEGORIES.map((cat) => {
                const isActive = cat === active
                return (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => onSelect(cat)}
                        className="cursor-pointer rounded-full border px-3 py-1 text-[12.5px] font-medium leading-none transition-colors"
                        style={{
                            background: isActive ? "var(--ink-900)" : "var(--paper-warm)",
                            color: isActive ? "var(--paper-white)" : "var(--ink-700)",
                            borderColor: isActive ? "var(--ink-900)" : "var(--ink-200)",
                            letterSpacing: "-0.005em",
                        }}
                    >
                        {cat}
                    </button>
                )
            })}

            <div className="flex-1" />

            {/* Search input (presentational) */}
            <div className="flex w-60 items-center gap-2 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5">
                <Search className="h-3 w-3 shrink-0 text-[var(--ink-soft)]" strokeWidth={2} />
                <span className="flex-1 text-[12.5px] text-[var(--ink-soft)]">
                    Rechercher une intégration
                </span>
            </div>
        </div>
    )
}
