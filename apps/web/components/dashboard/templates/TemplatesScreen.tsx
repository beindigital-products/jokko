"use client"

import { useState } from "react"
import { Plus, RotateCcw, Search } from "lucide-react"

import type { TemplateType } from "@/convex/lib/templateTypes"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { FilterPills } from "../shell/FilterPills"
import { TemplatesTable } from "./TemplatesTable"
import { TemplatePreviewPanel } from "./TemplatePreviewPanel"
import { TemplateCreateModal, type TemplateCreatePayload } from "./TemplateCreateModal"
import { TemplatesTabs, type TemplatesTab } from "./TemplatesTabs"
import type { TemplateRow, TemplatesData } from "./types"

/**
 * TemplatesScreen — v3 "Modèles" page. Composes header + category filter
 * pills + split-pane layout: templates table (list) on the left and a
 * WhatsApp-style preview panel on the right. Recreates ScreenTemplates
 * from the design handoff. Pure presentational.
 */
interface TemplatesScreenProps {
    data: TemplatesData
    canEdit?: boolean
    /** Active view + switch (Modèles ↔ Réponses rapides). */
    tab?: TemplatesTab
    onTab?: (tab: TemplatesTab) => void
    /** Sync-from-Meta in flight (spins the header button). */
    syncing?: boolean
    onSync?: () => void
    onCreate?: (payload: TemplateCreatePayload, opts: { submit: boolean }) => void
    /** Picked type needs the advanced (legacy) builder. */
    onAdvanced?: (type: TemplateType) => void
    onEdit?: (template: TemplateRow) => void
    onDelete?: (template: TemplateRow) => void
    onUse?: (template: TemplateRow) => void
}

export function TemplatesScreen({
    data,
    canEdit = true,
    tab,
    onTab,
    syncing,
    onSync,
    onCreate,
    onAdvanced,
    onEdit,
    onDelete,
    onUse,
}: TemplatesScreenProps) {
    const [activeCategory, setActiveCategory] = useState<string>(
        data.categories[0]?.key ?? "all",
    )
    const [selectedId, setSelectedId] = useState<string | undefined>(
        data.selectedId ?? data.templates[0]?.id,
    )
    const [createOpen, setCreateOpen] = useState(false)
    const [search, setSearch] = useState("")

    const filtered = data.templates.filter((t) => {
        const okCategory =
            activeCategory === "all" || t.category.toLowerCase() === activeCategory.toLowerCase()
        const okSearch =
            !search.trim() || t.name.toLowerCase().includes(search.trim().toLowerCase())
        return okCategory && okSearch
    })

    const selectedTemplate =
        filtered.find((t) => t.id === selectedId) ?? filtered[0] ?? null

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Données · ${data.count}`}
                title="Modèles"
                description="Templates WhatsApp synchronisés avec Meta. Header, body, footer, variables. Soumission + suivi approbation."
                actions={
                    <>
                        <HeaderButton icon={RotateCcw} onClick={onSync}>
                            {syncing ? "Sync…" : "Sync Meta"}
                        </HeaderButton>
                        {canEdit ? (
                            <HeaderButton
                                icon={Plus}
                                variant="primary"
                                onClick={() => setCreateOpen(true)}
                            >
                                Nouveau modèle
                            </HeaderButton>
                        ) : (
                            <HeaderButton icon={Plus} variant="primary">
                                Utiliser dans une conv.
                            </HeaderButton>
                        )}
                    </>
                }
            />

            {tab && onTab ? (
                <div className="border-b border-[var(--ink-200)] px-4 py-2.5 sm:px-8">
                    <TemplatesTabs tab={tab} onTab={onTab} />
                </div>
            ) : null}

            {/* Filter pills row with search trailing slot */}
            <FilterPills
                items={data.categories}
                activeKey={activeCategory}
                onChange={setActiveCategory}
                trailing={
                    <div className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5">
                        <Search className="h-3 w-3 shrink-0 text-[var(--ink-400)]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher"
                            aria-label="Rechercher un modèle"
                            className="w-[110px] bg-transparent text-[12px] text-[var(--ink-900)] placeholder:text-[var(--ink-soft)] focus:outline-none"
                        />
                    </div>
                }
            />

            {/* Split pane: list + preview */}
            <div className="flex min-h-0 flex-1">
                {/* Left: templates table */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <TemplatesTable
                        templates={filtered}
                        selectedId={selectedTemplate?.id}
                        onSelect={setSelectedId}
                    />
                </div>

                {/* Right: preview rail */}
                <TemplatePreviewPanel
                    template={selectedTemplate}
                    canEdit={canEdit}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUse={onUse}
                />
            </div>

            {canEdit ? (
                <TemplateCreateModal
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    onCreate={onCreate}
                    onAdvanced={(type) => {
                        setCreateOpen(false)
                        onAdvanced?.(type)
                    }}
                />
            ) : null}
        </div>
    )
}
