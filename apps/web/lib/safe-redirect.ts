/**
 * safeRedirect — sanitize post-auth redirect targets to prevent open-redirect
 * and phishing vectors.
 *
 * Used by the sign-in flow (and any future auth flow consuming a `?redirect=`
 * query parameter). The middleware in `apps/web/proxy.ts` writes this value
 * blindly when an unauthenticated user hits a protected route, so the
 * frontend layer MUST validate before routing.
 *
 * Returns the validated path, or the fallback `/dashboard` if input is
 * unsafe / empty.
 *
 * Reject rules :
 *   - falsy
 *   - does not start with `/` (after URL-decoding)
 *   - starts with `//` (protocol-relative external)
 *   - starts with `/\` (some browsers normalize backslashes)
 *   - encodes a scheme (`http:`, `https:`, `javascript:`, `data:`, `vbscript:`)
 *   - targets internal infra paths the user should never land on (`/api/`,
 *     `/_next/`, `/auth/sign-in`, `/auth/sign-up`)
 */

const FALLBACK = "/dashboard"
const DISALLOWED_PREFIXES = [
  "/api/",
  "/_next/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
] as const

const DANGEROUS_SCHEME_RE = /^\s*(?:javascript|data|vbscript|file|about):/i

export function safeRedirect(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return FALLBACK

  // Decode (potentially multiple times) before validating — attackers love
  // double-encoded payloads like %252Fevil.com.
  let decoded = raw.trim()
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      return FALLBACK
    }
  }

  if (decoded.length === 0) return FALLBACK
  if (DANGEROUS_SCHEME_RE.test(decoded)) return FALLBACK
  if (!decoded.startsWith("/")) return FALLBACK
  // Protocol-relative or backslash-prefixed escapes
  if (decoded.startsWith("//") || decoded.startsWith("/\\")) return FALLBACK
  // Block internal infra and recursive auth bounce.
  // Prefixes ending with `/` already encode the segment boundary, so a plain
  // `startsWith` is correct (e.g. `/api/` rejects `/api/auth/session` AND
  // `/api/`). Auth prefixes without trailing slash also accept the same
  // `startsWith` check because we add explicit `?`, `/`, `#` suffix variants
  // only if we want to allow `/auth/sign-in-something-else` as legit — we
  // don't, so a flat `startsWith` is safe.
  for (const prefix of DISALLOWED_PREFIXES) {
    if (decoded === prefix || decoded.startsWith(prefix)) {
      return FALLBACK
    }
  }

  return decoded
}
