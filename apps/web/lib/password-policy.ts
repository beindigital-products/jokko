/**
 * Password policy — single source of truth shared between client UI and
 * backend validation in `convex/auth.ts`.
 *
 * Any drift between this file and the backend regexes invalidates the
 * sign-up UX (user sees a green strength bar but submission is rejected).
 * The vitest suite asserts this concordance.
 */

export const PASSWORD_MIN_LENGTH = 10

export interface PasswordCriterion {
  id: "length" | "lowercase" | "uppercase" | "number"
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_CRITERIA: ReadonlyArray<PasswordCriterion> = [
  {
    id: "length",
    label: `Au moins ${PASSWORD_MIN_LENGTH} caractères`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "Une lettre minuscule",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "uppercase",
    label: "Une lettre majuscule",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "number",
    label: "Un chiffre",
    test: (p) => /[0-9]/.test(p),
  },
]

export type PasswordStrengthLevel = "empty" | "weak" | "medium" | "strong"

export interface PasswordEvaluation {
  score: number
  maxScore: number
  passed: ReadonlyArray<PasswordCriterion["id"]>
  failed: ReadonlyArray<PasswordCriterion["id"]>
  level: PasswordStrengthLevel
  /** Backend will accept this password (all 4 criteria pass). */
  isValid: boolean
  /** 0–100 fill percentage for the segmented bar. */
  percentage: number
}

/**
 * Strength mapping (per design spec §5 + multi-agent review H2) :
 *   0 criteria       → empty
 *   1–2 criteria     → weak  (FAIBLE)
 *   3 criteria       → medium (MOYEN)
 *   4 criteria (all) → strong (FORT) — only level that backend accepts
 */
export function evaluatePassword(password: string): PasswordEvaluation {
  const passed: PasswordCriterion["id"][] = []
  const failed: PasswordCriterion["id"][] = []
  for (const c of PASSWORD_CRITERIA) {
    if (c.test(password)) passed.push(c.id)
    else failed.push(c.id)
  }
  const score = passed.length
  const maxScore = PASSWORD_CRITERIA.length
  let level: PasswordStrengthLevel
  if (password.length === 0) level = "empty"
  else if (score <= 2) level = "weak"
  else if (score === 3) level = "medium"
  else level = "strong"
  return {
    score,
    maxScore,
    passed,
    failed,
    level,
    isValid: score === maxScore,
    percentage: maxScore === 0 ? 0 : Math.round((score / maxScore) * 100),
  }
}

/** UI strings tied to a strength level (FR-only for now). */
export const PASSWORD_LEVEL_LABEL: Record<PasswordStrengthLevel, string> = {
  empty: "",
  weak: "Faible",
  medium: "Moyen",
  strong: "Fort",
}
