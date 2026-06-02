import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — shadcn primitive extended with v2 design system variants.
 *
 * Variant guidance:
 *   - `default`     — legacy near-black primary. Kept for back-compat.
 *                     Prefer `accent` for new code per v2 design.
 *   - `accent`      — violet primary (v2 canonical CTA). Use on app chrome
 *                     and loud surfaces (auth, onboarding, plan upgrade).
 *   - `mono-link`   — uppercase mono inline link. Use for secondary
 *                     navigation cues ("Mot de passe oublié ?"). Source text
 *                     in natural case — CSS handles uppercase (a11y).
 *   - `destructive` — red CTA / dangerous action.
 *   - `outline` / `secondary` / `ghost` / `link` — unchanged.
 *
 * ⚠️ Do NOT use `disabled` to gate permission-driven UI. The principle is
 *    "hide, not disable" — use `useCan()` / conditional rendering.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-btn)] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        // === V2 design system ===
        accent:
          "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_8px_20px_-8px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-px focus-visible:ring-[var(--accent-ring)]",
        "mono-link":
          "h-auto px-0 py-0 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)] hover:text-[var(--accent)] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:underline underline-offset-4",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        xl: "h-12 px-7 text-sm has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
