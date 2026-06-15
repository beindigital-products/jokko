"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Label — form label primitive with v2 `eyebrow` variant.
 *
 * Variant guidance:
 *   - `default` — standard form label (size-md, semibold).
 *   - `eyebrow` — small uppercase mono "tracker" used above field titles
 *     and section headings ("CONNEXION · ESPACE ÉQUIPE"). Use natural case
 *     in source text; CSS handles uppercase (a11y: screen readers pronounce
 *     words instead of letters).
 */
const labelVariants = cva(
  "flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-sm leading-none font-medium",
        eyebrow:
          "font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)] leading-tight",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Label({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      data-variant={variant ?? "default"}
      className={cn(labelVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Label, labelVariants }
