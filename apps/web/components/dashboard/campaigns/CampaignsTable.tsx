import { CampaignRow } from "./CampaignRow"
import { CAMPAIGNS_COLS, type CampaignRow as CampaignRowData } from "./types"

/** Campaigns table — mono header + one CampaignRow per broadcast. */
export function CampaignsTable({
    campaigns,
    onOpen,
    emptyLabel = "Aucune campagne pour le moment.",
}: {
    campaigns: CampaignRowData[]
    onOpen?: (id: string) => void
    emptyLabel?: string
}) {
    return (
        <div className="flex-1 overflow-auto">
            <div className="min-w-[760px]">
                <div
                    className="grid items-center gap-x-5 border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-8 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]"
                    style={{ gridTemplateColumns: CAMPAIGNS_COLS, height: 38 }}
                >
                    <div>Campagne</div>
                    <div>Statut · démarrage</div>
                    <div>Modèle</div>
                    <div className="text-right">Audience</div>
                    <div className="text-right">Livrés</div>
                    <div className="text-right">Lus</div>
                    <div className="text-right">Coût</div>
                </div>
                {campaigns.length === 0 ? (
                    <div className="px-8 py-16 text-center text-[13px] text-[var(--ink-soft)]">
                        {emptyLabel}
                    </div>
                ) : (
                    campaigns.map((c) => <CampaignRow key={c.id} campaign={c} onOpen={onOpen} />)
                )}
            </div>
        </div>
    )
}
