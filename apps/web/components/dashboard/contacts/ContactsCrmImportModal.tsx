"use client"

import { useState } from "react"
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Loader2,
    ShieldCheck,
    Users,
    X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { CrmLogo } from "@/components/integrations/crm-logo"

export interface CrmProvider {
    id: string
    name: string
    /** Number of contacts the provider exposes — shown once connected. */
    contacts: number
}

export const CRM_PROVIDERS: CrmProvider[] = [
    { id: "hubspot", name: "HubSpot", contacts: 1284 },
    { id: "pipedrive", name: "Pipedrive", contacts: 642 },
    { id: "salesforce", name: "Salesforce", contacts: 3120 },
    { id: "sellsy", name: "Sellsy", contacts: 418 },
    { id: "axonaut", name: "Axonaut", contacts: 207 },
    { id: "nocrm", name: "noCRM.io", contacts: 96 },
]

/** Field mapping detected once a provider is connected. */
const FIELD_MAP: { from: string; to: string }[] = [
    { from: "Téléphone mobile", to: "phone" },
    { from: "Prénom + Nom", to: "name" },
    { from: "Email", to: "email" },
    { from: "Société", to: "company" },
    { from: "Étiquettes", to: "tags" },
]

type Step = "provider" | "mapping" | "done"

const STEPS: { id: Step; label: string }[] = [
    { id: "provider", label: "CRM" },
    { id: "mapping", label: "Mapping" },
    { id: "done", label: "Terminé" },
]

interface ContactsCrmImportModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Pre-select a provider (skips straight into a connected state). */
    defaultProviderId?: string
    /** Called once the import is confirmed. */
    onImported?: (provider: CrmProvider) => void
}

/**
 * ContactsCrmImportModal — v3 "Importer depuis un CRM" modal. Presentational
 * three-step flow: pick a CRM provider → review the auto-detected field
 * mapping → import summary. Used from the contacts empty-state and toolbar.
 */
