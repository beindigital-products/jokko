import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { Search } from "lucide-react"
import { FilterPills, type FilterPillItem } from "./FilterPills"

const meta = {
    title: "Shell/FilterPills",
    parameters: { layout: "fullscreen" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

const CONTACTS_FILTERS: FilterPillItem[] = [
    { key: "all", label: "Tous", count: "2 408" },
    { key: "vip", label: "VIP", count: 38 },
    { key: "prospect", label: "Prospects", count: 472 },
    { key: "active", label: "Clients actifs", count: "1 204" },
    { key: "inactive", label: "Inactifs 90j", count: 696 },
    { key: "dakar", label: "Dakar", count: 182 },
    { key: "abidjan", label: "Abidjan", count: 94 },
]

export const Contacts: Story = {
    render: () => {
        const [active, setActive] = useState("all")
        return (
            <FilterPills
                items={CONTACTS_FILTERS}
                activeKey={active}
                onChange={setActive}
                trailing={
                    <div className="flex w-[280px] items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                        <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                        <span className="flex-1 text-[12px] text-[var(--ink-400)]">
                            Rechercher un contact
                        </span>
                    </div>
                }
            />
        )
    },
}

export const Templates: Story = {
    name: "Templates filters",
    render: () => {
        const [active, setActive] = useState("all")
        return (
            <FilterPills
                items={[
                    { key: "all", label: "Tous", count: 24 },
                    { key: "utility", label: "Utilitaires", count: 14 },
                    { key: "marketing", label: "Marketing", count: 8 },
                    { key: "auth", label: "Authentif.", count: 2 },
                ]}
                activeKey={active}
                onChange={setActive}
            />
        )
    },
}
