import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CopilotPanel } from "./CopilotPanel"

const meta = {
    title: "Dashboard/Inbox/Copilot",
    parameters: { layout: "fullscreen" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const Panel: Story = {
    name: "Panel · right column",
    render: () => (
        <div className="flex h-screen justify-end bg-[var(--paper-white)]">
            <CopilotPanel
                contactName="Mehdi Sané"
                initials="MS"
                color="violet"
                phone="+221 77 614 02 11"
                summary="Mehdi veut commander 3 × Tessier noir M, livraison Dakar mardi 3. Devis envoyé à 544 € TTC, en attente de confirmation paiement."
                draft="Mehdi, je vous confirme la prise en compte du règlement. Expédition demain matin, vous recevrez le numéro de suivi DHL dans la journée."
                attributes={[
                    { label: "Pays", value: "🇸🇳 Sénégal" },
                    { label: "Langue", value: "Français" },
                    { label: "Source", value: "Landing · 12 mai" },
                    { label: "Premier contact", value: "il y a 12 jours" },
                    { label: "Valeur estimée", value: "544 € · L1 cmd" },
                ]}
            />
        </div>
    ),
}
