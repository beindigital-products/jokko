"use client"

import { useState } from "react"
import { Loader2, X } from "lucide-react"

import { Icon } from "../primitives/Icon"
import { IntegrationLogo } from "./IntegrationLogo"
import { integrationScopes } from "./scopes"
import type { IntegrationCategory } from "./types"

export interface ConnectTarget {
    id: string
    name: string
    cat: IntegrationCategory
    authMode: "oauth2" | "apiKey"
}

interface IntegrationConnectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    integration: ConnectTarget | null
    workspace?: string
    instanceHint?: { label: string; placeholder: string }
    /** OAuth redirect or api-key submit in progress. */
    submitting?: boolean
    onConnectOAuth: () => void
    onConnectApiKey: (apiKey: string, instance?: string) => void
}

/**
 * IntegrationConnectDialog — v3 connect-consent modal (design `IntegrationConnectDialog`).
 * Shows the scopes Jokko will receive + an OAuth security note; for OAuth providers
 * "Connecter" triggers the real authorize redirect, for api-key providers it reveals
 * the key fields and submits. Host remounts via `key` per open for fresh state.
 */
export function IntegrationConnectDialog({
    open,
    onOpenChange,
    integration,
    workspace,
    instanceHint,
    submitting = false,
    onConnectOAuth,
    onConnectApiKey,
}: IntegrationConnectDialogProps) {
    const [apiKey, setApiKey] = useState("")
    const [instance, setInstance] = useState("")

    if (!open || !integration) return null
    const it = integration
    const isApiKey = it.authMode === "apiKey"
    const scopes = integrationScopes(it.cat)
    const close = () => onOpenChange(false)

    const confirm = () => {
        if (submitting) return
        if (isApiKey) onConnectApiKey(apiKey.trim(), instance.trim() || undefined)
        else onConnectOAuth()
    }
    const canConfirm = !submitting && (!isApiKey || (apiKey.trim() && (!instanceHint || instance.trim())))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Fermer"
                onClick={close}
                className="absolute inset-0 bg-[var(--ink-900)]/30 backdrop-blur-[1.5px]"
            />
            <div
                className="relative z-10 flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-2xl"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center gap-3 border-b border-[var(--ink-200)] px-6 pb-4 pt-5">
                    <IntegrationLogo id={it.id} name={it.name} />
                    <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Connecter un connecteur
                        </p>
                        <h2 className="font-display text-[20px] font-bold tracking-tight text-[var(--ink-900)]">{it.name}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-500)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
                    <p className="text-[13.5px] leading-relaxed text-[var(--ink-700)]">
                        Vous allez autoriser <span className="font-semibold text-[var(--ink-900)]">{it.name}</span> à se
                        connecter{workspace ? <> à votre espace <span className="font-semibold text-[var(--ink-900)]">{workspace}</span></> : " à votre espace de travail"}.
                    </p>

                    <div>
                        <p className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                            Jokko pourra
                        </p>
                        <div className="flex flex-col gap-2.5">
                            {scopes.map((s, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-[var(--accent-muted)]">
                                        <Icon name={s.icon} size={13.5} color="var(--accent)" strokeWidth={1.9} />
                                    </span>
                                    <span className="text-[13px] text-[var(--ink-700)]">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isApiKey ? (
                        <div className="flex flex-col gap-3">
                            {instanceHint ? (
                                <div>
                                    <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-700)]">
                                        {instanceHint.label}
                                    </label>
                                    <input
                                        value={instance}
                                        onChange={(e) => setInstance(e.target.value)}
                                        placeholder={instanceHint.placeholder}
                                        disabled={submitting}
                                        className="h-10 w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13.5px] text-[var(--ink-900)] outline-none transition-colors placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]"
                                    />
                                </div>
                            ) : null}
                            <div>
                                <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-700)]">Clé API</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    autoComplete="off"
                                    placeholder="••••••••••••••••"
                                    disabled={submitting}
                                    className="h-10 w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13.5px] text-[var(--ink-900)] outline-none transition-colors placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]"
                                />
                                <p className="mt-1.5 text-[11px] text-[var(--ink-soft)]">
                                    Chiffrement AES-256 au repos. Jamais exposée côté client.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] p-3">
                            <Icon name="lock" size={14} color="var(--ink-soft)" strokeWidth={1.8} className="mt-0.5 shrink-0" />
                            <span className="text-[11.5px] leading-relaxed text-[var(--ink-soft)]">
                                Connexion sécurisée via OAuth 2.0. Aucun mot de passe n&apos;est stocké. Vous pouvez
                                révoquer l&apos;accès à tout moment.
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--ink-200)] px-6 py-4">
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={!canConfirm}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon name="lock" size={14} color="#fff" strokeWidth={2} />}
                        Connecter {it.name}
                    </button>
                </div>
            </div>
        </div>
    )
}
