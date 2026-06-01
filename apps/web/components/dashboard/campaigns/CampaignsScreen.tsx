"use client"

import { Plus, SlidersHorizontal } from "lucide-react"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { CampaignKpis } from "./CampaignKpis"
import { CampaignsTable } from "./CampaignsTable"
import type { CampaignsData } from "./types"

/**
 * CampaignsScreen — v3 "Campagnes" page. Composes header + KPI strip
 * (CampaignKpis) + broadcast table (CampaignsTable). Recreates the
 * `Jokko Desktop.html` ScreenCampaigns design. Pure presentational.
 */
export function CampaignsScreen({ data }: { data: CampaignsData }) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Diffusion · ${data.count}`}
                title="Campagnes"
                description="Diffusions massives sur templates approuvés Meta. Audiences segmentées, planification, suivi livraison + ROI."
                actions={
                    <>
                        <HeaderButton icon={SlidersHorizontal}>Filtres</HeaderButton>
                        <HeaderButton icon={Plus} variant="primary">
                            Nouvelle campagne
                        </HeaderButton>
                    </>
                }
            />
            <CampaignKpis kpis={data.kpis} />
            <CampaignsTable campaigns={data.campaigns} />
        </div>
    )
}
