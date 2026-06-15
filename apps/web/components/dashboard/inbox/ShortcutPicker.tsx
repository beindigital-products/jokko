"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

import { Chip } from "../primitives/Chip"

export interface ShortcutEntry {
    id: string
    /** Trigger keyword without leading slash, eg `merci`. */
    keyword: string
    label: string
    body: string
    category?: string
}

interface ShortcutPickerProps {
    shortcuts: ShortcutEntry[]
    /** Current query (text after `/`). Filters by keyword or label
     *  prefix/contains, case-insensitive. */
    query?: string
    activeId?: string
    onSelect?: (shortcut: ShortcutEntry) => void
    onHover?: (id: string) => void
    className?: string
}

/**
 * ShortcutPicker — floating popover triggered by typing `/` in the
 * composer. Lists team-wide quick replies / canned responses. Each row
 * shows `/keyword` mono + human label + body preview + optional
 * category chip. On select, the consumer inserts `body` into the
 * textarea (replacing the `/{query}` token).
 *
 * Positioning is the consumer's responsibility — render inside a
 * `position: relative` parent and place absolutely above the caret.
 */
export function ShortcutPicker({
    shortcuts,
    query = "",
    activeId,
    onSelect,
    onHover,
    className,
}: ShortcutPickerProps) {
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return shortcuts
        return shortcuts.filter(
            (s) =>
                s.keyword.toLowerCase().includes(q) ||
                s.label.toLowerCase().includes(q),
        )
    }, [shortcuts, query])

    return (
        <div
            role="listbox"
            aria-label="Insérer un raccourci"
            className={cn(
                "w-[320px] overflow-hidden rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-lg",
                className,
            )}
        >
            <div className="flex items-center justify-between border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                    Raccourci
                </span>
                <span className="font-mono text-[10px] text-[var(--ink-soft)]">/{query}</span>
            </div>
            <ul className="max-h-[260px] overflow-y-auto py-1">
                {filtered.length === 0 ? (
                    <li className="px-3 py-4 text-center text-[12px] text-[var(--ink-soft)]">
                        Aucun raccourci ne correspond à « /{query} ».
                    </li>
                ) : null}
                {filtered.map((s) => {
                    const active = s.id === activeId
                    return (
                        <li key={s.id} role="option" aria-selected={active}>
                            <button
                                type="button"
                                onClick={() => onSelect?.(s)}
                                onMouseEnter={() => onHover?.(s.id)}
                                className={cn(
                                    "flex w-full items-start gap-3 px-3 py-2 text-left transition-colors",
                                    active
                                        ? "bg-[var(--accent-muted)]/60"
                                        : "hover:bg-[var(--paper-warm)]",
                                )}
                            >
                                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-[var(--paper-warm)] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-[var(--ink-700)]">
                                    /{s.keyword}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[12.5px] font-semibold text-[var(--ink-900)]">
                                            {s.label}
                                        </span>
                                        {s.category ? (
                                            <Chip tone="neutral">{s.category}</Chip>
                                        ) : null}
                                    </div>
                                    <p className="mt-0.5 truncate text-[11.5px] text-[var(--ink-soft)]">
                                        {s.body}
                                    </p>
                                </div>
                            </button>
                        </li>
                    )
                })}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-3 py-1.5 font-mono text-[10px] text-[var(--ink-soft)]">
                <span>↑↓ Naviguer · ↵ Sélectionner</span>
                <span>Esc Fermer</span>
            </div>
        </div>
    )
}