export function ContactsCrmImportModal({
    open,
    onOpenChange,
    defaultProviderId,
    onImported,
}: ContactsCrmImportModalProps) {
    const [step, setStep] = useState<Step>(defaultProviderId ? "mapping" : "provider")
    const [providerId, setProviderId] = useState<string | null>(
        defaultProviderId ?? null,
    )
    const [busy, setBusy] = useState(false)

    if (!open) return null

    const provider = CRM_PROVIDERS.find((p) => p.id === providerId) ?? null
    const stepIndex = STEPS.findIndex((s) => s.id === step)

    function close() {
        onOpenChange(false)
    }

    function handleImport() {
        if (!provider) return
        setBusy(true)
        // Presentational: simulate the import, then land on the summary.
        setStep("done")
        setBusy(false)
        onImported?.(provider)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* backdrop */}
            <button
                type="button"
                aria-label="Fermer"
                onClick={close}
                className="absolute inset-0 bg-[var(--ink-900)]/30 backdrop-blur-[1px]"
            />

            {/* panel */}
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-xl">
                {/* header */}
                <div className="flex items-start justify-between border-b border-[var(--ink-100)] px-6 pb-4 pt-5">
                    <div>
                        <h2 className="font-display text-[18px] text-[var(--ink-900)]">
                            Importer depuis un CRM
                        </h2>
                        <p className="mt-0.5 text-[12.5px] text-[var(--ink-soft)]">
                            Synchronisez vos contacts existants en quelques clics.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Fermer"
                        onClick={close}
                        className="-mr-1 rounded-lg p-1.5 text-[var(--ink-400)] transition hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* step indicator */}
                <div className="flex items-center gap-2 px-6 pb-1 pt-4">
                    {STEPS.map((s, i) => {
                        const done = i < stepIndex
                        const current = i === stepIndex
                        return (
                            <div key={s.id} className="flex flex-1 items-center gap-2">
                                <span
                                    className={cn(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold",
                                        done && "bg-[var(--accent)] text-white",
                                        current &&
                                            "bg-[var(--accent-muted)] text-[var(--accent)] ring-1 ring-[var(--accent)]",
                                        !done &&
                                            !current &&
                                            "bg-[var(--paper-warm)] text-[var(--ink-soft)]",
                                    )}
                                >
                                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                                </span>
                                <span
                                    className={cn(
                                        "font-mono text-[9.5px] uppercase tracking-[0.1em]",
                                        current ? "text-[var(--ink-900)]" : "text-[var(--ink-soft)]",
                                    )}
                                >
                                    {s.label}
                                </span>
                                {i < STEPS.length - 1 ? (
                                    <span
                                        className={cn(
                                            "h-px flex-1",
                                            done ? "bg-[var(--accent)]" : "bg-[var(--ink-100)]",
                                        )}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </div>

                {/* body */}
                <div className="px-6 py-5">
                    {step === "provider" ? (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                            {CRM_PROVIDERS.map((p) => {
                                const active = providerId === p.id
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setProviderId(p.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition",
                                            active
                                                ? "border-[var(--accent)] bg-[var(--accent-muted)] ring-1 ring-[var(--accent)]"
                                                : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:bg-[var(--paper-warm)]",
                                        )}
                                    >
                                        <span className="flex h-9 w-9 items-center justify-center">
                                            <CrmLogo provider={p.id} className="h-full w-full" />
                                        </span>
                                        <span className="text-[12.5px] font-medium text-[var(--ink-900)]">
                                            {p.name}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    ) : null}

                    {step === "mapping" && provider ? (
                        <div>
                            <div className="flex items-center gap-3 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                                    <CrmLogo provider={provider.id} className="h-full w-full" />
                                </span>
                                <div className="min-w-0">
                                    <div className="text-[13px] font-semibold text-[var(--ink-900)]">
                                        {provider.name}
                                    </div>
                                    <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--status-good)]">
                                        ● Connecté · {provider.contacts.toLocaleString("fr-FR")} contacts
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                                Correspondance des champs
                            </div>
                            <div className="mt-2 divide-y divide-[var(--ink-100)] rounded-xl border border-[var(--ink-200)]">
                                {FIELD_MAP.map((f) => (
                                    <div
                                        key={f.to}
                                        className="flex items-center justify-between px-3 py-2"
                                    >
                                        <span className="text-[12.5px] text-[var(--ink-700)]">
                                            {f.from}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <ArrowRight className="h-3 w-3 text-[var(--ink-400)]" />
                                            <span className="font-mono text-[11px] text-[var(--ink-900)]">
                                                {f.to}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 flex items-start gap-2 text-[11.5px] text-[var(--ink-soft)]">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-good)]" />
                                Les doublons (même numéro) seront fusionnés, pas dupliqués.
                            </div>
                        </div>
                    ) : null}

                    {step === "done" && provider ? (
                        <div className="flex flex-col items-center py-4 text-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-good-soft)] text-[var(--status-good)]">
                                <Check className="h-6 w-6" strokeWidth={2.5} />
                            </span>
                            <div className="mt-3 text-[15px] font-semibold text-[var(--ink-900)]">
                                {provider.contacts.toLocaleString("fr-FR")} contacts importés
                            </div>
                            <p className="mt-1 max-w-xs text-[12.5px] text-[var(--ink-soft)]">
                                Vos contacts {provider.name} sont maintenant dans votre annuaire.
                                La synchronisation restera active en arrière-plan.
                            </p>
                        </div>
                    ) : null}
                </div>

                {/* footer */}
                <div className="flex items-center justify-between border-t border-[var(--ink-100)] bg-[var(--paper-warm)]/50 px-6 py-3.5">
                    {step === "done" ? (
                        <button
                            type="button"
                            onClick={close}
                            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white"
                        >
                            <Users className="h-3.5 w-3.5" />
                            Voir mes contacts
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    if (step === "provider") close()
                                    else setStep("provider")
                                }}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ink-200)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                            >
                                {step === "provider" ? (
                                    "Annuler"
                                ) : (
                                    <>
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Retour
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                disabled={!provider || busy}
                                onClick={() => {
                                    if (step === "provider") setStep("mapping")
                                    else handleImport()
                                }}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {busy ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Import…
                                    </>
                                ) : step === "provider" ? (
                                    <>
                                        Continuer
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                ) : (
                                    <>
                                        Importer {provider ? provider.contacts.toLocaleString("fr-FR") : ""} contacts
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
