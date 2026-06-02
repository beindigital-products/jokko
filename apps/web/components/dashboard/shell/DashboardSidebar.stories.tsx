import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { DashboardSidebar, type DashboardNavKey } from "./DashboardSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

const meta = {
    title: "Shell/DashboardSidebar",
    parameters: { layout: "fullscreen" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

const ORG = {
    name: "Atelier Bracquet",
    initial: "a",
    plan: "PRO",
    seats: "8 SIÈGES",
} as const

const OWNER_USER = {
    name: "Sophie Br…",
    initials: "SB",
    color: "emerald" as const,
    role: "OWNER",
    roleTone: "dark" as const,
    subtitle: "Propriétaire",
    online: true,
}

const BADGES = {
    "tableau-de-bord": 5,
    conversations: 142,
    mentions: 1,
    assignations: 14,
}

function ShellPreview({ active }: { active: DashboardNavKey }) {
    return (
        <SidebarProvider className="min-h-screen bg-[var(--paper-white)]">
            <DashboardSidebar org={ORG} user={OWNER_USER} active={active} badges={BADGES} />
            <div className="flex-1 border-l border-[var(--ink-200)] p-8 text-[var(--ink-soft)]">
                Main area placeholder
            </div>
        </SidebarProvider>
    )
}

export const ActiveConversations: Story = {
    render: () => <ShellPreview active="conversations" />,
}

export const ActiveContacts: Story = {
    render: () => <ShellPreview active="contacts" />,
}

export const ActiveReglages: Story = {
    render: () => <ShellPreview active="reglages" />,
}

export const ActiveAnalytics: Story = {
    render: () => <ShellPreview active="analytics" />,
}

export const AdminUser: Story = {
    name: "Admin user (vs Owner)",
    render: () => (
        <SidebarProvider className="min-h-screen bg-[var(--paper-white)]">
            <DashboardSidebar
                org={ORG}
                user={{
                    name: "Tom Roussel",
                    initials: "TR",
                    color: "crimson",
                    role: "ADMIN",
                    roleTone: "accent",
                    subtitle: "Administrateur",
                    online: true,
                }}
                active="conversations"
                badges={BADGES}
            />
            <div className="flex-1 border-l border-[var(--ink-200)] p-8 text-[var(--ink-soft)]">
                Main area placeholder
            </div>
        </SidebarProvider>
    ),
}
