'use client'

import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { TeamScreen, type Pole, type TeamMember } from '@/components/dashboard/team'
import { mapTeam, type TeamMemberDoc } from '@/lib/dashboard/team-data'
import {
    InviteMemberModal,
    PoleModal,
    EditMemberModal,
    RemoveMemberDialog,
    PendingInvitations,
    type Invitation,
} from '@/components/team'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { canManageRole, type Role } from '@/lib/team/roles'

/** Raw member doc as returned by `team.listMembers` (carries the action ids). */
interface RawMember extends TeamMemberDoc {
    userId: string
    poleId?: Id<'poles'> | null
    isCurrentUser?: boolean
}

/** Member shape consumed by the edit / remove modals. */
type ModalMember = {
    id: Id<'memberships'>
    userId: Id<'users'>
    name: string
    email: string
    role: Role
    poleId?: Id<'poles'>
}

/** Pole doc as returned by `poles.list` (consumed by the configure modal). */
type RawPole = {
    id: Id<'poles'>
    name: string
    description?: string
    color?: string
    icon?: string
    memberCount: number
}

function toModalMember(m: RawMember): ModalMember {
    return {
        id: m.id as Id<'memberships'>,
        userId: m.userId as Id<'users'>,
        name: m.user.name || m.user.email,
        email: m.user.email,
        role: (m.role as Role) || 'agent',
        poleId: (m.poleId as Id<'poles'> | undefined) ?? undefined,
    }
}

function TeamScreenSkeleton() {
    return (
        <div className="flex h-full w-full flex-col bg-[var(--paper-white)]">
            <div className="border-b border-[var(--ink-200)] px-8 pb-5 pt-7">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-7 w-40" />
                <Skeleton className="mt-2 h-4 w-80" />
            </div>
            <div className="border-b border-[var(--ink-200)] px-8 py-6">
                <Skeleton className="h-3 w-16" />
                <div className="mt-3 flex gap-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-[58px] w-[220px] rounded-xl" />
                    ))}
                </div>
            </div>
            <div className="space-y-2 px-8 pt-4">
                {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    )
}

export default function TeamPage() {
    const [inviteOpen, setInviteOpen] = useState(false)
    const [poleOpen, setPoleOpen] = useState(false)
    const [editingPole, setEditingPole] = useState<RawPole | null>(null)
    const [invitationsOpen, setInvitationsOpen] = useState(false)
    const [editMember, setEditMember] = useState<ModalMember | null>(null)
    const [removeMember, setRemoveMember] = useState<ModalMember | null>(null)

    const role = useQuery(api.users.currentUserRole)
    const membersData = useQuery(api.team.listMembers, {})
    const polesData = useQuery(api.poles.list, {})
    const invitationsData = useQuery(api.invitations.list, {})

    const rawMembers = useMemo(
        () => (membersData?.members ?? []) as unknown as RawMember[],
        [membersData?.members],
    )
    const rawById = useMemo(() => {
        const map = new Map<string, RawMember>()
        for (const m of rawMembers) map.set(String(m.id), m)
        return map
    }, [rawMembers])
    const rawPolesById = useMemo(() => {
        const map = new Map<string, RawPole>()
        for (const p of (polesData?.poles ?? []) as RawPole[]) map.set(String(p.id), p)
        return map
    }, [polesData?.poles])

    if (role === undefined || membersData === undefined) {
        return <TeamScreenSkeleton />
    }

    if (role === 'AGENT') {
        return (
            <div className="flex h-full w-full items-center justify-center bg-[var(--paper-white)] p-8">
                <div className="max-w-sm text-center">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Accès refusé
                    </p>
                    <h1 className="mt-1 font-display text-[22px] font-bold tracking-tight text-[var(--ink-900)]">
                        Réservé à l&apos;équipe d&apos;administration
                    </h1>
                    <p className="mt-2 text-sm text-[var(--ink-500)]">
                        Vous n&apos;avez pas les autorisations nécessaires pour gérer l&apos;équipe.
                    </p>
                </div>
            </div>
        )
    }

    const currentUserRole = ((membersData.currentUserRole as Role) || 'agent') as Role
    const data = mapTeam(
        { members: rawMembers, nonOwnerCount: membersData.nonOwnerCount, limit: membersData.limit },
        { poles: (polesData?.poles ?? []) as { id: string; name: string; color?: string | null; memberCount?: number | null }[] },
    )
    const invitations = (invitationsData?.invitations ?? []) as Invitation[]

    const openNewPole = () => {
        setEditingPole(null)
        setPoleOpen(true)
    }
    const openEditPole = (pole: Pole) => {
        setEditingPole(rawPolesById.get(pole.id) ?? null)
        setPoleOpen(true)
    }

    /** Per-row ⋮ menu — only for non-self, manageable (non-owner) members. */
    const renderMemberMenu = (member: TeamMember) => {
        const raw = rawById.get(member.id)
        if (!raw) return null
        const targetRole = (raw.role as Role) || 'agent'
        const canManage = !raw.isCurrentUser && canManageRole(currentUserRole, targetRole)
        if (!canManage) {
            return (
                <span className="flex h-7 w-7 items-center justify-center text-[var(--ink-200)]">
                    <MoreHorizontal className="h-4 w-4" />
                </span>
            )
        }
        return (
            <DropdownMenu>
                <DropdownMenuTrigger
                    aria-label={`Actions pour ${member.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-400)] outline-none hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)] data-[state=open]:bg-[var(--paper-warm)]"
                >
                    <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setEditMember(toModalMember(raw))}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Modifier le rôle / pôle
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setRemoveMember(toModalMember(raw))}
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Retirer de l&apos;équipe
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <>
            <TeamScreen
                data={data}
                invitationsCount={invitationsData?.total ?? 0}
                onInvite={() => setInviteOpen(true)}
                onShowInvitations={() => setInvitationsOpen(true)}
                onNewPole={openNewPole}
                onEditPole={openEditPole}
                renderMemberMenu={renderMemberMenu}
            />

            <InviteMemberModal
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                onSuccess={() => setInviteOpen(false)}
                currentUserRole={currentUserRole}
                teamUsage={{ current: membersData.nonOwnerCount ?? 0, limit: membersData.limit ?? 1 }}
            />

            <PoleModal
                open={poleOpen}
                onOpenChange={(o) => {
                    setPoleOpen(o)
                    if (!o) setEditingPole(null)
                }}
                pole={editingPole}
                onSuccess={() => {
                    setPoleOpen(false)
                    setEditingPole(null)
                }}
            />

            <EditMemberModal
                open={editMember !== null}
                onOpenChange={(o) => !o && setEditMember(null)}
                member={editMember}
                currentUserRole={currentUserRole}
                onSuccess={() => setEditMember(null)}
            />

            <RemoveMemberDialog
                open={removeMember !== null}
                onOpenChange={(o) => !o && setRemoveMember(null)}
                member={removeMember}
                onSuccess={() => setRemoveMember(null)}
            />

            <Dialog open={invitationsOpen} onOpenChange={setInvitationsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Invitations en attente</DialogTitle>
                        <DialogDescription>
                            Invitations envoyées en attente d&apos;acceptation.
                        </DialogDescription>
                    </DialogHeader>
                    <PendingInvitations invitations={invitations} />
                </DialogContent>
            </Dialog>
        </>
    )
}
