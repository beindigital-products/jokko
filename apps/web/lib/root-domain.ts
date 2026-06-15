/**
 * Single source of truth for the tenant root domain. Must stay aligned
 * with the auth cookie domain (ConvexClientProvider) and the subdomain
 * redirect (dashboard/layout.tsx) — a mismatch breaks cross-subdomain auth.
 *
 * Defaults to `jokko.co` (same default as ConvexClientProvider,
 * dashboard/layout, api/auth/session, facebook-connect).
 */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "jokko.co"

/** Display host for an org's tenant URL, e.g. "mon-entreprise.jokko.co". */
export function tenantHost(slug: string): string {
    return `${slug}.${ROOT_DOMAIN}`
}
