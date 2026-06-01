"use client"

import { Search } from "lucide-react"

import { OrgSwitcher } from "./OrgSwitcher"
import { SidebarSection } from "./SidebarSection"
import { SidebarItem } from "./SidebarItem"
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

/**
 * DashboardSidebar — v3 cockpit sidebar. Composes OrgSwitcher / search /
 * 6 nav sections / UserMenu. Pure presentational — wire it with hooks
 * from the page (badges from Convex, active item from pathname).
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
        <aside className="flex h-full w-[260px] shrink-0 flex-col bg-[#FCFAF6]">
            {/* Org card */}
            <div className="px-3 pt-4 pb-3">
                <OrgSwitcher
                    name={org.name}
                    initial={org.initial}
                    plan={org.plan}
                    seats={org.seats}
                    onClick={onOrgClick}
                    menu={orgMenu}
                />
            </div>

            {/* Search */}
            <div className="px-3 pb-3">
                <button
                    type="button"
                    onClick={onSearchClick}
                    className="flex w-full items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5 hover:bg-[var(--paper-white)] transition-colors"
                >
                    <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                    <span className="flex-1 text-left text-[12px] text-[var(--ink-400)]">
                        Rechercher
                    </span>
                    <span className="font-mono text-[10px] text-[var(--ink-400)]">⌘K</span>
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-3">
                {SECTIONS.map((section) => {
                    const items = section.items.filter((it) => !hidden.has(it.key))
                    if (items.length === 0) return null
                    return (
                        <SidebarSection key={section.label} label={section.label}>
                            {items.map((it) => (
                                <SidebarItem
                                    key={it.key}
                                    href={`${basePath}${it.path}`}
                                    icon={it.icon}
                                    label={it.label}
                                    badge={badges[it.key]}
                                    active={active === it.key}
                                />
                            ))}
                        </SidebarSection>
                    )
                })}
            </nav>

            {/* User card */}
            <div className="border-t border-[var(--ink-200)] px-3 pb-4 pt-3">
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
            </div>
        </aside>
    )
}
