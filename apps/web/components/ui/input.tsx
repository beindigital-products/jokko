import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * Input — v2 design system text field.
 *
 * Visual: paper-warm fill at rest, paper-white on focus, soft border that
 * thickens to accent violet with ring. h-12 + rounded-xl matches spec.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-xl border border-[color-mix(in_oklch,var(--ink-300)_60%,transparent)] bg-[var(--paper-warm)] px-3.5 py-2 text-sm ring-offset-background font-medium transition-all",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    "placeholder:text-[var(--ink-500)] placeholder:font-normal",
                    "focus:bg-[var(--paper-white)] focus:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
