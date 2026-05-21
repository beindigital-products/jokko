import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@jokko/tokens";
import type { Id } from "../../../../convex/_generated/dataModel";
import { SwipeToReply } from "./SwipeToReply";

export type ConversationMessage = {
    id: Id<"messages">;
    content?: string | null;
    type: string;
    direction: string;
    status: string;
    timestamp: number;
    mediaUrl?: string | null;
    mediaType?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    replyToId?: Id<"messages"> | null;
};

type Props = {
    message: ConversationMessage;
    replyTo?: ConversationMessage | null;
    onRetry?: (messageId: Id<"messages">) => void;
    onReplyRequest?: (message: ConversationMessage) => void;
};

export function MessageBubble({ message, replyTo, onRetry, onReplyRequest }: Props) {
    const outbound = message.direction === "OUTBOUND";
    const failed = message.status === "FAILED";

    const bubble = (
        <View
            style={[
                styles.bubble,
                outbound ? styles.bubbleOutbound : styles.bubbleInbound,
                failed && styles.bubbleFailed,
            ]}
        >
            {replyTo ? <ReplyQuote message={replyTo} outbound={outbound} /> : null}
            <BubbleContent message={message} outbound={outbound} />
            <View style={styles.meta}>
                <Text style={[styles.time, outbound && styles.timeOutbound]}>
                    {formatMessageTime(message.timestamp)}
                </Text>
                {outbound ? <StatusIcon status={message.status} /> : null}
            </View>
            {failed && onRetry ? (
                <Pressable
                    accessibilityRole="button"
                    onPress={() => onRetry(message.id)}
                    style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                >
                    <Ionicons name="refresh" size={14} color="#fff" />
                    <Text style={styles.retryText}>Réessayer</Text>
                </Pressable>
            ) : null}
        </View>
    );

    return (
        <View style={[styles.row, outbound && styles.rowOutbound]}>
            {onReplyRequest ? (
                <SwipeToReply
                    direction={outbound ? "left" : "right"}
                    onTrigger={() => onReplyRequest(message)}
                >
                    {bubble}
                </SwipeToReply>
            ) : (
                bubble
            )}
        </View>
    );
}

