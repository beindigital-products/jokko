"use client"

import { FileText, Zap } from "lucide-react"

import { cn } from "@/lib/utils"

export type TemplatesTab = "templates" | "shortcuts"

const TABS: { key: TemplatesTab; label: string; icon: typeof FileText }[] = [
    { key: "templates", label: "Modèles WhatsApp", icon: FileText },
    { key: "shortcuts", label: "Réponses rapides", icon: Zap },
]

/**
 * TemplatesTabs — segmented switch between the "Modèles WhatsApp" and
 * "Réponses rapides" views of the Modèles page. Shared by TemplatesScreen and
 * ShortcutsScreen so the control stays identical across both.
 */
export function TemplatesTabs({
    tab,
    onTab,
}: {
    tab: TemplatesTab
    onTab: (tab: TemplatesTab) => void
}) {
    return (
        <div className="inline-flex items-center gap-0.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] p-0.5">
            {TABS.map((t) => {
                const active = t.key === tab
                return (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => onTab(t.key)}
                        aria-pressed={active}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[12.5px] font-medium transition-colors",
                            active
                                ? "bg-[var(--paper-white)] text-[var(--ink-900)] shadow-sm"
                                : "text-[var(--ink-soft)] hover:text-[var(--ink-700)]",
                        )}
                    >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                    </button>
                )
            })}
        </div>
    )
}
