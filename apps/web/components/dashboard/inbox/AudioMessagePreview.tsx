"use client"

import { useState } from "react"
import { Pause, Play, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioMessagePreviewProps {
    durationLabel: string
    /** 0-100, default 0. Pure visual cue. */
    progressPct?: number
    /** Optional waveform peaks (0-1). Defaults to a pleasant fake pattern. */
    waveform?: number[]
    onDelete?: () => void
    /** Toggle external play state. Internal state defaults to false. */
    onPlayToggle?: (playing: boolean) => void
    className?: string
}

const FAKE_WAVEFORM = [
    0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.9, 0.5, 0.7, 0.3, 0.6, 0.4, 0.8, 0.5, 0.7,
    0.6, 0.3, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.4, 0.7, 0.5,
]

/**
 * AudioMessagePreview — composer-side preview of a recorded voice memo.
 * Shown in the textarea slot after the user stops recording, before the
 * actual send. Has Play/Pause + waveform + duration + Delete (trash).
 *
 * Visual only — no real <audio> wiring. Actual playback / Convex upload
 * happens in the page-level integration (Phase D).
 */
export function AudioMessagePreview({
    durationLabel,
    progressPct = 0,
    waveform = FAKE_WAVEFORM,
    onDelete,
    onPlayToggle,
    className,
}: AudioMessagePreviewProps) {
    const [playing, setPlaying] = useState(false)
    const progress = Math.max(0, Math.min(100, progressPct))
    const togglePlay = () => {
        const next = !playing
        setPlaying(next)
        onPlayToggle?.(next)
    }
    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-3",
                className,
            )}
        >
            <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Mettre en pause" : "Lire le message audio"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
                {playing ? (
                    <Pause className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                ) : (
                    <Play className="ml-px h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                )}
            </button>
            <div className="flex flex-1 items-center gap-[2px]" aria-hidden>
                {waveform.map((p, i) => {
                    const reached = (i / waveform.length) * 100 < progress
                    return (
                        <span
                            key={i}
                            className={cn(
                                "w-[2px] rounded-full",
                                reached ? "bg-[var(--accent)]" : "bg-[var(--ink-300)]",
                            )}
                            style={{ height: `${Math.max(4, Math.round(p * 22))}px` }}
                        />
                    )
                })}
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--ink-700)]">
                {durationLabel}
            </span>
            <button
                type="button"
                onClick={onDelete}
                aria-label="Supprimer le message audio"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--ink-soft)] hover:bg-[var(--paper-white)] hover:text-[var(--status-danger)] transition-colors"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
