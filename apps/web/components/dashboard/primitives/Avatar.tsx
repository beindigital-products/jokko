import { cn } from "@/lib/utils"

export type AvatarColor =
    | "violet"
    | "emerald"
    | "rose"
    | "amber"
    | "sky"
    | "indigo"
    | "crimson"
    | "teal"

export type AvatarSize = "sm" | "md" | "lg" | "xl"
export type AvatarShape = "circle" | "square"

interface AvatarProps {
    initials: string
    color?: AvatarColor
    size?: AvatarSize
    shape?: AvatarShape
    status?: "online" | "busy" | "away"
    className?: string
}

const GRADIENT: Record<AvatarColor, string> = {
    violet: "from-violet-400 to-indigo-600",
    emerald: "from-emerald-400 to-teal-600",
    rose: "from-rose-400 to-pink-600",
    amber: "from-amber-400 to-orange-600",
    sky: "from-sky-400 to-blue-600",
    indigo: "from-indigo-400 to-violet-600",
    crimson: "from-red-500 to-rose-700",
    teal: "from-teal-400 to-cyan-600",
}

const SIZE: Record<AvatarSize, string> = {
    sm: "h-6 w-6 text-[9px]",
    md: "h-8 w-8 text-[10px]",
    lg: "h-9 w-9 text-xs",
    xl: "h-14 w-14 text-base",
}

const STATUS_COLOR = {
    online: "bg-[var(--status-good)]",
    busy: "bg-[var(--status-warn)]",
    away: "bg-[var(--ink-400)]",
} as const

/**
 * Avatar — gradient-filled initials. Round for users, square for orgs.
 * Optional status dot bottom-right (online/busy/away).
 */
export function Avatar({
    initials,
    color = "violet",
    size = "md",
    shape = "circle",
    status,
    className,
}: AvatarProps) {
    return (
        <span className={cn("relative inline-block shrink-0", className)}>
            <span
                className={cn(
                    "inline-flex h-full w-full items-center justify-center bg-gradient-to-br font-bold text-white",
                    shape === "circle" ? "rounded-full" : "rounded-md",
                    SIZE[size],
                    GRADIENT[color],
                )}
            >
                {initials}
            </span>
            {status ? (
                <span
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[var(--paper-white)]",
                        STATUS_COLOR[status],
                    )}
                />
            ) : null}
        </span>
    )
}
