'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useChannels } from '@/hooks/useChannels'
import { useCurrentOrg } from '@/hooks/use-current-org'
import { usePermission } from '@/hooks/use-permission'
import { useFacebookSDK } from '@/hooks/useFacebookSDK'
import { Id } from '@/convex/_generated/dataModel'
import { usePlanLimits } from '@/hooks/usePlans'
import { isUnlimited } from '@/lib/plan-utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Loader2, Plus, Send, RefreshCw, Star, Ban, ArrowUpRight, AlertTriangle,
    AlertCircle, CheckCircle2, Building2, MoreHorizontal,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChannelCard, WebhookBox, type ChannelQuality } from '@/components/dashboard/settings'
import type { ChipTone } from '@/components/dashboard/primitives/Chip'

interface WhatsAppNumber {
    id: string
    display_phone_number: string
    verified_name: string
    quality_rating: string
    wabaId: string
}

const NUMBER_WORDS = ['Aucun', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf']
function numberWord(n: number): string {
    return NUMBER_WORDS[n] ?? String(n)
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback
}

function formatRelativeTime(timestamp: number | undefined): string {
    if (!timestamp) return 'jamais'
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "à l'instant"
    if (minutes < 60) return `il y a ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `il y a ${hours} h`
    return `il y a ${Math.floor(hours / 24)} j`
}

function statusChip(status: string, hasTokenError: boolean): { label: string; tone: ChipTone } {
    if (hasTokenError) return { label: 'Token expiré', tone: 'danger' }
    switch (status) {
        case 'active': return { label: 'Actif', tone: 'good' }
        case 'pending_setup': return { label: 'En attente', tone: 'warn' }
        case 'error': return { label: 'Erreur', tone: 'danger' }
        case 'banned': return { label: 'Banni', tone: 'danger' }
        case 'disabled': return { label: 'Désactivé', tone: 'neutral' }
        default: return { label: 'Déconnecté', tone: 'neutral' }
    }
}

function webhookUrl(): string {
    const base = process.env.NEXT_PUBLIC_CONVEX_URL || ''
    const site = base.replace('.convex.cloud', '.convex.site')
    return site ? `${site}/api/whatsapp/webhook` : 'https://<deployment>.convex.site/api/whatsapp/webhook'
}

export function ChannelsSettings() {
    const { currentOrg } = useCurrentOrg()
    const {
        channels, isLoading, updateChannel, disableChannel, setOrgDefault,
        addChannel, fetchPhoneNumbers, getChannelStatus, sendTestMessage,
    } = useChannels()
    const polesData = useQuery(api.poles.list, currentOrg ? { organizationId: currentOrg._id } : 'skip')
    const poles = polesData?.poles ?? []
    type Channel = (typeof channels)[number]
    type Pole = (typeof poles)[number]
    const canCreate = usePermission('channels:create')
    const canUpdate = usePermission('channels:update')
    const canDelete = usePermission('channels:delete')
    const { currentPlan } = usePlanLimits()

    const [channelStatuses, setChannelStatuses] = useState<Record<string, Record<string, string>>>({})
    const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null)
    const [testDialogChannelId, setTestDialogChannelId] = useState<string | null>(null)
    const [testPhone, setTestPhone] = useState('')
    const [sendingTest, setSendingTest] = useState(false)
    const [tokenErrors, setTokenErrors] = useState<Record<string, string>>({})
    const [checkingTokens, setCheckingTokens] = useState(false)
    const [disableTargetId, setDisableTargetId] = useState<string | null>(null)

    // Surface expired-token state from recent FAILED outbound calls (code 190).
    const callsTokenIssues = useQuery(
        api.calls.getChannelsWithTokenError,
        currentOrg ? { organizationId: currentOrg._id } : 'skip',
    )

    useEffect(() => {
        if (!callsTokenIssues || callsTokenIssues.length === 0) return
        setTokenErrors(prev => {
            const next = { ...prev }
            for (const issue of callsTokenIssues) next[issue.channelId as unknown as string] = issue.reason
            return next
        })
    }, [callsTokenIssues])

    // Auto-fetch Meta quality + token health for active channels on mount.
    useEffect(() => {
        if (!channels.length || checkingTokens) return
        const active = channels.filter((c: Channel) => c.status === 'active')
        if (!active.length) return
        let cancelled = false
        setCheckingTokens(true)
        Promise.allSettled(
            active.map(async (ch: Channel) => {
                try {
                    const status = await getChannelStatus({ channelId: ch._id as Id<'whatsappChannels'> })
                    if (status) {
                        setChannelStatuses(prev => ({ ...prev, [ch._id]: status }))
                        if (status.error && /access token|expired|session/i.test(status.error)) {
                            if (!cancelled) setTokenErrors(prev => ({ ...prev, [ch._id]: status.error }))
                        }
                    }
                } catch { /* ignore */ }
            })
        ).finally(() => { if (!cancelled) setCheckingTokens(false) })
        return () => { cancelled = true }
    }, [channels.length]) // eslint-disable-line react-hooks/exhaustive-deps

    const activeChannels = channels.filter((c: Channel) => c.status !== 'disabled' && c.status !== 'banned')
    const maxChannels = currentPlan?.maxWhatsappChannels ?? 1
    const canAddMore = isUnlimited(maxChannels) || activeChannels.length < maxChannels

    const handleSetDefault = async (channelId: string) => {
        try {
            await setOrgDefault({ id: channelId as Id<'whatsappChannels'> })
            toast.success('Canal par défaut mis à jour')
        } catch (e) { toast.error(getErrorMessage(e, 'Erreur')) }
    }
    const handleDisable = async (channelId: string) => {
        try {
            await disableChannel({ id: channelId as Id<'whatsappChannels'> })
            toast.success('Canal désactivé')
        } catch (e) { toast.error(getErrorMessage(e, 'Erreur')) }
    }
    const handleAssignPole = async (channelId: string, poleId: string | null) => {
        try {
            await updateChannel({
                id: channelId as Id<'whatsappChannels'>,
                poleId: (poleId ?? undefined) as Id<'poles'> | undefined,
            })
            toast.success(poleId ? 'Pôle assigné au canal' : 'Pôle retiré')
        } catch (e) { toast.error(getErrorMessage(e, 'Erreur')) }
    }
    const handleRefreshStatus = async (channelId: string) => {
        setLoadingStatusId(channelId)
        try {
            const status = await getChannelStatus({ channelId: channelId as Id<'whatsappChannels'> })
            if (status) setChannelStatuses(prev => ({ ...prev, [channelId]: status }))
            toast.success('Statut actualisé')
        } catch { toast.error('Impossible de récupérer le statut') }
        finally { setLoadingStatusId(null) }
    }
    const handleSendTest = async () => {
        if (!testDialogChannelId || !testPhone.trim()) return
        setSendingTest(true)
        try {
            await sendTestMessage({ channelId: testDialogChannelId as Id<'whatsappChannels'>, to: testPhone })
            toast.success('Message test envoyé')
            setTestDialogChannelId(null)
            setTestPhone('')
        } catch (e) { toast.error(getErrorMessage(e, "Échec de l'envoi")) }
        finally { setSendingTest(false) }
    }

    if (isLoading) {
        return <div className="h-64 animate-pulse rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)]" />
    }

    const count = activeChannels.length
    const latestWebhookAt = channels.reduce<number | undefined>(
        (max, c: Channel) => (c.lastWebhookAt && (!max || c.lastWebhookAt > max) ? c.lastWebhookAt : max),
        undefined,
    )

    return (
        <div className="max-w-[760px]">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Canaux WhatsApp Business
            </p>
            <h2 className="mb-2 mt-1 font-editorial text-[28px] italic leading-tight tracking-tight text-[var(--ink-900)]">
                {count === 0 ? 'Connectez votre premier numéro.' : `${numberWord(count)} numéro${count > 1 ? 's' : ''}, une boîte unique.`}
            </h2>
            <p className="max-w-[560px] text-[14px] leading-relaxed text-[var(--ink-500)]">
                Chaque numéro est connecté via Meta Business Cloud API. Le webhook entrant est auto-configuré et signé{' '}
                <span className="font-mono">HMAC-SHA256</span>.
            </p>

            {Object.keys(tokenErrors).length > 0 && (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] p-3 text-[12.5px] text-[var(--status-danger)]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Un ou plusieurs canaux ont un token expiré — l&apos;envoi et la réception sont bloqués. Reconnectez le numéro pour renouveler le token.</span>
                </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
                {channels.map((channel: Channel) => {
                    const hasTokenError = !!tokenErrors[channel._id]
                    const live = channelStatuses[channel._id]
                    const quality = (live?.quality_rating as ChannelQuality) || 'UNKNOWN'
                    const refreshing = loadingStatusId === channel._id
                    return (
                        <ChannelCard
                            key={channel._id}
                            name={`${channel.label}${channel.isOrgDefault ? ' · par défaut' : ''}`}
                            phone={channel.displayPhoneNumber || channel.verifiedName || '—'}
                            wabaId={channel.waba?.metaBusinessAccountId || undefined}
                            status={statusChip(channel.status, hasTokenError)}
                            quality={quality}
                            volume={undefined}
                            menu={
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        aria-label={`Actions pour ${channel.label}`}
                                        className="rounded p-1 text-[var(--ink-400)] outline-none hover:bg-[var(--paper-warm)] data-[state=open]:bg-[var(--paper-warm)]"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        <DropdownMenuItem disabled={refreshing} onSelect={() => handleRefreshStatus(channel._id)}>
                                            <RefreshCw className={cn('mr-2 h-3.5 w-3.5', refreshing && 'animate-spin')} />
                                            Actualiser le statut
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setTestDialogChannelId(channel._id)}>
                                            <Send className="mr-2 h-3.5 w-3.5" /> Envoyer un test
                                        </DropdownMenuItem>
                                        {canUpdate && !channel.isOrgDefault && channel.status === 'active' && (
                                            <DropdownMenuItem onSelect={() => handleSetDefault(channel._id)}>
                                                <Star className="mr-2 h-3.5 w-3.5" /> Définir par défaut
                                            </DropdownMenuItem>
                                        )}
                                        {canUpdate && poles.length > 0 && (
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>
                                                    <Building2 className="mr-2 h-3.5 w-3.5" /> Assigner un pôle
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onSelect={() => handleAssignPole(channel._id, null)}>
                                                        Aucun pôle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {poles.map((p: Pole) => (
                                                        <DropdownMenuItem key={p.id} onSelect={() => handleAssignPole(channel._id, p.id)}>
                                                            <span className="mr-2 h-2 w-2 rounded-full" style={{ background: p.color || 'var(--ink-400)' }} />
                                                            {p.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                        )}
                                        {canDelete && !channel.isOrgDefault && channel.status !== 'disabled' && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem variant="destructive" onSelect={() => setDisableTargetId(channel._id)}>
                                                    <Ban className="mr-2 h-3.5 w-3.5" /> Désactiver
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            }
                        />
                    )
                })}

                {/* Connect a new number */}
                {canCreate && canAddMore ? (
                    <AddChannelDialog
                        addChannel={addChannel}
                        fetchPhoneNumbers={fetchPhoneNumbers}
                        trigger={
                            <button
                                type="button"
                                className="flex items-center gap-3.5 rounded-xl border border-dashed border-[var(--ink-300)] p-4 text-left transition-colors hover:bg-[var(--paper-warm)]"
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--paper-warm)] text-[var(--ink-soft)]">
                                    <Plus className="h-5 w-5" />
                                </span>
                                <span className="flex-1">
                                    <span className="block text-[14px] font-medium text-[var(--ink-900)]">Connecter un nouveau numéro</span>
                                    <span className="block text-[12px] text-[var(--ink-soft)]">via Meta Business · 1-2 minutes</span>
                                </span>
                                <span className="rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[13px] font-medium text-white">Connecter</span>
                            </button>
                        }
                    />
                ) : canCreate ? (
                    <div className="flex items-center gap-3.5 rounded-xl border border-dashed border-[var(--ink-300)] p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--paper-warm)] text-[var(--ink-soft)]">
                            <ArrowUpRight className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                            <p className="text-[14px] font-medium text-[var(--ink-900)]">Limite de canaux atteinte</p>
                            <p className="text-[12px] text-[var(--ink-soft)]">Plan {currentPlan?.name ?? currentOrg?.plan} · {isUnlimited(maxChannels) ? '∞' : maxChannels} canal(aux)</p>
                        </div>
                        <a href="/dashboard/billing" className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]">
                            Mettre à niveau
                        </a>
                    </div>
                ) : null}
            </div>

            {/* Webhook */}
            <div className="mt-9">
                <WebhookBox
                    url={webhookUrl()}
                    verifiedAgo={latestWebhookAt ? formatRelativeTime(latestWebhookAt) : ''}
                    label="Webhook entrant · partagé"
                />
            </div>

            {/* Disable confirmation */}
            <AlertDialog open={!!disableTargetId} onOpenChange={(o) => !o && setDisableTargetId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Désactiver ce canal ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ce canal ne recevra plus de messages. Les conversations existantes seront conservées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => { if (disableTargetId) handleDisable(disableTargetId); setDisableTargetId(null) }}
                            className="bg-[var(--status-danger)] text-white hover:bg-[var(--status-danger)]/90"
                        >
                            Désactiver
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Test message dialog */}
            <Dialog open={!!testDialogChannelId} onOpenChange={(open) => { if (!open) { setTestDialogChannelId(null); setTestPhone('') } }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Envoyer un message test</DialogTitle>
                        <DialogDescription>
                            Un message de test sera envoyé via ce canal pour vérifier que l&apos;intégration fonctionne.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="test-phone" className="text-[13px] font-medium text-[var(--ink-700)]">Numéro destinataire</Label>
                            <Input id="test-phone" placeholder="+221 77 123 45 67" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="h-10" />
                        </div>
                        <button
                            type="button"
                            onClick={handleSendTest}
                            disabled={sendingTest || !testPhone.trim()}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--ink-900)] text-[13px] font-medium text-white hover:bg-[var(--ink-700)] disabled:opacity-50"
                        >
                            {sendingTest ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <><Send className="h-4 w-4" /> Envoyer le test</>}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ============================================
// Add Channel Dialog (multi-WABA aware) — Meta Embedded Signup
// ============================================

interface AddChannelDialogProps {
    addChannel: (args: {
        accessToken: string
        wabaId: string
        phoneNumberId: string
        displayPhoneNumber?: string
        verifiedName?: string
        label?: string
    }) => Promise<{ success: boolean; channelId: string }>
    fetchPhoneNumbers: (args: { accessToken: string }) => Promise<{
        wabaId: string | null
        wabaIds?: string[]
        phoneNumbers: WhatsAppNumber[]
    }>
    trigger?: React.ReactNode
}

function AddChannelDialog({ addChannel, fetchPhoneNumbers, trigger }: AddChannelDialogProps) {
    const { isReady: fbReady, login: fbLogin } = useFacebookSDK()
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'idle' | 'fetching' | 'selecting' | 'saving'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppNumber[]>([])
    const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null)
    const [channelLabel, setChannelLabel] = useState('')

    const resetState = () => {
        setStep('idle'); setErrorMessage(null); setAccessToken(null)
        setPhoneNumbers([]); setSelectedPhoneId(null); setChannelLabel('')
    }
    const handleOpenChange = (newOpen: boolean) => { setOpen(newOpen); if (!newOpen) resetState() }

    const launchFBSignup = async () => {
        setErrorMessage(null)
        try {
            const { accessToken: token } = await fbLogin()
            setAccessToken(token)
            setStep('fetching')
            const data = await fetchPhoneNumbers({ accessToken: token })
            setPhoneNumbers(data.phoneNumbers)
            if (data.phoneNumbers.length > 0) {
                setSelectedPhoneId(data.phoneNumbers[0].id)
                setStep('selecting')
            } else {
                setErrorMessage('Aucun numéro WhatsApp trouvé sur ce compte.')
                setStep('idle')
            }
        } catch (err) {
            setErrorMessage(getErrorMessage(err, 'Connexion annulée ou non autorisée.'))
            setStep('idle')
        }
    }

    const handleConfirm = async () => {
        if (!accessToken || !selectedPhoneId) return
        const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId)
        if (!selectedPhone) return
        setStep('saving')
        try {
            await addChannel({
                accessToken,
                wabaId: selectedPhone.wabaId,
                phoneNumberId: selectedPhoneId,
                displayPhoneNumber: selectedPhone.display_phone_number,
                verifiedName: selectedPhone.verified_name,
                label: channelLabel || selectedPhone.verified_name || selectedPhone.display_phone_number,
            })
            toast.success('Canal WhatsApp ajouté', { description: selectedPhone.display_phone_number || 'Nouveau canal actif' })
            handleOpenChange(false)
        } catch (err) {
            setErrorMessage(getErrorMessage(err, 'Erreur lors de la création du canal.'))
            setStep('selecting')
        }
    }

    const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId)

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 text-[13px] font-medium text-white hover:bg-[var(--ink-700)]">
                        <Plus className="h-3.5 w-3.5" /> Ajouter un canal
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ajouter un canal WhatsApp</DialogTitle>
                    <DialogDescription>
                        Connectez un nouveau numéro WhatsApp Business via votre compte Facebook.
                    </DialogDescription>
                </DialogHeader>

                {errorMessage && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] px-3 py-2.5 text-[13px] text-[var(--status-danger)]">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errorMessage}
                    </div>
                )}

                {step === 'idle' && (
                    <div className="space-y-4 py-2">
                        <div className="rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-4 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-muted)]">
                                <Plus className="h-6 w-6 text-[var(--accent)]" />
                            </div>
                            <p className="text-[13px] text-[var(--ink-700)]">
                                Une fenêtre popup va s&apos;ouvrir pour vous connecter à Facebook et sélectionner vos numéros WhatsApp Business.
                            </p>
                        </div>
                        <Button
                            onClick={launchFBSignup}
                            disabled={!fbReady}
                            className="h-11 w-full rounded-md bg-gradient-to-r from-[#1877F2] to-[#166fe5] font-semibold text-white hover:from-[#166fe5] hover:to-[#1565d8]"
                        >
                            {!fbReady ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            )}
                            Connecter WhatsApp Business
                        </Button>
                    </div>
                )}

                {step === 'fetching' && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
                        <p className="text-[13px] text-[var(--ink-soft)]">Récupération de tous vos numéros…</p>
                    </div>
                )}

                {(step === 'selecting' || step === 'saving') && (
                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--status-good)]/30 bg-[var(--status-good-soft)] px-3 py-2.5 text-[12px] text-[var(--status-good)]">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            {phoneNumbers.length} numéro{phoneNumbers.length > 1 ? 's' : ''} trouvé{phoneNumbers.length > 1 ? 's' : ''} sur votre compte
                        </div>
                        <div className="max-h-[300px] space-y-2 overflow-y-auto">
                            {phoneNumbers.map((phone) => {
                                const isSelected = selectedPhoneId === phone.id
                                return (
                                    <button
                                        key={phone.id}
                                        type="button"
                                        onClick={() => setSelectedPhoneId(phone.id)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                            isSelected
                                                ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                                                : 'border-[var(--ink-200)] bg-[var(--paper-white)] hover:border-[var(--ink-300)]',
                                        )}
                                    >
                                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', isSelected ? 'bg-[var(--accent)] text-white' : 'bg-[var(--paper-warm)] text-[var(--ink-soft)]')}>
                                            <Plus className="h-4 w-4 rotate-45" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-medium text-[var(--ink-900)]">{phone.verified_name || 'Numéro sans nom'}</span>
                                            <span className="block truncate text-[11px] text-[var(--ink-soft)]">{phone.display_phone_number}</span>
                                        </span>
                                        {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent)]" />}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="channel-label" className="text-[13px] font-medium text-[var(--ink-700)]">Nom du canal (optionnel)</Label>
                            <Input id="channel-label" placeholder="Ex : Support, Commercial…" value={channelLabel} onChange={(e) => setChannelLabel(e.target.value)} className="h-10" />
                        </div>
                        {selectedPhone && (
                            <div className="rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3">
                                <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Numéro sélectionné</p>
                                <p className="text-[13px] font-medium text-[var(--ink-900)]">{selectedPhone.verified_name || selectedPhone.display_phone_number}</p>
                                <p className="text-[11px] text-[var(--ink-soft)]">{selectedPhone.display_phone_number}</p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={step === 'saving' || !selectedPhoneId}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--ink-900)] text-[13px] font-medium text-white hover:bg-[var(--ink-700)] disabled:opacity-50"
                        >
                            {step === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Ajout en cours…</> : <><Plus className="h-4 w-4" /> Ajouter ce canal</>}
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
