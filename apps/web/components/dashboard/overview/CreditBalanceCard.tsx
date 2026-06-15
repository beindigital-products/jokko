import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { CreditBalance } from "./types"

/**
 * CreditBalanceCard — compact accent-gradient widget for the overview cockpit.
 * Shows the marketing-campaign credit balance + a quick top-up CTA that links
 * to the billing screen. Low state surfaces a "Solde bas" pill.
 */
export function CreditBalanceCard({
    credit,
    rechargeHref = "/dashboard/billing",
}: {
    credit: CreditBalance
    rechargeHref?: string
}) {
    return (
        <div
            className="relative overflow-hidden rounded-xl px-[18px] py-4 text-white"
            style={{ background: "linear-gradient(135deg, var(--accent) 0%, #2B0F8F 100%)" }}
        >
            {/* Radial glow decoration */}
            <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)" }}
            />
            <div className="relative flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] opacity-75">
                    Crédit campagnes
                </span>
                {credit.low ? (
                    <span className="rounded-md bg-[var(--status-warn)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.05em] text-white">
                        Solde bas
                    </span>
                ) : (
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] opacity-60">
                        Pay-as-you-go
                    </span>
                )}
            </div>

            <div className="relative mt-2 font-display text-[30px] font-bold leading-none tabular-nums tracking-tight">
                {credit.balance}
            </div>
            <p className="relative mt-1.5 text-[11.5px] leading-snug opacity-85">{credit.estimate}</p>

            <Link
                href={rechargeHref}
                className="relative mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[13px] font-semibold text-[var(--accent)] transition-colors hover:bg-white/90"
            >
                {credit.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    )
}
