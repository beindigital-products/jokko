import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { TemplatesScreen } from "./TemplatesScreen"
import type { TemplatesData } from "./types"

const DATA: TemplatesData = {
    count: "24 modèles · synchro Meta",
    categories: [
        { key: "all", label: "Tous", count: 24 },
        { key: "Utility", label: "Utilitaires", count: 14 },
        { key: "Marketing", label: "Marketing", count: 8 },
        { key: "Authentication", label: "Authentif.", count: 2 },
    ],
    templates: [
        {
            id: "1",
            name: "Devis envoyé",
            category: "Marketing",
            lang: "fr",
            status: "approved",
            sent: "1 240",
            open: "78%",
            preview: "Bonjour {{1}}, voici votre devis personnalisé pour {{2}}. Il est valable 14 jours.",
        },
        {
            id: "2",
            name: "Confirmation commande",
            category: "Utility",
            lang: "fr",
            status: "approved",
            sent: "3 480",
            open: "94%",
            preview: "Votre commande {{1}} est confirmée pour un total de {{2}} €.",
        },
        {
            id: "3",
            name: "Suivi livraison",
            category: "Utility",
            lang: "fr",
            status: "approved",
            sent: "2 880",
            open: "88%",
            preview: "Bonjour, votre colis {{1}} arrive le {{2}}. Suivi : {{3}}",
        },
        {
            id: "4",
            name: "Relance impayée",
            category: "Utility",
            lang: "fr",
            status: "pending",
            sent: "—",
            open: "—",
            preview: "Bonjour {{1}}, la facture {{2}} reste à régler. Lien : {{3}}",
        },
        {
            id: "5",
            name: "Rdv confirmé",
            category: "Utility",
            lang: "fr",
            status: "approved",
            sent: "142",
            open: "92%",
            preview: "Votre rendez-vous est confirmé le {{1}} à {{2}}.",
        },
        {
            id: "6",
            name: "Welcome customer",
            category: "Marketing",
            lang: "en",
            status: "approved",
            sent: "88",
            open: "64%",
            preview: "Welcome {{1}}! Reply STOP to unsubscribe.",
        },
        {
            id: "7",
            name: "Promo Vendredi noir",
            category: "Marketing",
            lang: "fr",
            status: "rejected",
            sent: "—",
            open: "—",
            preview: "Profitez de -30% pendant 48h sur {{1}}…",
        },
    ],
    selectedId: "1",
}

const meta = {
    title: "Screens/Templates",
    component: TemplatesScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 840 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof TemplatesScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: DATA, canEdit: true },
}

export const Empty: Story = {
    args: {
        data: {
            count: "0 modèle",
            categories: [
                { key: "all", label: "Tous", count: 0 },
                { key: "Utility", label: "Utilitaires", count: 0 },
                { key: "Marketing", label: "Marketing", count: 0 },
                { key: "Authentication", label: "Authentif.", count: 0 },
            ],
            templates: [],
        },
        canEdit: true,
    },
}
