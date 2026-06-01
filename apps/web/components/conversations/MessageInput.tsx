/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║           components/conversations/MessageInput.tsx           ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║                                                               ║
 * ║     ┌─────────────────────────────────────────────────────┐   ║
 * ║     │                                                     │   ║
 * ║     │  [😊]  [📎]  [Type your message...          ]  [➤]  │   ║
 * ║     │                                                     │   ║
 * ║     └─────────────────────────────────────────────────────┘   ║
 * ║                                                               ║
 * ║     Supports:                                                 ║
 * ║     - Text messages                                           ║
 * ║     - Image/Video upload                                      ║
 * ║     - Document upload                                         ║
 * ║     - Audio recording                                         ║
 * ║                                                               ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║ DESCRIPTION:                                                  ║
 * ║   Input de message avec support medias et envoi.              ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

'use client'

import { useState, useRef, useEffect, useMemo, KeyboardEvent } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import {
    Paperclip,
    Send,
    Smile,
    X,
    Image as ImageIcon,
    FileText,
    Loader2,
    Mic,
    Camera,
    Trash2,
    Reply,
    Zap, // Icon for shortcuts
} from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
// @ts-expect-error mic-recorder-to-mp3 does not ship TypeScript declarations.
import MicRecorder from 'mic-recorder-to-mp3'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSendMessage } from '@/hooks/useSendMessage'
import { useTypingIndicator } from '@/hooks/useRealtime'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { MentionPicker } from '@/components/dashboard/inbox'
import {
    resolveMentions,
    detectMentionQuery,
    insertMention,
    type MentionCandidate,
} from '@/lib/dashboard/mentions'
import { cn } from '@/lib/utils'
import type { Message } from '@/hooks/useMessages'
import { toast } from 'sonner'

// ============================================
// TYPES
// ============================================

interface MessageInputProps {
    conversationId: string
    disabled?: boolean
    placeholder?: string
    replyTo?: Message | null
    onCancelReply?: () => void
}

interface Attachment {
    file?: File
    storageId?: string
    preview?: string
    type: 'image' | 'video' | 'document' | 'audio'
}

interface Mp3Recorder {
    start: () => Promise<void>
    stop: () => {
        getMp3: () => Promise<[BlobPart[], Blob]>
    }
}

type MicRecorderConstructor = new (options: { bitRate: number }) => Mp3Recorder

const TypedMicRecorder = MicRecorder as MicRecorderConstructor

function toAttachmentType(type: string): Attachment['type'] {
    const normalized = type.toLowerCase()
    if (normalized === 'image' || normalized === 'video' || normalized === 'audio' || normalized === 'document') {
        return normalized
    }
    return 'document'
}

// File size limits (videos will be compressed on server)
const MAX_FILE_SIZES = {
    image: 5 * 1024 * 1024,      // 5 MB
    video: 100 * 1024 * 1024,    // 100 MB (will be compressed to 16MB)
    audio: 16 * 1024 * 1024,     // 16 MB
    document: 100 * 1024 * 1024, // 100 MB
}

const RECORDING_WAVEFORM_HEIGHTS = [10, 18, 12, 24, 16, 28, 14, 22, 11, 26, 19, 13, 25, 17, 29, 15, 21, 12, 23, 16]

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ============================================
// COMPONENT
// ============================================

