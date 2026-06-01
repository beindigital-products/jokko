import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CampaignsScreen, type CampaignsData } from "./CampaignsScreen"

const DATA: CampaignsData = {
    count: "6 campagnes",
    kpis: [
        { label: "Envoyés ce mois", value: "4 695", delta: "+18%" },
        { label: "Taux de livraison", value: "98.4%", delta: "+0.6 pt" },
        { label: "Taux de lecture", value: "78.3%", delta: "+2.1 pt" },
        { label: "Coût Meta · mois", value: "€148.72", delta: "€820 budget" },
    ],
    campaigns: [
        { id: "1", name: "Nouvelle collection printemps", status: "sending", tpl: "Welcome customer", audience: "1 240", delivered: "821", read: "612", cost: "€26.48", start: "aujourd'hui 11:00", progress: 0.68 },
        { id: "2", name: "Relance paniers abandonnés", status: "scheduled", tpl: "Relance impayée", audience: "88", delivered: "—", read: "—", cost: "est. €2.80", start: "demain 09:00", hint: "Démarre dans 21h", hintTone: "accent" },
        { id: "3", name: "Promo Fête des mères", status: "completed", tpl: "Devis envoyé", audience: "2 408", delivered: "2 392", read: "1 880", cost: "€76.94", start: "26 mai · terminé", progress: 1 },
        { id: "4", name: "Sondage satisfaction", status: "completed", tpl: "Confirmation cmd.", audience: "142", delivered: "142", read: "128", cost: "€4.54", start: "20 mai · terminé", progress: 1 },
        { id: "5", name: "Lancement service livraison", status: "draft", tpl: "—", audience: "—", delivered: "—", read: "—", cost: "—", start: "brouillon", hint: "À configurer" },
        { id: "6", name: "Réactivation 90j", status: "paused", tpl: "Welcome customer", audience: "696", delivered: "208", read: "92", cost: "€6.72", start: "en pause", progress: 0.3 },
    ],
}

const meta = {
    title: "Dashboard/Campaigns",
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
