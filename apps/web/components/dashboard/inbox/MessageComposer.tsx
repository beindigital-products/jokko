"use client"

import { useEffect, useRef, useState } from "react"
import { Mic, Paperclip, Send, Smile, Sparkles, Square } from "lucide-react"
import { cn } from "@/lib/utils"

import { AudioMessagePreview } from "./AudioMessagePreview"

type ComposerMode = "reply" | "note" | "templates" | "shortcuts"
type ComposerState = "idle" | "recording" | "preview"

interface MessageComposerProps {
    placeholder?: string
    onSend?: (text: string, mode: ComposerMode) => void
    /** Called when the user confirms a recorded voice memo from the preview.
     * Presentational : durationSeconds = timer; the real Blob will be wired
     * in the page-level integration. */
    onSendVoice?: (durationSeconds: number) => void
}

function formatDuration(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, "0")
    return `${m}:${sec}`
}

/**
 * MessageComposer — bottom of the inbox thread. Three states for the
 * input slot :
 *   - `idle`      : textarea
 *   - `recording` : red pulse + timer + cancel/stop
 *   - `preview`   : AudioMessagePreview (play + waveform + duration + delete)
 *
 * The toolbar (paperclip, emoji, mic, send) is always visible. The Send
 * button is shared : sends text in idle, sends the audio when in preview,
 * disabled otherwise. The Mic button starts a recording from idle ; in
 * preview it is hidden so the user must explicitly discard via the
 * trash icon to start over.
 */
export function MessageComposer({
    placeholder = "Tapez un message, / pour un raccourci, @ pour mentionner un coéquipier…",
    onSend,
    onSendVoice,
}: MessageComposerProps) {
    const [mode, setMode] = useState<ComposerMode>("reply")
    const [value, setValue] = useState("")
    const [state, setState] = useState<ComposerState>("idle")
    const [recordingSeconds, setRecordingSeconds] = useState(0)
    const [previewDuration, setPreviewDuration] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (state === "recording") {
            setRecordingSeconds(0)
            timerRef.current = setInterval(() => {
                setRecordingSeconds((s) => s + 1)
            }, 1000)
        } else if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [state])

    const modes: { key: ComposerMode; label: string }[] = [
        { key: "reply", label: "Réponse" },
        { key: "note", label: "Note" },
        { key: "templates", label: "Modèles" },
        { key: "shortcuts", label: "Raccourcis" },
    ]

    const hasText = value.trim().length > 0
    const canSend =
        (state === "idle" && hasText) || state === "preview"

    const startRecording = () => setState("recording")
    const cancelRecording = () => setState("idle")
    const stopRecording = () => {
        setPreviewDuration(recordingSeconds)
        setState("preview")
    }
    const discardPreview = () => {
        setPreviewDuration(0)
        setState("idle")
    }
    const handleSend = () => {
        if (state === "preview") {
            onSendVoice?.(previewDuration)
            setPreviewDuration(0)
            setState("idle")
            return
        }
        if (hasText) {
            onSend?.(value, mode)
            setValue("")
        }
    }

    return (
        <div className="border-t border-[var(--ink-200)] bg-[var(--paper-white)] px-5 py-3">
            <div className="mb-2 flex items-center gap-2">
                {modes.map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        onClick={() => setMode(m.key)}
                        disabled={state !== "idle"}
                        className={cn(
                            "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                            mode === m.key
                                ? "bg-[var(--ink-900)] text-white"
                                : "text-[var(--ink-soft)] hover:text-[var(--ink-900)]",
                            state !== "idle" && "opacity-50 cursor-not-allowed",
                        )}
                    >
                        {m.label}
                    </button>
                ))}
                <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-[var(--paper-warm)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink-soft)]">
                    <Sparkles className="h-3 w-3" />
                    AI · ⌘+SHIFT+R
                </span>
            </div>

            {state === "idle" ? (
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full resize-none rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-2.5 text-[12.5px] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]"
                />
            ) : null}

            {state === "recording" ? (
                <div className="flex items-center gap-3 rounded-md border border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] px-3 py-3">
                    <span
                        className="inline-flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[var(--status-danger)]"
                        aria-hidden
                    />
                    <span className="text-[12.5px] font-medium text-[var(--ink-900)]">
                        Enregistrement…
                    </span>
                    <span className="ml-1 font-mono text-[12px] tabular-nums text-[var(--ink-700)]">
                        {formatDuration(recordingSeconds)}
                    </span>
                    <button
                        type="button"
                        onClick={cancelRecording}
                        className="ml-auto inline-flex items-center gap-1 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={stopRecording}
                        aria-label="Arrêter l'enregistrement"
                        className="inline-flex items-center gap-1 rounded-md bg-[var(--ink-900)] px-2.5 py-1 text-[11.5px] font-semibold text-white hover:bg-[var(--ink-700)]"
                    >
                        <Square className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                        Arrêter
                    </button>
                </div>
            ) : null}

            {state === "preview" ? (
                <AudioMessagePreview
                    durationLabel={formatDuration(previewDuration)}
                    onDelete={discardPreview}
                />
            ) : null}

            <div className="mt-2 flex items-center gap-1.5 text-[var(--ink-400)]">
                <button
                    type="button"
                    className="rounded p-1 hover:text-[var(--ink-700)] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Joindre"
                    disabled={state !== "idle"}
                >
                    <Paperclip className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    className="rounded p-1 hover:text-[var(--ink-700)] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Emoji"
                    disabled={state !== "idle"}
                >
                    <Smile className="h-3.5 w-3.5" />
                </button>
                <div className="ml-auto flex items-center gap-1.5">
                    {state !== "preview" ? (
                        <button
                            type="button"
                            onClick={startRecording}
                            disabled={state === "recording"}
                            aria-label="Enregistrer un message audio"
                            className={cn(
                                "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                                state === "recording"
                                    ? "bg-[var(--status-danger-soft)] text-[var(--status-danger)] cursor-not-allowed"
                                    : "border border-[var(--ink-200)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]",
                            )}
                        >
                            <Mic className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!canSend}
                        aria-label={state === "preview" ? "Envoyer le message audio" : "Envoyer le message"}
                        className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="h-3 w-3" />
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    )
}
