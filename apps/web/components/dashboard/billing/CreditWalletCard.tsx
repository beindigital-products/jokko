import { ArrowRight, Lock, Wallet } from "lucide-react"

import { CreditBalanceHero } from "./CreditBalanceHero"
import { CreditPackTile } from "./CreditPackTile"
import { CreditAutoTopUp } from "./CreditAutoTopUp"
import type { CreditWallet } from "./types"

interface CreditWalletCardProps {
    wallet: CreditWallet
}

/**
 * CreditWalletCard — pay-as-you-go credit for marketing/utility campaigns.
 * Composes the balance hero, top-up packs, auto top-up toggle and the
 * secure-payment footer. Recreates the `RechargeDialog` design as an in-page
 * card. Pure presentational.
 */
export function CreditWalletCard({ wallet }: CreditWalletCardProps) {
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
                    <div className="grid grid-cols-4 gap-2">
                        {wallet.packs.map((p) => (
                            <CreditPackTile key={p.amount} pack={p} />
                        ))}
                    </div>
                </div>

                <CreditAutoTopUp description={wallet.autoTopUp} enabled={wallet.autoTopUpEnabled} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--ink-200)] bg-[var(--paper-warm)] px-[18px] py-3.5">
                <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-soft)]">
                    <Lock className="h-3 w-3" />
                    {wallet.paymentHint}
                </span>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                    {wallet.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}
