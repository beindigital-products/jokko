"use client"

import { MessageCircle, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

import { Chip, type ChipTone } from "../primitives/Chip"

export type ChannelQuality = "GREEN" | "YELLOW" | "RED" | "UNKNOWN"

interface ChannelCardProps {
    name: string
    phone: string
    wabaId: string
    status: { label: string; tone: ChipTone }
    quality: ChannelQuality
    volume: number
    onMore?: () => void
}

const QUALITY_TONE: Record<ChannelQuality, "good" | "warn" | "danger" | "neutral"> = {
    GREEN: "good",
    YELLOW: "warn",
    RED: "danger",
    UNKNOWN: "neutral",
}

const QUALITY_TEXT: Record<ChannelQuality, string> = {
    GREEN: "text-[var(--status-good)]",
    YELLOW: "text-[var(--status-warn)]",
    RED: "text-[var(--status-danger)]",
    UNKNOWN: "text-[var(--ink-soft)]",
}

export function ChannelCard({
    name,
    phone,
    wabaId,
    status,
    quality,
    volume,
    onMore,
}: ChannelCardProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] p-3">
            <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--status-good-soft)]">
                    <MessageCircle className="h-4 w-4 text-[var(--status-good)]" />
                </span>
                <div>
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--ink-900)]">
                        {name}
                        <Chip tone={status.tone}>{status.label}</Chip>
                    </div>
                    <div className="font-mono text-[11px] text-[var(--ink-soft)]">
                        {phone} · {wabaId}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-5 text-right">
                <div>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        QUALITÉ META
                    </div>
                    <div
                        className={cn(
                            "font-mono text-[11.5px] font-semibold",
                            QUALITY_TEXT[quality],
                        )}
                    >
                        {quality}
                    </div>
                </div>
                <div>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        VOLUME
                    </div>
                    <div className="font-display text-[16px] font-bold tabular-nums text-[var(--ink-900)]">
                        {volume}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onMore}
                    className="rounded p-1 text-[var(--ink-400)] hover:bg-[var(--paper-warm)]"
                    aria-label="Plus d'actions"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

// Helper export so callers can match QUALITY_TONE mapping in their own UI
export { QUALITY_TONE }
