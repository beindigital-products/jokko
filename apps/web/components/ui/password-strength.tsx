"use client"

import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  PASSWORD_CRITERIA,
  PASSWORD_LEVEL_LABEL,
  evaluatePassword,
  type PasswordEvaluation,
  type PasswordStrengthLevel,
} from "@/lib/password-policy"

/**
 * PasswordStrength — v2 design system password meter.
 *
 * Visual recipe per design spec §5 :
 *   - 4-segment bar (one segment per criterion passed)
 *   - Mono uppercase level label : FAIBLE / MOYEN / FORT
 *   - Criteria checklist kept for a11y (WCAG 3.3.3 Error Suggestion)
 *
 * Strength mapping (multi-agent review H2) :
 *   0 criteria  → empty bar
 *   1–2         → weak   (status-danger / status-warn segments)
 *   3           → medium (status-moment)
 *   4 (all)     → strong (status-good) — only level that backend accepts
 *
 * Public API preserved from v1 to keep any callers compiling. New consumers
 * should prefer `evaluatePassword()` directly from `@/lib/password-policy`.
 */

const SEGMENT_COLOR_BY_LEVEL: Record<PasswordStrengthLevel, string> = {
  empty: "bg-transparent",
  weak: "bg-[var(--status-danger)]",
  medium: "bg-[var(--status-warn)]",
  strong: "bg-[var(--status-good)]",
}

const LABEL_COLOR_BY_LEVEL: Record<PasswordStrengthLevel, string> = {
  empty: "text-[var(--ink-400)]",
  weak: "text-[var(--status-danger)]",
  medium: "text-[var(--status-warn)]",
  strong: "text-[var(--status-good)]",
}

interface PasswordStrengthProps {
  password: string
  /** Show the per-criterion checklist below the bar. Default: true. */
  showCriteria?: boolean
  className?: string
}

export function PasswordStrength({
  password,
  showCriteria = true,
  className,
}: PasswordStrengthProps) {
  const evaluation = evaluatePassword(password)
  // Hide entirely on empty input — saves vertical space until typing starts.
  if (password.length === 0) return null

  const filled = evaluation.score
  return (
    <div className={cn("space-y-2.5", className)} data-slot="password-strength">
      {/* 4-segment bar + mono label */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex flex-1 items-stretch gap-1"
          aria-label={`Force du mot de passe : ${PASSWORD_LEVEL_LABEL[evaluation.level] || "vide"}`}
        >
          {PASSWORD_CRITERIA.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-sm transition-colors",
                i < filled
                  ? SEGMENT_COLOR_BY_LEVEL[evaluation.level]
                  : "bg-[var(--ink-200)]"
              )}
            />
          ))}
        </div>
        <span
          aria-live="polite"
          className={cn(
            "font-mono text-[10px] font-medium uppercase tracking-[0.15em] leading-tight tabular-nums",
            LABEL_COLOR_BY_LEVEL[evaluation.level]
          )}
        >
          {PASSWORD_LEVEL_LABEL[evaluation.level] || "—"}
        </span>
      </div>

      {/* Criteria checklist (a11y — kept per WCAG Error Suggestion) */}
      {showCriteria ? (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {PASSWORD_CRITERIA.map((c) => {
            const passed = evaluation.passed.includes(c.id)
            return (
              <li
                key={c.id}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  passed
                    ? "text-[var(--status-good)]"
                    : "text-[var(--ink-500)]"
                )}
              >
                {passed ? (
                  <Check className="h-3 w-3 shrink-0" aria-hidden />
                ) : (
                  <X className="h-3 w-3 shrink-0" aria-hidden />
                )}
                <span>{c.label}</span>
              </li>
            )
          })}
        </ul>
      ) : null}

      {/* NIST/ANSSI guidance helper (UA review H8) — calms perceived "downgrade"
          when users notice the special-char requirement is gone. */}
      {evaluation.level !== "strong" ? (
        <p className="text-[11px] leading-relaxed text-[var(--ink-500)]">
          Un mot de passe long est plus sûr qu'un mot de passe complexe.
        </p>
      ) : null}
    </div>
  )
}

/**
 * @deprecated Prefer importing `evaluatePassword` from `@/lib/password-policy`
 * directly. Kept for back-compat with v1 callers.
 */
export function usePasswordStrength(password: string): PasswordEvaluation {
  return React.useMemo(() => evaluatePassword(password), [password])
}
