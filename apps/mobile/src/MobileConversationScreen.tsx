import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Avatar, Btn, Icon, NavButton, tint, useTheme, type IconName } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { ForwardSheet } from "./conversation/ForwardSheet";
import { GlassReply, type GlassReaction } from "./conversation/GlassReply";
import { MediaPicker } from "./conversation/MediaPicker";
import { MessageBubble, type ConversationMessage } from "./conversation/MessageBubble";
import { ShortcutPopover } from "./conversation/ShortcutPopover";
import { TemplatePicker } from "./conversation/TemplatePicker";
import { VoiceNoteRecorder } from "./conversation/VoiceNoteRecorder";
import { uploadFileToConvex } from "./conversation/upload";

type Props = {
    conversationId: string | null;
};

type StagedMedia = {
    key: string;
    uri: string;
    type: "IMAGE" | "VIDEO" | "DOCUMENT";
    mediaType: string;
    fileName: string;
    fileSize?: number;
};

const MAX_STAGED = 5;

export function MobileConversationScreen({ conversationId }: Props) {
    const router = useRouter();
    const { colors, font } = useTheme();
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [templateGateOpen, setTemplateGateOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ConversationMessage | null>(null);
    const [reactingTo, setReactingTo] = useState<ConversationMessage | null>(null);
    const [forwarding, setForwarding] = useState<ConversationMessage | null>(null);
    const [voiceActive, setVoiceActive] = useState(false);
    const [staged, setStaged] = useState<StagedMedia[]>([]);
    const stagedKey = useRef(0);
    const typedConversationId = conversationId as Id<"conversations"> | null;
    const conversation = useQuery(
        api.conversations.getById,
        typedConversationId ? { id: typedConversationId } : "skip",
    );
    const markAsRead = useMutation(api.conversations.markAsRead);
    const sendMessage = useMutation(api.messages.send);
    const sendTemplate = useMutation(api.templates.mutations.sendToConversation);
    const retryMessage = useMutation(api.messages.retry);
    const removeMessage = useMutation(api.messages.remove);
    const reactToMessage = useMutation(api.messages.react);
    const toggleStar = useMutation(api.messages.toggleStar);
    const assignToMe = useMutation(api.conversations.assignToMe);
    const resolveConversation = useMutation(api.conversations.resolve);
    const reopenConversation = useMutation(api.conversations.reopen);
    const archiveConversation = useMutation(api.conversations.archive);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const { results, status, loadMore } = usePaginatedQuery(
        api.messages.list,
        typedConversationId ? { conversationId: typedConversationId } : "skip",
        { initialNumItems: 30 },
    );

    const messages = useMemo(() => ((results ?? []) as ConversationMessage[]).slice().reverse(), [results]);
    const messagesById = useMemo(() => {
        const map = new Map<string, ConversationMessage>();
        for (const message of messages) map.set(message.id, message);
        return map;
    }, [messages]);

    // WhatsApp 24h service window: once the customer's last message is older than
    // 24h, free-form replies are blocked — only approved templates can re-open it.
    const windowExpiresAt = conversation?.windowExpiresAt;
    const windowExpired = typeof windowExpiresAt === "number" && Date.now() > windowExpiresAt;
    const failedCount = messages.reduce((count, message) => count + (message.status === "FAILED" ? 1 : 0), 0);

    // Keep the thread pinned to the newest message: jump to the bottom on first
    // load, then auto-follow each new message (or the 24h notice) at the end.
    const scrollRef = useRef<ScrollView>(null);
    const didInitialScroll = useRef(false);
    const newestId = messages.length > 0 ? messages[messages.length - 1].id : null;
    useEffect(() => {
        if (newestId && didInitialScroll.current) scrollRef.current?.scrollToEnd({ animated: true });
    }, [newestId, windowExpired]);

    const contactName = conversation?.contact?.name || conversation?.contact?.phoneNumber || "Contact inconnu";
    const contactPhone = conversation?.contact?.phoneNumber;
    const canSend = draft.trim().length > 0 && !isSending && Boolean(typedConversationId);
    const showShortcutPopover = draft.startsWith("/") && !draft.includes(" ");

    useEffect(() => {
        if (!typedConversationId || !conversation || conversation.unreadCount <= 0) return;
        void markAsRead({ id: typedConversationId });
    }, [conversation, markAsRead, typedConversationId]);

    const submitText = async () => {
        if (!typedConversationId || !canSend) return;
        const content = draft.trim();
        const replyToId = replyingTo?.id;
        setDraft("");
        setReplyingTo(null);
        setError(null);
        setIsSending(true);
        try {
            await sendMessage({ conversationId: typedConversationId, content, type: "TEXT", replyToId, isForwarded: false });
        } catch {
            setDraft(content);
            if (replyToId) setReplyingTo(replyingTo);
            setError("Message non envoyé. Vérifie le canal WhatsApp ou réessaie.");
        } finally {
            setIsSending(false);
        }
    };

    const sendVoiceNote = async ({ uri, durationMillis }: { uri: string; durationMillis: number }) => {
        if (!typedConversationId) return;
        try {
            const uploadUrl = await generateUploadUrl({});
            const storageId = await uploadFileToConvex(uploadUrl, uri, "audio/m4a");
            await sendMessage({
                conversationId: typedConversationId,
                type: "AUDIO",
                mediaStorageId: storageId as Id<"_storage">,
                mediaType: "audio/m4a",
                fileName: `voice-${Date.now()}.m4a`,
                content: `Note vocale (${formatSeconds(durationMillis)})`,
                isForwarded: false,
            });
        } catch (uploadError) {
            Alert.alert("Note vocale", uploadError instanceof Error ? uploadError.message : "Erreur d'envoi");
        }
    };

    const submitReaction = async (emoji: GlassReaction) => {
        const target = reactingTo;
        setReactingTo(null);
        if (!target) return;
        try {
            await reactToMessage({ messageId: target.id, emoji });
        } catch (reactionError) {
            Alert.alert("Réaction", reactionError instanceof Error ? reactionError.message : "Réaction impossible");
        }
    };

    // ── Glass Reply (long-press) actions ──────────────────────────────────
    const openGlassReply = (message: ConversationMessage) => {
        void Haptics.selectionAsync().catch(() => undefined);
        setReactingTo(message);
    };

    const glassReply = () => {
        const target = reactingTo;
        setReactingTo(null);
        if (target) setReplyingTo(target);
    };

    const glassCopy = async () => {
        const target = reactingTo;
        setReactingTo(null);
        const text = (target?.content ?? "").trim();
        if (text) await Clipboard.setStringAsync(text);
    };

    const glassToggleStar = async () => {
        const target = reactingTo;
        setReactingTo(null);
        if (!target) return;
        try {
            await toggleStar({ messageId: target.id });
        } catch (starError) {
            Alert.alert("Marquer", starError instanceof Error ? starError.message : "Action impossible");
        }
    };

    const glassDelete = () => {
        const target = reactingTo;
        setReactingTo(null);
        if (target) confirmDelete(target.id);
    };

    const glassForward = () => {
        const target = reactingTo;
        setReactingTo(null);
        if (target) setForwarding(target);
    };

    const submitForward = async (targetConversationId: Id<"conversations">) => {
        const source = forwarding;
        setForwarding(null);
        if (!source) return;
        try {
            await sendMessage({
                conversationId: targetConversationId,
                content: source.content ?? undefined,
                type: source.type,
                mediaUrl: source.mediaUrl ?? undefined,
                mediaType: source.mediaType ?? undefined,
                fileName: source.fileName ?? undefined,
                fileSize: source.fileSize ?? undefined,
                isForwarded: true,
            });
            Alert.alert("Transféré", "Le message a été transféré.");
        } catch (forwardError) {
            Alert.alert("Transférer", forwardError instanceof Error ? forwardError.message : "Transfert impossible");
        }
    };

    const sendTemplateMessage = async (templateId: Id<"templates">) => {
        if (!typedConversationId) return;
        setError(null);
        setIsSending(true);
        try {
            await sendTemplate({ conversationId: typedConversationId, templateId });
        } catch (templateError) {
            Alert.alert("Modèle WhatsApp", templateError instanceof Error ? templateError.message : "Envoi du modèle impossible");
        } finally {
            setIsSending(false);
        }
    };

    const stageMedia = (payload: { uri: string; type: "IMAGE" | "VIDEO" | "DOCUMENT"; mediaType: string; fileName: string; fileSize?: number }) => {
        setStaged((current) => {
            if (current.length >= MAX_STAGED) {
                Alert.alert("Pièces jointes", `Maximum ${MAX_STAGED} fichiers par message.`);
                return current;
            }
            stagedKey.current += 1;
            return [...current, { ...payload, key: `staged-${stagedKey.current}` }];
        });
    };

    const uploadAndSend = async (item: StagedMedia, caption: string | undefined) => {
        const uploadUrl = await generateUploadUrl({});
        const storageId = await uploadFileToConvex(uploadUrl, item.uri, item.mediaType);
        await sendMessage({
            conversationId: typedConversationId!,
            content: caption,
            type: item.type,
            mediaStorageId: storageId as Id<"_storage">,
            mediaType: item.mediaType,
            fileName: item.fileName,
            fileSize: item.fileSize,
            isForwarded: false,
        });
    };

    const submitStaged = async () => {
        if (!typedConversationId || staged.length === 0 || isSending) return;
        const items = staged;
        const caption = draft.trim();
        setError(null);
        setIsSending(true);
        try {
            // Caption rides with the first attachment, like WhatsApp.
            for (let i = 0; i < items.length; i++) {
                await uploadAndSend(items[i], i === 0 && caption ? caption : undefined);
            }
            setStaged([]);
            setDraft("");
        } catch (uploadError) {
            Alert.alert("Pièce jointe", uploadError instanceof Error ? uploadError.message : "Erreur d'envoi");
        } finally {
            setIsSending(false);
        }
    };

    const handleRetry = async (messageId: Id<"messages">) => {
        try {
            await retryMessage({ messageId });
        } catch (retryError) {
            Alert.alert("Réessayer", retryError instanceof Error ? retryError.message : "Réessai impossible");
        }
    };

    const handleRetryAll = () => {
        for (const message of messages) {
            if (message.status === "FAILED") void handleRetry(message.id);
        }
    };

    // Edit a failed message: pull its text back into the composer and drop the
    // failed copy so the corrected message sends fresh.
    const handleEditFailed = (message: ConversationMessage) => {
        setDraft((message.content ?? "").trim());
        if (message.replyToId) setReplyingTo(messagesById.get(message.replyToId) ?? null);
        void removeMessage({ messageId: message.id }).catch(() => undefined);
    };

    const confirmDelete = (messageId: Id<"messages">) => {
        Alert.alert("Supprimer le message", "Ce message sera retiré du fil.", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Supprimer",
                style: "destructive",
                onPress: () => {
                    void removeMessage({ messageId }).catch((removeError) =>
                        Alert.alert("Supprimer", removeError instanceof Error ? removeError.message : "Suppression impossible"),
                    );
                },
            },
        ]);
    };

    const runConversationAction = async (action: () => Promise<unknown>, label: string, thenLeave = false) => {
        if (!typedConversationId) return;
        setMenuOpen(false);
        setIsMutating(true);
        try {
            await action();
            if (thenLeave) router.replace("/inbox");
        } catch (actionError) {
            Alert.alert(label, actionError instanceof Error ? actionError.message : `${label} impossible`);
        } finally {
            setIsMutating(false);
        }
    };

    const callContact = () => {
        if (!contactPhone) {
            Alert.alert("Appel", "Aucun numéro disponible pour ce contact.");
            return;
        }
        void Linking.openURL(`tel:${contactPhone.replace(/[^\d+]/g, "")}`);
    };

    if (!conversationId) {
        return <ConversationState title="Conversation introuvable" body="Retourne à l'inbox et sélectionne une conversation." onBack={() => router.replace("/inbox")} />;
    }
    if (conversation === undefined || status === "LoadingFirstPage") {
        return <View style={[styles.center, { backgroundColor: colors.paper }]}><ActivityIndicator color={colors.accent} /></View>;
    }
    if (conversation === null) {
        return <ConversationState title="Accès impossible" body="Cette conversation n'existe pas ou n'est pas visible pour ton rôle." onBack={() => router.replace("/inbox")} />;
    }

    const isResolved = conversation.status === "RESOLVED" || conversation.status === "ARCHIVED";
    const canAssignToMe = !conversation.assignedTo && conversation.status !== "ARCHIVED";

    const renderedThread: React.ReactNode[] = [];
    let lastDay = "";
    for (const message of messages) {
        const day = dayKey(message.timestamp);
        if (day !== lastDay) {
            lastDay = day;
            renderedThread.push(<DaySep key={`sep-${day}`} label={dayLabel(message.timestamp)} />);
        }
        renderedThread.push(
            <MessageBubble
                key={message.id}
                message={message}
                replyTo={message.replyToId ? messagesById.get(message.replyToId) ?? null : null}
                onRetry={handleRetry}
                onEdit={handleEditFailed}
                onDelete={confirmDelete}
                onReplyRequest={setReplyingTo}
                onReactionRequest={openGlassReply}
            />,
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.rule2 }]}>
                <NavButton icon="chevron-left" onPress={() => router.replace("/inbox")} />
                <Pressable
                    style={styles.headerText}
                    onPress={() => {
                        const contactId = conversation.contact?._id;
                        if (contactId) router.push(`/contacts/${contactId}`);
                    }}
                >
                    <Avatar name={contactName} size={36} status="online" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: font.sansSemibold, color: colors.ink, letterSpacing: -0.15 }}>
                            {contactName}
                        </Text>
                        <Text numberOfLines={1} style={{ fontSize: 11.5, color: isResolved ? colors.mute : colors.good, marginTop: 1, fontFamily: font.sans }}>
                            {isResolved ? statusLabel(conversation.status) : `en ligne · ${conversation.channel}`}
                        </Text>
                    </View>
                </Pressable>
                <NavButton icon="phone" onPress={callContact} />
                <NavButton icon="more-v" onPress={() => setMenuOpen(true)} />
            </View>

            {/* Body */}
            <View style={[styles.body, { backgroundColor: colors.paper2 }]}>
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.thread}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
                    onContentSizeChange={() => {
                        if (!didInitialScroll.current && messages.length > 0) {
                            scrollRef.current?.scrollToEnd({ animated: false });
                            didInitialScroll.current = true;
                        }
                    }}
                >
                    {status === "CanLoadMore" ? (
                        <Pressable onPress={() => loadMore(30)} style={({ pressed }) => [styles.loadMore, { backgroundColor: colors.card, borderColor: colors.rule }, pressed && styles.pressed]}>
                            <Text style={{ fontSize: 12, fontFamily: font.sansMedium, color: colors.mute }}>Charger les messages précédents</Text>
                        </Pressable>
                    ) : null}
                    {messages.length === 0 ? (
                        <View style={styles.threadEmpty}>
                            <Text style={{ fontSize: 17, fontFamily: font.display, color: colors.ink }}>Aucun message</Text>
                            <Text style={{ marginTop: 6, maxWidth: 260, textAlign: "center", fontSize: 14, lineHeight: 20, color: colors.mute, fontFamily: font.sans }}>
                                Le fil se remplira dès le premier message entrant.
                            </Text>
                        </View>
                    ) : (
                        renderedThread
                    )}
                    {windowExpired ? (
                        <View style={[styles.windowNotice, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                            <View style={styles.windowNoticeHead}>
                                <Icon name="clock" size={14} color={colors.warn} strokeWidth={2} />
                                <Text style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: 0.8, color: colors.warn }}>
                                    FENÊTRE 24H EXPIRÉE
                                </Text>
                            </View>
                            <Text style={{ fontSize: 13, lineHeight: 19, textAlign: "center", color: colors.ink3, fontFamily: font.sans }}>
                                Pour relancer la conversation, envoyez un modèle WhatsApp approuvé.
                            </Text>
                        </View>
                    ) : null}
                </ScrollView>
            </View>

            {error ? <Text style={[styles.errorText, { color: colors.hot, fontFamily: font.sans }]}>{error}</Text> : null}

            {failedCount > 0 ? (
                <View style={[styles.failedBanner, { backgroundColor: tint(colors.hot, 0.08), borderColor: tint(colors.hot, 0.25) }]}>
                    <Icon name="offline" size={16} color={colors.hot} strokeWidth={1.8} />
                    <Text style={{ flex: 1, fontSize: 12.5, lineHeight: 17, color: colors.ink2, fontFamily: font.sans }}>
                        {failedCount > 1 ? `${failedCount} messages en attente.` : "1 message en attente."} Connexion limitée.
                    </Text>
                    <Pressable onPress={handleRetryAll} hitSlop={8}>
                        <Text style={{ fontSize: 12, fontFamily: font.sansSemibold, color: colors.accentInk }}>Tout réessayer</Text>
                    </Pressable>
                </View>
            ) : null}

            {windowExpired ? (
                /* 24h service window expired — free-form locked, only templates re-open it. */
                <View style={[styles.gate, { borderTopColor: colors.rule2, backgroundColor: colors.paper }]}>
                    <Btn tone="accent" size="lg" full icon="sticky-note" onPress={() => setTemplateGateOpen(true)}>
                        Envoyer un modèle
                    </Btn>
                    <Text style={[styles.gateHint, { color: colors.mute, fontFamily: font.sans }]}>
                        La saisie libre se débloquera à la réponse du contact.
                    </Text>
                    <TemplatePicker
                        hideTrigger
                        open={templateGateOpen}
                        onOpenChange={setTemplateGateOpen}
                        disabled={!typedConversationId}
                        onSelect={(templateId) => void sendTemplateMessage(templateId)}
                    />
                </View>
            ) : (
                <>
                    {/* Reply morph */}
                    {replyingTo ? (
                        <View style={[styles.replyBar, { backgroundColor: colors.paper2, borderLeftColor: colors.accent }]}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: 11.5, fontFamily: font.sansSemibold, color: colors.accentInk }}>
                                    {replyingTo.direction === "OUTBOUND" ? "Vous" : contactName}
                                </Text>
                                <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.ink3, marginTop: 2, fontFamily: font.sans }}>
                                    {(replyingTo.content ?? "").trim() || `[${replyingTo.type}]`}
                                </Text>
                            </View>
                            <Pressable onPress={() => setReplyingTo(null)} hitSlop={10}>
                                <Icon name="close" size={16} color={colors.mute} />
                            </Pressable>
                        </View>
                    ) : null}

                    {showShortcutPopover ? (
                        <ShortcutPopover
                            query={draft}
                            onSelect={(suggestion) => setDraft(`${suggestion.text ?? suggestion.shortcut} `)}
                        />
                    ) : null}

                    {staged.length > 0 ? (
                        <View style={styles.stagedRow}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stagedScroll}>
                                {staged.map((item) => (
                                    <View key={item.key} style={[styles.stagedChip, { backgroundColor: colors.paper2, borderColor: colors.rule }]}>
                                        {item.type === "IMAGE" ? (
                                            <Image source={{ uri: item.uri }} style={styles.stagedThumb} resizeMode="cover" />
                                        ) : (
                                            <View style={styles.stagedTile}>
                                                <Icon name={item.type === "VIDEO" ? "video" : "doc"} size={20} color={colors.ink3} strokeWidth={1.6} />
                                                <Text numberOfLines={2} style={{ fontSize: 9, lineHeight: 11, marginTop: 4, textAlign: "center", color: colors.mute, fontFamily: font.mono }}>
                                                    {item.fileName}
                                                </Text>
                                            </View>
                                        )}
                                        <Pressable
                                            accessibilityLabel="Retirer la pièce jointe"
                                            onPress={() => setStaged((current) => current.filter((s) => s.key !== item.key))}
                                            hitSlop={6}
                                            style={[styles.stagedClose, { backgroundColor: colors.ink }]}
                                        >
                                            <Icon name="close" size={10} color={colors.paper} strokeWidth={2.4} />
                                        </Pressable>
                                    </View>
                                ))}
                            </ScrollView>
                            <Text style={{ fontFamily: font.mono, fontSize: 10.5, color: colors.mute, paddingHorizontal: 12, paddingTop: 4 }}>
                                {staged.length}/{MAX_STAGED}
                            </Text>
                        </View>
                    ) : null}

                    {/* Composer */}
                    <View style={[styles.composer, { borderTopColor: colors.rule2, backgroundColor: colors.paper }]}>
                        {!voiceActive ? (
                            <>
                                <MediaPicker disabled={!typedConversationId || isSending || staged.length >= MAX_STAGED} onPicked={stageMedia} />
                                <TemplatePicker disabled={!typedConversationId || isSending} onSelect={(templateId) => void sendTemplateMessage(templateId)} />
                                <TextInput
                                    value={draft}
                                    onChangeText={setDraft}
                                    placeholder="Répondre par WhatsApp"
                                    placeholderTextColor={colors.mute}
                                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.rule, color: colors.ink, fontFamily: font.sans }]}
                                    multiline
                                    maxLength={2000}
                                />
                            </>
                        ) : null}
                        {!voiceActive && (staged.length > 0 || draft.trim().length > 0) ? (
                            <Pressable
                                accessibilityRole="button"
                                disabled={isSending || !typedConversationId}
                                onPress={() => (staged.length > 0 ? void submitStaged() : submitText())}
                                style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.ink, opacity: isSending || !typedConversationId ? 0.45 : pressed ? 0.8 : 1 }]}
                            >
                                {isSending ? <ActivityIndicator color={colors.paper} /> : <Icon name="send" size={18} color={colors.paper} strokeWidth={2} />}
                            </Pressable>
                        ) : null}
                        {voiceActive || (staged.length === 0 && draft.trim().length === 0) ? (
                            <VoiceNoteRecorder disabled={!typedConversationId} onSend={sendVoiceNote} onActiveChange={setVoiceActive} />
                        ) : null}
                    </View>
                </>
            )}

            <GlassReply
                message={reactingTo}
                onReact={(emoji) => void submitReaction(emoji)}
                onReply={glassReply}
                onForward={glassForward}
                onCopy={() => void glassCopy()}
                onToggleStar={() => void glassToggleStar()}
                onDelete={glassDelete}
                onClose={() => setReactingTo(null)}
            />

            <ForwardSheet
                visible={forwarding !== null}
                organizationId={conversation.organizationId}
                excludeConversationId={typedConversationId}
                onPick={(id) => void submitForward(id)}
                onClose={() => setForwarding(null)}
            />

            {/* Actions menu */}
            <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
                <Pressable style={styles.menuScrim} onPress={() => setMenuOpen(false)}>
                    <View style={[styles.menuSheet, { backgroundColor: colors.paper }]}>
                        <View style={[styles.menuHandle, { backgroundColor: colors.rule }]} />
                        {canAssignToMe ? (
                            <MenuRow icon="user" label="M'attribuer" disabled={isMutating} onPress={() => runConversationAction(() => assignToMe({ id: typedConversationId! }), "M'attribuer")} />
                        ) : null}
                        {isResolved ? (
                            <MenuRow icon="rotate" label="Rouvrir" disabled={isMutating} onPress={() => runConversationAction(() => reopenConversation({ id: typedConversationId! }), "Rouvrir")} />
                        ) : (
                            <MenuRow icon="circle-check" label="Résoudre" disabled={isMutating} onPress={() => runConversationAction(() => resolveConversation({ id: typedConversationId! }), "Résoudre")} />
                        )}
                        <MenuRow icon="user" label="Voir le contact" onPress={() => { setMenuOpen(false); const id = conversation.contact?._id; if (id) router.push(`/contacts/${id}`); }} />
                        <MenuRow icon="archive" label="Archiver" danger disabled={isMutating} onPress={() => runConversationAction(() => archiveConversation({ id: typedConversationId! }), "Archiver", true)} />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

