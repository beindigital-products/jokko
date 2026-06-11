import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AutomationsScreen } from "./AutomationsScreen"
import type { AutomationsData } from "./types"

const DATA: AutomationsData = {
    count: "6 flows",
    kpis: [
        { label: "Total", value: "6", delta: "flows créés" },
        { label: "Actives", value: "4", delta: "en exécution" },
        { label: "Brouillons", value: "2", delta: "non publiés" },
        { label: "Taux d'activation", value: "67%", delta: "actives / total" },
    ],
    automations: [
        { id: "1", name: "Accueil — premier message", description: "Salutation + menu de tri vers le bon pôle", active: true, trigger: "Premier message", runs: "1 240", conv: "78%", updated: "il y a 8 min" },
        { id: "2", name: "Routage par mot-clé", description: "« devis », « prix », « commande » → réponses", active: true, trigger: "Mot-clé", runs: "892", conv: "—", updated: "il y a 22 min" },
        { id: "3", name: "Hors horaires — auto-réponse", description: "Réponse différée en dehors de 9h–19h", active: true, trigger: "Plage horaire", runs: "410", conv: "—", updated: "hier 19:01" },
        { id: "4", name: "Devis automatisé", description: "Collecte besoin → envoi du modèle Devis", active: true, trigger: "Mot-clé « devis »", runs: "188", conv: "54%", updated: "il y a 1 h" },
        { id: "5", name: "Sondage post-livraison", description: "Note de satisfaction après livraison", active: false, trigger: "Webhook livraison", runs: "64", conv: "—", updated: "20 mai" },
        { id: "6", name: "Reroute support → ventes", description: "Détecte intention d'achat, réassigne", active: false, trigger: "Mot-clé « acheter »", runs: "142", conv: "32%", updated: "il y a 4 h" },
    ],
}

const meta = {
    title: "Screens/Automations",
    component: AutomationsScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 760 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AutomationsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: DATA },
}

export const Empty: Story = {
    args: {
        data: {
            count: "0 flow",
            kpis: [
                { label: "Total", value: "0", delta: "—" },
                { label: "Actives", value: "0", delta: "—" },
                { label: "Brouillons", value: "0", delta: "—" },
                { label: "Taux d'activation", value: "0%", delta: "0 / 0" },
            ],
            automations: [],
        },
    },
}

export const ReadOnly: Story = {
    args: { data: DATA, canEdit: false },
}
