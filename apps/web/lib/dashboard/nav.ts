import type { DashboardNavKey } from "@/components/dashboard/shell"

/**
 * Maps the current pathname to the active sidebar nav key. Order matters —
 * more specific prefixes are checked first. The dedicated Mentions page lives
 * at /mentions; the generic notifications history (/notifications, reached via
 * the bell) is mention-adjacent so it keeps the same key.
 */
export function navKeyFromPathname(
    pathname: string,
    basePath = "/dashboard",
): DashboardNavKey {
    const rel = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname

    if (rel.startsWith("/mentions")) return "mentions"
    if (rel.startsWith("/notifications")) return "mentions"
    if (rel.startsWith("/conversations")) return "conversations"
    if (rel.startsWith("/assignments")) return "assignations"
    if (rel.startsWith("/contacts")) return "contacts"
    if (rel.startsWith("/modeles")) return "modeles"
    if (rel.startsWith("/campagnes")) return "campagnes"
    if (rel.startsWith("/automatisations")) return "automatisations"
    if (rel.startsWith("/integrations")) return "integrations"
    if (rel.startsWith("/team")) return "equipe"
    if (rel.startsWith("/analytics")) return "analytics"
    if (rel.startsWith("/settings")) return "reglages"
    if (rel.startsWith("/billing")) return "facturation"
    return "tableau-de-bord"
}

/**
 * Nav keys an AGENT must not see (mirrors the legacy sidebar's role gating):
 * assignment routing, broadcasting, automations, analytics, team admin,
 * integrations and billing stay OWNER/ADMIN-only.
 */
export const AGENT_HIDDEN_KEYS: DashboardNavKey[] = [
    "assignations",
    "modeles",
    "campagnes",
    "automatisations",
    "integrations",
    "equipe",
    "analytics",
    "facturation",
]

/** Keys to hide for a given role (empty for OWNER/ADMIN). */
export function hiddenNavKeysForRole(role?: string | null): DashboardNavKey[] {
    return role === "AGENT" ? AGENT_HIDDEN_KEYS : []
}