function DaySep({ label }: { label: string }) {
    const { colors, font } = useTheme();
    return (
        <View style={styles.daySep}>
            <Text style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: 0.7, textTransform: "uppercase", color: colors.mute, backgroundColor: colors.paper2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden" }}>
                {label}
            </Text>
        </View>
    );
}

function MenuRow({ icon, label, onPress, danger, disabled }: { icon: IconName; label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
    const { colors, font } = useTheme();
    const fg = danger ? colors.hot : colors.ink;
    return (
        <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.menuRow, { borderBottomColor: colors.rule2, opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }]}>
            <Icon name={icon} size={20} color={fg} strokeWidth={1.7} />
            <Text style={{ flex: 1, fontSize: 15.5, fontFamily: font.sansMedium, color: fg }}>{label}</Text>
        </Pressable>
    );
}

function ConversationState({ title, body, onBack }: { title: string; body: string; onBack: () => void }) {
    const { colors, font } = useTheme();
    return (
        <View style={[styles.center, { backgroundColor: colors.paper, paddingHorizontal: 32 }]}>
            <View style={[styles.stateIcon, { backgroundColor: colors.paper2, borderColor: colors.rule }]}>
                <Icon name="inbox" size={26} color={colors.ink3} />
            </View>
            <Text style={{ fontSize: 20, fontFamily: font.display, color: colors.ink, marginTop: 18, letterSpacing: -0.4, textAlign: "center" }}>{title}</Text>
            <Text style={{ marginTop: 8, maxWidth: 300, fontSize: 14, lineHeight: 20, color: colors.mute, textAlign: "center", fontFamily: font.sans }}>{body}</Text>
            <Btn tone="primary" size="md" iconRight="arrow-right" onPress={onBack} style={{ marginTop: 22 }}>Retour à l'inbox</Btn>
        </View>
    );
}

