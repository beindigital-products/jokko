import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, tint, useTheme, type JokkoTheme } from "@jokko/ui-mobile";
import type { Id } from "../../../../convex/_generated/dataModel";
import { SwipeToReply } from "./SwipeToReply";
import { AudioMessage } from "./AudioMessage";

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
    isStarred?: boolean | null;
    reactions?: { userId: Id<"users">; emoji: string; createdAt: number }[];
};

function openMedia(url?: string | null) {
    if (url) Linking.openURL(url).catch(() => undefined);
}

type Props = {
    message: ConversationMessage;
    replyTo?: ConversationMessage | null;
    onRetry?: (messageId: Id<"messages">) => void;
    onEdit?: (message: ConversationMessage) => void;
    onDelete?: (messageId: Id<"messages">) => void;
    onReplyRequest?: (message: ConversationMessage) => void;
    onReactionRequest?: (message: ConversationMessage) => void;
};

export function MessageBubble({ message, replyTo, onRetry, onEdit, onDelete, onReplyRequest, onReactionRequest }: Props) {
    const theme = useTheme();
    const { colors, font } = theme;
    const outbound = message.direction === "OUTBOUND";
    const failed = message.status === "FAILED";
    const reactions = message.reactions ?? [];
    const isMedia = ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "STICKER"].includes(message.type);
    const fg = outbound ? colors.bubbleOutInk : colors.ink;

    const bubble = (
        <Pressable
            onLongPress={() => onReactionRequest?.(message)}
            delayLongPress={300}
            android_disableSound
            style={[
                styles.bubble,
                {
                    backgroundColor: failed ? tint(colors.hot, 0.07) : outbound ? colors.bubbleOut : colors.bubbleIn,
                    borderColor: failed ? tint(colors.hot, 0.4) : colors.rule,
                    borderWidth: outbound && !failed ? 0 : StyleSheet.hairlineWidth,
                    padding: isMedia && message.type === "IMAGE" ? 4 : undefined,
                    paddingHorizontal: isMedia && message.type === "IMAGE" ? 4 : 13,
                    paddingVertical: isMedia && message.type === "IMAGE" ? 4 : 9,
                    borderBottomRightRadius: outbound ? 6 : 18,
                    borderBottomLeftRadius: outbound ? 18 : 6,
                },
            ]}
        >
            {replyTo ? <ReplyQuote message={replyTo} outbound={outbound} theme={theme} /> : null}
            <BubbleContent message={message} outbound={outbound} theme={theme} failed={failed} />
            {failed ? (
                <View style={styles.failedMeta}>
                    <View style={styles.failedTag}>
                        <View style={[styles.failedBadge, { backgroundColor: colors.hot }]}>
                            <Text style={styles.failedBadgeMark}>!</Text>
                        </View>
                        <Text style={{ fontSize: 11.5, fontFamily: font.sansMedium, color: colors.hot }}>Échec d'envoi</Text>
                    </View>
                    <Text style={{ fontFamily: font.mono, fontSize: 9.5, color: colors.mute }}>
                        {formatMessageTime(message.timestamp)}
                    </Text>
                </View>
            ) : (
                <View style={[styles.meta, isMedia && message.type === "IMAGE" ? styles.metaMedia : null]}>
                    {message.isStarred ? <Icon name="star" size={10} color={fg} strokeWidth={2} /> : null}
                    <Text style={{ fontFamily: font.mono, fontSize: 9.5, color: fg, opacity: 0.55 }}>
                        {formatMessageTime(message.timestamp)}
                    </Text>
                    {outbound ? <StatusIcon status={message.status} color={fg} /> : null}
                </View>
            )}
        </Pressable>
    );

    return (
        <View style={[styles.row, outbound && styles.rowOutbound]}>
            <View style={styles.column}>
                {onReplyRequest ? (
                    <SwipeToReply direction={outbound ? "left" : "right"} onTrigger={() => onReplyRequest(message)}>
                        {bubble}
                    </SwipeToReply>
                ) : (
                    bubble
                )}
                {failed && (onRetry || onEdit || onDelete) ? (
                    <View style={styles.failedActions}>
                        {onRetry ? (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => onRetry(message.id)}
                                style={({ pressed }) => [styles.chip, { backgroundColor: colors.ink }, pressed && styles.pressed]}
                            >
                                <Icon name="rotate" size={13} color={colors.paper} strokeWidth={2.2} />
                                <Text style={[styles.chipText, { color: colors.paper, fontFamily: font.sansMedium }]}>Réessayer</Text>
                            </Pressable>
                        ) : null}
                        {onEdit && message.type === "TEXT" ? (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => onEdit(message)}
                                style={({ pressed }) => [styles.chip, styles.chipGhost, { borderColor: colors.rule }, pressed && styles.pressed]}
                            >
                                <Text style={[styles.chipText, { color: colors.ink3, fontFamily: font.sansMedium }]}>Modifier</Text>
                            </Pressable>
                        ) : null}
                        {onDelete ? (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => onDelete(message.id)}
                                style={({ pressed }) => [styles.chip, styles.chipGhost, { borderColor: "transparent" }, pressed && styles.pressed]}
                            >
                                <Text style={[styles.chipText, { color: colors.hot, fontFamily: font.sansMedium }]}>Supprimer</Text>
                            </Pressable>
                        ) : null}
                    </View>
                ) : null}
                {reactions.length > 0 ? <ReactionsChip reactions={reactions} outbound={outbound} theme={theme} /> : null}
            </View>
        </View>
    );
}

