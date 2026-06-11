"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2, Lock } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const FCFA_PER_CONVERSATION = 60
const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`

interface RechargeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Current balance, already formatted (e.g. "12 000 FCFA"). */
    balanceLabel: string
    /** Conversations the balance covers (e.g. "200"). */
    conversationsLabel?: string
    /** Valid top-up amounts in FCFA. */
    amounts: number[]
    /** Start the Stripe checkout for the chosen amount. */
    onPay: (amount: number) => void | Promise<void>
    paying?: boolean
    insufficient?: boolean
    insufficientNote?: string
}

/**
 * RechargeDialog — v3 "Recharger le crédit conversations" top-up modal,
 * recreated from the design handoff `RechargeDialog`. Balance card + amount
 * picker + auto-top-up shortcut + Stripe checkout. Amounts are in FCFA (the
 * backend's currency); the design's € mock is adapted to it.
 */
export function RechargeDialog({
    open,
    onOpenChange,
    balanceLabel,
    conversationsLabel,
    amounts,
    onPay,
    paying,
    insufficient,
    insufficientNote,
}: RechargeDialogProps) {
    const [amount, setAmount] = useState(amounts[1] ?? amounts[0] ?? 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-2xl border-[var(--ink-200)] bg-[var(--paper-white)] p-0 sm:max-w-[520px]">
                <DialogHeader className="space-y-0 px-6 pb-4 pt-6 text-left">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Facturation · crédit conversations Meta
                    </p>
                    <DialogTitle className="mt-1 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                        {insufficient ? "Crédit insuffisant — rechargez pour envoyer" : "Recharger le crédit conversations"}
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-[13px] leading-snug text-[var(--ink-500)]">
                        Le crédit est consommé par Meta selon le pays et la catégorie de conversation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-6 py-5">
                    {insufficient && insufficientNote ? (
                        <div className="flex items-center gap-2.5 rounded-lg border border-[var(--status-danger)]/25 bg-[var(--status-danger-soft)]/60 px-3.5 py-3 text-[12.5px] text-[var(--ink-700)]">
                            <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--status-danger)]" />
                            {insufficientNote}
                        </div>
                    ) : null}

                    {/* Balance card */}
                    <div
                        className="rounded-xl px-5 py-4 text-white"
                        style={{ background: "linear-gradient(135deg, var(--accent), #2B0F8F)" }}
                    >
                        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] opacity-75">Solde actuel</div>
                        <div className="mt-1 font-editorial text-[36px] leading-none tracking-[-0.015em]">{balanceLabel}</div>
                        {conversationsLabel ? (
                            <div className="mt-2 text-[12px] opacity-85">≈ {conversationsLabel} conversations marketing</div>
                        ) : null}
                    </div>

                    {/* Amount picker */}
                    <div>
                        <div className="mb-1.5 text-[12px] font-medium text-[var(--ink-700)]">Montant à recharger</div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {amounts.map((a) => {
                                const on = a === amount
                                return (
                                    <button
                                        key={a}
                                        type="button"
                                        onClick={() => setAmount(a)}
                                        className={cn(
                                            "rounded-[10px] border px-2 py-3 text-center transition",
                                            on
                                                ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                                                : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:border-[var(--ink-300)]",
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "font-editorial text-[17px] tracking-[-0.01em]",
                                                on ? "text-[var(--accent)]" : "text-[var(--ink-900)]",
                                            )}
                                        >
                                            {fcfa(a)}
                                        </div>
                                        <div className="mt-1 font-mono text-[10.5px] text-[var(--ink-soft)]">
                                            ≈ {Math.round(a / FCFA_PER_CONVERSATION).toLocaleString("fr-FR")} conv.
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Auto top-up → billing */}
                    <Link
                        href="/dashboard/billing"
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3.5 py-2.5 text-[12.5px] text-[var(--ink-700)] transition hover:border-[var(--accent)]"
                    >
                        <span>Recharge automatique quand le solde est bas</span>
                        <span className="inline-flex shrink-0 items-center gap-1 font-medium text-[var(--accent)]">
                            Configurer
                            <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                    </Link>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/50 px-6 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--ink-soft)]">
                        <Lock className="h-3 w-3" />
                        Paiement sécurisé · Stripe
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="inline-flex h-9 items-center rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            disabled={paying || !amount}
                            onClick={() => onPay(amount)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white transition hover:bg-[var(--ink-700)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {paying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Payer {fcfa(amount)}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
