import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { TemplatePicker } from "./TemplatePicker"
import type { TemplateEntry } from "./TemplatePicker"
import { TemplateVariableForm } from "./TemplateVariableForm"

const meta = {
    title: "Screens/Inbox/Template",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

const TEMPLATES: TemplateEntry[] = [
    {
        id: "tpl-devis",
        name: "Devis envoyé",
        body: "Bonjour {{1}}, voici votre devis personnalisé pour {{2}}. Il est valable 14 jours.",
        category: "marketing",
        language: "FR",
        status: "approved",
    },
    {
        id: "tpl-confirm",
        name: "Confirmation commande",
        body: "Votre commande {{1}} est confirmée pour la livraison le {{2}} à {{3}}.",
        category: "utility",
        language: "FR",
        status: "approved",
    },
    {
        id: "tpl-suivi",
        name: "Suivi livraison",
        body: "Bonjour, votre colis {{1}} arrive le {{2}}. Suivez-le ici : {{3}}.",
        category: "utility",
        language: "FR",
        status: "approved",
    },
    {
        id: "tpl-relance",
        name: "Relance impayée",
        body: "Bonjour {{1}}, la facture {{2}} reste à régler. Merci de procéder au paiement avant le {{3}}.",
        category: "utility",
        language: "FR",
        status: "pending",
    },
    {
        id: "tpl-rdv",
        name: "Rdv confirmé",
        body: "Votre rendez-vous est confirmé le {{1}} à {{2}}. À très vite !",
        category: "utility",
        language: "FR",
        status: "approved",
    },
    {
        id: "tpl-welcome",
        name: "Welcome customer",
        body: "Welcome {{1}}! Reply STOP to unsubscribe.",
        category: "marketing",
        language: "EN",
        status: "approved",
    },
    {
        id: "tpl-promo",
        name: "Promo Vendredi noir",
        body: "Profitez de -30% pendant 48h sur la collection {{1}}.",
        category: "marketing",
        language: "FR",
        status: "rejected",
    },
]

export const Picker: Story = {
    name: "Picker · liste + recherche",
    render: () => {
        const [picked, setPicked] = useState<TemplateEntry | null>(null)
        return (
            <div className="max-w-xl space-y-3 bg-[var(--paper-warm)]/40 p-6">
                <TemplatePicker templates={TEMPLATES} onSelect={setPicked} />
                {picked ? (
                    <p className="text-[11px] text-[var(--ink-soft)]">
                        Sélectionné : <strong>{picked.name}</strong>
                    </p>
                ) : null}
            </div>
        )
    },
}

export const VariableForm: Story = {
    name: "Variable form · remplissage {{N}}",
    render: () => {
        const [inserted, setInserted] = useState<string | null>(null)
        return (
            <div className="max-w-xl space-y-3 bg-[var(--paper-warm)]/40 p-6">
                <TemplateVariableForm
                    template={TEMPLATES[0]}
                    onInsert={(body) => setInserted(body)}
                    onCancel={() => setInserted("(annulé)")}
                />
                {inserted ? (
                    <div className="rounded-md border border-[var(--accent-muted)] bg-[var(--accent-muted)]/40 p-3 text-[12px]">
                        <p className="mb-1 font-mono text-[10px] uppercase text-[var(--accent)]">
                            Inséré dans le composer
                        </p>
                        {inserted}
                    </div>
                ) : null}
            </div>
        )
    },
}

export const FullFlow: Story = {
    name: "Full flow · picker → form → inséré",
    render: () => {
        const [picked, setPicked] = useState<TemplateEntry | null>(null)
        const [inserted, setInserted] = useState<string | null>(null)
        return (
            <div className="max-w-xl space-y-3 bg-[var(--paper-warm)]/40 p-6">
                {!picked ? (
                    <TemplatePicker templates={TEMPLATES} onSelect={setPicked} />
                ) : (
                    <TemplateVariableForm
                        template={picked}
                        onInsert={(body) => {
                            setInserted(body)
                            setPicked(null)
                        }}
                        onCancel={() => setPicked(null)}
                    />
                )}
                {inserted ? (
                    <div className="rounded-md border border-[var(--accent-muted)] bg-[var(--accent-muted)]/40 p-3 text-[12px]">
                        <p className="mb-1 font-mono text-[10px] uppercase text-[var(--accent)]">
                            Inséré dans le composer
                        </p>
                        {inserted}
                    </div>
                ) : null}
            </div>
        )
    },
}
