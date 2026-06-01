"use client"

import { useState } from "react"
import { Globe, Plus } from "lucide-react"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { CategoryFilterBar } from "./CategoryFilterBar"
import { IntegrationSection } from "./IntegrationSection"
import type { FilterCategory, Integration, IntegrationCategory, IntegrationsData } from "./types"

/** Ordered list of category headings used when "Tous" is selected. */
const GROUPED_ORDER: IntegrationCategory[] = [
    "CRM",
    "Prod.",
    "Messagerie",
    "Paiement",
    "E-commerce",
    "API",
]

/**
 * IntegrationsScreen — v3 "Intégrations" page. Composes PageHeader +
 * category filter bar + grouped or filtered 3-col integration card grid.
 * Recreates `ScreenIntegrations` from screens-extra.jsx. Presentational.
 */
export function IntegrationsScreen({ data }: { data: IntegrationsData }) {
    const [activeFilter, setActiveFilter] = useState<FilterCategory>("Tous")

    const filtered: Integration[] =
        activeFilter === "Tous"
            ? data.integrations
            : data.integrations.filter((it) => it.cat === activeFilter)

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Connecteurs · ${data.activeCount} actifs`}
                title="Intégrations"
                description="Connectez votre CRM, vos outils internes et déclenchez Jokko depuis n'importe où."
                actions={
                    <>
                        <HeaderButton icon={Globe}>Documentation API</HeaderButton>
                        <HeaderButton icon={Plus} variant="primary">
                            Demander une intégration
                        </HeaderButton>
                    </>
                }
            />

            <CategoryFilterBar active={activeFilter} onSelect={setActiveFilter} />

            <div className="flex-1 overflow-y-auto px-7 pb-10 pt-6">
                {activeFilter === "Tous" ? (
                    <div className="space-y-8">
                        {GROUPED_ORDER.map((cat) => {
                            const items = filtered.filter((it) => it.cat === cat)
                            return (
                                <IntegrationSection
                                    key={cat}
                                    title={cat}
                                    integrations={items}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <IntegrationSection integrations={filtered} />
                )}
            </div>
        </div>
    )
}
