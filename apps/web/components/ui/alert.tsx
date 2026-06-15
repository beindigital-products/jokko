import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Alert — v2 design system feedback banner.
 *
 * Variant guidance:
 *   - `default`        — neutral surface alert (legacy).
 *   - `destructive`    — legacy destructive variant (kept for back-compat).
 *   - `error-cream`    — V2: red border + cream-tinted bg + circle-i icon.
 *                        Use on auth/form errors.
 *   - `success-cream`  — V2: green border + cream-tinted bg.
 *   - `warn-cream`     — V2: amber border + cream-tinted bg.
 *   - `info-cream`     — V2: violet border + cream-tinted bg.
 *
 * The cream-* enum is exhaustive so future feedback states are consistent
 * (per User Advocate review #9). Only error-cream is fully styled in Slice 0;
 * the others share the same recipe with status-* color swapped.
 *
 * ⚠️ Do NOT pass UPPERCASE strings in title — write natural case, the
 * component decides display casing for a11y compliance.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",

        // === V2 cream variants ===
        "error-cream":
          "border-[color-mix(in_oklch,var(--status-danger)_30%,transparent)] bg-[var(--status-danger-soft)] text-[var(--status-danger)] [&>svg]:text-[var(--status-danger)]",
        "success-cream":
          "border-[color-mix(in_oklch,var(--status-good)_30%,transparent)] bg-[var(--status-good-soft)] text-[var(--status-good)] [&>svg]:text-[var(--status-good)]",
        "warn-cream":
          "border-[color-mix(in_oklch,var(--status-warn)_30%,transparent)] bg-[var(--status-warn-soft)] text-[var(--status-warn)] [&>svg]:text-[var(--status-warn)]",
        "info-cream":
          "border-[color-mix(in_oklch,var(--accent)_30%,transparent)] bg-[var(--accent-muted)] text-[var(--accent)] [&>svg]:text-[var(--accent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, alertVariants }