function ReactionsChip({
    reactions,
    outbound,
    theme,
}: {
    reactions: NonNullable<ConversationMessage["reactions"]>;
    outbound: boolean;
    theme: JokkoTheme;
}) {
    const { colors, font } = theme;
    const counts = reactions.reduce<Map<string, number>>((acc, r) => {
        acc.set(r.emoji, (acc.get(r.emoji) ?? 0) + 1);
        return acc;
    }, new Map());
    return (
        <View style={[styles.reactionsRow, outbound ? styles.reactionsRowOutbound : styles.reactionsRowInbound]}>
            {Array.from(counts.entries()).map(([emoji, count]) => (
                <View key={emoji} style={[styles.reactionPill, { backgroundColor: colors.bubbleIn, borderColor: colors.rule }]}>
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    {count > 1 ? <Text style={{ fontSize: 11, fontFamily: font.sansSemibold, color: colors.ink3 }}>{count}</Text> : null}
                </View>
            ))}
        </View>
    );
}

function BubbleContent({ message, outbound, theme, failed }: { message: ConversationMessage; outbound: boolean; theme: JokkoTheme; failed?: boolean }) {
    const { colors, font } = theme;
    // The failed bubble is light (hot-tinted), so its text stays dark ink.
    const fg = failed ? colors.ink : outbound ? colors.bubbleOutInk : colors.ink;
    const tileBg = outbound && !failed ? "rgba(242,239,232,0.10)" : colors.paper2;

    if (message.type === "IMAGE" && message.mediaUrl) {
        return (
            <View style={{ gap: 4 }}>
                <Pressable onPress={() => openMedia(message.mediaUrl)} accessibilityRole="imagebutton" accessibilityLabel="Ouvrir la photo">
                    <Image source={{ uri: message.mediaUrl }} style={[styles.mediaImage, { backgroundColor: colors.paper2 }]} resizeMode="cover" />
                </Pressable>
                {message.content ? (
                    <Text style={[styles.text, { color: fg, fontFamily: font.sans, paddingHorizontal: 8, paddingTop: 4 }]}>
                        {message.content}
                    </Text>
                ) : null}
            </View>
        );
    }

    if (message.type === "AUDIO") {
        if (message.mediaUrl) {
            return <AudioMessage uri={message.mediaUrl} fallbackLabel={extractDuration(message.content)} outbound={outbound} />;
        }
        return (
            <View style={[styles.mediaTile, { backgroundColor: tileBg }]}>
                <View style={[styles.mediaTileIcon, { backgroundColor: outbound ? "rgba(242,239,232,0.12)" : colors.card }]}>
                    <Icon name="mic" size={18} color={outbound ? fg : colors.accentInk} strokeWidth={1.8} />
                </View>
                <Text style={[styles.mediaTileText, { color: fg, fontFamily: font.sansMedium }]} numberOfLines={1}>
                    {message.content?.trim() || "Message vocal"}
                </Text>
            </View>
        );
    }

    if (message.type === "VIDEO") {
        return (
            <Pressable onPress={() => openMedia(message.mediaUrl)} style={[styles.mediaTile, { backgroundColor: tileBg }]}>
                <View style={[styles.mediaTileIcon, { backgroundColor: outbound ? "rgba(242,239,232,0.12)" : colors.card }]}>
                    <Icon name="video" size={18} color={outbound ? fg : colors.accentInk} strokeWidth={1.8} />
                </View>
                <Text style={[styles.mediaTileText, { color: fg, fontFamily: font.sansMedium, flex: 1 }]} numberOfLines={1}>
                    {message.content?.trim() || "Vidéo"}
                </Text>
                <Icon name="arrow-up-right" size={16} color={fg} />
            </Pressable>
        );
    }

    if (message.type === "DOCUMENT") {
        const meta = message.fileSize ? formatBytes(message.fileSize) : null;
        return (
            <Pressable
                onPress={() => openMedia(message.mediaUrl)}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir ${message.fileName ?? "le document"}`}
                style={[styles.docCard, { backgroundColor: tileBg }]}
            >
                <View style={[styles.docIcon, { backgroundColor: tint(colors.hot, 0.12) }]}>
                    <Icon name="doc" size={20} color={colors.hot} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.mediaTileText, { color: fg, fontFamily: font.sansMedium }]} numberOfLines={1}>
                        {message.fileName ?? "Document"}
                    </Text>
                    {meta ? (
                        <Text style={{ fontFamily: font.mono, fontSize: 10.5, color: fg, opacity: 0.6, marginTop: 2 }}>{meta}</Text>
                    ) : null}
                </View>
                <Icon name="arrow-up-right" size={16} color={fg} />
            </Pressable>
        );
    }

    const content = (message.content ?? "").trim();
    return (
        <Text style={[styles.text, { color: fg, fontFamily: font.sans }]}>{content || `[${message.type}]`}</Text>
    );
}

function ReplyQuote({ message, outbound, theme }: { message: ConversationMessage; outbound: boolean; theme: JokkoTheme }) {
    const { colors, font } = theme;
    const fg = outbound ? colors.bubbleOutInk : colors.ink3;
    const preview = (message.content ?? "").trim() || mediaLabelFor(message.type);
    return (
        <View
            style={[
                styles.replyQuote,
                {
                    borderLeftColor: outbound ? colors.paper : colors.accent,
                    backgroundColor: outbound ? "rgba(242,239,232,0.10)" : colors.paper2,
                },
            ]}
        >
            <Text style={{ fontSize: 11.5, fontFamily: font.sansSemibold, color: fg, opacity: 0.85 }}>
                {message.direction === "OUTBOUND" ? "Vous" : "Contact"}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 12.5, color: fg, opacity: 0.85, marginTop: 2, fontFamily: font.sans }}>
                {preview}
            </Text>
        </View>
    );
}

function StatusIcon({ status, color }: { status: string; color: string }) {
    if (status === "READ") return <Icon name="check-double" size={12} color="#4D9CFF" strokeWidth={2.4} />;
    if (status === "DELIVERED") return <Icon name="check-double" size={12} color={color} strokeWidth={2.4} />;
    if (status === "SENT") return <Icon name="check" size={11} color={color} strokeWidth={2.4} />;
    if (status === "FAILED") return <Text style={{ color: "#FF5B5B", fontSize: 11 }}>✕</Text>;
    return <Icon name="clock" size={11} color={color} strokeWidth={2} />;
}

function mediaLabelFor(type: string): string {
    switch (type.toUpperCase()) {
        case "AUDIO":
            return "Message vocal";
        case "IMAGE":
            return "Photo";
        case "VIDEO":
            return "Vidéo";
        case "DOCUMENT":
            return "Document";
        case "STICKER":
            return "Sticker";
        default:
            return "Message";
    }
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

// Pull a "m:ss" duration out of a voice-note caption (e.g. "Note vocale (0:34)").
function extractDuration(content?: string | null): string | undefined {
    const match = (content ?? "").match(/(\d+:\d{2})/);
    return match ? match[1] : undefined;
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", justifyContent: "flex-start" },
    rowOutbound: { justifyContent: "flex-end" },
    column: { maxWidth: "82%" },
    bubble: {
        maxWidth: "100%",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
    },
    text: { fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
    meta: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 3 },
    metaMedia: { paddingHorizontal: 8, paddingBottom: 4 },
    mediaImage: { width: 224, height: 224, borderRadius: 14 },
    mediaTile: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, minWidth: 180 },
    mediaTileIcon: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    mediaTileText: { fontSize: 13.5 },
    docCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, minWidth: 200 },
    docIcon: { width: 40, height: 48, borderRadius: 6, alignItems: "center", justifyContent: "center" },
    replyQuote: { borderLeftWidth: 2.5, paddingLeft: 10, paddingRight: 8, paddingVertical: 5, borderRadius: 8, marginBottom: 6 },
    reactionsRow: { marginTop: -6, flexDirection: "row", flexWrap: "wrap", gap: 4 },
    reactionsRowInbound: { justifyContent: "flex-start", paddingLeft: 8 },
    reactionsRowOutbound: { justifyContent: "flex-end", paddingRight: 8 },
    reactionPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
    },
    reactionEmoji: { fontSize: 12, lineHeight: 16 },
    failedMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8 },
    failedTag: { flexDirection: "row", alignItems: "center", gap: 6 },
    failedBadge: { width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
    failedBadgeMark: { color: "#fff", fontSize: 9, fontWeight: "700", lineHeight: 11 },
    failedActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 8 },
    chip: {
        height: 32,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
    },
    chipGhost: { borderWidth: StyleSheet.hairlineWidth },
    chipText: { fontSize: 12.5 },
    pressed: { opacity: 0.7 },
});
