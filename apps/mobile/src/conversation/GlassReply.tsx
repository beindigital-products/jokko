import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Icon, useTheme, type IconName } from "@jokko/ui-mobile";
import type { ConversationMessage } from "./MessageBubble";

export const GLASS_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;
export type GlassReaction = (typeof GLASS_REACTIONS)[number];

type Action = { key: string; label: string; icon: IconName; danger?: boolean; onPress: () => void };

type Props = {
    message: ConversationMessage | null;
    onReact: (emoji: GlassReaction) => void;
    onReply: () => void;
    onForward: () => void;
    onCopy: () => void;
    onToggleStar: () => void;
    onDelete: () => void;
    onClose: () => void;
};

/**
 * iOS-style long-press context menu: a blurred scrim, a glass reaction tray,
 * a preview of the pressed bubble, and a glass action menu. Replaces the bare
 * emoji ReactionPicker with the full "Glass Reply" interaction from the design.
 */
export function GlassReply({ message, onReact, onReply, onForward, onCopy, onToggleStar, onDelete, onClose }: Props) {
    const { colors, font, dark } = useTheme();
    const visible = message !== null;
    const outbound = message?.direction === "OUTBOUND";
    const glassBg = dark ? "rgba(30,31,38,0.82)" : "rgba(250,249,247,0.82)";
    const trayBg = dark ? "rgba(30,31,38,0.7)" : "rgba(250,249,247,0.6)";
    const divider = dark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.08)";

    const actions: Action[] = [
        { key: "reply", label: "Répondre", icon: "reply", onPress: onReply },
        { key: "forward", label: "Transférer", icon: "forward", onPress: onForward },
        { key: "copy", label: "Copier", icon: "sticky-note", onPress: onCopy },
        { key: "star", label: message?.isStarred ? "Retirer" : "Marquer", icon: "star", onPress: onToggleStar },
        { key: "delete", label: "Supprimer", icon: "trash", danger: true, onPress: onDelete },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                <BlurView intensity={dark ? 28 : 20} tint={dark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,10,10,0.28)" }]} />
            </Pressable>

            <View style={styles.center} pointerEvents="box-none">
                <View style={[styles.stack, { alignItems: outbound ? "flex-end" : "flex-start" }]} pointerEvents="box-none">
                    {/* Reaction tray */}
                    <BlurView intensity={40} tint={dark ? "dark" : "light"} style={[styles.tray, { backgroundColor: trayBg }]}>
                        {GLASS_REACTIONS.map((emoji) => (
                            <Pressable key={emoji} onPress={() => onReact(emoji)} style={styles.reactionDot} hitSlop={2}>
                                <Text style={styles.reactionEmoji}>{emoji}</Text>
                            </Pressable>
                        ))}
                    </BlurView>

                    {/* Pressed bubble preview */}
                    {message ? (
                        <View
                            style={[
                                styles.preview,
                                {
                                    backgroundColor: outbound ? colors.bubbleOut : colors.bubbleIn,
                                    borderColor: colors.rule,
                                    borderWidth: outbound ? 0 : StyleSheet.hairlineWidth,
                                    borderBottomRightRadius: outbound ? 6 : 18,
                                    borderBottomLeftRadius: outbound ? 18 : 6,
                                },
                            ]}
                        >
                            <Text numberOfLines={6} style={{ fontSize: 15, lineHeight: 20, color: outbound ? colors.bubbleOutInk : colors.ink, fontFamily: font.sans }}>
                                {previewText(message)}
                            </Text>
                        </View>
                    ) : null}

                    {/* Action menu */}
                    <BlurView intensity={40} tint={dark ? "dark" : "light"} style={[styles.menu, { backgroundColor: glassBg }]}>
                        {actions.map((action, index) => (
                            <Pressable
                                key={action.key}
                                accessibilityRole="button"
                                onPress={action.onPress}
                                style={({ pressed }) => [
                                    styles.menuRow,
                                    { borderBottomColor: divider, borderBottomWidth: index === actions.length - 1 ? 0 : StyleSheet.hairlineWidth },
                                    pressed && { backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.05)" },
                                ]}
                            >
                                <Text style={{ fontSize: 15, color: action.danger ? colors.hot : colors.ink, fontFamily: font.sans }}>{action.label}</Text>
                                <Icon name={action.icon} size={17} color={action.danger ? colors.hot : colors.ink} strokeWidth={1.6} />
                            </Pressable>
                        ))}
                    </BlurView>
                </View>
            </View>
        </Modal>
    );
}

function previewText(message: ConversationMessage): string {
    const content = (message.content ?? "").trim();
    if (content) return content;
    switch (message.type.toUpperCase()) {
        case "AUDIO":
            return "Message vocal";
        case "IMAGE":
            return "Photo";
        case "VIDEO":
            return "Vidéo";
        case "DOCUMENT":
            return message.fileName ?? "Document";
        default:
            return "Message";
    }
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", paddingHorizontal: 16 },
    stack: { gap: 12, maxWidth: "92%", alignSelf: "center", width: "100%" },
    tray: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderRadius: 999,
        overflow: "hidden",
    },
    reactionDot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    reactionEmoji: { fontSize: 24 },
    preview: { maxWidth: "82%", paddingHorizontal: 13, paddingVertical: 9, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
    menu: { width: 224, borderRadius: 14, overflow: "hidden" },
    menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
});
