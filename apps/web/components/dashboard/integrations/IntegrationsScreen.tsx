"use client"

import { useMemo, useState } from "react"
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

interface IntegrationsScreenProps {
    data: IntegrationsData
    /** Connect a not-yet-connected provider (passes the integration id = provider key). */
    onConnect?: (id: string) => void
    /** Open a connected provider's settings (passes the integration id = provider key). */
    onConfigure?: (id: string) => void
    /** Disconnect a connected provider (passes the integration id = provider key). */
    onDisconnect?: (id: string) => void
    /** Header actions. */
    onDocs?: () => void
    onRequest?: () => void
    /** Optional slot above the grid (e.g. the opt-in RGPD banner). */
    banner?: React.ReactNode
}

/**
 * IntegrationsScreen — v3 "Intégrations" page. Composes PageHeader +
 * category filter bar (with live search) + grouped or filtered 3-col
 * integration card grid. Recreates `ScreenIntegrations` from screens-extra.jsx.
 */
export function IntegrationsScreen({ data, onConnect, onConfigure, onDisconnect, onDocs, onRequest, banner }: IntegrationsScreenProps) {
    const [activeFilter, setActiveFilter] = useState<FilterCategory>("Tous")
    const [query, setQuery] = useState("")

    const filtered: Integration[] = useMemo(() => {
        const q = query.trim().toLowerCase()
        return data.integrations.filter((it) => {
            const catOk = activeFilter === "Tous" || it.cat === activeFilter
            const queryOk = !q || it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)
            return catOk && queryOk
        })
    }, [data.integrations, activeFilter, query])

    const grouped = activeFilter === "Tous" && !query.trim()

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Connecteurs · ${data.activeCount} actif${data.activeCount > 1 ? "s" : ""}`}
                title="Intégrations"
                description="Connectez votre CRM, vos outils internes et déclenchez Jokko depuis n'importe où."
                actions={
                    <>
                        <HeaderButton icon={Globe} onClick={onDocs}>
                            Documentation API
                        </HeaderButton>
                        <HeaderButton icon={Plus} variant="primary" onClick={onRequest}>
                            Demander une intégration
                        </HeaderButton>
                    </>
                }
            />

            <CategoryFilterBar active={activeFilter} onSelect={setActiveFilter} query={query} onQuery={setQuery} />

            <div className="flex-1 overflow-y-auto px-7 pb-10 pt-6">
                {banner ? <div className="mb-6">{banner}</div> : null}
                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-[13px] text-[var(--ink-soft)]">
                        Aucune intégration ne correspond à votre recherche.
                    </div>
                ) : grouped ? (
                    <div className="space-y-8">
                        {GROUPED_ORDER.map((cat) => (
                            <IntegrationSection
                                key={cat}
                                title={cat}
                                integrations={filtered.filter((it) => it.cat === cat)}
                                onConnect={onConnect}
                                onConfigure={onConfigure}
                                onDisconnect={onDisconnect}
                            />
                        ))}
                    </div>
                ) : (
                    <IntegrationSection
                        integrations={filtered}
                        onConnect={onConnect}
                        onConfigure={onConfigure}
                        onDisconnect={onDisconnect}
                    />
                )}
            </div>
        </div>
    )
}
