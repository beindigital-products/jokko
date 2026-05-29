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
    /** Path prefix for nav links (default `/dashboard`). */
    basePath?: string
    onOrgClick?: () => void
    onUserClick?: () => void
    onSearchClick?: () => void
}

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
    basePath = "/dashboard",
    onOrgClick,
    onUserClick,
    onSearchClick,
}: DashboardSidebarProps) {
    const href = (k: DashboardNavKey) => {
        const map: Record<DashboardNavKey, string> = {
            "tableau-de-bord": "",
            conversations: "/conversations",
            mentions: "/conversations/mentions",
            assignations: "/assignments",
            contacts: "/contacts",
            modeles: "/modeles",
            campagnes: "/campagnes",
            automatisations: "/automatisations",
            integrations: "/integrations",
            equipe: "/team",
            analytics: "/analytics",
            reglages: "/settings",
            facturation: "/billing",
        }
        return `${basePath}${map[k]}`
    }

    return (
        <aside className="flex w-[260px] shrink-0 flex-col bg-[#FCFAF6]">
            {/* Org card */}
            <div className="px-3 pt-4 pb-3">
                <OrgSwitcher
                    name={org.name}
                    initial={org.initial}
                    plan={org.plan}
                    seats={org.seats}
                    onClick={onOrgClick}
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
                <SidebarSection label="PILOTAGE">
                    <SidebarItem
                        href={href("tableau-de-bord")}
                        icon={LayoutGrid}
                        label="Tableau de bord"
                        badge={badges["tableau-de-bord"]}
                        active={active === "tableau-de-bord"}
                    />
                </SidebarSection>
                <SidebarSection label="INBOX">
                    <SidebarItem
                        href={href("conversations")}
                        icon={MessageSquare}
                        label="Conversations"
                        badge={badges.conversations}
                        active={active === "conversations"}
                    />
                    <SidebarItem
                        href={href("mentions")}
                        icon={AtSign}
                        label="Mentions"
                        badge={badges.mentions}
                        active={active === "mentions"}
                    />
                    <SidebarItem
                        href={href("assignations")}
                        icon={Repeat}
                        label="Assignations"
                        badge={badges.assignations}
                        active={active === "assignations"}
                    />
                </SidebarSection>
                <SidebarSection label="DONNÉES">
                    <SidebarItem
                        href={href("contacts")}
                        icon={BookUser}
                        label="Contacts"
                        badge={badges.contacts}
                        active={active === "contacts"}
                    />
                    <SidebarItem
                        href={href("modeles")}
                        icon={FileText}
                        label="Modèles"
                        badge={badges.modeles}
                        active={active === "modeles"}
                    />
                    <SidebarItem
                        href={href("campagnes")}
                        icon={Send}
                        label="Campagnes"
                        badge={badges.campagnes}
                        active={active === "campagnes"}
                    />
                </SidebarSection>
                <SidebarSection label="AUTOMATISATION">
                    <SidebarItem
                        href={href("automatisations")}
                        icon={Zap}
                        label="Automatisations"
                        badge={badges.automatisations}
                        active={active === "automatisations"}
                    />
                    <SidebarItem
                        href={href("integrations")}
                        icon={Globe}
                        label="Intégrations"
                        badge={badges.integrations}
                        active={active === "integrations"}
                    />
                </SidebarSection>
                <SidebarSection label="ÉQUIPE & INSIGHTS">
                    <SidebarItem
                        href={href("equipe")}
                        icon={UsersRound}
                        label="Équipe"
                        badge={badges.equipe}
                        active={active === "equipe"}
                    />
                    <SidebarItem
                        href={href("analytics")}
                        icon={BarChart3}
                        label="Analytics"
                        badge={badges.analytics}
                        active={active === "analytics"}
                    />
                </SidebarSection>
                <SidebarSection label="COMPTE">
                    <SidebarItem
                        href={href("reglages")}
                        icon={Settings}
                        label="Réglages"
                        badge={badges.reglages}
                        active={active === "reglages"}
                    />
                    <SidebarItem
                        href={href("facturation")}
                        icon={Receipt}
                        label="Facturation"
                        badge={badges.facturation}
                        active={active === "facturation"}
                    />
                </SidebarSection>
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
                />
            </div>
        </aside>
    )
}
