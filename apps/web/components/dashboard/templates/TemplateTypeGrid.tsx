"use client"

import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    TEMPLATE_TYPE_CONFIGS,
    TEMPLATE_TYPE_GROUPS,
    type TemplateType,
} from "@/convex/lib/templateTypes"
import { Chip } from "../primitives/Chip"
import { TEMPLATE_TYPE_ICONS } from "./template-type-icons"

interface TemplateTypeGridProps {
    selectedType?: TemplateType
    onSelect: (type: TemplateType) => void
    /** Optional predicate to restrict which types are offered (e.g. advanced only). */
    filter?: (type: TemplateType) => boolean
}

/**
 * TemplateTypeGrid — groups every WhatsApp template type (Base / Interactifs /
 * E-commerce / Avancés) from the shared {@link TEMPLATE_TYPE_CONFIGS} into
 * selectable v3 cards. Used as the "advanced formats" picker inside the
 * creation wizard. Presentational.
 */
export function TemplateTypeGrid({ selectedType, onSelect, filter }: TemplateTypeGridProps) {
    const groups = TEMPLATE_TYPE_GROUPS.map((group) => ({
        ...group,
        types: filter ? group.types.filter(filter) : group.types,
    })).filter((group) => group.types.length > 0)

    return (
        <div className="space-y-7">
            {groups.map((group) => (
                <section key={group.id}>
                    <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        {group.titleFr}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-[var(--ink-500)]">
                        {group.descriptionFr}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {group.types.map((type) => {
                            const config = TEMPLATE_TYPE_CONFIGS[type]
                            const TypeIcon = TEMPLATE_TYPE_ICONS[type]
                            const active = selectedType === type
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => onSelect(type)}
                                    className={cn(
                                        "group flex items-start gap-3 rounded-xl border p-3.5 text-left transition",
                                        active
                                            ? "border-[var(--accent)] bg-[var(--accent-muted)] ring-1 ring-[var(--accent)]"
                                            : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:border-[var(--ink-300)] hover:bg-[var(--paper-warm)]",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition",
                                            active
                                                ? "border-[var(--accent)]/30 bg-[var(--paper-white)] text-[var(--accent)]"
                                                : "border-[var(--ink-100)] bg-[var(--paper-warm)] text-[var(--ink-500)] group-hover:text-[var(--ink-700)]",
                                        )}
                                    >
                                        <TypeIcon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[13.5px] font-semibold text-[var(--ink-900)]">
                                                {config.labelFr}
                                            </span>
                                            <ArrowRight
                                                className={cn(
                                                    "h-3.5 w-3.5 shrink-0 text-[var(--accent)] transition-opacity",
                                                    active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                                )}
                                            />
                                        </div>
                                        <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--ink-500)]">
                                            {config.descriptionFr}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {config.categories.map((cat) => (
                                                <Chip key={cat} tone="neutral">
                                                    {cat}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>
            ))}
        </div>
    )
}
