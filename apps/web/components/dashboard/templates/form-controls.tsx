"use client"

import { type ReactNode } from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Shared v3 form primitives for the template flows — the paper-ink field /
 * select / textarea, the labelled `Field` wrapper, the inline "+ Variable"
 * accent button and a bordered `FormSection`. Used by both the
 * `TemplateCreateModal` (simple types) and the full-page `TemplateBuilder`
 * (advanced types / edit) so every control looks identical.
 */

/** Base class: paper field, ink border, accent focus ring. */
export const FIELD_CLS =
    "w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13px] text-[var(--ink-900)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"

export function Field({
    label,
    hint,
    action,
    children,
}: {
    label: string
    hint?: string
    action?: ReactNode
    children: ReactNode
}) {
    return (
        <label className="block">
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-[var(--ink-700)]">{label}</span>
                {action}
            </div>
            {children}
            {hint ? <p className="mt-1 text-[10.5px] text-[var(--ink-soft)]">{hint}</p> : null}
        </label>
    )
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn(FIELD_CLS, "h-9", props.className)} />
}

export function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={cn(FIELD_CLS, "h-9 appearance-none pr-8", props.className)} />
}

export function TextareaField(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={cn(FIELD_CLS, "resize-none py-2 leading-relaxed", props.className)} />
}

/** Inline accent button that appends the next `{{N}}` token to a field. */
export function VariableButton({
    onClick,
    label = "Variable",
    disabled,
}: {
    onClick: () => void
    label?: string
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent)] transition hover:bg-[var(--accent-muted)] disabled:cursor-not-allowed disabled:opacity-40"
        >
            <Plus className="h-3 w-3" />
            {label}
        </button>
    )
}

/** A top-bordered block used to separate form groups (header / body / …). */
export function FormSection({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn("border-t border-[var(--ink-100)] pt-5", className)}>{children}</div>
}

/** Append the next `{{N}}` token to a body of text, returning the new value. */
export function appendVariable(current: string): string {
    const matches = current.match(/\{\{(\d+)\}\}/g)
    const next = matches ? matches.length + 1 : 1
    return `${current} {{${next}}} `
}
