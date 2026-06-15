/**
 * CreditBalanceHero — accent-gradient panel showing the current credit
 * balance and its conversation-equivalent. Mirrors the gradient balance box
 * of the `RechargeDialog` design (kept identical in the low state; the alert
 * is rendered separately above it by CreditWalletCard).
 */
export function CreditBalanceHero({
    balance,
    estimate,
}: {
    balance: string
    estimate: string
}) {
    return (
        <div
            className="relative overflow-hidden rounded-xl px-5 py-[18px] text-white"
            style={{ background: "linear-gradient(135deg, var(--accent) 0%, #2B0F8F 100%)" }}
        >
            {/* Radial glow decoration */}
            <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)" }}
            />
            <div className="relative">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] opacity-75">
                    Solde actuel
                </div>
                <div className="mt-1 font-display text-[40px] font-bold leading-none tabular-nums tracking-tight">
                    {balance}
                </div>
                <div className="mt-2 text-[12px] opacity-85">{estimate}</div>
            </div>
        </div>
    )
}
