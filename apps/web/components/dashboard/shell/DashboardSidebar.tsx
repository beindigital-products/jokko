"use client"

import Link from "next/link"
import { Search } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "./OrgSwitcher"
import { UserMenu } from "./UserMenu"
import type { AvatarColor } from "../primitives/Avatar"
import type { ChipTone } from "../primitives/Chip"

import {
    AtSign,
    BarChart3,
    BookUser,
    FileText,
    Globe,
    LayoutGrid,
    MessageSquare,
    Receipt,
    Repeat,
    Send,
    Settings,
    UsersRound,
    Zap,
} from "lucide-react"

export type DashboardNavKey =
    | "tableau-de-bord"
    | "conversations"
    | "mentions"
    | "assignations"
    | "contacts"
    | "modeles"
    | "campagnes"
    | "automatisations"
    | "integrations"
    | "equipe"
    | "analytics"
    | "reglages"
    | "facturation"

export interface DashboardSidebarOrg {
    name: string
    initial: string
    plan?: string
    seats?: string
}

export interface DashboardSidebarUser {
    name: string
    initials: string
    color?: AvatarColor
    role?: string
    roleTone?: ChipTone
    subtitle?: string
    online?: boolean
}

interface DashboardSidebarProps {
    org: DashboardSidebarOrg
    user: DashboardSidebarUser
    active: DashboardNavKey
    /** Per-item badge counts (e.g. { conversations: 142, mentions: 1 }). */
    badges?: Partial<Record<DashboardNavKey, string | number>>
    /** Nav keys to hide (e.g. role gating for AGENT). */
    hiddenKeys?: DashboardNavKey[]
    /** Path prefix for nav links (default `/dashboard`). */
    basePath?: string
    onOrgClick?: () => void
    onUserClick?: () => void
    onSearchClick?: () => void
    /** Dropdown content for the org card (org list + settings). */
    orgMenu?: React.ReactNode
    /** Dropdown content for the user card (account + sign out). */
    userMenu?: React.ReactNode
}

type NavEntry = {
    key: DashboardNavKey
    icon: React.ComponentType<{ className?: string }>
    label: string
    /** Route suffix appended to basePath. */
    path: string
}

const SECTIONS: { label: string; items: NavEntry[] }[] = [
    {
        label: "PILOTAGE",
        items: [{ key: "tableau-de-bord", icon: LayoutGrid, label: "Tableau de bord", path: "" }],
    },
    {
        label: "INBOX",
        items: [
            { key: "conversations", icon: MessageSquare, label: "Conversations", path: "/conversations" },
            { key: "mentions", icon: AtSign, label: "Mentions", path: "/notifications" },
            { key: "assignations", icon: Repeat, label: "Assignations", path: "/assignments" },
        ],
    },
    {
        label: "DONNÉES",
        items: [
            { key: "contacts", icon: BookUser, label: "Contacts", path: "/contacts" },
            { key: "modeles", icon: FileText, label: "Modèles", path: "/modeles" },
            { key: "campagnes", icon: Send, label: "Campagnes", path: "/campagnes" },
        ],
    },
    {
        label: "AUTOMATISATION",
        items: [
            { key: "automatisations", icon: Zap, label: "Automatisations", path: "/automatisations" },
            { key: "integrations", icon: Globe, label: "Intégrations", path: "/integrations" },
        ],
    },
    {
        label: "ÉQUIPE & INSIGHTS",
        items: [
            { key: "equipe", icon: UsersRound, label: "Équipe", path: "/team" },
            { key: "analytics", icon: BarChart3, label: "Analytics", path: "/analytics" },
        ],
    },
    {
        label: "COMPTE",
        items: [
            { key: "reglages", icon: Settings, label: "Réglages", path: "/settings" },
            { key: "facturation", icon: Receipt, label: "Facturation", path: "/billing" },
        ],
    },
]

/** Shared active/hover styling for a nav row — matches the v3 design exactly. */
const ITEM_CLASS = cn(
    "h-auto gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--ink-700)]",
    "hover:bg-[var(--paper-white)] hover:text-[var(--ink-900)]",
    "data-[active=true]:border data-[active=true]:border-[var(--ink-200)] data-[active=true]:bg-[var(--paper-white)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ink-900)] data-[active=true]:shadow-sm",
)

/**
 * DashboardSidebar — v3 cockpit sidebar, now built on the shadcn `Sidebar`
 * primitive (provider state, mobile off-canvas sheet, ⌘B toggle, rail) while
 * keeping the exact "Cobalt × paper × ink" look: paper bg, org card, ⌘K search,
 * 6 mono-labelled groups, accent-on-paper active rows + badges, user card.
 * Pure presentational — wired from the page (badges/active/role gating).
 * Requires a `SidebarProvider` ancestor (added in the dashboard layout).
 */
export function DashboardSidebar({
    org,
    user,
    active,
    badges = {},
    hiddenKeys = [],
    basePath = "/dashboard",
    onOrgClick,
    onUserClick,
    onSearchClick,
    orgMenu,
    userMenu,
}: DashboardSidebarProps) {
    const hidden = new Set(hiddenKeys)

    return (
        <Sidebar
            collapsible="icon"
            data-testid="app-sidebar"
            aria-label="Navigation principale"
            className="[&_[data-sidebar=sidebar]]:bg-[#FCFAF6]"
        >
            {/* Org card + search */}
            <SidebarHeader className="gap-2 p-3 group-data-[collapsible=icon]:p-2">
                <OrgSwitcher
                    name={org.name}
                    initial={org.initial}
                    plan={org.plan}
                    seats={org.seats}
                    onClick={onOrgClick}
                    menu={orgMenu}
                />
                <button
                    type="button"
                    onClick={onSearchClick}
                    className="flex w-full items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1.5 transition-colors hover:bg-[var(--paper-warm)] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                >
                    <Search className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                    <span className="flex-1 text-left text-[12px] text-[var(--ink-400)] group-data-[collapsible=icon]:hidden">
                        Rechercher
                    </span>
                    <span className="font-mono text-[10px] text-[var(--ink-400)] group-data-[collapsible=icon]:hidden">
                        ⌘K
                    </span>
                </button>
            </SidebarHeader>

            {/* Grouped nav */}
            <SidebarContent className="px-1.5">
                {SECTIONS.map((section) => {
                    const items = section.items.filter((it) => !hidden.has(it.key))
                    if (items.length === 0) return null
                    return (
                        <SidebarGroup key={section.label} className="py-1">
                            <SidebarGroupLabel className="px-2 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                                {section.label}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {items.map((it) => (
                                        <SidebarMenuItem key={it.key}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active === it.key}
                                                tooltip={it.label}
                                                className={ITEM_CLASS}
                                            >
                                                <Link href={`${basePath}${it.path}`}>
                                                    <it.icon className="text-[var(--ink-500)]" />
                                                    <span>{it.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                            {badges[it.key] != null ? (
                                                <SidebarMenuBadge className="font-mono text-[10px] font-medium text-[var(--ink-soft)]">
                                                    {badges[it.key]}
                                                </SidebarMenuBadge>
                                            ) : null}
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )
                })}
            </SidebarContent>

            {/* User card */}
            <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
                <UserMenu
                    name={user.name}
                    initials={user.initials}
                    color={user.color}
                    role={user.role}
                    roleTone={user.roleTone}
                    subtitle={user.subtitle}
                    online={user.online}
                    onClick={onUserClick}
                    menu={userMenu}
                />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
