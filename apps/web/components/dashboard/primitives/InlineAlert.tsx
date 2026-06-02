import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type InlineAlertTone = "mute" | "warn" | "danger" | "accent" | "good"

interface InlineAlertProps {
    tone?: InlineAlertTone
    icon?: LucideIcon
    title?: React.ReactNode
    /** Mono code shown next to the title, e.g. "HTTP 503". */
    code?: string
    body?: React.ReactNode
    /** Action buttons / links. */
    actions?: React.ReactNode
    className?: string
}

const TONE: Record<InlineAlertTone, { bg: string; bar: string; fg: string }> = {
    mute: { bg: "var(--paper-warm)", bar: "var(--ink-400)", fg: "var(--ink-500)" },
    warn: { bg: "rgba(184,134,11,0.06)", bar: "#8E670B", fg: "#8E670B" },
    danger: { bg: "rgba(220,56,56,0.05)", bar: "#B82828", fg: "#B82828" },
    accent: { bg: "rgba(105,56,239,0.05)", bar: "#4F1FCF", fg: "#4F1FCF" },
    good: { bg: "rgba(19,138,78,0.06)", bar: "#138A4E", fg: "#138A4E" },
}

/**
 * InlineAlert — a contained alert with a left tone bar, optional icon, a
 * title + mono code, an explaining body and actions. Used for recoverable
 * errors and warnings inside panels. Recreates `InlineAlert` from the design's
 * states kit.
 */
export function InlineAlert({ tone = "mute", icon: Icon, title, code, body, actions, className }: InlineAlertProps) {
    const t = TONE[tone]
    return (
        <div
            className={cn(
                "relative flex items-start gap-3 overflow-hidden rounded-[6px] py-3 pl-[18px] pr-3.5",
                className,
            )}
            style={{ background: t.bg }}
            role="alert"
        >
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: t.bar }} />
            {Icon ? <Icon className="mt-px h-4 w-4 shrink-0" style={{ color: t.fg }} /> : null}
            <div className="min-w-0 flex-1">
                {title || code ? (
                    <div className="mb-0.5 flex items-baseline gap-2.5">
                        {title ? (
                            <div className="text-[13.5px] font-semibold tracking-tight text-[var(--ink-900)]">
                                {title}
                            </div>
                        ) : null}
                        {code ? (
                            <span className="font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: t.fg }}>
                                {code}
                            </span>
                        ) : null}
                    </div>
                ) : null}
                {body ? <div className="text-[12.5px] leading-relaxed text-[var(--ink-500)]">{body}</div> : null}
                {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
            </div>
        </div>
    )
}
