"use client"

import { useState } from "react"
import { Check, Plus, Sparkles, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { Icon } from "../primitives/Icon"
import { AutomationKpis } from "./AutomationKpis"
import { AutomationsTable } from "./AutomationsTable"
import type { AutomationRowActions } from "./AutomationRow"
import type { AutomationsData } from "./types"

type StatusFilter = "all" | "active" | "draft"

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Toutes les automatisations" },
    { key: "active", label: "Actives" },
    { key: "draft", label: "Brouillons" },
]

interface AutomationsScreenProps extends AutomationRowActions {
    data: AutomationsData
    /** Open the creation modal (header "Nouvelle automatisation"). */
    onNew?: () => void
}

/**
 * AutomationsScreen — v3 "Automatisations" page. Composes header + KPI strip
 * + status filter + flow table. The shared v3 list look (mono header on
 * paper-warm, grid rows) matches Campagnes / Modèles / Contacts. Adapts the
 * design's `ScreenFlows` list rail into a full-width list; the canvas lives in
 * the editor route.
 */
export function AutomationsScreen({ data, onNew, canEdit = true, ...rowActions }: AutomationsScreenProps) {
    const [status, setStatus] = useState<StatusFilter>("all")

    const automations =
        status === "all"
            ? data.automations
            : data.automations.filter((a) => (status === "active" ? a.active : !a.active))
    const activeLabel = STATUS_FILTERS.find((f) => f.key === status)?.label

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Automatisation · ${data.count}`}
                title="Automatisations"
                description="Builder visuel — déclencheurs, conditions, actions. Exécution serveur sur chaque message entrant."
                actions={
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors",
                                        status === "all"
                                            ? "border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                                            : "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]",
                                    )}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    {status === "all" ? "Filtres" : activeLabel}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[220px]">
                                {STATUS_FILTERS.map((f) => (
                                    <DropdownMenuItem
                                        key={f.key}
                                        onClick={() => setStatus(f.key)}
                                        className="cursor-pointer gap-2 text-[13px]"
                                    >
                                        <span className="flex-1">{f.label}</span>
                                        {status === f.key ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : null}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {canEdit ? (
                            <HeaderButton icon={Plus} variant="primary" onClick={onNew}>
                                Nouvelle automatisation
                            </HeaderButton>
                        ) : null}
                    </>
                }
            />
            <AutomationKpis kpis={data.kpis} />
            {data.automations.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-6">
                    <div className="flex max-w-md flex-col items-center text-center">
                        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-muted)]">
                            <Icon name="bolt" size={26} color="var(--accent)" strokeWidth={1.7} />
                        </span>
                        <h2 className="font-display text-lg font-bold text-[var(--ink-900)]">Aucune automatisation</h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-500)]">
                            Créez votre premier flow pour répondre, trier et agir automatiquement sur chaque message
                            entrant.
                        </p>
                        {canEdit ? (
                            <div className="mt-5 flex items-center gap-2">
                                <HeaderButton icon={Sparkles} onClick={onNew}>
                                    Assistant IA
                                </HeaderButton>
                                <HeaderButton icon={Plus} variant="primary" onClick={onNew}>
                                    Nouvelle automatisation
                                </HeaderButton>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : (
                <AutomationsTable
                    automations={automations}
                    canEdit={canEdit}
                    emptyLabel={status === "all" ? undefined : "Aucune automatisation pour ce filtre."}
                    {...rowActions}
                />
            )}
        </div>
    )
}
