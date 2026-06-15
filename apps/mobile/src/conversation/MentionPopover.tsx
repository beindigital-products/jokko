import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { Avatar, Micro, useTheme } from "@jokko/ui-mobile";
import { api } from "../../../../convex/_generated/api";

type Member = { user: { id: string; name: string; avatar?: string | null }; role: string };

type Props = {
    query: string;
    onSelect: (mention: { userId: string; name: string }) => void;
};

/**
 * Autocomplete shown above the composer when typing "@..." in an internal note.
 * Lists org members (team.listMembers) filtered by the typed query.
 */
export function MentionPopover({ query, onSelect }: Props) {
    const { colors, font } = useTheme();
    const team = useQuery(api.team.listMembers, {}) as { members?: Member[] } | undefined;

    const q = query.trim().toLowerCase();
    const members = (team?.members ?? [])
        .filter((m) => m.user?.name && (!q || m.user.name.toLowerCase().includes(q)))
        .slice(0, 6);

    if (members.length === 0) return null;

    return (
        <View style={[styles.popover, { backgroundColor: colors.card, borderColor: colors.rule }]}>
            <Micro style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 }}>Mentionner un coéquipier</Micro>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 216 }}>
                {members.map((m) => (
                    <Pressable
                        key={m.user.id}
                        accessibilityRole="button"
                        onPress={() => onSelect({ userId: m.user.id, name: m.user.name })}
                        style={({ pressed }) => [styles.row, { borderBottomColor: colors.rule2 }, pressed && { backgroundColor: colors.paper2 }]}
                    >
                        <Avatar name={m.user.name} size={30} imageUrl={m.user.avatar} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontSize: 14, color: colors.ink, fontFamily: font.sansMedium }}>
                                {m.user.name}
                            </Text>
                            <Text style={{ fontSize: 10.5, color: colors.mute, fontFamily: font.mono, letterSpacing: 0.4, marginTop: 1 }}>
                                {(m.role ?? "agent").toUpperCase()}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    popover: {
        position: "absolute",
        bottom: 88,
        left: 12,
        right: 12,
        zIndex: 10,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
});
