"use client";

import { Loader2, X } from "lucide-react";
import { Icon } from "@/components/dashboard/primitives/Icon";
import { IntegrationLogo } from "@/components/dashboard/integrations/IntegrationLogo";
import { integrationScopes } from "@/components/dashboard/integrations/scopes";
import type { IntegrationCategory } from "@/components/dashboard/integrations";

interface DisconnectDialogProps {
    open: boolean;
    providerLabel: string;
    /** Provider key for the logo glyph (falls back to the lowercased label). */
    providerId?: string;
    category?: IntegrationCategory;
    onCancel: () => void;
    onConfirm: () => Promise<void> | void;
    busy?: boolean;
    /** When false, tokens are wiped locally and the user revokes access in the provider's UI. */
    supportsRemoteRevoke?: boolean;
}

/**
 * DisconnectDialog — v3 confirmation (design `IntegrationDisconnectDialog`).
 * Lists the actions that stop on disconnect + a reassurance note that synced
 * data is kept. Immediate (no acknowledgment checkbox).
 */
export function DisconnectDialog({
    open,
    providerLabel,
    providerId,
    category = "CRM",
    onCancel,
    onConfirm,
    busy,
    supportsRemoteRevoke = false,
}: DisconnectDialogProps) {
    if (!open) return null;
    const scopes = integrationScopes(category).slice(0, 3);

    async function handleConfirm() {
        if (busy) return;
        try {
            await onConfirm();
        } catch {
            // Parent owns error reporting.
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Fermer"
                onClick={() => !busy && onCancel()}
                className="absolute inset-0 bg-[var(--ink-900)]/30 backdrop-blur-[1.5px]"
            />
            <div
                className="relative z-10 flex w-full max-w-[476px] flex-col overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-2xl"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-start gap-3.5 px-6 pb-1 pt-6">
                    <span className="relative shrink-0">
                        <IntegrationLogo id={providerId ?? providerLabel.toLowerCase()} name={providerLabel} />
                        <span className="absolute -bottom-1.5 -right-1.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-[var(--paper-white)] bg-[var(--status-danger)]">
                            <Icon name="logout" size={10} color="#fff" strokeWidth={2.4} />
                        </span>
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-[16.5px] font-semibold tracking-tight text-[var(--ink-900)]">
                            Déconnecter {providerLabel} ?
                        </h2>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-500)]">
                            La synchronisation s&apos;arrête immédiatement. Ces actions ne seront plus exécutées :
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => !busy && onCancel()}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-500)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 pt-3.5">
                    <div className="flex flex-col gap-2">
                        {scopes.map((s, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <Icon name="close" size={13} color="var(--status-danger)" strokeWidth={2.2} className="shrink-0" />
                                <span className="text-[12.5px] text-[var(--ink-500)]">{s.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3">
                        <Icon name="shield" size={14} color="var(--status-good)" strokeWidth={1.8} className="mt-0.5 shrink-0" />
                        <span className="text-[11.5px] leading-relaxed text-[var(--ink-soft)]">
                            Vos données déjà synchronisées sont conservées. Vous pourrez reconnecter à tout moment.
                            {!supportsRemoteRevoke
                                ? ` Pensez à révoquer l'accès dans les paramètres de ${providerLabel}.`
                                : ""}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-60"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--status-danger)] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon name="logout" size={14} color="#fff" strokeWidth={2} />}
                        {busy ? "Déconnexion…" : "Déconnecter"}
                    </button>
                </div>
            </div>
        </div>
    );
}
