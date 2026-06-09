import type { Integration, IntegrationsData } from "@/components/dashboard/integrations"

/**
 * integrations-data — pure mapper turning real Convex CRM data
 * (`crm.connections.listAvailableProviders` + `listForCurrentOrganization`)
 * into the v3 marketplace `IntegrationsData`. Side-effect free → unit-testable.
 *
 * The backend only exposes **CRM** connectors today (all functional), so those
 * render live (real status + connect/configure). The design's broader catalog
 * (Slack/Stripe/Notion/…) is surfaced as honest "Bientôt" showcase cards
 * (`available: false`) so the page reads as the full marketplace without dead
 * connect buttons.
 */

export interface ProviderDoc {
    key: string
    displayName: string
    authMode: "oauth2" | "apiKey"
    availability: "available" | "coming_soon"
    docsUrl?: string
}

export interface ConnectionDoc {
    _id: string
    provider: string
    status: "active" | "degraded" | "reconnect_required" | "disconnected"
    lastSyncAt?: number
    lastErrorAt?: number
}

/** Frontend copy for the known CRM providers (backend stores no desc). */
const CRM_DESC: Record<string, string> = {
    hubspot: "Sync contacts + deals, bidirectionnel.",
    pipedrive: "Pipeline deals + activités.",
    salesforce: "Comptes, opportunités, activités.",
    sellsy: "CRM + facturation française.",
    axonaut: "Gestion + facturation pour PME.",
    nocrm: "CRM léger orienté prospection.",
}

/** Aspirational connectors from the design, not yet backed by the API. */
const SHOWCASE: Integration[] = [
    { id: "notion", name: "Notion", desc: "Bases de contacts + docs internes.", cat: "Prod.", on: false, health: null, last: "—", available: false },
    { id: "sheets", name: "Google Sheets", desc: "Export auto vers feuille de calcul.", cat: "Prod.", on: false, health: null, last: "—", available: false },
    { id: "slack", name: "Slack", desc: "Notifications + commandes /jokko.", cat: "Messagerie", on: false, health: null, last: "—", available: false },
    { id: "teams", name: "Microsoft Teams", desc: "Notifications + bot dans les canaux.", cat: "Messagerie", on: false, health: null, last: "—", available: false },
    { id: "stripe", name: "Stripe", desc: "Liens de paiement dans les messages.", cat: "Paiement", on: false, health: null, last: "—", available: false },
    { id: "shopify", name: "Shopify", desc: "Commandes + statut livraison.", cat: "E-commerce", on: false, health: null, last: "—", available: false },
    { id: "webhook", name: "Webhook personnalisé", desc: "POST sortant sur événements.", cat: "API", on: false, health: null, last: "—", available: false },
    { id: "zapier", name: "Zapier", desc: "3 000+ apps via triggers.", cat: "API", on: false, health: null, last: "—", available: false },
]

/** Compact French relative time, e.g. "à l'instant", "il y a 4 min". */
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

function healthOf(status: ConnectionDoc["status"]): Integration["health"] {
    if (status === "active") return "good"
    if (status === "degraded" || status === "reconnect_required") return "warn"
    return null
}

function lastLabel(conn: ConnectionDoc, now: number): string {
    if (conn.status === "active") return conn.lastSyncAt ? `synchronisé ${relativeTime(conn.lastSyncAt, now)}` : "connecté"
    if (conn.status === "degraded" || conn.status === "reconnect_required") {
        return conn.lastErrorAt ? `incident ${relativeTime(conn.lastErrorAt, now)}` : "à vérifier"
    }
    return "—"
}

/** Best connection per provider — an active one wins, else first seen. */
function bestByProvider(conns: ConnectionDoc[]): Map<string, ConnectionDoc> {
    const map = new Map<string, ConnectionDoc>()
    for (const c of conns) {
        const cur = map.get(c.provider)
        if (!cur || c.status === "active") map.set(c.provider, c)
    }
    return map
}

export function mapIntegrations(
    providers: ProviderDoc[],
    connections: ConnectionDoc[],
    now: number = Date.now(),
): IntegrationsData {
    const byProvider = bestByProvider(connections)

    const crm: Integration[] = providers.map((p) => {
        const conn = byProvider.get(p.key)
        const on = !!conn && conn.status !== "disconnected"
        return {
            id: p.key,
            name: p.displayName,
            desc: CRM_DESC[p.key] ?? "Connecteur CRM.",
            cat: "CRM",
            on,
            health: on ? healthOf(conn!.status) : null,
            last: conn ? lastLabel(conn, now) : "—",
            available: p.availability === "available",
        }
    })

    // Dedupe by id (live CRM entries win over the static showcase). Guards the
    // React `key={it.id}` in IntegrationSection against ever colliding if the
    // backend returns a duplicate provider key or a showcase id overlaps a
    // real provider — the catalog stays render-safe regardless of input.
    const seen = new Set<string>()
    const integrations = [...crm, ...SHOWCASE].filter((it) => {
        if (seen.has(it.id)) return false
        seen.add(it.id)
        return true
    })
    const activeCount = integrations.filter((i) => i.on).length
    return { activeCount, integrations }
}