function BubbleContent({
    message,
    outbound,
}: {
    message: ConversationMessage;
    outbound: boolean;
}) {
    const textColor = outbound ? styles.bubbleTextOutbound : null;

    if (message.type === "IMAGE" && message.mediaUrl) {
        return (
            <View style={styles.mediaWrap}>
                <Image
                    source={{ uri: message.mediaUrl }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                />
                {message.content ? (
                    <Text style={[styles.bubbleText, textColor, styles.captionText]}>
                        {message.content}
                    </Text>
                ) : null}
            </View>
        );
    }

    if (message.type === "VIDEO") {
        return (
            <View style={[styles.mediaTile, outbound && styles.mediaTileOutbound]}>
                <Ionicons
                    name="videocam"
                    size={20}
                    color={outbound ? "#fff" : theme.accent.primary}
                />
                <Text style={[styles.mediaTileText, textColor]}>Vidéo</Text>
            </View>
        );
    }

    if (message.type === "AUDIO") {
        return (
            <View style={[styles.mediaTile, outbound && styles.mediaTileOutbound]}>
                <Ionicons
                    name="mic"
                    size={20}
                    color={outbound ? "#fff" : theme.accent.primary}
                />
                <Text style={[styles.mediaTileText, textColor]}>Note vocale</Text>
            </View>
        );
    }

    if (message.type === "DOCUMENT") {
        return (
            <View style={[styles.mediaTile, outbound && styles.mediaTileOutbound]}>
                <Ionicons
                    name="document-text"
                    size={20}
                    color={outbound ? "#fff" : theme.accent.primary}
                />
                <View style={styles.docText}>
                    <Text style={[styles.mediaTileText, textColor]} numberOfLines={1}>
                        {message.fileName ?? "Document"}
                    </Text>
                    {message.fileSize ? (
                        <Text style={[styles.mediaSubText, outbound && styles.mediaSubTextOutbound]}>
                            {formatBytes(message.fileSize)}
                        </Text>
                    ) : null}
                </View>
            </View>
        );
    }

    const content = (message.content ?? "").trim();
    if (!content) {
        return <Text style={[styles.bubbleText, textColor]}>{`[${message.type}]`}</Text>;
    }
    return <Text style={[styles.bubbleText, textColor]}>{content}</Text>;
}

function ReplyQuote({
    message,
    outbound,
}: {
    message: ConversationMessage;
    outbound: boolean;
}) {
    const preview = (message.content ?? "").trim() || `[${message.type}]`;
    return (
        <View
            style={[
                styles.replyQuote,
                outbound ? styles.replyQuoteOutbound : styles.replyQuoteInbound,
            ]}
        >
            <Text
                style={[
                    styles.replyAuthor,
                    outbound ? styles.replyAuthorOutbound : null,
                ]}
            >
                {message.direction === "OUTBOUND" ? "Vous" : "Contact"}
            </Text>
            <Text
                numberOfLines={2}
                style={[
                    styles.replyContent,
                    outbound ? styles.replyContentOutbound : null,
                ]}
            >
                {preview}
            </Text>
        </View>
    );
}

function StatusIcon({ status }: { status: string }) {
    if (status === "READ") {
        return (
            <View style={styles.statusIconRow}>
                <Ionicons name="checkmark-done" size={14} color="#7DB3FF" />
            </View>
        );
    }
    if (status === "DELIVERED") {
        return (
            <View style={styles.statusIconRow}>
                <Ionicons name="checkmark-done" size={14} color="#D7D3CC" />
            </View>
        );
    }
    if (status === "SENT") {
        return (
            <View style={styles.statusIconRow}>
                <Ionicons name="checkmark" size={14} color="#D7D3CC" />
            </View>
        );
    }
    if (status === "FAILED") {
        return (
            <View style={styles.statusIconRow}>
                <Ionicons name="alert-circle" size={14} color="#F87171" />
            </View>
        );
    }
    return (
        <View style={styles.statusIconRow}>
            <Ionicons name="time-outline" size={14} color="#D7D3CC" />
        </View>
    );
}

function formatMessageTime(timestamp: number): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", justifyContent: "flex-start" },
    rowOutbound: { justifyContent: "flex-end" },
    bubble: {
        maxWidth: "82%",
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderWidth: 1,
        gap: theme.spacing.xs,
    },
    bubbleInbound: {
        backgroundColor: theme.surface.raised,
        borderColor: theme.ink[300],
    },
    bubbleOutbound: {
        backgroundColor: theme.ink[900],
        borderColor: theme.ink[900],
    },
    bubbleFailed: {
        borderColor: theme.semantic.danger,
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 21,
        color: theme.ink[900],
    },
    bubbleTextOutbound: { color: "#fff" },
    captionText: { marginTop: theme.spacing.xs },
    mediaWrap: { gap: theme.spacing.xs },
    mediaImage: {
        width: 220,
        height: 220,
        borderRadius: theme.radius.md,
        backgroundColor: theme.surface.sunken,
    },
    mediaTile: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    mediaTileOutbound: {},
    mediaTileText: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.ink[900],
    },
    mediaSubText: {
        marginTop: 2,
        fontSize: 12,
        color: theme.ink[500],
    },
    mediaSubTextOutbound: { color: "#D7D3CC" },
    docText: { flex: 1, minWidth: 0 },
    replyQuote: {
        borderLeftWidth: 3,
        paddingLeft: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: 4,
    },
    replyQuoteInbound: {
        borderLeftColor: theme.accent.primary,
        backgroundColor: theme.surface.sunken,
    },
    replyQuoteOutbound: {
        borderLeftColor: "#7DB3FF",
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    replyAuthor: {
        fontSize: 11,
        fontWeight: "800",
        color: theme.accent.primary,
    },
    replyAuthorOutbound: { color: "#7DB3FF" },
    replyContent: {
        marginTop: 2,
        fontSize: 12,
        color: theme.ink[700],
    },
    replyContentOutbound: { color: "#D7D3CC" },
    meta: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xs,
        alignItems: "center",
    },
    time: { fontSize: 11, color: theme.ink[500], fontWeight: "700" },
    timeOutbound: { color: "#D7D3CC" },
    statusIconRow: { flexDirection: "row", alignItems: "center" },
    retryButton: {
        marginTop: theme.spacing.xs,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.semantic.danger,
        alignSelf: "flex-start",
    },
    retryText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "800",
    },
    pressed: { opacity: 0.7 },
});
