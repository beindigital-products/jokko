import Link from "next/link"

import { cn } from "@/lib/utils"

/** Plain bordered paper card — the container shared by every overview panel. */
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]",
                className,
            )}
        >
            {children}
        </div>
    )
}

/** Mono uppercase eyebrow label used at the top of each card. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]",
                className,
            )}
        >
            {children}
        </div>
    )
}

/** Display sub-title used inside cards (editorial, italic per the design). */
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                "font-editorial text-[20px] leading-tight tracking-tight text-[var(--ink-900)]",
                className,
            )}
        >
            {children}
        </div>
    )
}

/** Compact card action button (ghost or primary), optionally a link. */
export function MiniBtn({
    children,
    tone = "ghost",
    href,
}: {
    children: React.ReactNode
    tone?: "ghost" | "primary"
    href?: string
}) {
    const cls = cn(
        "inline-flex h-[26px] items-center rounded-md px-2.5 text-[12px] font-medium transition-colors",
        tone === "primary"
            ? "bg-[var(--ink-900)] text-white hover:brightness-95"
            : "border border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
    )
    return href ? (
        <Link href={href} className={cls}>
            {children}
        </Link>
    ) : (
        <button type="button" className={cls}>
            {children}
        </button>
    )
}
