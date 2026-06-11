/**
 * Per-minute call rates billed to the org's credit (in FCFA), resolved by the
 * destination phone's country dialling prefix. Only OUTBOUND calls are billed —
 * inbound WhatsApp calls are free.
 *
 * These are STARTING values you can tune to match your pricing/margin. For
 * reference, Meta's WhatsApp connectivity fee for Senegal / "Rest of Africa" is
 * ~6 FCFA/min; the numbers below are the amounts DEBITED from the customer
 * (i.e. your selling price), seeded across the UEMOA / West-Africa (FCFA) zone.
 */

export const DEFAULT_CALL_RATE_FCFA_PER_MINUTE = 25;

// Country dialling prefix → FCFA per (started) minute. Extend as needed.
const CALL_RATES_FCFA_PER_MINUTE: Record<string, number> = {
    "221": 10, // Senegal
    "223": 10, // Mali
    "225": 10, // Cote d'Ivoire
    "226": 10, // Burkina Faso
    "227": 10, // Niger
    "228": 10, // Togo
    "229": 10, // Benin
};

/** Resolve the per-minute FCFA rate for a destination phone number. */
export function callRatePerMinuteFcfa(toPhone: string): number {
    const digits = (toPhone ?? "").replace(/\D/g, "");
    // Longest matching prefix wins (so a longer, more specific prefix is preferred).
    const prefixes = Object.keys(CALL_RATES_FCFA_PER_MINUTE).sort((a, b) => b.length - a.length);
    for (const prefix of prefixes) {
        if (digits.startsWith(prefix)) return CALL_RATES_FCFA_PER_MINUTE[prefix];
    }
    return DEFAULT_CALL_RATE_FCFA_PER_MINUTE;
}

/**
 * Cost in FCFA for an outbound call of `durationSeconds`, billed per STARTED
 * minute (Meta bills in 6s increments; we round up to the minute for simplicity).
 * Returns 0 for non-positive durations — unanswered / missed calls are not billed.
 */
export function callCostFcfa(toPhone: string, durationSeconds: number | undefined): number {
    if (!durationSeconds || durationSeconds <= 0) return 0;
    const minutes = Math.ceil(durationSeconds / 60);
    return minutes * callRatePerMinuteFcfa(toPhone);
}
