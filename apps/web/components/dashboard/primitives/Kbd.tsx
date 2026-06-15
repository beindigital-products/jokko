import type { ReactNode } from "react"

/**
 * Kbd — a single keyboard key cap.
 *
 * Documented in Storybook (Primitives · Inputs). Used to surface shortcuts in
 * search fields, command palettes and tooltips. Rounded 6px, paper-warm fill.
 */
export function Kbd({ children }: { children: ReactNode }) {
    return (
        <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[6px] border border-[var(--ink-200)] bg-[var(--paper-warm)] px-1.5 font-mono text-[11px] text-[var(--ink-700)]">
            {children}
        </kbd>
    )
}
