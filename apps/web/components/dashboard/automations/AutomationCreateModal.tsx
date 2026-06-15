"use client"

import { useState } from "react"
import { ArrowRight, LayoutGrid, Loader2, Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "../primitives/Icon"

export type AutomationMode = "guided" | "diagram"

export interface AutomationCreateInput {
    name: string
    triggerType: string
    mode: AutomationMode
}

interface AutomationCreateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Persist the flow + route to the chosen editor. */
    onCreate?: (input: AutomationCreateInput) => void | Promise<void>
    creating?: boolean
}

const TRIGGERS: { id: string; label: string; desc: string; icon: IconName }[] = [
    { id: "NEW_CONVERSATION", label: "Nouveau message", desc: "1er message d'un contact", icon: "bolt" },
    { id: "KEYWORD", label: "Mot-clé", desc: "Un mot précis est reçu", icon: "flag" },
    { id: "NO_REPLY", label: "Sans réponse", desc: "Timeout après silence", icon: "clock" },
    { id: "SCHEDULE", label: "Plage horaire", desc: "Hors heures d'ouverture", icon: "clock" },
    { id: "WEBHOOK", label: "Webhook", desc: "Événement externe (API)", icon: "globe" },
]

const MODES: { id: AutomationMode; label: string; desc: string; tag: string; Icon: typeof Sparkles }[] = [
    {
        id: "guided",
        label: "Assistant IA",
        desc: "Décrivez votre besoin en langage naturel, l'IA construit le flux pour vous.",
        tag: "Recommandé",
        Icon: Sparkles,
    },
    {
        id: "diagram",
        label: "Éditeur visuel",
        desc: "Glissez-déposez nœuds, conditions et actions sur un canevas libre.",
        tag: "Avancé",
        Icon: LayoutGrid,
    },
]

/**
 * AutomationCreateModal — v3 "Nouvelle automatisation" modal recreated from the
 * design handoff (`screens-flows.jsx` FlowCreateModal): name + trigger (5 cards)
 * + build method (Assistant IA / Éditeur visuel). Hands off to the page which
 * creates the flow and routes to the right editor.
 */
export function AutomationCreateModal({ open, onOpenChange, onCreate, creating = false }: AutomationCreateModalProps) {
    const [name, setName] = useState("")
    const [trigger, setTrigger] = useState(TRIGGERS[0].id)
    const [mode, setMode] = useState<AutomationMode>("guided")

    // The host remounts via a `key` per open, so initial state is always fresh.
    if (!open) return null

    const close = () => onOpenChange(false)
    const submit = () => {
        if (creating) return
        onCreate?.({ name: name.trim() || "Nouvelle automatisation", triggerType: trigger, mode })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Fermer"
                onClick={close}
                className="absolute inset-0 bg-[var(--ink-900)]/30 backdrop-blur-[1.5px]"
            />
            <div
                className="relative z-10 flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-2xl"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[var(--ink-200)] px-6 pb-4 pt-5">
                    <div>
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Nouvelle automatisation
                        </p>
                        <h2 className="mt-1 font-display text-[20px] font-bold tracking-tight text-[var(--ink-900)]">
                            Créer une automatisation
                        </h2>
                        <p className="mt-1 max-w-md text-[13px] text-[var(--ink-500)]">
                            Nommez le flow, choisissez ce qui le déclenche, puis comment vous voulez le construire.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--ink-500)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
                    <div>
                        <div className="mb-1.5 flex items-baseline justify-between">
                            <label className="text-[12px] font-medium text-[var(--ink-700)]">
                                Nom de l&apos;automatisation
                            </label>
                            <span className="text-[11px] text-[var(--ink-soft)]">non visible par le client</span>
                        </div>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ex. Accueil — premier message"
                            className="h-10 w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13.5px] text-[var(--ink-900)] outline-none transition-colors placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]"
                        />
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-baseline justify-between">
                            <label className="text-[12px] font-medium text-[var(--ink-700)]">Déclencheur</label>
                            <span className="text-[11px] text-[var(--ink-soft)]">exécution serveur</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {TRIGGERS.map((t) => {
                                const on = trigger === t.id
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTrigger(t.id)}
                                        className={cn(
                                            "rounded-[10px] border px-3 py-2.5 text-left transition-colors",
                                            on
                                                ? "border-[var(--accent)] bg-[var(--accent)]/5"
                                                : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:bg-[var(--paper-warm)]",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex h-[26px] w-[26px] items-center justify-center rounded-md",
                                                on ? "bg-[var(--accent-muted)]" : "bg-[var(--paper-warm)]",
                                            )}
                                        >
                                            <Icon name={t.icon} size={14} color={on ? "var(--accent)" : "var(--ink-500)"} />
                                        </span>
                                        <div className="mt-2 text-[12.5px] font-semibold tracking-[-0.005em] text-[var(--ink-900)]">
                                            {t.label}
                                        </div>
                                        <div className="mt-0.5 text-[11px] leading-[1.3] text-[var(--ink-soft)]">
                                            {t.desc}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-700)]">
                            Méthode de création
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {MODES.map((m) => {
                                const on = mode === m.id
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setMode(m.id)}
                                        className={cn(
                                            "relative rounded-xl border p-4 text-left transition-colors",
                                            on
                                                ? "border-[var(--accent)] bg-[var(--accent)]/5"
                                                : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:bg-[var(--paper-warm)]",
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className={cn(
                                                    "flex h-9 w-9 items-center justify-center rounded-[9px]",
                                                    on ? "bg-[var(--accent)] text-white" : "bg-[var(--paper-warm)] text-[var(--ink-500)]",
                                                )}
                                            >
                                                <m.Icon className="h-[18px] w-[18px]" />
                                            </span>
                                            <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                                                {m.label}
                                            </span>
                                            <span
                                                className={cn(
                                                    "ml-auto rounded-md px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em]",
                                                    on
                                                        ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                                                        : "bg-[var(--paper-warm)] text-[var(--ink-soft)]",
                                                )}
                                            >
                                                {m.tag}
                                            </span>
                                        </div>
                                        <div className="mt-2.5 text-[12px] leading-[1.45] text-[var(--ink-500)]">
                                            {m.desc}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 border-t border-[var(--ink-200)] px-6 py-4">
                    <span className="font-mono text-[11.5px] tracking-[0.02em] text-[var(--ink-soft)]">
                        {mode === "guided" ? "→ Ouvre l'assistant conversationnel" : "→ Ouvre le canevas vierge"}
                    </span>
                    <div className="flex-1" />
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={creating}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-60"
                    >
                        {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Créer
                        {!creating ? <ArrowRight className="h-3.5 w-3.5" /> : null}
                    </button>
                </div>
            </div>
        </div>
    )
}
