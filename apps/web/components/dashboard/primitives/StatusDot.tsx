import { cn } from "@/lib/utils"

export type StatusDotTone = "good" | "warn" | "danger" | "neutral"

interface StatusDotProps {
    tone: StatusDotTone
    size?: "sm" | "md"
    className?: string
}

const TONE: Record<StatusDotTone, string> = {
    good: "bg-[var(--status-good)]",
    warn: "bg-[var(--status-warn)]",
    danger: "bg-[var(--status-danger)]",
    neutral: "bg-[var(--ink-400)]",
}

export function StatusDot({ tone, size = "sm", className }: StatusDotProps) {
    return (
        <span
            className={cn(
                "inline-block shrink-0 rounded-full",
                size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
                TONE[tone],
                className,
            )}
        />
    )
}
