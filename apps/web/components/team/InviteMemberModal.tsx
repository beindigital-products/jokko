'use client'

import { useState } from 'react'
import { Loader2, Lock, Send, Users } from 'lucide-react'
import { useAction, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { type Role, getAssignableRoles } from '@/lib/team/roles'

interface InviteMemberModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (data?: { token: string; email: string }) => void
    currentUserRole: Role
    teamUsage?: { current: number; limit: number }
}

type InviteRole = 'agent' | 'admin'

const ROLE_CARDS: { value: InviteRole; label: string; sub: string }[] = [
    { value: 'agent', label: 'Agent', sub: 'Voit ses conversations' },
    { value: 'admin', label: 'Admin', sub: 'Cockpit complet' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** v3 Inviter un coéquipier — recreates the `dialogs.jsx` InviteMemberDialog. */
export function InviteMemberModal({
    open,
    onOpenChange,
    onSuccess,
    currentUserRole,
    teamUsage,
}: InviteMemberModalProps) {
    const sendInvitation = useAction(api.invitations.create)
    const polesData = useQuery(api.poles.list, {})
    const poles = polesData?.poles ?? []

    const [email, setEmail] = useState('')
    const [role, setRole] = useState<InviteRole>('agent')
    const [poleId, setPoleId] = useState<string>('none')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const canSetAdmin = getAssignableRoles(currentUserRole).includes('admin')
    const isLimitReached = teamUsage ? teamUsage.current >= teamUsage.limit : false
    const seatsLabel = teamUsage ? `Équipe · ${teamUsage.current} / ${teamUsage.limit} sièges` : 'Équipe'

    const reset = () => {
        setEmail('')
        setRole('agent')
        setPoleId('none')
        setError(null)
        setSubmitting(false)
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) reset()
        onOpenChange(next)
    }

    const handleSubmit = async () => {
        if (isLimitReached) {
            setError('Limite de sièges atteinte. Passez à un plan supérieur.')
            return
        }
        if (!EMAIL_RE.test(email.trim())) {
            setError('Adresse email invalide.')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            const result = await sendInvitation({
                email: email.trim(),
                role: role.toUpperCase(),
                poleId: role === 'agent' && poleId !== 'none' ? (poleId as Id<'poles'>) : undefined,
            })
            const token = (result?.token as string | undefined) ?? undefined
            onSuccess(token ? { token, email: email.trim() } : undefined)
            handleOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue')
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton
                className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[560px]"
            >
                {/* Head */}
                <div className="border-b border-[var(--ink-200)] px-6 pb-4 pt-5">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        {seatsLabel}
                    </p>
                    <DialogTitle className="mt-1 font-editorial text-[24px] font-normal italic tracking-tight text-[var(--ink-900)]">
                        Inviter un coéquipier
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-[13px] text-[var(--ink-500)]">
                        Une invitation par email avec un lien de connexion valable 14 jours.
                    </DialogDescription>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-[18px] overflow-y-auto px-6 py-5">
                    {isLimitReached && (
                        <div className="rounded-lg border border-[var(--status-warn)]/30 bg-[var(--status-warn-soft)] px-3.5 py-2.5 text-[12.5px] text-[var(--ink-700)]">
                            Vous avez atteint la limite de sièges de votre plan. Retirez un membre ou passez au plan supérieur.
                        </div>
                    )}

                    <Field label="Email">
                        <input
                            type="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jeanne.lemoine@exemple.fr"
                            className="h-11 w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 text-[14px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] focus:border-[var(--accent)]"
                        />
                    </Field>

                    <Field
                        label="Rôle"
                        hint={!canSetAdmin ? 'Seul le propriétaire peut nommer un Admin.' : undefined}
                    >
                        <div className="flex gap-2">
                            {ROLE_CARDS.map((r) => {
                                const locked = r.value === 'admin' && !canSetAdmin
                                const selected = role === r.value
                                return (
                                    <button
                                        key={r.value}
                                        type="button"
                                        disabled={locked}
                                        onClick={() => setRole(r.value)}
                                        className={`relative flex-1 rounded-[10px] border px-3.5 py-3 text-left transition-colors ${
                                            selected
                                                ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                                                : locked
                                                  ? 'cursor-not-allowed border-[var(--ink-200)] bg-[var(--paper-warm)] opacity-55'
                                                  : 'border-[var(--ink-200)] bg-[var(--paper-white)] hover:border-[var(--ink-300)]'
                                        }`}
                                    >
                                        <div className="text-[13.5px] font-semibold tracking-tight text-[var(--ink-900)]">
                                            {r.label}
                                        </div>
                                        <div className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">{r.sub}</div>
                                        {locked && (
                                            <Lock className="absolute right-2.5 top-2.5 h-3 w-3 text-[var(--ink-soft)]" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </Field>

                    {role === 'agent' && poles.length > 0 && (
                        <Field label="Pôle">
                            <Select value={poleId} onValueChange={setPoleId}>
                                <SelectTrigger className="h-11 w-full border-[var(--ink-200)] bg-[var(--paper-white)]">
                                    <SelectValue placeholder="Sélectionner un pôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun pôle</SelectItem>
                                    {poles.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}

                    <div className="flex items-center gap-3 rounded-lg bg-[var(--paper-warm)] px-3.5 py-3 text-[12px] text-[var(--ink-500)]">
                        <Users className="h-3.5 w-3.5 shrink-0 text-[var(--ink-soft)]" />
                        <span>Vous pourrez inviter d&apos;autres membres à tout moment depuis cette page.</span>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] px-3.5 py-2.5 text-[12.5px] text-[var(--status-danger)]">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)] px-5 py-3.5">
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="rounded-md px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--ink-100)]"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || isLimitReached}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Envoyer l&apos;invitation
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Field({
    label,
    hint,
    children,
}: {
    label: string
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div>
            <div className="mb-1.5 text-[12px] font-medium tracking-tight text-[var(--ink-700)]">{label}</div>
            {children}
            {hint && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-[var(--status-warn)]">
                    <Lock className="h-2.5 w-2.5" />
                    {hint}
                </div>
            )}
        </div>
    )
}