function statusLabel(status: string): string {
    if (status === "RESOLVED") return "Résolue";
    if (status === "ARCHIVED") return "Archivée";
    return status;
}

function dayKey(timestamp: number): string {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diff = Math.round((startToday - day) / 86_400_000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}

function formatSeconds(durationMillis: number): string {
    const totalSeconds = Math.max(1, Math.round(durationMillis / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingLeft: 4,
        paddingRight: 8,
        paddingTop: 4,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerText: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 },
    body: { flex: 1 },
    thread: { padding: 14, gap: 8, flexGrow: 1 },
    daySep: { alignItems: "center", paddingVertical: 8 },
    loadMore: { alignSelf: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, marginBottom: 6 },
    threadEmpty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
    errorText: { paddingHorizontal: 18, paddingTop: 8, fontSize: 13, lineHeight: 18 },
    windowNotice: {
        alignSelf: "center",
        maxWidth: "86%",
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        gap: 6,
    },
    windowNoticeHead: { flexDirection: "row", alignItems: "center", gap: 6 },
    failedBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginHorizontal: 12,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    gate: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    gateHint: { fontSize: 11.5, textAlign: "center", marginTop: 8 },
    stagedRow: { paddingTop: 8 },
    stagedScroll: { gap: 8, paddingHorizontal: 12 },
    stagedChip: { width: 72, height: 72, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
    stagedThumb: { width: "100%", height: "100%" },
    stagedTile: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    stagedClose: { position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
    replyBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginHorizontal: 12,
        marginTop: 8,
        paddingLeft: 12,
        paddingRight: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderLeftWidth: 3,
    },
    composer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 118,
        borderRadius: 22,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 14,
        paddingTop: 11,
        paddingBottom: 11,
        fontSize: 15.5,
        lineHeight: 20,
    },
    sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    stateIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    menuScrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10,10,10,0.4)" },
    menuSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36, paddingTop: 8 },
    menuHandle: { width: 36, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 6 },
    menuRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
    pressed: { opacity: 0.7 },
});
