'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Check, LifeBuoy, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { useCurrentOrg } from '@/hooks/use-current-org'
import { DashboardSidebar, type DashboardNavKey } from '@/components/dashboard/shell'
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { avatarColorFromString, initialsFromName } from '@/lib/dashboard/avatar-color'
import { hiddenNavKeysForRole, navKeyFromPathname } from '@/lib/dashboard/nav'

const PLAN_LABELS: Record<string, string> = {
    FREE: 'Gratuit',
    STARTER: 'Starter',
    BUSINESS: 'Business',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
}
const ROLE_SUBTITLE: Record<string, string> = {
    OWNER: 'Propriétaire',
    ADMIN: 'Administrateur',
    AGENT: 'Agent',
}

/**
 * AppSidebar — wires the v3 DashboardSidebar to live data: active route,
 * org (name + plan), current user (name + role), badge counts (unread
 * conversations, unassigned, unread mentions), role gating, and the
 * org-switch / sign-out dropdowns.
 */
export function AppSidebar({ basePath = '/dashboard' }: { basePath?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useAuthActions()
    const { currentOrg, allOrgs, switchOrg } = useCurrentOrg()
    const me = useQuery(api.users.me)
    const role = useQuery(api.users.currentUserRole)
    const stats = useQuery(api.conversations.getSidebarStats)
    const mentionCount = useQuery(api.notifications.unreadMentionCount)

    const active = navKeyFromPathname(pathname ?? basePath, basePath)
    const hiddenKeys = hiddenNavKeysForRole(role)

    const orgName = currentOrg?.name ?? 'Organisation'
    const planLabel = currentOrg?.plan
        ? (PLAN_LABELS[currentOrg.plan] ?? currentOrg.plan)
        : undefined
    const userName = me?.name || me?.email || 'Utilisateur'

    const badges: Partial<Record<DashboardNavKey, string | number>> = {}
    if (stats?.unread) badges.conversations = stats.unread
    if (stats?.unassigned) badges.assignations = stats.unassigned
    if (mentionCount) badges.mentions = mentionCount

    const handleLogout = async () => {
        try {
            await signOut()
        } finally {
            router.push('/auth/sign-in')
        }
    }

    const handleSwitchOrg = async (organizationId: Id<'organizations'>) => {
        if (organizationId === currentOrg?._id) return
        await switchOrg({ organizationId })
        router.push(basePath)
    }

    const orgMenu = (
        <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Organisations
            </DropdownMenuLabel>
            {allOrgs?.map((o) => (
                <DropdownMenuItem
                    key={o._id}
                    onClick={() => handleSwitchOrg(o._id as Id<'organizations'>)}
                    className="flex items-center gap-2"
                >
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--ink-900)] text-[9px] font-bold text-white">
                        {(o.name?.[0] ?? '?').toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{o.name}</span>
                    {o._id === currentOrg?._id ? (
                        <Check className="h-3.5 w-3.5 text-[var(--accent)]" />
                    ) : null}
                </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href={`${basePath}/settings`}>
                    <SettingsIcon className="mr-2 h-4 w-4" /> Réglages de l&apos;organisation
                </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
    )

    const userMenu = (
        <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="truncate">{me?.email ?? userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href={`${basePath}/settings`}>
                    <SettingsIcon className="mr-2 h-4 w-4" /> Mon compte
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href={`${basePath}/help`}>
                    <LifeBuoy className="mr-2 h-4 w-4" /> Aide &amp; support
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={handleLogout}
                className="text-[var(--status-danger)] focus:text-[var(--status-danger)]"
            >
                <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </DropdownMenuItem>
        </DropdownMenuContent>
    )

    return (
        <DashboardSidebar
            basePath={basePath}
            active={active}
            hiddenKeys={hiddenKeys}
            badges={badges}
            org={{
                name: orgName,
                initial: (orgName[0] ?? 'O').toUpperCase(),
                plan: planLabel,
            }}
            user={{
                name: userName,
                initials: initialsFromName(me?.name, me?.email),
                color: avatarColorFromString(userName),
                role: role ?? undefined,
                roleTone: 'accent',
                subtitle: role ? ROLE_SUBTITLE[role] : undefined,
                online: true,
            }}
            onSearchClick={() => router.push(`${basePath}/conversations`)}
            orgMenu={orgMenu}
            userMenu={userMenu}
        />
    )
}
