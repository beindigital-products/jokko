import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type Suggestion = {
    _id: Id<"shortcuts">;
    shortcut: string;
    text?: string;
    type?: string;
};

type Props = {
    query: string;
    onSelect: (suggestion: Suggestion) => void;
};

export function ShortcutPopover({ query, onSelect }: Props) {
    const suggestions = useQuery(api.shortcuts.suggest, { search: query }) as
        | Suggestion[]
        | undefined;

    if (!suggestions || suggestions.length === 0) {
        return (
            <View style={styles.popover}>
                <Text style={styles.empty}>Aucun raccourci ne correspond.</Text>
            </View>
        );
    }

    return (
        <View style={styles.popover}>
            <ScrollView
                horizontal={false}
                keyboardShouldPersistTaps="handled"
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
            >
                {suggestions.map((suggestion) => (
                    <Pressable
                        key={suggestion._id}
                        accessibilityRole="button"
                        onPress={() => onSelect(suggestion)}
                        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                    >
                        <Text style={styles.shortcut}>{suggestion.shortcut}</Text>
                        <Text style={styles.preview} numberOfLines={1}>
                            {suggestion.text ?? `[${suggestion.type ?? "TEXT"}]`}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    popover: {
        position: "absolute",
        bottom: 80,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        maxHeight: 220,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    scroll: { maxHeight: 220 },
    scrollContent: { paddingVertical: theme.spacing.xs },
    row: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    shortcut: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.accent.primary,
    },
    preview: {
        marginTop: 2,
        fontSize: 13,
        color: theme.ink[700],
    },
    empty: {
        padding: theme.spacing.md,
        fontSize: 13,
        color: theme.ink[500],
        textAlign: "center",
    },
    pressed: { opacity: 0.6 },
});
