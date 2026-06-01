"use client"

import { FileDown } from "lucide-react"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { PlanCard } from "./PlanCard"
import { UsageStrip } from "./UsageStrip"
import { InvoicesTable } from "./InvoicesTable"
import type { BillingData } from "./types"

interface BillingScreenProps {
    data: BillingData
}

/**
 * BillingScreen — v3 "Facturation" page. Composes the header, plan hero
 * card, 3-column usage strip, and invoices table. Recreates `ScreenBilling`
 * from screens-admin.jsx. Pure presentational.
 */
export function BillingScreen({ data }: BillingScreenProps) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={data.eyebrow}
                title="Facturation"
                description="Plan, consommation, factures et méthodes de paiement. Facturation Stripe."
                actions={
                    <HeaderButton icon={FileDown}>Télécharger factures</HeaderButton>
                }
            />

            <div className="flex-1 space-y-5 overflow-y-auto px-8 pb-8 pt-10">
                <PlanCard plan={data.plan} />
                <UsageStrip usage={data.usage} />
                <InvoicesTable
                    invoices={data.invoices}
                    title={
                        data.invoices.length > 0
                            ? `${data.invoices.length} dernière${data.invoices.length > 1 ? "s" : ""} facture${data.invoices.length > 1 ? "s" : ""}`
                            : "Factures"
                    }
                />
            </div>
        </div>
    )
}
