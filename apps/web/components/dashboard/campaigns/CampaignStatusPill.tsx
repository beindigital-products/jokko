import { Chip } from "../primitives/Chip"
import type { CampaignStatus } from "./types"

const STATUS: Record<CampaignStatus, { tone: "accent" | "neutral" | "good" | "warn"; label: string }> = {
    sending: { tone: "accent", label: "En cours" },
    scheduled: { tone: "neutral", label: "Planifiée" },
    completed: { tone: "good", label: "Terminée" },
    draft: { tone: "neutral", label: "Brouillon" },
    paused: { tone: "warn", label: "En pause" },
}

/** Status badge for a broadcast campaign. */
export function CampaignStatusPill({ status }: { status: CampaignStatus }) {
    const s = STATUS[status]
    return <Chip tone={s.tone}>{s.label}</Chip>
}
