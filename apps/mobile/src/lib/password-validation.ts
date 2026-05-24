export function validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 10) {
        return { valid: false, message: "Le mot de passe doit contenir au moins 10 caractères." };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: "Le mot de passe doit contenir au moins une majuscule." };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: "Le mot de passe doit contenir au moins une minuscule." };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: "Le mot de passe doit contenir au moins un chiffre." };
    }
    return { valid: true, message: "" };
}

export type PasswordStrength = {
    /** 0..4 — 0 = empty/very weak, 4 = strong */
    score: 0 | 1 | 2 | 3 | 4;
    /** Short human label used in the UI meter. */
    label: string;
    /** Theme-aligned semantic tone for the meter fill. */
    tone: "neutral" | "danger" | "warning" | "success";
};

/**
 * Lightweight client-side strength heuristic for the sign-up password meter.
 *
 * Pure function, no zxcvbn dependency. We score on length tiers + presence
 * of character classes (lower / upper / digit / symbol). Backend still
 * enforces the canonical rule via {@link validatePassword}; this is purely
 * for UX feedback while the user types.
 */
export function passwordStrength(password: string): PasswordStrength {
    if (!password) {
        return { score: 0, label: "Mot de passe", tone: "neutral" };
    }

    let score = 0;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Hard gate: anything shorter than 8 characters is always Faible regardless
    // of character variety. Prevents "Aa1" from scoring as Moyen.
    if (password.length < 8) score = Math.min(score, 1);

    const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

    if (clamped <= 1) return { score: clamped, label: "Faible", tone: "danger" };
    if (clamped === 2) return { score: clamped, label: "Moyen", tone: "warning" };
    if (clamped === 3) return { score: clamped, label: "Bon", tone: "success" };
    return { score: clamped, label: "Excellent", tone: "success" };
}
