"use client"

import { useState } from "react"
import { Plus, RotateCcw, Search } from "lucide-react"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { FilterPills } from "../shell/FilterPills"
import { TemplatesTable } from "./TemplatesTable"
import { TemplatePreviewPanel } from "./TemplatePreviewPanel"
import type { TemplatesData } from "./types"

/**
 * TemplatesScreen — v3 "Modèles" page. Composes header + category filter
 * pills + split-pane layout: templates table (list) on the left and a
 * WhatsApp-style preview panel on the right. Recreates ScreenTemplates
 * from the design handoff. Pure presentational.
 */
export function TemplatesScreen({
    data,
    canEdit = true,
}: {
    data: TemplatesData
    canEdit?: boolean
}) {
    const [activeCategory, setActiveCategory] = useState<string>(
        data.categories[0]?.key ?? "all",
    )
    const [selectedId, setSelectedId] = useState<string | undefined>(
        data.selectedId ?? data.templates[0]?.id,
    )

    const filtered =
        activeCategory === "all"
            ? data.templates
            : data.templates.filter(
                  (t) => t.category.toLowerCase() === activeCategory.toLowerCase(),
              )

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
                        <HeaderButton icon={RotateCcw}>Sync Meta</HeaderButton>
                        {canEdit ? (
                            <HeaderButton icon={Plus} variant="primary">
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

            {/* Filter pills row with search trailing slot */}
            <FilterPills
                items={data.categories}
                activeKey={activeCategory}
                onChange={setActiveCategory}
                trailing={
                    <div className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 text-[12px] text-[var(--ink-soft)]">
                        <Search className="h-3 w-3 shrink-0" />
                        <span>Rechercher</span>
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
                <TemplatePreviewPanel template={selectedTemplate} canEdit={canEdit} />
            </div>
        </div>
    )
}
