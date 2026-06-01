"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Archive,
    Ban,
    CheckCircle,
    Clock,
    Info,
    MoreVertical,
    RotateCcw,
    Unlock,
} from "lucide-react"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMessages, type Message } from "@/hooks/useMessages"
import { useConversations } from "@/hooks/useConversations"
import { useTeamMembers } from "@/hooks/useTeamMembers"
import { useTypingIndicator } from "@/hooks/useRealtime"
import { cn } from "@/lib/utils"

import { Avatar } from "@/components/dashboard/primitives/Avatar"
import { Chip } from "@/components/dashboard/primitives/Chip"
import { StickyNote } from "lucide-react"
import { HeaderButton } from "@/components/dashboard/shell"
import { MessageBubble } from "@/components/dashboard/inbox"
import {
    avatarColorFromString,
    initialsFromName,
} from "@/lib/dashboard/avatar-color"
import { formatBubbleTime, formatDaySeparator } from "@/lib/dashboard/format-time"
import { replyAuthorLabel, replyPreviewText } from "@/lib/dashboard/reply"

import { AssignmentDropdown } from "../AssignmentDropdown"
import { CallButton } from "@/components/calls/call-button"
import { MessageInput } from "../MessageInput"
import {
    AudioPlayer,
    DocumentPreview,
    ImageViewer,
    LocationMessage,
    StickerMessage,
    VideoPlayer,
} from "../media"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface InboxThreadProps {
    conversationId: string
    onBack?: () => void
    onToggleInfo?: () => void
    showInfoButton?: boolean
}

// ── status → delivery ticks ──────────────────────────────────────────────

function deliveryFromStatus(
    status: Message["status"],
): "sent" | "delivered" | "read" | undefined {
    switch (status) {
        case "READ":
            return "read"
        case "DELIVERED":
            return "delivered"
        case "SENT":
        case "PENDING":
            return "sent"
        default:
            return undefined
    }
}

// ── 24h window pill ──────────────────────────────────────────────────────

function windowChip(expiresAt?: number | null) {
    if (!expiresAt) return null
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) return { tone: "danger" as const, label: "Fenêtre expirée" }
    const hours = Math.floor(remaining / 3_600_000)
    const minutes = Math.floor((remaining % 3_600_000) / 60_000)
    const label = hours > 0 ? `${hours}h${minutes.toString().padStart(2, "0")}` : `${minutes}min`
    return remaining < 4 * 3_600_000
        ? { tone: "warn" as const, label: `${label} restantes` }
        : { tone: "good" as const, label: `${label} restantes` }
}

// ── message → bubble body ────────────────────────────────────────────────

function renderBody(m: Message, isOutbound: boolean): { body: React.ReactNode; bare: boolean } {
    const media = m.media?.[0]
    switch (m.type) {
        case "AUDIO":
            return { body: <AudioPlayer src={media?.url ?? null} isOutbound={isOutbound} />, bare: true }
        case "IMAGE":
            return {
                body: (
                    <ImageViewer
                        src={media?.url ?? null}
                        caption={m.content ?? undefined}
                        isOutbound={isOutbound}
                    />
                ),
                bare: true,
            }
        case "VIDEO":
            return {
                body: (
                    <VideoPlayer
                        src={media?.url ?? null}
                        caption={m.content ?? undefined}
                        isOutbound={isOutbound}
                    />
                ),
                bare: true,
            }
        case "DOCUMENT":
            return {
                body: (
                    <DocumentPreview
                        url={media?.url ?? null}
                        fileName={media?.fileName}
                        mimeType={media?.mimeType}
                        fileSize={media?.fileSize}
                        isOutbound={isOutbound}
                    />
                ),
                bare: true,
            }
        case "LOCATION":
            return { body: <LocationMessage message={m} />, bare: true }
        case "STICKER":
            return { body: <StickerMessage url={media?.url ?? null} />, bare: true }
        default:
            return { body: m.content ?? "", bare: false }
    }
}

