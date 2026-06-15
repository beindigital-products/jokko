import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { MessageComposer } from "./MessageComposer"
import { ShortcutPicker } from "./ShortcutPicker"
import type { ShortcutEntry } from "./ShortcutPicker"

const meta = {
    title: "Screens/Inbox/Shortcut",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

const SHORTCUTS: ShortcutEntry[] = [
    {
        id: "s-merci",
        keyword: "merci",
        label: "Remercier",
        body: "Merci pour votre message ! Je reviens vers vous au plus vite.",
        category: "Général",
    },
    {
        id: "s-horaires",
        keyword: "horaires",
        label: "Horaires d'ouverture",
        body: "Nous sommes ouverts du lundi au vendredi de 9h à 18h.",
        category: "Général",
    },
    {
        id: "s-dakar",
        keyword: "dakar",
        label: "Livraison Dakar",
        body: "Nous livrons à Dakar du mardi au samedi via DHL Express. Délai 24-48h.",
        category: "Livraison",
    },
    {
        id: "s-devis",
        keyword: "devis",
        label: "Demande de devis",
        body: "Pour vous préparer un devis personnalisé, pourriez-vous me préciser les pièces et quantités souhaitées ?",
        category: "Vente",
    },
    {
        id: "s-rdv",
        keyword: "rdv",
        label: "Prise de rendez-vous",
        body: "Souhaitez-vous prendre un rendez-vous ? Voici nos créneaux disponibles cette semaine.",
        category: "Vente",
    },
    {
        id: "s-paiement",
        keyword: "paiement",
        label: "Lien de paiement",
        body: "Vous pouvez régler en ligne via ce lien sécurisé. Je vous l'envoie dans un instant.",
        category: "Vente",
    },
    {
        id: "s-sav",
        keyword: "sav",
        label: "Service après-vente",
        body: "Pour toute question SAV, je transfère votre demande à notre équipe support — réponse sous 2h ouvrées.",
        category: "Support",
    },
]

export const Picker: Story = {
    name: "Picker · /raccourci popover",
    render: () => {
        const [query, setQuery] = useState("")
        const [active, setActive] = useState<string | undefined>(SHORTCUTS[0]?.id)
        const [inserted, setInserted] = useState<string | null>(null)
        return (
            <div className="max-w-xl space-y-3 bg-[var(--paper-warm)]/40 p-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tape pour filtrer (ex: « me », « dakar »)"
                    className="w-full rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[12px] placeholder:text-[var(--ink-400)] focus:outline-none"
                />
                <ShortcutPicker
                    shortcuts={SHORTCUTS}
                    query={query}
                    activeId={active}
                    onSelect={(s) => setInserted(s.body)}
                    onHover={(id) => setActive(id)}
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

export const PickerAboveComposer: Story = {
    name: "Picker · positionné au-dessus du composer",
    render: () => {
        const [active, setActive] = useState<string | undefined>(SHORTCUTS[0]?.id)
        return (
            <div className="relative max-w-2xl">
                <div className="absolute bottom-full left-5 z-10 mb-2">
                    <ShortcutPicker
                        shortcuts={SHORTCUTS}
                        query=""
                        activeId={active}
                        onHover={setActive}
                    />
                </div>
                <MessageComposer placeholder="Tapez / pour insérer un raccourci…" />
            </div>
        )
    },
}
