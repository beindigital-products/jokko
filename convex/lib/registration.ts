/**
 * Meta's `/{phone_number_id}/register` endpoint requires a 6-DIGIT *numeric* PIN
 * (the two-step-verification PIN). Hex strings — e.g. derived from
 * `crypto.randomUUID()` — contain letters (a–f) and are rejected by Meta with
 * "Parameter pin must be a 6-digit string". This always returns six digits 0–9.
 */
export function generateRegistrationPin(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b % 10).join("");
}
