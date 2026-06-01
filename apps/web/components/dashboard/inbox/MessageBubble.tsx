import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MessageBubbleAudio {
    durationLabel: string
    /** 0-100 progress for the playhead. Pure visual cue. */
    progressPct?: number
    /** Optional waveform peaks (0-1). Defaults to a pleasant fake pattern. */
    waveform?: number[]
}

interface MessageBubbleProps {
    side: "in" | "out"
    /** Text body. Ignored when `audio` is provided. */
    children?: React.ReactNode
    /** Renders a voice message (WhatsApp style) instead of text. */
    audio?: MessageBubbleAudio
    timestamp?: string
    /** `read` = ✓✓ blue, `delivered` = ✓✓ grey, `sent` = ✓ grey */
    deliveryStatus?: "sent" | "delivered" | "read"
    /** When true, drops the bubble background + padding so rich media
     *  (image, video, document card) can fill edge-to-edge. The footer
     *  (timestamp + ticks) renders below the media, right-aligned. */
    bare?: boolean
    className?: string
}

const FAKE_WAVEFORM = [
    0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.9, 0.5, 0.7, 0.3, 0.6, 0.4, 0.8, 0.5, 0.7,
    0.6, 0.3, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.4,
]

/**
 * MessageBubble — chat bubble. `in` = paper-white card with ink border,
 * `out` = ink-900 fill with white text. Bottom-right delivery ticks +
 * timestamp, mirroring WhatsApp. When `audio` prop is set, renders a
 * voice-message UI (play button + waveform + duration) instead of text.
 */
export function MessageBubble({
    side,
    children,
    audio,
    timestamp,
    deliveryStatus,
    bare,
    className,
}: MessageBubbleProps) {
    const out = side === "out"
    return (
        <div className={cn("flex", out ? "justify-end" : "justify-start", className)}>
            <div
                className={cn(
                    "max-w-[70%]",
                    bare
                        ? "overflow-hidden rounded-2xl"
                        : cn(
                              "rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed",
                              audio && "min-w-[220px]",
                              out
                                  ? "bg-[var(--ink-900)] text-white rounded-br-md"
                                  : "bg-[var(--paper-white)] border border-[var(--ink-200)] text-[var(--ink-900)] rounded-bl-md",
                          ),
                )}
            >
                {audio ? <AudioBlock audio={audio} out={out} /> : children}
                {timestamp || deliveryStatus ? (
                    <div
                        className={cn(
                            "flex items-center justify-end gap-1 font-mono text-[10px]",
                            bare
                                ? "mt-0.5 px-1 text-[var(--ink-soft)]"
                                : cn("mt-1", out ? "text-white/60" : "text-[var(--ink-soft)]"),
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

function AudioBlock({ audio, out }: { audio: MessageBubbleAudio; out: boolean }) {
    const peaks = audio.waveform ?? FAKE_WAVEFORM
    const progress = Math.max(0, Math.min(100, audio.progressPct ?? 0))
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                aria-label="Lire le message audio"
                className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                    out
                        ? "bg-white text-[var(--ink-900)] hover:bg-white/90"
                        : "bg-[var(--ink-900)] text-white hover:bg-[var(--ink-700)]",
                )}
            >
                <Play className="ml-px h-3 w-3" fill="currentColor" strokeWidth={0} />
            </button>
            <div className="flex flex-1 items-center gap-[2px]" aria-hidden>
                {peaks.map((p, i) => {
                    const reached = (i / peaks.length) * 100 < progress
                    return (
                        <span
                            key={i}
                            className={cn(
                                "w-[2px] rounded-full",
                                out
                                    ? reached
                                        ? "bg-white"
                                        : "bg-white/40"
                                    : reached
                                        ? "bg-[var(--ink-900)]"
                                        : "bg-[var(--ink-300)]",
                            )}
                            style={{ height: `${Math.max(3, Math.round(p * 18))}px` }}
                        />
                    )
                })}
            </div>
            <span
                className={cn(
                    "shrink-0 font-mono text-[10px]",
                    out ? "text-white/80" : "text-[var(--ink-soft)]",
                )}
            >
                {audio.durationLabel}
            </span>
        </div>
    )
}