// ── internal note card ───────────────────────────────────────────────────

/** Splits note content so `@Name` tokens render highlighted (accent). */
function highlightMentions(
    content: string,
    mentions: { userId: string; name: string }[],
): React.ReactNode {
    if (!mentions.length) return content
    // Longest names first to avoid partial overlaps.
    const names = [...new Set(mentions.map((m) => m.name))].sort(
        (a, b) => b.length - a.length,
    )
    const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    const re = new RegExp(`@(${escaped.join("|")})`, "g")
    const out: React.ReactNode[] = []
    let last = 0
    let m: RegExpExecArray | null
    let key = 0
    while ((m = re.exec(content)) !== null) {
        if (m.index > last) out.push(content.slice(last, m.index))
        out.push(
            <span key={key++} className="font-semibold text-[var(--accent)]">
                {m[0]}
            </span>,
        )
        last = m.index + m[0].length
    }
    if (last < content.length) out.push(content.slice(last))
    return out
}

function InternalNoteCard({
    message,
    authorName,
}: {
    message: Message
    authorName: string
}) {
    return (
        <div className="flex justify-center" data-testid="internal-note">
            <div className="w-full max-w-[85%] rounded-xl border border-[var(--status-warn)]/30 bg-[var(--status-warn-soft)]/50 px-3 py-2.5">
                <div className="mb-1 flex items-center gap-1.5">
                    <StickyNote className="h-3 w-3 text-[var(--status-warn)]" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        Note interne · {authorName}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-[var(--ink-soft)]">
                        {formatBubbleTime(message.timestamp)}
                    </span>
                </div>
                <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--ink-900)]">
                    {highlightMentions(message.content ?? "", message.mentions ?? [])}
                </p>
                {message.mentions && message.mentions.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                        {message.mentions.map((mt) => (
                            <Chip key={mt.userId} tone="accent">
                                @{mt.name}
                            </Chip>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

// ── thread header (v3 chrome + wired actions) ────────────────────────────

function ThreadHeader({
    conversationId,
    onToggleInfo,
    showInfoButton,
}: {
    conversationId: string
    onToggleInfo?: () => void
    showInfoButton?: boolean
}) {
    const router = useRouter()
    const {
        currentMember,
        archiveConversation,
        resolveConversation,
        reopenResolvedConversation,
        blockContact,
        isResolving,
    } = useConversations()

    const data = useQuery(api.conversations.getById, {
        id: conversationId as Id<"conversations">,
    })
    const { isTyping, typingUsers } = useTypingIndicator(conversationId)

    if (!data) {
        return (
            <div className="flex items-center gap-2.5 border-b border-[var(--ink-200)] px-5 py-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ink-100)]" />
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--ink-100)]" />
            </div>
        )
    }

    const name = data.contact?.name || data.contact?.phoneNumber || "Contact"
    const phone = data.contact?.waId || data.contact?.phoneNumber || ""
    const isBlocked = data.contact?.isBlocked
    const win = windowChip(data.windowExpiresAt)
    const assignee = data.assignedTo
        ? {
              id: data.assignedTo._id,
              name: data.assignedTo.user?.name ?? null,
              email: data.assignedTo.user?.email ?? "",
              avatar: data.assignedTo.user?.image ?? null,
          }
        : null

    const handleResolve = async () => {
        await resolveConversation(conversationId)
        router.push("/dashboard/conversations")
    }

    return (
        <div className="flex items-center justify-between border-b border-[var(--ink-200)] bg-[var(--paper-white)] px-5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
                <Avatar initials={initialsFromName(data.contact?.name, phone)} color={avatarColorFromString(name)} />
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-[var(--ink-900)]">{name}</span>
                        <span className="font-mono text-[11px] text-[var(--ink-soft)]">{phone}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                        {isTyping ? (
                            <span className="text-[11px] font-medium text-[var(--accent)] animate-pulse">
                                {typingUsers.length > 0 ? `${typingUsers[0]} écrit…` : "écrit…"}
                            </span>
                        ) : (
                            <>
                                {assignee ? (
                                    <Chip tone="accent">
                                        {assignee.name ? `→ ${assignee.name.split(" ")[0]}` : "Assigné"}
                                    </Chip>
                                ) : (
                                    <Chip tone="neutral">Non assigné</Chip>
                                )}
                                {win ? (
                                    <Chip tone={win.tone}>
                                        <Clock className="h-2.5 w-2.5" /> {win.label}
                                    </Chip>
                                ) : null}
                                {isBlocked ? <Chip tone="danger">Bloqué</Chip> : null}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
                {currentMember ? (
                    <>
                        <AssignmentDropdown
                            conversationId={conversationId}
                            currentAssignee={assignee}
                            currentUserMemberId={currentMember.id}
                            currentUserRole={currentMember.role}
                        />
                        <CallButton
                            conversationId={conversationId}
                            contactPhone={phone}
                            contactName={data.contact?.name ?? undefined}
                        />
                    </>
                ) : null}

                {data.status === "OPEN" ? (
                    <HeaderButton icon={CheckCircle} variant="primary" onClick={handleResolve}>
                        {isResolving ? "…" : "Résoudre"}
                    </HeaderButton>
                ) : (
                    <HeaderButton icon={RotateCcw} onClick={() => reopenResolvedConversation(conversationId)}>
                        Rouvrir
                    </HeaderButton>
                )}

                {showInfoButton && onToggleInfo ? (
                    <button
                        type="button"
                        onClick={onToggleInfo}
                        aria-label="Infos contact"
                        className="rounded-md p-1.5 text-[var(--ink-500)] hover:bg-[var(--paper-warm)]"
                    >
                        <Info className="h-4 w-4" />
                    </button>
                ) : null}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label="Plus d'actions"
                            className="rounded-md p-1.5 text-[var(--ink-500)] hover:bg-[var(--paper-warm)]"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => archiveConversation(conversationId)}>
                            <Archive className="mr-2 h-4 w-4" /> Archiver
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => data.contact?._id && blockContact(data.contact._id)}
                            className={isBlocked ? "" : "text-[var(--status-danger)]"}
                        >
                            {isBlocked ? (
                                <>
                                    <Unlock className="mr-2 h-4 w-4" /> Débloquer
                                </>
                            ) : (
                                <>
                                    <Ban className="mr-2 h-4 w-4" /> Bloquer
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

// ── thread container ─────────────────────────────────────────────────────

/**
 * InboxThread — wired thread column (v3). Composes a v3-styled header
 * (wired to resolve/assign/call/archive/block) + day-grouped MessageBubble
 * list (text via v3 bubble, media via existing viewers in `bare` bubbles)
 * + the existing MessageInput composer (Phase 3 swaps it for v3).
 *
 * Preserves : realtime messages, load-more pagination, auto-scroll,
 * mark-as-read, blocked banner, reply + forward state.
 */
export function InboxThread({
    conversationId,
    onBack,
    onToggleInfo,
    showInfoButton,
}: InboxThreadProps) {
    const { currentMember, markAsRead } = useConversations()
    const { nameByUserId } = useTeamMembers()
    const [replyTo, setReplyTo] = useState<Message | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    const conversationData = useQuery(api.conversations.getById, {
        id: conversationId as Id<"conversations">,
    })
    const isBlocked = conversationData?.contact?.isBlocked
    const contactName = conversationData?.contact?.name ?? null

    const { messages, isLoading, hasNextPage, loadMore, isFetchingNextPage, resendMessage } =
        useMessages({ conversationId, organizationId: currentMember?.organizationId })

    useEffect(() => {
        if (conversationId) markAsRead(conversationId)
    }, [conversationId, markAsRead])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages.length])

    // Group consecutive messages by calendar day.
    const groups = useMemo(() => {
        const out: { day: string; items: Message[] }[] = []
        let current: { day: string; items: Message[] } | null = null
        let lastDayKey = ""
        for (const m of messages) {
            const d = new Date(m.timestamp)
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            if (!current || key !== lastDayKey) {
                current = { day: formatDaySeparator(m.timestamp), items: [] }
                out.push(current)
                lastDayKey = key
            }
            current.items.push(m)
        }
        return out
    }, [messages])

    const handleResend = useCallback(
        (id: string) => {
            resendMessage(id)
        },
        [resendMessage],
    )

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
            {onBack ? (
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1 border-b border-[var(--ink-200)] px-4 py-2 text-[12px] text-[var(--ink-soft)] md:hidden"
                >
                    ← Retour
                </button>
            ) : null}

            <ThreadHeader
                conversationId={conversationId}
                onToggleInfo={onToggleInfo}
                showInfoButton={showInfoButton}
            />

            {isBlocked ? (
                <div className="flex items-center justify-center gap-2 border-b border-[var(--status-danger)]/20 bg-[var(--status-danger-soft)] px-4 py-2 text-[12px] font-medium text-[var(--status-danger)]">
                    <Ban className="h-3.5 w-3.5" />
                    Ce contact est bloqué — vous ne pouvez ni recevoir ni envoyer de messages.
                </div>
            ) : null}

            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--paper-warm)]/40 px-5 py-4">
                {hasNextPage ? (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={loadMore}
                            disabled={isFetchingNextPage}
                            className="rounded-full border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1 text-[11px] text-[var(--ink-soft)] hover:bg-[var(--paper-warm)] disabled:opacity-50"
                        >
                            {isFetchingNextPage ? "Chargement…" : "Charger plus"}
                        </button>
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}>
                                <div className="h-10 w-48 animate-pulse rounded-2xl bg-[var(--ink-100)]" />
                            </div>
                        ))}
                    </div>
                ) : (
                    groups.map((g, gi) => (
                        <Fragment key={gi}>
                            <div className="text-center">
                                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                                    {g.day}
                                </span>
                            </div>
                            {g.items.map((m) => {
                                if (m.isInternal) {
                                    return (
                                        <InternalNoteCard
                                            key={m.id}
                                            message={m}
                                            authorName={
                                                (m.senderId && nameByUserId.get(m.senderId)) ||
                                                "Coéquipier"
                                            }
                                        />
                                    )
                                }
                                const out = m.direction === "OUTBOUND"
                                const { body, bare } = renderBody(m, out)
                                return (
                                    <div key={m.id}>
                                        <MessageBubble
                                            side={out ? "out" : "in"}
                                            timestamp={formatBubbleTime(m.timestamp)}
                                            deliveryStatus={out ? deliveryFromStatus(m.status) : undefined}
                                            bare={bare}
                                            onReply={() => setReplyTo(m)}
                                            quote={
                                                m.replyTo
                                                    ? {
                                                          author: replyAuthorLabel(
                                                              m.replyTo.direction,
                                                              contactName,
                                                          ),
                                                          snippet: replyPreviewText(
                                                              m.replyTo.type,
                                                              m.replyTo.content,
                                                          ),
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {body}
                                        </MessageBubble>
                                        {out && m.status === "FAILED" ? (
                                            <div className="mt-0.5 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleResend(m.id)}
                                                    className="text-[10px] font-medium text-[var(--status-danger)] hover:underline"
                                                >
                                                    Échec · Réessayer
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </Fragment>
                    ))
                )}
                <div ref={bottomRef} className="h-2" />
            </div>

            <MessageInput
                conversationId={conversationId}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                disabled={!!isBlocked}
                contactName={contactName}
            />
        </div>
    )
}
