import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { Plus } from "lucide-react"

import { TemplateCreateModal, type TemplateCreatePayload } from "./TemplateCreateModal"

const meta = {
    title: "Screens/Templates/Création de modèle",
    parameters: { layout: "fullscreen" },
} satisfies Meta

export default meta
type Story = StoryObj

/** Height-bounded paper surface the modal can overlay. */
function ModalFrame() {
    const [open, setOpen] = useState(true)
    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: "100%", height: 820, background: "var(--paper-warm)" }}
        >
            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Nouveau modèle
                </button>
            ) : null}
            <TemplateCreateModal
                open={open}
                onOpenChange={setOpen}
                onCreate={(payload: TemplateCreatePayload) => {
                    console.log("create", payload)
                    return true
                }}
                onAdvanced={(type) => {
                    console.log("advanced", type)
                    setOpen(false)
                }}
            />
        </div>
    )
}

/** The 5-step "Nouveau modèle" wizard (Réglages → Contenu → Variables → Boutons → Récap). */
export const Wizard: Story = {
    name: "Assistant · 5 étapes",
    render: () => <ModalFrame />,
}
