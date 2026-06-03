import { Chip } from "../primitives/Chip"
import type { TemplateStatus } from "./types"

const STATUS: Record<TemplateStatus, { tone: "good" | "warn" | "danger" | "neutral"; label: string }> = {
    approved: { tone: "good", label: "Approuvé" },
    pending: { tone: "warn", label: "En attente" },
    rejected: { tone: "danger", label: "Refusé" },
    draft: { tone: "neutral", label: "Brouillon" },
}

/** Meta approval status badge for a WhatsApp template. */
export function TemplateStatusPill({ status }: { status: TemplateStatus }) {
    const s = STATUS[status]
    return <Chip tone={s.tone}>{s.label}</Chip>
}
