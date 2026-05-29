import { cn } from "@/lib/utils"

interface MessageBubbleProps {
    side: "in" | "out"
    children: React.ReactNode
    timestamp?: string
    /** `read` = ✓✓ blue, `delivered` = ✓✓ grey, `sent` = ✓ grey */
    deliveryStatus?: "sent" | "delivered" | "read"
    className?: string
}

/**
 * MessageBubble — chat bubble. `in` = paper-white card with ink border,
 * `out` = ink-900 fill with white text. Bottom-right delivery ticks +
 * timestamp, mirroring WhatsApp.
 */
export function MessageBubble({
    side,
    children,
    timestamp,
    deliveryStatus,
    className,
}: MessageBubbleProps) {
    const out = side === "out"
    return (
        <div className={cn("flex", out ? "justify-end" : "justify-start", className)}>
            <div
                className={cn(
                    "max-w-[70%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed",
                    out
                        ? "bg-[var(--ink-900)] text-white rounded-br-md"
                        : "bg-[var(--paper-white)] border border-[var(--ink-200)] text-[var(--ink-900)] rounded-bl-md",
                )}
            >
                {children}
                {timestamp || deliveryStatus ? (
                    <div
                        className={cn(
                            "mt-1 flex items-center justify-end gap-1 font-mono text-[10px]",
                            out ? "text-white/60" : "text-[var(--ink-soft)]",
                        )}
                    >
                        {timestamp ? <span>{timestamp}</span> : null}
                        {deliveryStatus === "read" ? <span className="text-sky-400">✓✓</span> : null}
                        {deliveryStatus === "delivered" ? <span>✓✓</span> : null}
                        {deliveryStatus === "sent" ? <span>✓</span> : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
