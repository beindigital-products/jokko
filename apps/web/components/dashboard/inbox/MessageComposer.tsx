"use client"

import { useState } from "react"
import { Paperclip, Smile, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type ComposerMode = "reply" | "note" | "templates" | "shortcuts"

interface MessageComposerProps {
    placeholder?: string
    onSend?: (text: string, mode: ComposerMode) => void
}

/**
 * MessageComposer — bottom textarea of the inbox thread. Mode tabs
 * (Réponse / Note / Modèles / Raccourcis), AI shortcut hint top-right,
 * format buttons + Send.
 */
export function MessageComposer({
    placeholder = "Tapez un message, / pour un raccourci, @ pour mentionner un coéquipier…",
    onSend,
}: MessageComposerProps) {
    const [mode, setMode] = useState<ComposerMode>("reply")
    const [value, setValue] = useState("")
    const modes: { key: ComposerMode; label: string }[] = [
        { key: "reply", label: "Réponse" },
        { key: "note", label: "Note" },
        { key: "templates", label: "Modèles" },
        { key: "shortcuts", label: "Raccourcis" },
    ]
    return (
        <div className="border-t border-[var(--ink-200)] bg-[var(--paper-white)] px-5 py-3">
            <div className="mb-2 flex items-center gap-2">
                {modes.map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        onClick={() => setMode(m.key)}
                        className={cn(
                            "rounded-md px-2.5 py-1 text-[12px] font-medium",
                            mode === m.key
                                ? "bg-[var(--ink-900)] text-white"
                                : "text-[var(--ink-soft)] hover:text-[var(--ink-900)]",
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
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                rows={2}
                className="w-full resize-none rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-2.5 text-[12.5px] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]"
            />
            <div className="mt-2 flex items-center gap-1.5 text-[var(--ink-400)]">
                <button className="rounded p-1 hover:text-[var(--ink-700)]" aria-label="Joindre">
                    <Paperclip className="h-3.5 w-3.5" />
                </button>
                <button className="rounded p-1 hover:text-[var(--ink-700)]" aria-label="Emoji">
                    <Smile className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onSend?.(value, mode)
                        setValue("")
                    }}
                    disabled={!value.trim()}
                    className="ml-auto inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Envoyer
                </button>
            </div>
        </div>
    )
}
