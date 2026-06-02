import { cn } from "@/lib/utils"

import { Icon, type IconName } from "./Icon"

export type ToastTone = "success" | "alert" | "info"

interface ToastProps {
    tone: ToastTone
    icon: IconName
    title: string
    body: string
    /** Trailing relative time, e.g. "2 min". */
    time?: string
    className?: string
}

/** Icon-square tint per tone. */
const ICON_TINT: Record<ToastTone, string> = {
    success: "bg-[var(--status-good-soft)] text-[var(--status-good)]",
    alert: "bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
    info: "bg-[var(--accent-muted)] text-[var(--accent)]",
}

/**
 * Toast — transient notification card. A tinted icon square, a title + body
 * column, and an optional trailing mono timestamp. Presentational only;
 * stacking, auto-dismiss and portals are owned by the host.
 */
export function Toast({ tone, icon, title, body, time, className }: ToastProps) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-3.5 shadow-[0_10px_30px_-12px_rgba(10,10,10,0.18)]",
                className,
            )}
        >
            <span
                className={cn(
                    "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg",
                    ICON_TINT[tone],
                )}
            >
                <Icon name={icon} size={16} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium tracking-tight text-[var(--ink-900)]">{title}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-[var(--ink-500)]">{body}</div>
            </div>
            {time ? (
                <span className="ml-auto shrink-0 font-mono text-[10.5px] tracking-tight text-[var(--ink-soft)]">
                    {time}
                </span>
            ) : null}
        </div>
    )
}