export function MessageInput({
    conversationId,
    disabled,
    placeholder = 'Ecrivez votre message...',
    replyTo,
    onCancelReply,
}: MessageInputProps) {
    const [message, setMessage] = useState('')
    const [attachment, setAttachment] = useState<Attachment | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)

    // Compose mode : 'reply' = WhatsApp message to the contact, 'note' =
    // team-only internal note (with @mentions, never sent to WhatsApp).
    const [mode, setMode] = useState<'reply' | 'note'>('reply')

    // Shortcuts state
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [shortcutQuery, setShortcutQuery] = useState('')
    const shortcuts = useQuery(api.shortcuts.suggest, showShortcuts ? { search: shortcutQuery } : "skip")

    // @mention state (note mode only)
    const [showMentions, setShowMentions] = useState(false)
    const [mentionQuery, setMentionQuery] = useState('')
    const [mentionStart, setMentionStart] = useState(0)
    const [activeMentionId, setActiveMentionId] = useState<string | undefined>(undefined)
    const [pickedMentions, setPickedMentions] = useState<MentionCandidate[]>([])
    const { members: teamMembers } = useTeamMembers()
    const filteredMembers = useMemo(() => {
        const q = mentionQuery.trim().toLowerCase()
        if (!q) return teamMembers
        return teamMembers.filter((m) => m.name.toLowerCase().includes(q))
    }, [teamMembers, mentionQuery])

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const recorderRef = useRef<Mp3Recorder | null>(null)
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

    const { sendMessage, sendMedia, addInternalNote, isSending } = useSendMessage(conversationId)
    const { sendTyping } = useTypingIndicator(conversationId)
    const getDownloadUrl = useMutation(api.files.getDownloadUrl)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
            if (recorderRef.current) {
                recorderRef.current.stop()
            }
        }
    }, [])

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false)
            }
        }

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showEmojiPicker])

    // Handle emoji selection
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const cursorPosition = textareaRef.current?.selectionStart || message.length
        const newMessage =
            message.slice(0, cursorPosition) +
            emojiData.emoji +
            message.slice(cursorPosition)
        setMessage(newMessage)
        setShowEmojiPicker(false)
        textareaRef.current?.focus()
    }

    // Handle shortcut selection
    const handleShortcutSelect = async (shortcut: { shortcut: string, text?: string, type?: string, mediaStorageId?: Id<"_storage"> }) => {
        const cursorPosition = textareaRef.current?.selectionStart || message.length

        // We know shortcutQuery ends at cursorPosition
        const textBeforeCursor = message.slice(0, cursorPosition)

        if (textBeforeCursor.endsWith(shortcutQuery)) {
            const triggerStart = cursorPosition - shortcutQuery.length

            // If it's a media shortcut
            if (shortcut.type && shortcut.type !== 'TEXT' && shortcut.mediaStorageId) {
                // Remove the trigger text
                const newMessage =
                    message.slice(0, triggerStart) +
                    message.slice(cursorPosition)

                setMessage(newMessage)

                // Fetch preview URL
                try {
                    const url = await getDownloadUrl({ storageId: shortcut.mediaStorageId })
                    if (url) {
                        setAttachment({
                            storageId: shortcut.mediaStorageId,
                            type: toAttachmentType(shortcut.type),
                            preview: url,
                            // file is undefined
                        })
                        // Set caption if present
                        if (shortcut.text) {
                            setMessage(shortcut.text)
                        }
                    }
                } catch (e) {
                    console.error("Failed to load shortcut media", e)
                    toast.error("Erreur lors du chargement du média")
                }

                setShowShortcuts(false)
                setShortcutQuery('')
                return
            }

            // Text shortcut
            const insertText = shortcut.text || ""
            const newMessage =
                message.slice(0, triggerStart) +
                insertText +
                message.slice(cursorPosition)

            setMessage(newMessage)
            setShowShortcuts(false)
            setShortcutQuery('')

            // Adjust height and focus
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus()
                    // Re-calculate height
                    textareaRef.current.style.height = 'auto'
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
                }
            }, 0)
        }
    }

    // Auto-resize textarea
    const adjustHeight = () => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
        }
    }

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // WhatsApp Cloud API Supported Types
        const supportedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

        let type: 'image' | 'video' | 'document' = 'document';
        if (supportedImages.includes(file.type)) {
            type = 'image';
        } else if (file.type.startsWith('video/')) {
            // Try to send all videos as video type first, backend will fallback if supported check fails
            type = 'video';
        }

        // Check file size against limits
        const maxSize = MAX_FILE_SIZES[type]
        if (file.size > maxSize) {
            const limitInfo = type === 'video'
                ? `Limite: ${formatFileSize(maxSize)} (les videos seront comprimees automatiquement)`
                : `Limite WhatsApp pour les ${type === 'image' ? 'images' : 'documents'}: ${formatFileSize(maxSize)}`

            alert(
                `Le fichier est trop volumineux (${formatFileSize(file.size)}).\n\n` +
                `${limitInfo}\n\n` +
                `Veuillez choisir un fichier plus petit.`
            )
            // Reset the input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        const newAttachment: Attachment = { file, type }

        // Create preview for images and videos
        if (type === 'image' || type === 'video') {
            newAttachment.preview = URL.createObjectURL(file)
        }

        console.log('[MessageInput] File selected:', { type, fileName: file.name, size: file.size })
        setAttachment(newAttachment)
    }

    // Remove attachment
    const removeAttachment = () => {
        if (attachment?.preview) {
            URL.revokeObjectURL(attachment.preview)
        }
        setAttachment(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Format recording duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Start audio recording
    const startRecording = async () => {
        try {
            const recorder = new TypedMicRecorder({ bitRate: 128 })
            await recorder.start()
            recorderRef.current = recorder

            setIsRecording(true)
            setRecordingDuration(0)

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1)
            }, 1000)
        } catch (error) {
            console.error('[MessageInput] Failed to start recording:', error)
            alert('Impossible d\'acceder au microphone. Verifiez les permissions.')
        }
    }

    // Stop recording and send
    const stopRecordingAndSend = () => {
        if (!recorderRef.current || !isRecording) return

        recorderRef.current
            .stop()
            .getMp3()
            .then(([buffer]) => {
                const audioFile = new File(buffer, `audio_${Date.now()}.mp3`, {
                    type: 'audio/mpeg',
                })

                sendMedia({
                    file: audioFile,
                    type: 'audio',
                })

                cleanupRecording()
            })
            .catch((e: unknown) => {
                console.error('[MessageInput] Failed to get MP3:', e)
                cleanupRecording()
            })
    }

    // Cancel recording
    const cancelRecording = () => {
        if (recorderRef.current) {
            recorderRef.current.stop()
        }
        cleanupRecording()
    }

    // Cleanup recording state
    const cleanupRecording = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
        }
        recorderRef.current = null
        setIsRecording(false)
        setRecordingDuration(0)
    }

    // Insert a picked teammate as an @mention token (note mode)
    const handleMentionSelect = (member: { id: string; name: string }) => {
        const caret = textareaRef.current?.selectionStart ?? message.length
        const { text, caret: newCaret } = insertMention(message, caret, mentionStart, member.name)
        setMessage(text)
        setPickedMentions((prev) =>
            prev.some((p) => p.userId === member.id)
                ? prev
                : [...prev, { userId: member.id, name: member.name }],
        )
        setShowMentions(false)
        setMentionQuery('')
        setTimeout(() => {
            const el = textareaRef.current
            if (el) {
                el.focus()
                el.setSelectionRange(newCaret, newCaret)
                adjustHeight()
            }
        }, 0)
    }

    // Send message. `disabled` (blocked contact) gates WhatsApp replies but
    // NOT internal notes — team coordination stays available on blocked contacts.
    const handleSend = async () => {
        if (isSending) return
        if (disabled && mode !== 'note') return

        const trimmedMessage = message.trim()

        // ── Internal note path (team-only, with @mentions) ──────────────
        if (mode === 'note') {
            if (!trimmedMessage) return
            try {
                await addInternalNote({
                    content: trimmedMessage,
                    mentions: resolveMentions(trimmedMessage, pickedMentions),
                })
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Erreur inconnue'
                toast.error(`Erreur lors de l'ajout de la note: ${msg}`)
                return
            }
            setMessage('')
            setPickedMentions([])
            setShowMentions(false)
            if (textareaRef.current) textareaRef.current.style.height = 'auto'
            return
        }

        // Build replyTo info for optimistic display
        const replyToInfo = replyTo
            ? { id: replyTo.id, content: replyTo.content, type: replyTo.type }
            : undefined

        try {
            if (attachment) {
                const sendPromise = sendMedia({
                    file: attachment.file, // optional now
                    storageId: attachment.storageId,
                    type: attachment.type,
                    caption: trimmedMessage || undefined,
                    replyToMessageId: replyTo?.id,
                    replyTo: replyToInfo,
                })

                toast.promise(sendPromise, {
                    loading: attachment.type === 'video' ? 'Envoi de la vidéo en cours (veuillez patienter)...' : 'Envoi du fichier en cours...',
                    success: 'Envoyé avec succès !',
                    error: (err) => `Échec de l'envoi: ${err.message}`
                })

                await sendPromise
                removeAttachment()
            } else if (trimmedMessage) {
                await sendMessage({
                    text: trimmedMessage,
                    replyToMessageId: replyTo?.id,
                    replyTo: replyToInfo,
                })
            } else {
                return
            }
        } catch (error) {
            console.error("Error sending message:", error)
            const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
            toast.error(`Erreur lors de l'envoi: ${errorMessage}`)
            return
        }

        setMessage('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
        // Clear reply after sending
        if (onCancelReply) {
            onCancelReply()
        }
    }

    // Handle keyboard
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setMessage(newValue)
        adjustHeight()

        const cursorPosition = e.target.selectionStart
        const textBeforeCursor = newValue.slice(0, cursorPosition)

        // Note mode : detect @mention; do NOT emit typing (it's internal).
        if (mode === 'note') {
            const mention = detectMentionQuery(textBeforeCursor)
            if (mention) {
                setMentionQuery(mention.query)
                setMentionStart(mention.start)
                setShowMentions(true)
                setActiveMentionId(undefined)
            } else {
                setShowMentions(false)
                setMentionQuery('')
            }
            // No `/` shortcuts in note mode.
            setShowShortcuts(false)
            return
        }

        sendTyping()

        // Shortcut detection (reply mode only)
        const match = textBeforeCursor.match(/(?:^|\s)(\/[\w-]*)$/)
        if (match) {
            const query = match[1] // e.g. "/hel"
            setShortcutQuery(query)
            setShowShortcuts(true)
        } else {
            setShowShortcuts(false)
            setShortcutQuery('')
        }
    }

    const isNote = mode === 'note'
    // Blocked contact disables replies but never notes.
    const effectiveDisabled = disabled && !isNote
    const canSend =
        (message.trim() || (mode === 'reply' && attachment)) && !isSending && !effectiveDisabled

    // Recording UI
    if (isRecording) {
        return (
            <div className="border-t border-[var(--ink-200)] bg-[var(--paper-white)] p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4"
                >
                    {/* Cancel Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelRecording}
                        className="shrink-0 text-[var(--status-danger)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-soft)]"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>

                    {/* Recording Indicator */}
                    <div className="flex-1 flex items-center gap-3">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="h-3 w-3 rounded-full bg-[var(--status-danger)]"
                        />
                        <span className="text-sm font-medium text-[var(--ink-700)]">
                            Enregistrement... {formatDuration(recordingDuration)}
                        </span>
                        {/* Waveform animation */}
                        <div className="flex items-center gap-[2px]">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-[3px] bg-[var(--accent)] rounded-full"
                                    animate={{
                                        height: [4, RECORDING_WAVEFORM_HEIGHTS[i], 4],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 0.5,
                                        delay: i * 0.05,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Send Button */}
                    <Button
                        onClick={stopRecordingAndSend}
                        size="icon"
                        className="shrink-0 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] h-10 w-10"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </motion.div>
            </div>
        )
    }

    // Get reply preview text
    const getReplyPreviewText = (msg: Message): string => {
        if (msg.content) return msg.content
        switch (msg.type) {
            case 'IMAGE': return '📷 Photo'
            case 'VIDEO': return '🎥 Vidéo'
            case 'AUDIO': return '🎵 Audio'
            case 'DOCUMENT': return '📄 Document'
            case 'LOCATION': return '📍 Position'
            case 'STICKER': return '🎨 Sticker'
            default: return 'Message'
        }
    }

    return (
        <div
            className={cn(
                'border-t border-[var(--ink-200)] p-4 relative transition-colors',
                isNote ? 'bg-[var(--status-warn-soft)]/40' : 'bg-[var(--paper-white)]',
            )}
        >
            {/* Mode toggle : Réponse (WhatsApp) / Note interne (équipe) */}
            <div className="mb-3 flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => { setMode('reply'); setShowMentions(false) }}
                    className={cn(
                        'rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors',
                        mode === 'reply'
                            ? 'bg-[var(--ink-900)] text-white'
                            : 'text-[var(--ink-soft)] hover:text-[var(--ink-900)]',
                    )}
                >
                    Réponse
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('note'); setShowShortcuts(false); setShowEmojiPicker(false) }}
                    className={cn(
                        'rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors',
                        mode === 'note'
                            ? 'bg-[var(--status-warn)] text-white'
                            : 'text-[var(--ink-soft)] hover:text-[var(--ink-900)]',
                    )}
                >
                    Note interne
                </button>
                {isNote ? (
                    <span className="ml-1 text-[11px] text-[var(--ink-soft)]">
                        Visible par l&apos;équipe uniquement · @ pour mentionner
                    </span>
                ) : null}
            </div>

            {/* @mention popup (note mode) */}
            <AnimatePresence>
                {isNote && showMentions && filteredMembers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-4 mb-2 z-50"
                    >
                        <MentionPicker
                            members={filteredMembers}
                            query={mentionQuery}
                            activeId={activeMentionId ?? filteredMembers[0]?.id}
                            onSelect={(m) => handleMentionSelect(m)}
                            onHover={(id) => setActiveMentionId(id)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shortcuts Popup */}
            <AnimatePresence>
                {!isNote && showShortcuts && shortcuts && shortcuts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-4 mb-2 z-50 w-72 bg-[var(--paper-white)] rounded-lg shadow-xl border border-[var(--ink-200)] overflow-hidden"
                    >
                        <div className="bg-[var(--paper-warm)] px-3 py-2 border-b border-[var(--ink-200)] flex items-center gap-2">
                            <Zap className="w-4 h-4 text-[var(--accent)]" />
                            <span className="text-xs font-medium text-[var(--ink-soft)]">Raccourcis rapides</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                            {(() => {
                                if (!shortcuts) return null;

                                const groups = {
                                    TEXT: { label: '📝 Messages', items: [] as typeof shortcuts },
                                    IMAGE: { label: '📷 Images', items: [] as typeof shortcuts },
                                    VIDEO: { label: '🎥 Vidéos', items: [] as typeof shortcuts },
                                    DOCUMENT: { label: '📄 Documents', items: [] as typeof shortcuts },
                                }; // Type assertion to handle generic type

                                shortcuts.forEach(s => {
                                    const type = (s.type || 'TEXT') as keyof typeof groups;
                                    if (groups[type]) {
                                        groups[type].items.push(s);
                                    } else {
                                        // Fallback for unknown types if any
                                        if (!groups['TEXT']) groups['TEXT'] = { label: '📝 Messages', items: [] };
                                        groups['TEXT'].items.push(s);
                                    }
                                });

                                return Object.entries(groups).map(([type, group]) => {
                                    if (group.items.length === 0) return null;

                                    return (
                                        <div key={type} className="mb-2 last:mb-0">
                                            <div className="px-3 py-1.5 font-mono text-[10px] font-medium text-[var(--ink-soft)] uppercase tracking-wider sticky top-0 bg-[var(--paper-white)]/95 backdrop-blur-sm z-10">
                                                {group.label}
                                            </div>
                                            {group.items.map((s) => (
                                                <button
                                                    key={s._id}
                                                    onClick={() => handleShortcutSelect(s)}
                                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--paper-warm)] text-sm flex flex-col gap-0.5 transition-colors group"
                                                >
                                                    <span className="font-mono font-medium text-[var(--ink-900)] group-hover:text-[var(--accent)]">
                                                        {s.shortcut}
                                                    </span>
                                                    <span className="text-[var(--ink-soft)] line-clamp-2 text-xs">
                                                        {s.text || <span className="italic opacity-50">Sans texte</span>}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reply Preview */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3"
                    >
                        <div className="flex items-center gap-2 rounded-xl bg-[var(--paper-warm)] p-3 border-l-4 border-[var(--accent)]">
                            <Reply className="h-4 w-4 text-[var(--accent)] shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--accent)]">
                                    {replyTo.direction === 'INBOUND' ? 'Client' : 'Vous'}
                                </p>
                                <p className="text-sm text-[var(--ink-600)] truncate">
                                    {getReplyPreviewText(replyTo)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onCancelReply}
                                className="h-6 w-6 shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attachment Preview */}
            <AnimatePresence>
                {attachment && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3"
                    >
                        <div className="flex items-center gap-3 rounded-xl bg-[var(--paper-warm)] p-3">
                            {attachment.preview ? (
                                attachment.type === 'video' ? (
                                    <video
                                        src={attachment.preview}
                                        className="h-16 w-16 rounded-lg object-cover"
                                        muted
                                    />
                                ) : (
                                    <Image
                                        src={attachment.preview}
                                        alt="Preview"
                                        width={64}
                                        height={64}
                                        unoptimized
                                        className="h-16 w-16 rounded-lg object-cover"
                                    />
                                )
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--ink-100)]">
                                    <FileText className="h-8 w-8 text-[var(--ink-400)]" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--ink-900)] truncate">
                                    {attachment.file ? attachment.file.name : "Média"}
                                </p>
                                <p className="text-xs text-[var(--ink-soft)]">
                                    {attachment.file ? (attachment.file.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={removeAttachment}
                                className="h-8 w-8 shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="flex items-end gap-2">
                {/* Emoji Button */}
                <div className="relative" ref={emojiPickerRef}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={cn(
                                    'shrink-0 text-[var(--ink-soft)] hover:text-[var(--ink-700)]',
                                    showEmojiPicker && 'text-[var(--accent)] bg-[var(--accent-muted)]'
                                )}
                            >
                                <Smile className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Emojis</TooltipContent>
                    </Tooltip>

                    {/* Emoji Picker Popup */}
                    <AnimatePresence>
                        {showEmojiPicker && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-12 left-0 z-50 shadow-xl rounded-lg"
                            >
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    theme={Theme.LIGHT}
                                    width={320}
                                    height={400}
                                    searchPlaceHolder="Rechercher un emoji..."
                                    previewConfig={{ showPreview: false }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Attachment Button — hidden in note mode (notes are text-only) */}
                {!isNote && (
                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled || isSending}
                                    className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--ink-700)]"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Joindre un fichier</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem
                            onClick={() => {
                                // WhatsApp supported image types: JPEG, PNG, WebP
                                fileInputRef.current?.setAttribute('accept', 'image/jpeg,image/png,image/webp,image/*')
                                fileInputRef.current?.click()
                            }}
                        >
                            <ImageIcon className="mr-2 h-4 w-4 text-blue-500" />
                            Photo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                fileInputRef.current?.setAttribute('accept', 'video/*')
                                fileInputRef.current?.click()
                            }}
                        >
                            <Camera className="mr-2 h-4 w-4 text-purple-500" />
                            Video
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                // Allow all types for document fallback
                                fileInputRef.current?.setAttribute('accept', '*/*')
                                fileInputRef.current?.click()
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4 text-red-500" />
                            Document
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                )}

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Textarea */}
                <div className="flex-1 relative">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isNote ? 'Note interne… tapez @ pour mentionner un coéquipier' : placeholder}
                        disabled={effectiveDisabled || isSending}
                        className={cn(
                            'min-h-[44px] max-h-[150px] resize-none rounded-2xl pr-12 placeholder:text-[var(--ink-400)]',
                            isNote
                                ? 'border-[var(--status-warn)]/40 bg-[var(--status-warn-soft)]/40 focus:bg-[var(--status-warn-soft)]/60 focus-visible:ring-[var(--status-warn)]/30 focus-visible:border-[var(--status-warn)]'
                                : 'border-[var(--ink-200)] bg-[var(--paper-warm)] focus:bg-[var(--paper-white)] focus-visible:ring-[var(--accent-ring)] focus-visible:border-[var(--accent)]',
                        )}
                        rows={1}
                    />
                </div>

                {/* Send/Voice Button. Note mode : always Send (no voice in notes). */}
                <motion.div
                    initial={false}
                    animate={{ scale: canSend || isNote ? 1 : 0.9 }}
                >
                    {canSend || isNote ? (
                        <Button
                            onClick={handleSend}
                            disabled={!canSend}
                            size="icon"
                            className={cn(
                                'shrink-0 rounded-full h-10 w-10 text-white',
                                isNote
                                    ? 'bg-[var(--status-warn)] hover:brightness-95'
                                    : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]',
                            )}
                        >
                            {isSending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </Button>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled || isSending}
                                    onClick={startRecording}
                                    className="shrink-0 text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--accent-muted)] h-10 w-10"
                                >
                                    <Mic className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Enregistrer un message vocal</TooltipContent>
                        </Tooltip>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
