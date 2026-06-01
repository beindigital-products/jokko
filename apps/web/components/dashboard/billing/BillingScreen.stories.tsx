import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { BillingScreen } from "./BillingScreen"
import type { BillingData } from "./types"

const DEFAULT_DATA: BillingData = {
    eyebrow: "Compte · Pro · facture mensuelle",
    plan: {
        name: "Pro",
        tagline: "jusqu'à 10 sièges · 3 numéros",
        price: "€149",
        priceUnit: "/ mois HT",
        renewalNote:
            "Renouvellement automatique le 26 juin 2026. Période d'essai terminée — paiement actif via VISA •••• 4842.",
    },
    usage: [
        {
            label: "Conversations Meta",
            value: "4 612",
            total: "10 000",
            fraction: 0.4612,
            cost: "€148.72",
        },
        {
            label: "Contacts",
            value: "2 408",
            total: "5 000",
            fraction: 0.4816,
            cost: "inclus",
        },
        {
            label: "Sièges",
            value: "8",
            total: "10",
            fraction: 0.8,
            cost: "inclus",
        },
    ],
    invoices: [
        {
            id: "inv-1",
            date: "26 mai 2026",
            number: "INV-2026-0526",
            total: "€178.42",
            status: "paid",
        },
        {
            id: "inv-2",
            date: "26 avr. 2026",
            number: "INV-2026-0426",
            total: "€166.18",
            status: "paid",
        },
        {
            id: "inv-3",
            date: "26 mars 2026",
            number: "INV-2026-0326",
            total: "€189.04",
            status: "paid",
        },
        {
            id: "inv-4",
            date: "26 fév. 2026",
            number: "INV-2026-0226",
            total: "€149.00",
            status: "paid",
        },
        {
            id: "inv-5",
            date: "26 jan. 2026",
            number: "INV-2026-0126",
            total: "€149.00",
            status: "paid",
        },
        {
            id: "inv-6",
            date: "26 déc. 2025",
            number: "INV-2025-1226",
            total: "€149.00",
            status: "paid",
        },
    ],
}

const meta = {
    title: "Dashboard/Billing",
    component: BillingScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 880 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof BillingScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: DEFAULT_DATA },
}

export const Empty: Story = {
    args: {
        data: {
            eyebrow: "Compte · Pro · facture mensuelle",
            plan: {
                name: "Pro",
                tagline: "jusqu'à 10 sièges · 3 numéros",
                price: "€149",
                priceUnit: "/ mois HT",
                renewalNote:
                    "Renouvellement automatique le 26 juin 2026. Démarrage ce mois — aucun paiement encore enregistré.",
            },
            usage: [
                {
                    label: "Conversations Meta",
                    value: "0",
                    total: "10 000",
                    fraction: 0,
                    cost: "inclus",
                },
                {
                    label: "Contacts",
                    value: "0",
                    total: "5 000",
                    fraction: 0,
                    cost: "inclus",
                },
                {
                    label: "Sièges",
                    value: "1",
                    total: "10",
                    fraction: 0.1,
                    cost: "inclus",
                },
            ],
            invoices: [],
        },
    },
}
