import type { AutomationsData, AutomationRowData as AutomationRow } from "@/components/dashboard/automations"

/**
 * automations-data — pure mappers turning `flows.list` docs into the v3
 * `AutomationsData` the AutomationsScreen consumes. Side-effect free →
 * unit-testable. The backend stores no run/conversion stats, so KPIs are
 * derived from counts only.
 */

export interface FlowDoc {
    _id: string
    name: string
    description?: string
    triggerType: string
    isActive: boolean
    updatedAt: number
}

/** Human label for a flow trigger type. */
export function triggerLabel(triggerType: string): string {
    switch (triggerType) {
        case "KEYWORD":
            return "Mot-clé"
        case "NEW_CONVERSATION":
            return "Nouveau message"
        case "SCHEDULE":
            return "Plage horaire"
        case "WEBHOOK":
            return "Webhook"
        case "NO_REPLY":
            return "Sans réponse"
        default:
            return "Nouveau message"
    }
}

/** Compact French relative time, e.g. "à l'instant", "il y a 5 min", "il y a 2 h". */
export function relativeTime(ts: number, now: number): string {
    const diff = Math.max(now - ts, 0)
    const min = Math.floor(diff / 60_000)
    if (min < 1) return "à l'instant"
    if (min < 60) return `il y a ${min} min`
    const h = Math.floor(min / 60)
    if (h < 24) return `il y a ${h} h`
    const d = Math.floor(h / 24)
    if (d < 7) return `il y a ${d} j`
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function mapRow(f: FlowDoc, now: number): AutomationRow {
    return {
        id: f._id,
        name: f.name,
        description: f.description?.trim() || "Automatisation WhatsApp",
        active: f.isActive,
        trigger: triggerLabel(f.triggerType),
        // Execution stats aren't tracked by the backend yet → placeholder.
        runs: "—",
        conv: "—",
        updated: relativeTime(f.updatedAt, now),
    }
}

export function mapAutomationsData(flows: FlowDoc[], now: number = Date.now()): AutomationsData {
    const total = flows.length
    const active = flows.filter((f) => f.isActive).length
    const draft = total - active
    const rate = total > 0 ? `${Math.round((active / total) * 100)}%` : "—"

    return {
        count: `${total} flow${total > 1 ? "s" : ""}`,
        kpis: [
            { label: "Total", value: String(total), delta: "flows créés" },
            { label: "Actives", value: String(active), delta: "en exécution" },
            { label: "Brouillons", value: String(draft), delta: "non publiés" },
            { label: "Taux d'activation", value: rate, delta: "actives / total" },
        ],
        automations: flows.map((f) => mapRow(f, now)),
    }
}
