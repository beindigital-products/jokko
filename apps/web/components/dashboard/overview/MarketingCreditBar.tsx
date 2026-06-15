import Link from "next/link"
import { Plus } from "lucide-react"

import { Icon } from "../primitives/Icon"
import type { MarketingCredit } from "./types"

/**
 * MarketingCreditBar — full-width WhatsApp marketing-credit strip for the
 * cockpit. Accent-gradient balance block (left) + monthly usage meter (middle)
 * + a top-up CTA (right). The entry point to recharge Meta marketing-conversation
 * credit. Recreates `MarketingCreditBar` from the Jokko Desktop design.
 */
export function MarketingCreditBar({
    credit,
    onRecharge,
    rechargeHref = "/dashboard/billing",
}: {
    credit: MarketingCredit
    onRecharge?: () => void
    rechargeHref?: string
}) {
    const { balance, conversations, spent, budget, pct, runwayLabel, autoTopupLabel, low, lowLabel, ctaLabel } = credit
    const meterColor = low ? "var(--status-warn)" : "var(--accent)"

    return (
        <div
            className="flex flex-col overflow-hidden rounded-xl border bg-[var(--paper-white)] sm:flex-row sm:items-stretch"
            style={{ borderColor: low ? "rgba(220,56,56,0.35)" : "var(--ink-200)" }}
        >
            {/* Accent balance block */}
            <div
                className="flex flex-col justify-center px-[22px] py-4 text-white sm:min-w-[268px]"
                style={{ background: "linear-gradient(135deg, var(--accent) 0%, #2B0F8F 100%)" }}
            >
                <div className="flex items-center gap-[7px]">
                    <Icon name="whatsapp" size={13} color="#fff" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] opacity-80">
                        Crédit marketing WhatsApp
                    </span>
                </div>
                <div className="mt-2 font-display text-[38px] font-bold leading-none tabular-nums tracking-[-0.015em]">
                    {balance}
                </div>
                <div className="mt-1.5 text-[11.5px] opacity-85">≈ {conversations} conversations marketing</div>
            </div>

            {/* Usage meter */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-[9px] px-6 py-4">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] text-[var(--ink-700)]">Consommé ce mois · marketing</span>
                    <span className="font-mono text-[12px] tabular-nums text-[var(--ink-900)]">
                        {spent} / {budget}
                    </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ink-100)]">
                    <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: meterColor }}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <span
                        className="font-mono text-[11px]"
                        style={{ color: low ? "var(--status-danger)" : "var(--ink-soft)" }}
                    >
                        {low ? (lowLabel ?? "Solde bas — rechargez avant la prochaine campagne") : runwayLabel}
                    </span>
                    {autoTopupLabel ? (
                        <span className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--ink-500)]">
                            {autoTopupLabel}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Action */}
            <div className="flex items-center border-t border-[var(--ink-200)] px-[22px] py-4 sm:border-l sm:border-t-0">
                {onRecharge ? (
                    <button
                        type="button"
                        onClick={onRecharge}
                        className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--accent)] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {ctaLabel ?? "Ajouter des crédits"}
                    </button>
                ) : (
                    <Link
                        href={rechargeHref}
                        className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--accent)] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {ctaLabel ?? "Ajouter des crédits"}
                    </Link>
                )}
            </div>
        </div>
    )
}
