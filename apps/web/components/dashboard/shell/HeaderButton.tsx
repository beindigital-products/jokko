import Link from "next/link"

import { cn } from "@/lib/utils"

interface HeaderButtonProps {
    children: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
    variant?: "default" | "primary"
    onClick?: () => void
    asChild?: boolean
    /** When using asChild, pass the wrapping element directly via children. */
    href?: string
}

/**
 * HeaderButton — used in page header action rows. Two variants :
 *   - default : outline, paper-white bg, ink-700 text
 *   - primary : filled ink-900 dark, white text
 */
export function HeaderButton({
    children,
    icon: Icon,
    variant = "default",
    onClick,
    asChild,
    href,
}: HeaderButtonProps) {
    const className = cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
        variant === "primary"
            ? "bg-[var(--ink-900)] text-white hover:bg-[var(--ink-700)]"
            : "border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
    )
    const inner = (
        <>
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {children}
        </>
    )
    if (asChild) {
        return <span className={className}>{inner}</span>
    }
    if (href) {
        return (
            <Link href={href} className={className} onClick={onClick}>
                {inner}
            </Link>
        )
    }
    return (
        <button type="button" onClick={onClick} className={className}>
            {inner}
        </button>
    )
}
