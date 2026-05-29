"use client"

import { useState } from "react"
import { Check, Copy, Globe } from "lucide-react"

interface WebhookBoxProps {
    url: string
    signatureLabel?: string
    verifiedAgo?: string
    lastStatus?: string
    label?: string
}

/**
 * WebhookBox — URL display + Copier button + HMAC signature info.
 * Used in Réglages > Canaux WhatsApp for the inbound webhook.
 */
export function WebhookBox({
    url,
    signatureLabel = "HMAC-SHA256",
    verifiedAgo,
    lastStatus,
    label = "Webhook entrant · partagé",
}: WebhookBoxProps) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(url).then(
            () => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
            },
            () => {
                // copy failed — silent (eg user blocked clipboard)
            },
        )
    }
    return (
        <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                {label}
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] p-2.5">
                <Globe className="h-3.5 w-3.5 text-[var(--ink-soft)]" />
                <span className="flex-1 truncate font-mono text-[11.5px]">{url}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2 py-1 text-[11px] hover:bg-[var(--paper-warm)]"
                >
                    {copied ? (
                        <>
                            <Check className="h-3 w-3 text-[var(--status-good)]" /> Copié
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3" /> Copier
                        </>
                    )}
                </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-[var(--ink-soft)]">
                <span>
                    Signature <span className="font-mono">{signatureLabel}</span>
                </span>
                {verifiedAgo ? (
                    <span className="text-[var(--status-good)]">
                        Vérifié {verifiedAgo}
                    </span>
                ) : null}
                {lastStatus ? (
                    <span className="text-[var(--status-good)]">{lastStatus}</span>
                ) : null}
            </div>
        </div>
    )
}
