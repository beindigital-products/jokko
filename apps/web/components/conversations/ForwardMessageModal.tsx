/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║       components/conversations/ForwardMessageModal.tsx        ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Modal pour transférer un message à une autre conversation.  ║
 * ║   Design system v3 (paper · ink · accent). Aperçu adapté au   ║
 * ║   type : vignette pour image/vidéo, icône typée sinon, texte. ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useMemo } from 'react'
import {
    Search,
    Forward,
    Loader2,
    Check,
    FileText,
    Mic,
    MapPin,
    Sticker,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar } from '@/components/dashboard/primitives/Avatar'
import { avatarColorFromString, initialsFromName } from '@/lib/dashboard/avatar-color'
import { replyPreviewText } from '@/lib/dashboard/reply'
import { useConversations } from '@/hooks/useConversations'
import type { Message } from '@/hooks/useMessages'
import { cn } from '@/lib/utils'

interface ForwardMessageModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    message: Message | null
    currentConversationId: string
    onForward: (conversationId: string, message: Message) => Promise<void>
}

// ── preview of the message being forwarded (image thumb vs typed icon vs text) ─

function TypeIcon({ type }: { type: Message['type'] }) {
    const cls = 'h-4.5 w-4.5'
    switch (type) {
        case 'AUDIO':
            return <Mic className={cls} />
        case 'DOCUMENT':
            return <FileText className={cls} />
        case 'LOCATION':
            return <MapPin className={cls} />
        case 'STICKER':
            return <Sticker className={cls} />
        default:
            return <FileText className={cls} />
    }
}

function ForwardPreview({ message }: { message: Message }) {
    const media = message.media?.[0]
    const hasThumb =
        (message.type === 'IMAGE' || message.type === 'VIDEO' || message.type === 'STICKER') &&
        !!media?.url
    const isMedia = ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION'].includes(
        message.type,
    )

    return (
        <div className="mx-5 flex items-center gap-3 rounded-xl border-l-2 border-[var(--accent)] bg-[var(--paper-warm)] px-3 py-2.5">
            {hasThumb ? (
                message.type === 'VIDEO' ? (
                    <video
                        src={media!.url}
                        muted
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={media!.url}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                )
            ) : isMedia ? (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--ink-100)] text-[var(--ink-500)]">
                    <TypeIcon type={message.type} />
                </div>
            ) : null}
            <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Message à transférer
                </span>
                <p className="truncate text-[13px] leading-snug text-[var(--ink-900)]">
                    {replyPreviewText(message.type, message.content)}
                </p>
            </div>
        </div>
    )
}

export function ForwardMessageModal({
    open,
    onOpenChange,
    message,
    currentConversationId,
    onForward,
}: ForwardMessageModalProps) {
    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isForwarding, setIsForwarding] = useState(false)
    const [forwardedTo, setForwardedTo] = useState<string | null>(null)

    const { conversations, isLoading } = useConversations()

    const filteredConversations = useMemo(() => {
        if (!conversations) return []
        return conversations
            .filter((conv) => conv.id !== currentConversationId)
            .filter((conv) => {
                if (!search) return true
                const q = search.toLowerCase()
                return (
                    conv.contact.name?.toLowerCase().includes(q) ||
                    conv.contact.phone?.toLowerCase().includes(q)
                )
            })
    }, [conversations, currentConversationId, search])

    const handleForward = async (conversationId: string) => {
        if (!message || isForwarding) return
        setSelectedId(conversationId)
        setIsForwarding(true)
        try {
            await onForward(conversationId, message)
            setForwardedTo(conversationId)
            setTimeout(() => {
                onOpenChange(false)
                setSelectedId(null)
                setForwardedTo(null)
                setSearch('')
            }, 900)
        } catch (error) {
            console.error('Forward failed:', error)
        } finally {
            setIsForwarding(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setSearch('')
            setSelectedId(null)
            setForwardedTo(null)
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="gap-0 overflow-hidden bg-[var(--paper-white)] p-0 sm:max-w-md"
                data-testid="forward-modal"
            >
                <DialogHeader className="px-5 pt-5 text-left">
                    <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ink-900)]">
                        <Forward className="h-4.5 w-4.5 text-[var(--accent)]" />
                        Transférer le message
                    </DialogTitle>
                    <DialogDescription className="text-[13px] text-[var(--ink-soft)]">
                        Choisissez une conversation destinataire.
                    </DialogDescription>
                </DialogHeader>

                {/* Message preview */}
                {message ? (
                    <div className="mt-3">
                        <ForwardPreview message={message} />
                    </div>
                ) : null}

                {/* Search */}
                <div className="px-5 pb-2 pt-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]" />
                        <Input
                            placeholder="Rechercher une conversation…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 rounded-lg border-[var(--ink-200)] bg-[var(--paper-warm)] pl-9 text-[13px] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-ring)]"
                        />
                    </div>
                </div>

                {/* Conversations list */}
                <ScrollArea className="h-[320px] px-2 pb-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--ink-400)]" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="px-3 py-10 text-center text-[13px] text-[var(--ink-soft)]">
                            {search ? 'Aucune conversation trouvée.' : 'Aucune autre conversation.'}
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filteredConversations.map((conv) => {
                                const isSelected = selectedId === conv.id
                                const isForwarded = forwardedTo === conv.id
                                const label = conv.contact.name || conv.contact.phone || 'Contact'

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => handleForward(conv.id)}
                                        disabled={isForwarding}
                                        data-testid="forward-target"
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed',
                                            isForwarded
                                                ? 'bg-[var(--status-good-soft)]'
                                                : isSelected
                                                  ? 'bg-[var(--paper-warm)]'
                                                  : 'hover:bg-[var(--paper-warm)]',
                                        )}
                                    >
                                        <Avatar
                                            initials={initialsFromName(conv.contact.name, conv.contact.phone)}
                                            color={avatarColorFromString(label)}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-medium text-[var(--ink-900)]">
                                                {conv.contact.name || conv.contact.phone}
                                            </p>
                                            {conv.contact.name ? (
                                                <p className="truncate font-mono text-[11px] text-[var(--ink-soft)]">
                                                    {conv.contact.phone}
                                                </p>
                                            ) : null}
                                        </div>

                                        {isForwarded ? (
                                            <span className="flex items-center gap-1 text-[var(--status-good)]">
                                                <Check className="h-4 w-4" />
                                                <span className="text-[12px] font-medium">Envoyé</span>
                                            </span>
                                        ) : isSelected && isForwarding ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-[var(--ink-soft)]" />
                                        ) : (
                                            <Forward className="h-4 w-4 text-[var(--ink-400)]" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
