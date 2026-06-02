import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CampaignWizardScreen } from "./CampaignWizardScreen"
import type { CampaignWizardData } from "./types"

const DATA: CampaignWizardData = {
    draft: {
        name: "Promo Fête des Pères",
        description: "Lancement opération -20% sur la maroquinerie",
        templateId: "t-devis",
        audienceType: "segment",
        audienceTags: ["Clients actifs"],
        audienceCount: 1204,
        audienceExcluded: 312,
        variables: [
            { token: "{{1}}", source: "Contact · Prénom", example: "Margaux" },
            { token: "{{2}}", source: "Valeur fixe", example: "Promo Fête des Pères -20%" },
        ],
        sendingNumberId: "n-paris",
        schedule: "scheduled",
        scheduleLabel: "Samedi 13 juin 2026 · 10:00",
    },
    templates: [
        {
            id: "t-devis",
            name: "Devis envoyé",
            category: "Marketing",
            lang: "FR",
            status: "approved",
            header: "Devis_{{2}}.pdf",
            body: "Bonjour {{1}}, voici votre devis personnalisé pour {{2}}. Il est valable 14 jours.",
            footer: "— L'équipe Atelier Bracquet",
            buttons: ["Nous appeler", "Voir la boutique"],
        },
        {
            id: "t-confirm",
            name: "Confirmation commande",
            category: "Utility",
            lang: "FR",
            status: "approved",
            body: "Votre commande {{1}} est confirmée pour un total de {{2}}.",
        },
        {
            id: "t-welcome",
            name: "Welcome customer",
            category: "Marketing",
            lang: "EN",
            status: "pending",
            body: "Welcome {{1}}! Reply STOP to unsubscribe.",
        },
    ],
    audienceOptions: [
        { type: "all", label: "Tous les contacts", sub: "2 408 contacts éligibles" },
        { type: "segment", label: "Par segment", sub: "Tags, activité, opt-in" },
        { type: "country", label: "Par pays", sub: "Filtrer par indicatif" },
    ],
    audiencePool: ["Clients actifs", "VIP", "Prospects", "Dakar", "Paris", "Newsletter"],
    sendingNumbers: [
        { id: "n-paris", city: "Paris", number: "+33 1 84 60 12 88", pole: "Ventes" },
        { id: "n-dakar", city: "Dakar", number: "+221 33 822 14 50", pole: "Dakar" },
        { id: "n-abidjan", city: "Abidjan", number: "+225 27 22 91 04 17", pole: "Support" },
    ],
    cost: {
        amount: "€38.52",
        detail: "1 204 conv. × €0.032 (Meta Marketing FR)",
        balanceAfter: "€109.20",
        ok: true,
    },
}

const meta = {
    title: "Dashboard/Campaign Wizard",
    component: CampaignWizardScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 860 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof CampaignWizardScreen>

export default meta
type Story = StoryObj<typeof meta>

/** Full interactive flow — start at step 1 and click through. */
export const Default: Story = { args: { data: DATA } }

export const Step2Template: Story = { args: { data: DATA, initialStep: 2 } }
export const Step3Audience: Story = { args: { data: DATA, initialStep: 3 } }
export const Step4Variables: Story = { args: { data: DATA, initialStep: 4 } }
export const Step5Send: Story = { args: { data: DATA, initialStep: 5 } }
export const Step6Review: Story = { args: { data: DATA, initialStep: 6 } }
