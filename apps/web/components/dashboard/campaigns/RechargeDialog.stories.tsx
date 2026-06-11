import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { RechargeDialog } from "./RechargeDialog"

const meta = {
    title: "Screens/Campaigns/Recharge",
    parameters: { layout: "fullscreen" },
} satisfies Meta

export default meta
type Story = StoryObj

function Frame({ insufficient }: { insufficient?: boolean }) {
    const [open, setOpen] = useState(true)
    return (
        <div className="relative flex items-center justify-center" style={{ width: "100%", height: 760, background: "var(--paper-warm)" }}>
            <RechargeDialog
                open={open}
                onOpenChange={setOpen}
                balanceLabel="12 000 FCFA"
                conversationsLabel="200"
                amounts={[5000, 10000, 25000, 50000, 100000]}
                onPay={(a) => console.log("pay", a)}
                insufficient={insufficient}
                insufficientNote={
                    insufficient ? "Campagne « Réactivation 90j » bloquée — besoin de 22 000 FCFA, solde 12 000 FCFA." : undefined
                }
            />
        </div>
    )
}

export const Default: Story = { name: "Recharge crédit", render: () => <Frame /> }
export const Insufficient: Story = { name: "Crédit insuffisant", render: () => <Frame insufficient /> }
