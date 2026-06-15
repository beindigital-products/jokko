"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * PasswordInput — v2 password field with show/hide toggle.
 *
 * Visual matches the v2 Input primitive : `h-12 rounded-xl`, paper-warm
 * resting bg, paper-white on focus, accent violet ring on focus.
 *
 * Error state is driven by the standard `aria-invalid` prop (no custom
 * `error` prop) so it composes naturally with form libraries (react-hook-form,
 * zod resolvers, Convex auth errors).
 *
 * Convention : the parent renders `<Alert variant="error-cream">` adjacent
 * to the input(s) for the human-readable message — the input itself only
 * indicates the field is in error via border + ring color shift.
 */

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  /** Optional left-side icon (e.g. lock). */
  leftIcon?: React.ReactNode
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        {leftIcon ? (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-500)]">
            {leftIcon}
          </div>
        ) : null}
        <input
          type={showPassword ? "text" : "password"}
          ref={ref}
          {...props}
          className={cn(
            "flex h-12 w-full rounded-xl border border-[color-mix(in_oklch,var(--ink-300)_60%,transparent)] bg-[var(--paper-warm)] py-2 text-sm font-medium ring-offset-background transition-all",
            "placeholder:text-[var(--ink-500)] placeholder:font-normal",
            "focus:bg-[var(--paper-white)] focus:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-[var(--status-danger)] aria-invalid:focus-visible:ring-[color-mix(in_oklch,var(--status-danger)_40%,transparent)]",
            leftIcon ? "pl-11" : "px-3.5",
            "pr-11",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-500)] transition-colors hover:text-[var(--ink-900)] focus:outline-none focus-visible:text-[var(--ink-900)]"
          tabIndex={-1}
          aria-label={
            showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
