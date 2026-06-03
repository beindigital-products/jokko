import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { Plus } from "lucide-react"

import type { TemplateType } from "@/convex/lib/templateTypes"
import { TemplateCreateModal } from "./TemplateCreateModal"

const meta = {
    title: "Screens/Templates/Création de modèle",
    parameters: { layout: "fullscreen" },
} satisfies Meta

export default meta
type Story = StoryObj

/** Shared frame: a height-bounded paper surface the modal can overlay. */
function ModalFrame({ defaultType }: { defaultType?: TemplateType }) {
    const [open, setOpen] = useState(true)
    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: "100%", height: 760, background: "var(--paper-warm)" }}
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
            <TemplateCreateModal open={open} onOpenChange={setOpen} defaultType={defaultType} />
        </div>
    )
}

/* Step 1 — pick a template type. */
function TypeSelectionStory() {
    return <ModalFrame />
}
export const TypeSelection: Story = {
    name: "Étape 1 · Choix du type",
    render: () => <TypeSelectionStory />,
}

/* Step 2 — builder for a Call-to-action template (header + body + buttons). */
function BuilderStory() {
    return <ModalFrame defaultType="CALL_TO_ACTION" />
}
export const Builder: Story = {
    name: "Étape 2 · Configuration (appel à l'action)",
    render: () => <BuilderStory />,
}

/* Step 2 — builder for a Media template (image/video/document header). */
function BuilderMediaStory() {
    return <ModalFrame defaultType="MEDIA" />
}
export const BuilderMedia: Story = {
    name: "Étape 2 · Configuration (média)",
    render: () => <BuilderMediaStory />,
}

/* Step 2 — builder for an Authentication (OTP) template. */
function BuilderAuthStory() {
    return <ModalFrame defaultType="AUTHENTICATION" />
}
export const BuilderAuthentication: Story = {
    name: "Étape 2 · Configuration (authentification)",
    render: () => <BuilderAuthStory />,
}
