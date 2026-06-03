'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Loader2,
    Merge,
    Check,
    Users,
    Phone,
    Mail,
    Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPhoneDisplay } from '@/lib/contacts/validation'
import { Avatar } from '@/components/dashboard/primitives/Avatar'
import { Chip } from '@/components/dashboard/primitives/Chip'
import { avatarColorFromString } from '@/lib/dashboard/avatar-color'

interface DuplicatesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type DuplicateContact = {
    _id: Id<"contacts">
    phone: string
    name?: string | null
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    company?: string | null
    countryCode?: string | null
    tags: string[]
    createdAt: number
}

function getInitials(name?: string | null, firstName?: string | null, lastName?: string | null): string {
    if (name) return name.slice(0, 2).toUpperCase()
    const f = firstName?.[0]?.toUpperCase() || ''
    const l = lastName?.[0]?.toUpperCase() || ''
    return f + l || '?'
}

function getDisplayName(c: DuplicateContact): string {
    return c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Sans nom'
}

export function DuplicatesDialog({ open, onOpenChange }: DuplicatesDialogProps) {
    const duplicateGroups = useQuery(
        api.contacts.detectDuplicates,
        open ? {} : "skip"
    )
    const mergeDuplicates = useMutation(api.contacts.mergeDuplicates)

    const [mergingGroup, setMergingGroup] = useState<number | null>(null)
    const [mergedGroups, setMergedGroups] = useState<Set<number>>(new Set())
    const [mergingAll, setMergingAll] = useState(false)

    const isLoading = duplicateGroups === undefined

    const handleMergeGroup = async (groupIndex: number, group: DuplicateContact[]) => {
        if (group.length < 2) return
        setMergingGroup(groupIndex)
        try {
            // Use first contact as primary (oldest by createdAt)
            const sorted = [...group].sort((a, b) => a.createdAt - b.createdAt)
            const primary = sorted[0]
            const duplicateIds = sorted.slice(1).map(c => c._id)
            await mergeDuplicates({
                primaryId: primary._id,
                duplicateIds,
            })
            setMergedGroups(prev => new Set(prev).add(groupIndex))
        } catch (error) {
            console.error('Merge failed:', error)
        } finally {
            setMergingGroup(null)
        }
    }

    const handleMergeAll = async () => {
        if (!duplicateGroups) return
        setMergingAll(true)
        for (let i = 0; i < duplicateGroups.length; i++) {
            if (mergedGroups.has(i)) continue
            await handleMergeGroup(i, duplicateGroups[i] as DuplicateContact[])
        }
        setMergingAll(false)
    }

    const handleOpenChange = (value: boolean) => {
        if (!value) {
            setMergedGroups(new Set())
            setMergingGroup(null)
            setMergingAll(false)
        }
        onOpenChange(value)
    }

    const pendingGroups = duplicateGroups
        ? duplicateGroups.filter((_, i) => !mergedGroups.has(i))
        : []

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-[var(--ink-200)] bg-[var(--paper-white)]">
                <DialogHeader className="space-y-0 text-left">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Annuaire · doublons
                    </p>
                    <DialogTitle className="mt-1 flex items-center gap-2 font-editorial text-[20px] font-normal leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                        <Merge className="h-5 w-5 text-[var(--ink-400)]" />
                        Doublons de contacts
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-[13px] leading-snug text-[var(--ink-500)]">
                        Contacts potentiellement en double, regroupes par numero de telephone ou nom identique.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--ink-400)]" />
                            <p className="text-sm text-[var(--ink-soft)]">Analyse des contacts en cours...</p>
                        </div>
                    ) : duplicateGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--status-good-soft)]">
                                <Check className="h-6 w-6 text-[var(--status-good)]" strokeWidth={2.5} />
                            </div>
                            <p className="text-sm font-medium text-[var(--ink-900)]">Aucun doublon detecte</p>
                            <p className="max-w-sm text-center text-xs text-[var(--ink-soft)]">
                                Tous vos contacts sont uniques. La detection se base sur le numero de telephone et le nom.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Summary + Merge All */}
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-[var(--ink-700)]">
                                    <span className="font-semibold text-[var(--ink-900)]">
                                        {pendingGroups.length}
                                    </span>{' '}
                                    groupe{pendingGroups.length > 1 ? 's' : ''} de doublons
                                    {mergedGroups.size > 0 && (
                                        <span className="ml-2 text-[var(--status-good)]">
                                            ({mergedGroups.size} fusionne{mergedGroups.size > 1 ? 's' : ''})
                                        </span>
                                    )}
                                </p>
                                {pendingGroups.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleMergeAll}
                                        disabled={mergingAll || mergingGroup !== null}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-60"
                                    >
                                        {mergingAll ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Fusion en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Merge className="h-3.5 w-3.5" />
                                                Tout fusionner
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Duplicate groups */}
                            {duplicateGroups.map((group, groupIndex) => {
                                const isMerged = mergedGroups.has(groupIndex)
                                const isMerging = mergingGroup === groupIndex
                                const typedGroup = group as DuplicateContact[]

                                return (
                                    <div
                                        key={groupIndex}
                                        className={cn(
                                            'rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-3 transition-all',
                                            isMerged && 'opacity-60'
                                        )}
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-[var(--ink-400)]" />
                                                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                                                    {typedGroup.length} contacts similaires
                                                </span>
                                            </div>
                                            {isMerged ? (
                                                <Chip tone="good">
                                                    <Check className="h-3 w-3" strokeWidth={3} />
                                                    Fusionne
                                                </Chip>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMergeGroup(groupIndex, typedGroup)}
                                                    disabled={isMerging || mergingAll}
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-60"
                                                >
                                                    {isMerging ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Merge className="h-3 w-3" />
                                                    )}
                                                    Fusionner
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid gap-2">
                                            {typedGroup.map((contact, contactIndex) => (
                                                <div
                                                    key={String(contact._id)}
                                                    className={cn(
                                                        'flex items-center gap-3 rounded-lg border p-2',
                                                        contactIndex === 0
                                                            ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                                                            : 'border-[var(--ink-100)] bg-[var(--paper-warm)]'
                                                    )}
                                                >
                                                    <Avatar
                                                        initials={getInitials(contact.name, contact.firstName, contact.lastName)}
                                                        color={avatarColorFromString(getDisplayName(contact))}
                                                        size="md"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="truncate text-sm font-medium text-[var(--ink-900)]">
                                                                {getDisplayName(contact)}
                                                            </p>
                                                            {contactIndex === 0 && (
                                                                <Chip tone="accent" className="shrink-0">
                                                                    Principal
                                                                </Chip>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-3">
                                                            <span className="flex items-center gap-1 text-[11px] text-[var(--ink-soft)]">
                                                                <Phone className="h-3 w-3 text-[var(--ink-400)]" />
                                                                {formatPhoneDisplay(contact.phone, 'international')}
                                                            </span>
                                                            {contact.email && (
                                                                <span className="flex items-center gap-1 truncate text-[11px] text-[var(--ink-soft)]">
                                                                    <Mail className="h-3 w-3 text-[var(--ink-400)]" />
                                                                    {contact.email}
                                                                </span>
                                                            )}
                                                            {contact.company && (
                                                                <span className="flex items-center gap-1 truncate text-[11px] text-[var(--ink-soft)]">
                                                                    <Building2 className="h-3 w-3 text-[var(--ink-400)]" />
                                                                    {contact.company}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {contact.tags.length > 0 && (
                                                        <div className="flex shrink-0 gap-1">
                                                            {contact.tags.slice(0, 2).map((tag) => (
                                                                <Chip key={tag} tone="neutral">
                                                                    {tag}
                                                                </Chip>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
