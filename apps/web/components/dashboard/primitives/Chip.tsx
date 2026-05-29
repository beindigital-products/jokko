import { cn } from "@/lib/utils"

export type ChipTone = "neutral" | "accent" | "good" | "warn" | "danger" | "dark"

interface ChipProps {
    children: React.ReactNode
    tone?: ChipTone
    className?: string
}

const TONE: Record<ChipTone, string> = {
    neutral: "bg-[var(--paper-warm)] text-[var(--ink-700)] border border-[var(--ink-200)]",
    accent: "bg-[var(--accent-muted)] text-[var(--accent)]",
    good: "bg-[var(--status-good-soft)] text-[var(--status-good)]",
    warn: "bg-[var(--status-warn-soft)] text-[var(--status-warn)]",
    danger: "bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
    dark: "bg-[var(--ink-900)] text-white",
}

/**
 * Chip — mono uppercase tracker pill used for tags, status labels, role badges.
 * For status-with-dot pattern, use Chip with a `●` prefix or StatusDot before.
 */
export function Chip({ children, tone = "neutral", className }: ChipProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em]",
                TONE[tone],
                className,
            )}
        >
            {children}
        </span>
    )
}
