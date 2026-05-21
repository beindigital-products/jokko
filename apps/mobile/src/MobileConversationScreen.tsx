import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MediaPicker } from "./conversation/MediaPicker";
import { MessageBubble, type ConversationMessage } from "./conversation/MessageBubble";
import { ShortcutPopover } from "./conversation/ShortcutPopover";
import { VoiceNoteRecorder } from "./conversation/VoiceNoteRecorder";
import { uploadFileToConvex } from "./conversation/upload";

type Props = {
    conversationId: string | null;
};

export function MobileConversationScreen({ conversationId }: Props) {
    const router = useRouter();
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const typedConversationId = conversationId as Id<"conversations"> | null;
    const conversation = useQuery(
        api.conversations.getById,
        typedConversationId ? { id: typedConversationId } : "skip",
    );
    const markAsRead = useMutation(api.conversations.markAsRead);
    const sendMessage = useMutation(api.messages.send);
    const retryMessage = useMutation(api.messages.retry);
    const assignToMe = useMutation(api.conversations.assignToMe);
    const resolveConversation = useMutation(api.conversations.resolve);
    const archiveConversation = useMutation(api.conversations.archive);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const {
        results,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.messages.list,
        typedConversationId ? { conversationId: typedConversationId } : "skip",
        { initialNumItems: 30 },
    );

    const messages = useMemo(
        () => ((results ?? []) as ConversationMessage[]).slice().reverse(),
        [results],
    );
    const messagesById = useMemo(() => {
        const map = new Map<string, ConversationMessage>();
        for (const message of messages) map.set(message.id, message);
        return map;
    }, [messages]);

    const contactName =
        conversation?.contact?.name || conversation?.contact?.phoneNumber || "Contact inconnu";
    const canSend = draft.trim().length > 0 && !isSending && Boolean(typedConversationId);
    const showShortcutPopover = draft.startsWith("/") && !draft.includes(" ");

    useEffect(() => {
        if (!typedConversationId || !conversation || conversation.unreadCount <= 0) return;
        void markAsRead({ id: typedConversationId });
    }, [conversation, markAsRead, typedConversationId]);

    const submitText = async () => {
        if (!typedConversationId || !canSend) return;

        const content = draft.trim();
        setDraft("");
        setError(null);
        setIsSending(true);

        try {
            await sendMessage({
                conversationId: typedConversationId,
                content,
                type: "TEXT",
                isForwarded: false,
            });
        } catch {
            setDraft(content);
            setError("Message non envoyé. Vérifie le canal WhatsApp ou réessaie.");
        } finally {
            setIsSending(false);
        }
    };

    const sendVoiceNote = async ({
        uri,
        durationMillis,
    }: {
        uri: string;
        durationMillis: number;
    }) => {
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
            const message =
                uploadError instanceof Error ? uploadError.message : "Erreur d'envoi";
            Alert.alert("Note vocale", message);
        }
    };

    const sendMedia = async (payload: {
        uri: string;
        type: "IMAGE" | "VIDEO" | "DOCUMENT";
        mediaType: string;
        fileName: string;
        fileSize?: number;
    }) => {
        if (!typedConversationId) return;
        setError(null);
        setIsSending(true);
        try {
            const uploadUrl = await generateUploadUrl({});
            const storageId = await uploadFileToConvex(uploadUrl, payload.uri, payload.mediaType);
            await sendMessage({
                conversationId: typedConversationId,
                type: payload.type,
                mediaStorageId: storageId as Id<"_storage">,
                mediaType: payload.mediaType,
                fileName: payload.fileName,
                fileSize: payload.fileSize,
                isForwarded: false,
            });
        } catch (uploadError) {
            const message =
                uploadError instanceof Error ? uploadError.message : "Erreur d'envoi";
            Alert.alert("Pièce jointe", message);
        } finally {
            setIsSending(false);
        }
    };

    const handleRetry = async (messageId: Id<"messages">) => {
        try {
            await retryMessage({ messageId });
        } catch (retryError) {
            const message =
                retryError instanceof Error ? retryError.message : "Réessai impossible";
            Alert.alert("Réessayer", message);
        }
    };

    const handleAssignToMe = async () => {
        if (!typedConversationId) return;
        setIsMutating(true);
        try {
            await assignToMe({ id: typedConversationId });
        } catch (assignError) {
            const message =
                assignError instanceof Error ? assignError.message : "Attribution impossible";
            Alert.alert("M'attribuer", message);
        } finally {
            setIsMutating(false);
        }
    };

    const handleResolve = async () => {
        if (!typedConversationId) return;
        setIsMutating(true);
        try {
            await resolveConversation({ id: typedConversationId });
        } catch (resolveError) {
            const message =
                resolveError instanceof Error ? resolveError.message : "Résolution impossible";
            Alert.alert("Résoudre", message);
        } finally {
            setIsMutating(false);
        }
    };

    const handleArchive = async () => {
        if (!typedConversationId) return;
        setIsMutating(true);
        try {
            await archiveConversation({ id: typedConversationId });
            router.replace("/inbox");
        } catch (archiveError) {
            const message =
                archiveError instanceof Error ? archiveError.message : "Archivage impossible";
            Alert.alert("Archiver", message);
        } finally {
            setIsMutating(false);
        }
    };

    if (!conversationId) {
        return (
            <ConversationState
                title="Conversation introuvable"
                body="Retourne à l'inbox et sélectionne une conversation."
                onBack={() => router.replace("/inbox")}
            />
        );
    }

    if (conversation === undefined || status === "LoadingFirstPage") {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    if (conversation === null) {
        return (
            <ConversationState
                title="Accès impossible"
                body="Cette conversation n'existe pas ou n'est pas visible pour ton rôle."
                onBack={() => router.replace("/inbox")}
            />
        );
    }

    const isResolved = conversation.status === "RESOLVED" || conversation.status === "ARCHIVED";
    const canAssignToMe = !conversation.assignedTo && conversation.status !== "ARCHIVED";

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retour inbox"
                    onPress={() => router.replace("/inbox")}
                    hitSlop={10}
                    style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.ink[900]} />
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Voir le contact"
                    onPress={() => {
                        const contactId = conversation.contact?._id;
                        if (contactId) router.push(`/contacts/${contactId}`);
                    }}
                    style={styles.headerText}
                >
                    <Text style={styles.contactName} numberOfLines={1}>{contactName}</Text>
                    <Text style={styles.headerMeta} numberOfLines={1}>
                        {conversation.channel} · {conversation.status}
                    </Text>
                </Pressable>
                {conversation.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.actionsRow}>
                {canAssignToMe ? (
                    <ActionChip
                        icon="person-add-outline"
                        label="M'attribuer"
                        disabled={isMutating}
                        onPress={handleAssignToMe}
                    />
                ) : null}
                {!isResolved ? (
                    <ActionChip
                        icon="checkmark-circle-outline"
                        label="Résoudre"
                        disabled={isMutating}
                        onPress={handleResolve}
                    />
                ) : null}
                <ActionChip
                    icon="archive-outline"
                    label="Archiver"
                    disabled={isMutating}
                    onPress={handleArchive}
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.messagesContent}
                keyboardShouldPersistTaps="handled"
            >
                {status === "CanLoadMore" ? (
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => loadMore(30)}
                        style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}
                    >
                        <Text style={styles.loadMoreText}>Charger les messages précédents</Text>
                    </Pressable>
                ) : null}

                {messages.length === 0 ? (
                    <View style={styles.threadEmpty}>
                        <Text style={styles.threadEmptyTitle}>Aucun message</Text>
                        <Text style={styles.threadEmptyBody}>
                            Le fil se remplira dès le premier message entrant.
                        </Text>
                    </View>
                ) : (
                    messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            replyTo={
                                message.replyToId
                                    ? messagesById.get(message.replyToId) ?? null
                                    : null
                            }
                            onRetry={handleRetry}
                        />
                    ))
                )}
            </ScrollView>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {showShortcutPopover ? (
                <ShortcutPopover
                    query={draft}
                    onSelect={(suggestion) => {
                        const replacement = suggestion.text ?? suggestion.shortcut;
                        setDraft(`${replacement} `);
                    }}
                />
            ) : null}

            <View style={styles.composer}>
                <MediaPicker
                    disabled={!typedConversationId || isSending}
                    onPicked={(payload) => void sendMedia(payload)}
                />
                <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Répondre par WhatsApp"
                    placeholderTextColor={theme.ink[500]}
                    style={styles.input}
                    multiline
                    maxLength={2000}
                />
                {draft.trim().length > 0 ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Envoyer le message"
                        disabled={!canSend}
                        onPress={submitText}
                        style={({ pressed }) => [
                            styles.sendButton,
                            !canSend && styles.sendButtonDisabled,
                            pressed && canSend && styles.pressed,
                        ]}
                    >
                        {isSending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Ionicons name="send" size={18} color="#fff" />
                        )}
                    </Pressable>
                ) : (
                    <VoiceNoteRecorder disabled={!typedConversationId} onSend={sendVoiceNote} />
                )}
            </View>
        </View>
    );
}

