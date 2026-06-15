"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

import { Chip } from "../primitives/Chip"
import { StatusDot, type StatusDotTone } from "../primitives/StatusDot"

export type TemplateCategory = "marketing" | "utility" | "authentication"
export type TemplateStatus = "approved" | "pending" | "rejected"

export interface TemplateEntry {
    id: string
    name: string
    body: string
    category: TemplateCategory
    language: string
    status: TemplateStatus
}

interface TemplatePickerProps {
    templates: TemplateEntry[]
    onSelect?: (template: TemplateEntry) => void
    /** Defaults to a built-in fuzzy contains. Override to plug Meta search. */
    onSearch?: (query: string) => void
    placeholder?: string
}

const CATEGORY_LABEL: Record<TemplateCategory, string> = {
    marketing: "Marketing",
    utility: "Utility",
    authentication: "Auth",
}

const STATUS_TONE: Record<TemplateStatus, StatusDotTone> = {
    approved: "good",
    pending: "warn",
    rejected: "danger",
}

const STATUS_LABEL: Record<TemplateStatus, string> = {
    approved: "Approuvé",
    pending: "En attente",
    rejected: "Refusé",
}

/**
 * TemplatePicker — picker shown when the composer is in "Modèles" mode.
 * Search input + scrollable list. Each row shows template name, body
 * snippet, category + language chips, status dot. Click selects.
 */
export function TemplatePicker({
    templates,
    onSelect,
    onSearch,
    placeholder = "Rechercher un modèle…",
}: TemplatePickerProps) {
    const [query, setQuery] = useState("")
    const filtered = useMemo(() => {
        if (onSearch) return templates
        const q = query.trim().toLowerCase()
        if (!q) return templates
        return templates.filter((t) =>
            (t.name + " " + t.body).toLowerCase().includes(q),
        )
    }, [templates, query, onSearch])

    return (
        <div className="overflow-hidden rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-sm">
            <div className="border-b border-[var(--ink-200)] px-3 py-2">
                <div className="flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            onSearch?.(e.target.value)
                        }}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent text-[12px] placeholder:text-[var(--ink-400)] focus:outline-none"
                    />
                </div>
            </div>
            <ul className="max-h-[280px] divide-y divide-[var(--ink-100)] overflow-y-auto">
                {filtered.length === 0 ? (
                    <li className="px-4 py-6 text-center text-[12px] text-[var(--ink-soft)]">
                        Aucun modèle ne correspond.
                    </li>
                ) : null}
                {filtered.map((t) => (
                    <li key={t.id}>
                        <button
                            type="button"
                            onClick={() => onSelect?.(t)}
                            disabled={t.status !== "approved"}
                            className={cn(
                                "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                                t.status === "approved"
                                    ? "hover:bg-[var(--paper-warm)]"
                                    : "opacity-60 cursor-not-allowed",
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-semibold text-[var(--ink-900)]">
                                        {t.name}
                                    </span>
                                    <Chip tone="neutral">{CATEGORY_LABEL[t.category]}</Chip>
                                    <Chip tone="neutral">{t.language}</Chip>
                                </div>
                                <p className="mt-1 truncate font-mono text-[11px] text-[var(--ink-soft)]">
                                    {t.body}
                                </p>
                            </div>
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                                <StatusDot tone={STATUS_TONE[t.status]} />
                                {STATUS_LABEL[t.status]}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
