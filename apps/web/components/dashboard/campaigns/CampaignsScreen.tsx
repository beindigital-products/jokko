"use client"

import { useState } from "react"
import { Check, Plus, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { CampaignKpis } from "./CampaignKpis"
import { CampaignsTable } from "./CampaignsTable"
import type { CampaignStatus, CampaignsData } from "./types"

type StatusFilter = CampaignStatus | "all"

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Toutes les campagnes" },
    { key: "sending", label: "En cours" },
    { key: "scheduled", label: "Planifiées" },
    { key: "completed", label: "Terminées" },
    { key: "paused", label: "En pause" },
    { key: "draft", label: "Brouillons" },
]

interface CampaignsScreenProps {
    data: CampaignsData
    /** Open the creation wizard (header "Nouvelle campagne"). */
    onNew?: () => void
    /** Open a campaign's detail (row click). */
    onOpenRow?: (id: string) => void
    /** Optional slot above the table (e.g. the marketing-credit bar). */
    creditBar?: React.ReactNode
    canEdit?: boolean
}

/**
 * CampaignsScreen — v3 "Campagnes" page. Composes header + KPI strip
 * (CampaignKpis) + optional credit bar + broadcast table (CampaignsTable).
 * The "Filtres" button filters the list by status. Recreates the
 * `Jokko Desktop.html` ScreenCampaigns design.
 */
export function CampaignsScreen({ data, onNew, onOpenRow, creditBar, canEdit = true }: CampaignsScreenProps) {
    const [status, setStatus] = useState<StatusFilter>("all")

    const campaigns = status === "all" ? data.campaigns : data.campaigns.filter((c) => c.status === status)
    const activeLabel = STATUS_FILTERS.find((f) => f.key === status)?.label

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Diffusion · ${data.count}`}
                title="Campagnes"
                description="Diffusions massives sur templates approuvés Meta. Audiences segmentées, planification, suivi livraison + ROI."
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
                            <DropdownMenuContent align="end" className="min-w-[200px]">
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
                                Nouvelle campagne
                            </HeaderButton>
                        ) : null}
                    </>
                }
            />
            <CampaignKpis kpis={data.kpis} />
            {creditBar ? (
                <div className="border-b border-[var(--ink-200)] px-4 py-4 sm:px-8">{creditBar}</div>
            ) : null}
            <CampaignsTable
                campaigns={campaigns}
                onOpen={onOpenRow}
                emptyLabel={status === "all" ? undefined : "Aucune campagne pour ce filtre."}
            />
        </div>
    )
}
