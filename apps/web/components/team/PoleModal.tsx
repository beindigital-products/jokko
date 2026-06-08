'use client'

import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog'
import { avatarColorFromString, initialsFromName } from '@/lib/dashboard/avatar-color'

interface Pole {
    id: Id<'poles'>
    name: string
    description?: string
    color?: string
    icon?: string
    memberCount: number
}

interface PoleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pole?: Pole | null
    onSuccess: () => void
}

/** Design palette (Jokko Desktop.html PoleDialog). */
const PALETTE = ['#6938EF', '#1F6E5A', '#B8860B', '#DC3838', '#A8174C', '#0B7285', '#252525']

interface RosterMember {
    id: Id<'memberships'>
    poleId?: Id<'poles'> | null
    user: { name?: string | null; email: string }
}

/** v3 Nouveau / Configurer pôle — recreates the `dialogs.jsx` PoleDialog. */
export function PoleModal({ open, onOpenChange, pole, onSuccess }: PoleModalProps) {
    const create = !pole

    const createPole = useMutation(api.poles.create)
    const updatePole = useMutation(api.poles.update)
    const removePole = useMutation(api.poles.remove)
    const changePole = useMutation(api.team.changePole)
    const membersData = useQuery(api.team.listMembers, open ? {} : 'skip')

    const members = (membersData?.members ?? []) as unknown as RosterMember[]
    const currentUserRole = (membersData?.currentUserRole ?? 'agent') as string
    const canDelete = currentUserRole === 'owner'

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState(PALETTE[0])
    const [selected, setSelected] = useState<Set<string> | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [initialized, setInitialized] = useState(false)

    // Initialise fields + roster once the members are loaded for this opening.
    if (open && !initialized && membersData !== undefined) {
        setName(pole?.name ?? '')
        setDescription(pole?.description ?? '')
        setColor(pole?.color || PALETTE[0])
        setSelected(
            new Set(
                pole
                    ? members.filter((m) => String(m.poleId) === String(pole.id)).map((m) => String(m.id))
                    : [],
            ),
        )
        setInitialized(true)
    }
    if (!open && initialized) {
        setInitialized(false)
        setError(null)
        setSaving(false)
    }

    const handleOpenChange = (next: boolean) => {
        if (saving || deleting) return
        onOpenChange(next)
    }

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev ?? [])
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const applyRoster = async (poleId: Id<'poles'>) => {
        const sel = selected ?? new Set<string>()
        for (const m of members) {
            const wasIn = pole ? String(m.poleId) === String(pole.id) : false
            const nowIn = sel.has(String(m.id))
            if (nowIn && !wasIn) await changePole({ membershipId: m.id, poleId })
            else if (!nowIn && wasIn) await changePole({ membershipId: m.id, poleId: undefined })
        }
    }

    const handleSave = async () => {
        if (name.trim().length < 2) {
            setError('Le nom du pôle doit contenir au moins 2 caractères.')
            return
        }
        setSaving(true)
        setError(null)
        try {
            if (create) {
                const newId = (await createPole({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    color,
                    icon: 'Building2',
                })) as Id<'poles'>
                await applyRoster(newId)
            } else {
                await updatePole({
                    id: pole.id,
                    name: name.trim(),
                    description: description.trim() || undefined,
                    color,
                    icon: pole.icon || 'Building2',
                })
                await applyRoster(pole.id)
            }
            onSuccess()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!pole || !canDelete) return
        setDeleting(true)
        setError(null)
        try {
            await removePole({ id: pole.id })
            onSuccess()
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
            setDeleting(false)
        }
    }

    const inputClass =
        'h-11 w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 text-[14px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] focus:border-[var(--accent)]'

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[620px]">
                <div className="border-b border-[var(--ink-200)] px-6 pb-4 pt-5">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Équipe · pôles
                    </p>
                    <DialogTitle className="mt-1 font-editorial text-[24px] font-normal italic tracking-tight text-[var(--ink-900)]">
                        {create ? 'Nouveau pôle' : `Configurer le pôle ${pole?.name ?? ''}`}
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-[13px] text-[var(--ink-500)]">
                        Le pôle regroupe des agents pour le routage par numéro ou par mot-clé.
                    </DialogDescription>
                </div>

                <div className="flex flex-col gap-[18px] overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-[1.5fr_1fr] gap-3.5">
                        <Field label="Nom du pôle">
                            <input
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ex. Service après-vente"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Couleur">
                            <div className="flex h-11 items-center gap-1.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5">
                                {PALETTE.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        aria-label={`Couleur ${c}`}
                                        onClick={() => setColor(c)}
                                        style={{ background: c }}
                                        className={`h-[18px] w-[18px] rounded-full transition-transform ${
                                            c === color
                                                ? 'ring-2 ring-[var(--ink-900)] ring-offset-2 ring-offset-[var(--paper-warm)]'
                                                : 'hover:scale-110'
                                        }`}
                                    />
                                ))}
                            </div>
                        </Field>
                    </div>

                    <Field label="Description">
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="À quoi sert ce pôle ? (optionnel)"
                            className={inputClass}
                        />
                    </Field>

                    <Field label={create ? 'Ajouter des membres' : 'Membres'}>
                        <div className="max-h-[208px] overflow-y-auto rounded-xl border border-[var(--ink-200)] p-1.5">
                            {membersData === undefined ? (
                                <div className="flex items-center justify-center gap-2 py-6 text-[13px] text-[var(--ink-soft)]">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                                </div>
                            ) : members.length === 0 ? (
                                <div className="py-6 text-center text-[13px] text-[var(--ink-soft)]">
                                    Aucun membre à afficher.
                                </div>
                            ) : (
                                members.map((m, i) => {
                                    const on = (selected ?? new Set()).has(String(m.id))
                                    const label = m.user.name || m.user.email
                                    return (
                                        <div
                                            key={m.id}
                                            className={`flex items-center gap-3 px-2.5 py-2 ${
                                                i === 0 ? '' : 'border-t border-[var(--ink-100)]'
                                            }`}
                                        >
                                            <span
                                                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                                style={{ background: avatarColorFromString(label) }}
                                            >
                                                {initialsFromName(label)}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-[13px] font-medium tracking-tight text-[var(--ink-900)]">
                                                    {label}
                                                </div>
                                                <div className="truncate text-[11.5px] text-[var(--ink-soft)]">
                                                    {m.user.email}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={on}
                                                aria-label={`${on ? 'Retirer' : 'Ajouter'} ${label}`}
                                                onClick={() => toggle(String(m.id))}
                                                className="relative h-4 w-7 shrink-0 rounded-full transition-colors"
                                                style={{ background: on ? 'var(--accent)' : 'var(--ink-200)' }}
                                            >
                                                <span
                                                    className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all"
                                                    style={{ left: on ? 14 : 2 }}
                                                />
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </Field>

                    {error && (
                        <div className="rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] px-3.5 py-2.5 text-[12.5px] text-[var(--status-danger)]">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)] px-5 py-3.5">
                    {create ? (
                        <span className="text-[12px] text-[var(--ink-500)]">Visible par toute l&apos;équipe.</span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={!canDelete || deleting || saving}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed"
                            style={{ color: canDelete ? 'var(--status-danger)' : 'var(--ink-400)' }}
                        >
                            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {canDelete ? 'Supprimer le pôle' : 'Suppression réservée au propriétaire'}
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleOpenChange(false)}
                            className="rounded-md px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--ink-100)]"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || deleting}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : create ? (
                                <Plus className="h-3.5 w-3.5" />
                            ) : null}
                            {create ? 'Créer le pôle' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-1.5 text-[12px] font-medium tracking-tight text-[var(--ink-700)]">{label}</div>
            {children}
        </div>
    )
}
