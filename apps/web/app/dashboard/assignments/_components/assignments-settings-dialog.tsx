"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface AssignmentSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

/** v3 toggle row — accent track + white knob, like the page's MasterSwitch. */
function ToggleRow({
    title,
    sub,
    checked,
    onChange,
}: {
    title: string
    sub: string
    checked: boolean
    onChange: (next: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex-1">
                <p className="text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink-900)]">
                    {title}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-[var(--ink-soft)]">{sub}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={title}
                onClick={() => onChange(!checked)}
                className="relative shrink-0"
                style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: checked ? "var(--accent)" : "var(--ink-300)",
                }}
            >
                <span
                    className="absolute"
                    style={{
                        top: 2,
                        left: checked ? 22 : 2,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                        transition: "left 0.15s",
                    }}
                />
            </button>
        </div>
    )
}

/**
 * AssignmentSettingsDialog — v3 (Cobalt × paper × ink) modal to configure the
 * three backed auto-assignment settings: master toggle, exclude-offline, and
 * max concurrent chats per agent. Persists via `updateAssignmentSettings`.
 */
export function AssignmentSettingsDialog({ open, onOpenChange }: AssignmentSettingsDialogProps) {
    const settings = useQuery(api.assignments.getAssignmentSettings)
    const updateSettings = useMutation(api.assignments.updateAssignmentSettings)

    const [autoAssignEnabled, setAutoAssignEnabled] = useState(false)
    const [maxConcurrentChats, setMaxConcurrentChats] = useState(5)
    const [excludeOfflineAgents, setExcludeOfflineAgents] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (settings) {
            setAutoAssignEnabled(settings.autoAssignEnabled ?? false)
            setMaxConcurrentChats(settings.maxConcurrentChats ?? 5)
            setExcludeOfflineAgents(settings.excludeOfflineAgents ?? true)
        }
    }, [settings])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateSettings({
                autoAssignEnabled,
                maxConcurrentChats: Number(maxConcurrentChats) || 1,
                excludeOfflineAgents,
            })
            toast.success("Réglages d'attribution enregistrés")
            onOpenChange(false)
        } catch {
            toast.error("Impossible d'enregistrer les réglages")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-xl border-[var(--ink-200)] bg-[var(--paper-white)] p-0 sm:max-w-[440px]">
                <DialogHeader className="space-y-0 border-b border-[var(--ink-200)] px-[22px] pb-4 pt-5 text-left">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Routage · attribution
                    </p>
                    <DialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                        Réglages d&apos;attribution
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-[13px] leading-snug text-[var(--ink-500)]">
                        Configurez comment les conversations sont distribuées à votre équipe.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-[22px] py-1">
                    <ToggleRow
                        title="Attribution automatique"
                        sub="Activée par défaut. Sinon, les conversations restent à attribuer manuellement."
                        checked={autoAssignEnabled}
                        onChange={setAutoAssignEnabled}
                    />
                    <div className="h-px bg-[var(--ink-100)]" />
                    <ToggleRow
                        title="Exclure les agents hors ligne"
                        sub="Ne pas attribuer de conversations aux agents déconnectés."
                        checked={excludeOfflineAgents}
                        onChange={setExcludeOfflineAgents}
                    />
                    <div className="h-px bg-[var(--ink-100)]" />
                    <div className="py-3">
                        <label
                            htmlFor="max-chats"
                            className="text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink-900)]"
                        >
                            Conversations simultanées max par agent
                        </label>
                        <div className="mt-2 flex items-center gap-3">
                            <input
                                id="max-chats"
                                type="number"
                                min={1}
                                max={50}
                                value={maxConcurrentChats}
                                onChange={(e) => setMaxConcurrentChats(Number(e.target.value))}
                                className="h-9 w-24 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13px] tabular-nums text-[var(--ink-900)] focus:border-[var(--accent)] focus:outline-none"
                            />
                            <p className="flex-1 text-[12px] leading-snug text-[var(--ink-soft)]">
                                Limite globale appliquée aux nouveaux membres.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-row justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-[22px] py-3.5">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-60"
                    >
                        {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Enregistrer
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
