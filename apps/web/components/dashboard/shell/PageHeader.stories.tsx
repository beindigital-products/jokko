import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Download, Filter, Plus, Upload } from "lucide-react"
import { PageHeader } from "./PageHeader"
import { HeaderButton } from "./HeaderButton"

const meta = {
    title: "Shell/PageHeader",
    parameters: { layout: "fullscreen" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const TitleOnly: Story = {
    render: () => (
        <PageHeader
            eyebrow="PILOTAGE"
            title="Tableau de bord"
            description="Vue d'ensemble — KPIs, alertes, raccourcis."
        />
    ),
}

export const WithActions: Story = {
    render: () => (
        <PageHeader
            eyebrow="DONNÉES · 2 408 CONTACTS"
            title="Contacts"
            description="Annuaire unifié — synchro WhatsApp, attributs, segments."
            actions={
                <>
                    <HeaderButton icon={Filter}>Filtres</HeaderButton>
                    <HeaderButton icon={Upload}>Importer</HeaderButton>
                    <HeaderButton icon={Download}>Exporter</HeaderButton>
                    <HeaderButton icon={Plus} variant="primary">
                        Nouveau contact
                    </HeaderButton>
                </>
            }
        />
    ),
}

export const HeaderButtonVariants: Story = {
    name: "HeaderButton variants",
    render: () => (
        <div className="flex flex-wrap items-center gap-2 p-8">
            <HeaderButton>Default</HeaderButton>
            <HeaderButton icon={Plus}>Default · icon</HeaderButton>
            <HeaderButton variant="primary">Primary</HeaderButton>
            <HeaderButton icon={Plus} variant="primary">
                Primary · icon
            </HeaderButton>
        </div>
    ),
}
