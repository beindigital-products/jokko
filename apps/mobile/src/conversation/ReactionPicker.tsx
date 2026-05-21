import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@jokko/tokens";

export const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

type Props = {
    visible: boolean;
    onSelect: (emoji: ReactionEmoji) => void;
    onClose: () => void;
};

/**
 * Compact bottom-sheet emoji picker shown on long-press of a bubble.
 *
 * Six emojis match WhatsApp's native quick-reaction set so the UX feels
 * familiar. Tapping an emoji fires onSelect and closes; tapping outside
 * cancels.
 */
export function ReactionPicker({ visible, onSelect, onClose }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable
                accessibilityLabel="Fermer le sélecteur de réaction"
                style={styles.backdrop}
                onPress={onClose}
            />
            <View style={styles.sheet} accessibilityLabel="Choix de la réaction">
                <View style={styles.row}>
                    {REACTION_EMOJIS.map((emoji) => (
                        <Pressable
                            key={emoji}
                            accessibilityRole="button"
                            accessibilityLabel={`Réagir avec ${emoji}`}
                            onPress={() => onSelect(emoji)}
                            hitSlop={6}
                            style={({ pressed }) => [
                                styles.emojiButton,
                                pressed && styles.pressed,
                            ]}
                        >
                            <Text style={styles.emoji}>{emoji}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
        position: "absolute",
        bottom: 100,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        padding: theme.spacing.md,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.surface.default,
        borderWidth: 1,
        borderColor: theme.ink[300],
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    emojiButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    emoji: { fontSize: 26, lineHeight: 32 },
    pressed: { backgroundColor: theme.surface.sunken },
});
