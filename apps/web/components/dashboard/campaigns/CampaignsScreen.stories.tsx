import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CampaignsScreen } from "./CampaignsScreen"
import type { CampaignsData } from "./types"

const DATA: CampaignsData = {
    count: "6 campagnes",
    kpis: [
        { label: "Envoyés ce mois", value: "4 695", delta: "5 campagnes" },
        { label: "Taux de livraison", value: "98.4%", delta: "4 692 / 4 695" },
        { label: "Taux de lecture", value: "78.3%", delta: "3 672 lus" },
        { label: "Coût Meta · mois", value: "216 420 FCFA", delta: "5 diffusions" },
    ],
    campaigns: [
        { id: "1", name: "Nouvelle collection printemps", status: "sending", tpl: "Welcome customer", audience: "1 240", delivered: "821", read: "612", cost: "50 820 FCFA", start: "aujourd'hui 11:00", progress: 0.68 },
        { id: "2", name: "Relance paniers abandonnés", status: "scheduled", tpl: "Relance impayée", audience: "88", delivered: "—", read: "—", cost: "est. 5 280 FCFA", start: "demain 09:00", hint: "Démarre dans 21h", hintTone: "accent" },
        { id: "3", name: "Promo Fête des mères", status: "completed", tpl: "Devis envoyé", audience: "2 408", delivered: "2 392", read: "1 880", cost: "144 480 FCFA", start: "26 mai · terminé", progress: 1 },
        { id: "4", name: "Sondage satisfaction", status: "completed", tpl: "Confirmation cmd.", audience: "142", delivered: "142", read: "128", cost: "8 520 FCFA", start: "20 mai · terminé", progress: 1 },
        { id: "5", name: "Lancement service livraison", status: "draft", tpl: "—", audience: "—", delivered: "—", read: "—", cost: "—", start: "brouillon", hint: "À configurer" },
        { id: "6", name: "Réactivation 90j", status: "paused", tpl: "Welcome customer", audience: "696", delivered: "208", read: "92", cost: "12 480 FCFA", start: "en pause", progress: 0.3 },
    ],
}

const meta = {
    title: "Screens/Campaigns",
    component: CampaignsScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 760 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof CampaignsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: DATA },
}

export const Empty: Story = {
    args: {
        data: {
            count: "0 campagne",
            kpis: [
                { label: "Envoyés ce mois", value: "0", delta: "—" },
                { label: "Taux de livraison", value: "—", delta: "—" },
                { label: "Taux de lecture", value: "—", delta: "—" },
                { label: "Coût Meta · mois", value: "€0", delta: "€820 budget" },
            ],
            campaigns: [],
        },
    },
}