function ActionChip({
    icon,
    label,
    onPress,
    disabled,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.actionChip,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
            ]}
        >
            <Ionicons name={icon} size={14} color={theme.ink[900]} />
            <Text style={styles.actionChipText}>{label}</Text>
        </Pressable>
    );
}

function ConversationState({
    title,
    body,
    onBack,
}: {
    title: string;
    body: string;
    onBack: () => void;
}) {
    return (
        <View style={styles.stateRoot}>
            <View style={styles.stateIcon}>
                <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={28}
                    color={theme.accent.primary}
                />
            </View>
            <Text style={styles.stateTitle}>{title}</Text>
            <Text style={styles.stateBody}>{body}</Text>
            <Pressable
                accessibilityRole="button"
                onPress={onBack}
                style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
            >
                <Text style={styles.primaryActionText}>Retour à l'inbox</Text>
            </Pressable>
        </View>
    );
}

function formatSeconds(durationMillis: number): string {
    const totalSeconds = Math.max(1, Math.round(durationMillis / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.surface.default,
    },
    header: {
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
        backgroundColor: theme.surface.default,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    headerText: {
        flex: 1,
        minWidth: 0,
    },
    contactName: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: "800",
        color: theme.ink[900],
    },
    headerMeta: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: "800",
        color: theme.ink[500],
        textTransform: "uppercase",
    },
    unreadBadge: {
        minWidth: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.xs,
        backgroundColor: theme.accent.primary,
    },
    unreadText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "800",
    },
    actionsRow: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
    },
    actionChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 8,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
    },
    actionChipText: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[900],
    },
    messagesContent: {
        flexGrow: 1,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    loadMore: {
        minHeight: 38,
        alignSelf: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
    },
    loadMoreText: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[500],
    },
    threadEmpty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: theme.spacing.xxl,
    },
    threadEmptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: theme.ink[900],
    },
    threadEmptyBody: {
        marginTop: theme.spacing.sm,
        maxWidth: 280,
        textAlign: "center",
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[500],
    },
    errorText: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        fontSize: 13,
        lineHeight: 18,
        color: theme.semantic.danger,
        fontWeight: "700",
    },
    composer: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: theme.spacing.sm,
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.ink[300],
        backgroundColor: theme.surface.default,
    },
    input: {
        flex: 1,
        minHeight: 46,
        maxHeight: 118,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: 15,
        lineHeight: 20,
        color: theme.ink[900],
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.ink[900],
    },
    sendButtonDisabled: {
        opacity: 0.45,
    },
    stateRoot: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
    },
    stateIcon: {
        width: 68,
        height: 68,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
        marginBottom: theme.spacing.lg,
    },
    stateTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: theme.ink[900],
        textAlign: "center",
    },
    stateBody: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xl,
        maxWidth: 320,
        fontSize: 15,
        lineHeight: 22,
        color: theme.ink[500],
        textAlign: "center",
    },
    primaryAction: {
        minHeight: 50,
        alignSelf: "stretch",
        borderRadius: theme.radius.pill,
        backgroundColor: theme.ink[900],
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.lg,
    },
    primaryActionText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    disabled: { opacity: 0.5 },
    pressed: {
        opacity: 0.65,
    },
});
