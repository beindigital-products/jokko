import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"

/**
 * v3 Settings primitives — paper/ink cards with a mono-less header (icon badge +
 * title + description), optional right slot, and an optional footer (save bar).
 * Shared across every Réglages section so the page reads consistently.
 */
export function SettingsCard({
    icon: Icon,
    title,
    description,
    headerRight,
    children,
    footer,
    tone = "default",
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description?: string
    headerRight?: ReactNode
    children?: ReactNode
    footer?: ReactNode
    tone?: "default" | "danger"
}) {
    const danger = tone === "danger"
    return (
        <section
            className={`overflow-hidden rounded-xl border ${danger ? "border-[var(--status-danger)]/30" : "border-[var(--ink-200)]"} bg-[var(--paper-white)]`}
        >
            <header className="flex items-center gap-3 border-b border-[var(--ink-100)] px-5 py-4">
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${danger ? "bg-[var(--status-danger-soft)] text-[var(--status-danger)]" : "bg-[var(--accent-muted)] text-[var(--accent)]"}`}
                >
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3
                        className={`text-[14px] font-semibold tracking-tight ${danger ? "text-[var(--status-danger)]" : "text-[var(--ink-900)]"}`}
                    >
                        {title}
                    </h3>
                    {description ? (
                        <p className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">{description}</p>
                    ) : null}
                </div>
                {headerRight}
            </header>
            {children ? <div className="px-5 py-5">{children}</div> : null}
            {footer ? (
                <footer className="flex items-center justify-end gap-2 border-t border-[var(--ink-100)] bg-[var(--paper-warm)] px-5 py-3">
                    {footer}
                </footer>
            ) : null}
        </section>
    )
}

/** v3 dark primary save button (with spinner). */
export function SaveButton({
    onClick,
    loading,
    children = "Enregistrer",
    disabled,
}: {
    onClick?: () => void
    loading?: boolean
    children?: ReactNode
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading || disabled}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-50"
        >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {children}
        </button>
    )
}

/** Field label + control + optional hint. */
export function Field({
    label,
    htmlFor,
    hint,
    children,
}: {
    label: string
    htmlFor?: string
    hint?: string
    children: ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={htmlFor}
                className="text-[12px] font-medium tracking-tight text-[var(--ink-700)]"
            >
                {label}
            </label>
            {children}
            {hint ? <p className="text-[11px] text-[var(--ink-soft)]">{hint}</p> : null}
        </div>
    )
}

/** A row inside a card body: title + description on the left, control on the right. */
export function SettingRow({
    title,
    description,
    control,
    disabled,
}: {
    title: string
    description?: string
    control: ReactNode
    disabled?: boolean
}) {
    return (
        <div className={`flex items-center justify-between gap-4 ${disabled ? "opacity-50" : ""}`}>
            <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-[var(--ink-900)]">{title}</p>
                {description ? (
                    <p className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">{description}</p>
                ) : null}
            </div>
            <div className="shrink-0">{control}</div>
        </div>
    )
}
