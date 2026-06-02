import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CreditWalletCard } from "@/components/dashboard/billing/CreditWalletCard"
import type { CreditWallet } from "@/components/dashboard/billing/types"

const WALLET: CreditWallet = {
    balance: "€38.20",
    estimate: "≈ 1 200 conv. Utility · 480 Marketing",
    packs: [
        { amount: "€50", note: "≈ 1 550 conv." },
        { amount: "€100", note: "≈ 3 100 conv.", selected: true },
        { amount: "€250", note: "≈ 7 750 conv." },
        { amount: "€500", note: "≈ 15 500 conv." },
    ],
    autoTopUp: "Recharger automatiquement de €100 quand le solde passe sous €10.",
    autoTopUpEnabled: true,
    paymentHint: "Paiement sécurisé · Stripe · VISA •••• 4842",
    ctaLabel: "Recharger €100",
}

const meta = {
    title: "Primitives/Credit",
    component: CreditWalletCard,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <div style={{ maxWidth: 560 }}>
                    <Story />
                </div>
            </div>
        ),
    ],
} satisfies Meta<typeof CreditWalletCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { wallet: WALLET, selectedIndex: 1 },
}
