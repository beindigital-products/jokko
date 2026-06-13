import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { Avatar, Icon, Micro, useTheme } from "@jokko/ui-mobile";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type Member = { user: { id: string; name: string; avatar?: string | null }; role: string };

/**
 * Reassign a conversation to a teammate (hand-off). Lists org members and calls
 * assignments.assign with the chosen member.
 */
export function AssignSheet({
    visible,
    conversationId,
    currentAssigneeId,
    onClose,
}: {
    visible: boolean;
    conversationId: Id<"conversations"> | null;
    currentAssigneeId?: string | null;
    onClose: () => void;
}) {
    const { colors, font } = useTheme();
    const team = useQuery(api.team.listMembers, visible ? {} : "skip") as { members?: Member[] } | undefined;
    const assign = useMutation(api.assignments.assign);
    const [busy, setBusy] = useState<string | null>(null);

    const choose = async (member: Member) => {
        if (!conversationId) return;
        setBusy(member.user.id);
        try {
            await assign({ conversationId, memberId: member.user.id as Id<"users"> });
            onClose();
        } catch (error) {
            Alert.alert("Attribution impossible", error instanceof Error ? error.message : "Réessaie.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                <View style={styles.handle}>
                    <View style={[styles.bar, { backgroundColor: colors.rule }]} />
                </View>
                <View style={{ paddingHorizontal: 22, paddingBottom: 8 }}>
                    <Micro style={{ marginBottom: 4 }}>Équipe</Micro>
                    <Text style={{ fontFamily: font.display, fontSize: 26, letterSpacing: -0.8, color: colors.ink }}>Attribuer à…</Text>
                </View>
                <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4 }} keyboardShouldPersistTaps="handled">
                    {(team?.members ?? []).map((member) => {
                        const active = member.user.id === currentAssigneeId;
                        return (
                            <Pressable
                                key={member.user.id}
                                accessibilityRole="button"
                                onPress={() => void choose(member)}
                                style={({ pressed }) => [
                                    styles.row,
                                    { borderColor: active ? colors.accent : colors.rule, backgroundColor: active ? colors.accentSoft : colors.card },
                                    pressed && { opacity: 0.85 },
                                ]}
                            >
                                <Avatar name={member.user.name} size={36} imageUrl={member.user.avatar} />
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text numberOfLines={1} style={{ fontSize: 14.5, fontFamily: font.sansMedium, color: colors.ink }}>
                                        {member.user.name}
                                    </Text>
                                    <Text style={{ fontFamily: font.mono, fontSize: 10.5, color: colors.mute, letterSpacing: 0.4, marginTop: 1 }}>
                                        {(member.role ?? "agent").toUpperCase()}
                                    </Text>
                                </View>
                                {busy === member.user.id ? (
                                    <ActivityIndicator color={colors.accent} />
                                ) : active ? (
                                    <Icon name="check" size={18} color={colors.accentInk} strokeWidth={2.4} />
                                ) : null}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,10,10,0.4)" },
    sheet: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "80%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 28 },
    handle: { alignItems: "center", paddingTop: 8, paddingBottom: 6 },
    bar: { width: 36, height: 5, borderRadius: 3 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
});
