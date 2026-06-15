/**
 * WhatsApp templates encode parameters as `{{1}}`, `{{2}}`, etc. in body text.
 *
 * The V1.5+ template picker filters out templates that have any of those
 * placeholders because filling them requires a parameter-input UI that we
 * intentionally haven't shipped yet (avoids a half-baked form).
 */
export function templateBodyHasPlaceholders(body: string): boolean {
    return /\{\{\s*\d+\s*\}\}/.test(body);
}
