"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface SidebarItemProps {
    href?: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    badge?: string | number
    active?: boolean
    onClick?: () => void
}

/**
 * SidebarItem — sidebar nav row. When `href` is provided, renders a Link
 * (Next.js routing). Otherwise a button (for collapsed/menu actions).
 */
export function SidebarItem({
    href,
    icon: Icon,
    label,
    badge,
    active,
    onClick,
}: SidebarItemProps) {
    const inner = (
        <span
            className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                active
                    ? "border border-[var(--ink-200)] bg-[var(--paper-white)] font-semibold text-[var(--ink-900)] shadow-sm"
                    : "text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
            )}
        >
            <Icon className="h-4 w-4 shrink-0 text-[var(--ink-500)]" />
            <span className="flex-1 truncate text-left">{label}</span>
            {badge != null ? (
                <span className="font-mono text-[10px] font-medium text-[var(--ink-soft)]">
                    {badge}
                </span>
            ) : null}
        </span>
    )

    if (href) {
        return (
            <li>
                <Link href={href} className="block">
                    {inner}
                </Link>
            </li>
        )
    }

    return (
        <li>
            <button type="button" onClick={onClick} className="w-full">
                {inner}
            </button>
        </li>
    )
}
