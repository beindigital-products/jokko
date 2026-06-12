import { useMemo } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { Avatar, Icon, useTheme } from "@jokko/ui-mobile";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type Props = {
    visible: boolean;
    organizationId: Id<"organizations"> | null;
    excludeConversationId: Id<"conversations"> | null;
    onPick: (conversationId: Id<"conversations">) => void;
    onClose: () => void;
};

type Row = {
    _id: Id<"conversations">;
    preview?: string | null;
    contact?: { name?: string | null; phoneNumber?: string | null } | null;
};

/** Pick a conversation to forward a message into. */
export function ForwardSheet({ visible, organizationId, excludeConversationId, onPick, onClose }: Props) {
    const { colors, font } = useTheme();
    const data = useQuery(
        api.conversations.list,
        visible && organizationId ? { organizationId, filter: "all" } : "skip",
    );

    const rows = useMemo<Row[]>(() => {
        const list = (data ?? []) as Row[];
        return list.filter((row) => row._id !== excludeConversationId);
    }, [data, excludeConversationId]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable accessibilityLabel="Fermer" style={styles.backdrop} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                <View style={styles.handle}>
                    <View style={[styles.handleBar, { backgroundColor: colors.rule }]} />
                </View>
                <View style={[styles.header, { borderBottomColor: colors.rule }]}>
                    <View>
                        <Text style={[styles.eyebrow, { color: colors.mute, fontFamily: font.mono }]}>TRANSFÉRER VERS</Text>
                        <Text style={[styles.title, { color: colors.ink, fontFamily: font.display }]}>Une conversation</Text>
                    </View>
                    <Pressable onPress={onClose} hitSlop={10} style={({ pressed }) => [styles.close, { backgroundColor: colors.card }, pressed && styles.pressed]}>
                        <Icon name="close" size={18} color={colors.ink3} />
                    </Pressable>
                </View>

                {data === undefined ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.accent} />
                    </View>
                ) : rows.length === 0 ? (
                    <View style={styles.center}>
                        <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: font.sansSemibold }]}>Aucune autre conversation</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.list}>
                        {rows.map((row) => {
                            const name = row.contact?.name || row.contact?.phoneNumber || "Contact";
                            return (
                                <Pressable
                                    key={row._id}
                                    accessibilityRole="button"
                                    onPress={() => onPick(row._id)}
                                    style={({ pressed }) => [styles.row, { borderColor: colors.rule }, pressed && { backgroundColor: colors.paper2 }]}
                                >
                                    <Avatar name={name} size={38} />
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text numberOfLines={1} style={{ fontSize: 14.5, color: colors.ink, fontFamily: font.sansSemibold }}>{name}</Text>
                                        {row.preview ? (
                                            <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.mute, fontFamily: font.sans, marginTop: 1 }}>{row.preview}</Text>
                                        ) : null}
                                    </View>
                                    <Icon name="arrow-up-right" size={16} color={colors.mute2} />
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
    sheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "72%",
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingBottom: 28,
    },
    handle: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
    handleBar: { width: 38, height: 4, borderRadius: 2 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    eyebrow: { fontSize: 10, letterSpacing: 1.2, marginBottom: 3 },
    title: { fontSize: 20, letterSpacing: -0.3 },
    close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    list: { padding: 16, gap: 8 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
    center: { alignItems: "center", justifyContent: "center", padding: 32, minHeight: 180 },
    emptyTitle: { fontSize: 15 },
    pressed: { opacity: 0.65 },
});
