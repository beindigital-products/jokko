'use client'

import { useMemo, useState } from "react"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import { CREDIT_PACKS } from "@/lib/credit-packs"
import { CreditWalletCard } from "@/components/dashboard/billing/CreditWalletCard"
import type { CreditWallet } from "@/components/dashboard/billing/types"
import { RechargeDialog } from "./recharge-dialog"

const formatXOF = (amount: number) =>
    new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(amount)

const formatInt = (amount: number) => new Intl.NumberFormat("fr-FR").format(amount)

/** Default pack: the one flagged `popular`, else the first. */
const DEFAULT_INDEX = Math.max(
    0,
    CREDIT_PACKS.findIndex((p) => p.popular),
)

/** ~60 FCFA per marketing message (matches CREDIT_PACKS messagesEstimated). */
const FCFA_PER_MESSAGE = 60
/** Below this balance we surface the low-balance treatment. */
const LOW_BALANCE_THRESHOLD = 1_000

/**
 * CreditWalletCardConnected — wires the v3 CreditWalletCard to the real credit
 * balance (`credits.getBalance`, in XOF) and the existing Wave/Carte recharge
 * flow (RechargeDialog). Selecting a pack + "Recharger" opens the dialog
 * pre-seeded on the payment step.
 */
export function CreditWalletCardConnected() {
    const balance = useQuery(api.credits.getBalance)
    const [selectedIndex, setSelectedIndex] = useState(DEFAULT_INDEX)
    const [rechargeOpen, setRechargeOpen] = useState(false)

    const value = balance ?? 0
    const selectedPack = CREDIT_PACKS[selectedIndex] ?? CREDIT_PACKS[DEFAULT_INDEX]

    const wallet: CreditWallet = useMemo(() => {
        const low = value < LOW_BALANCE_THRESHOLD
        return {
            balance: formatXOF(value),
            estimate: `≈ ${formatInt(Math.floor(value / FCFA_PER_MESSAGE))} messages marketing`,
            low,
            alert: low
                ? "Solde bas — rechargez pour lancer vos campagnes marketing."
                : undefined,
            packs: CREDIT_PACKS.map((p) => ({
                amount: formatInt(p.amountFCFA),
                note: `FCFA · ≈ ${formatInt(p.messagesEstimated)} msg`,
            })),
            paymentHint: "Paiement sécurisé · Wave · Carte bancaire",
            ctaLabel: `Recharger ${selectedPack.label}`,
        }
    }, [value, selectedPack.label])

    return (
        <>
            <CreditWalletCard
                wallet={wallet}
                selectedIndex={selectedIndex}
                onSelectPack={setSelectedIndex}
                onRecharge={() => setRechargeOpen(true)}
            />
            <RechargeDialog
                open={rechargeOpen}
                onOpenChange={setRechargeOpen}
                initialAmount={selectedPack.amountFCFA}
            />
        </>
    )
}
