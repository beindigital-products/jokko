import { ArrowRight, Loader2, Lock, Wallet } from "lucide-react"

import { CreditBalanceHero } from "./CreditBalanceHero"
import { CreditPackTile } from "./CreditPackTile"
import { CreditAutoTopUp } from "./CreditAutoTopUp"
import type { CreditWallet } from "./types"

interface CreditWalletCardProps {
    wallet: CreditWallet
    /** Index of the selected pack — overrides each pack's own `selected`. */
    selectedIndex?: number
    /** Called when a pack tile is clicked. */
    onSelectPack?: (index: number) => void
    /** Called when the primary recharge CTA is clicked. */
    onRecharge?: () => void
    /** Disables the CTA + shows a spinner while a payment session is created. */
    loading?: boolean
}

/**
 * CreditWalletCard — pay-as-you-go credit for marketing/utility campaigns.
 * Composes the balance hero, top-up packs, auto top-up toggle and the
 * secure-payment footer. Recreates the `RechargeDialog` design as an in-page
 * card. Presentational — selection + recharge are driven by callbacks.
 */
export function CreditWalletCard({
    wallet,
    selectedIndex,
    onSelectPack,
    onRecharge,
    loading,
}: CreditWalletCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--ink-200)] px-[18px] py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent-muted)] text-[var(--accent)]">
                    <Wallet className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        Crédit conversations · Meta
                    </div>
                    <div className="font-editorial text-[20px] leading-tight tracking-tight text-[var(--ink-900)]">
                        Recharger le crédit campagnes
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 px-[18px] py-4">
                {/* Low-balance alert */}
                {wallet.low && wallet.alert ? (
                    <div className="flex items-center gap-2.5 rounded-lg border border-[var(--status-danger)]/25 bg-[var(--status-danger-soft)] px-3.5 py-3 text-[12.5px] text-[var(--ink-700)]">
                        <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--status-danger)]" />
                        <span>{wallet.alert}</span>
                    </div>
                ) : null}

                <CreditBalanceHero balance={wallet.balance} estimate={wallet.estimate} />

                {/* Top-up packs */}
                <div>
                    <div className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        Montant à recharger
                    </div>
                    <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))" }}
                    >
                        {wallet.packs.map((p, i) => (
                            <CreditPackTile
                                key={p.amount}
                                pack={p}
                                selected={selectedIndex !== undefined ? i === selectedIndex : undefined}
                                onSelect={onSelectPack ? () => onSelectPack(i) : undefined}
                            />
                        ))}
                    </div>
                </div>

                {wallet.autoTopUp ? (
                    <CreditAutoTopUp
                        description={wallet.autoTopUp}
                        enabled={wallet.autoTopUpEnabled ?? false}
                    />
                ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--ink-200)] bg-[var(--paper-warm)] px-[18px] py-3.5">
                <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-soft)]">
                    <Lock className="h-3 w-3" />
                    {wallet.paymentHint}
                </span>
                <button
                    type="button"
                    onClick={onRecharge}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
                >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {wallet.ctaLabel}
                    {loading ? null : <ArrowRight className="h-3.5 w-3.5" />}
                </button>
            </div>
        </div>
    )
}
