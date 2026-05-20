import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { theme } from "@jokko/tokens";

export function SpikeFrame({ title, children }: { title: string; children: ReactNode }) {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <View style={styles.frame}>
            <View style={styles.frameHeader}>
                <Pressable
                    onPress={() => router.replace("/spikes")}
                    hitSlop={12}
                    style={styles.backRow}
                    accessibilityLabel={t("navigation.menu")}
                >
                    <Ionicons name="chevron-back" size={18} color={theme.accent.primary} />
                    <Text style={styles.backBtn}>{t("navigation.menu")}</Text>
                </Pressable>
                <Text style={styles.frameTitle}>{title}</Text>
            </View>
            <View style={styles.frameBody}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    frame: { flex: 1, backgroundColor: theme.surface.default },
    frameHeader: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.ink[300],
    },
    backRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 2 },
    backBtn: { fontSize: 15, color: theme.accent.primary },
    frameTitle: { fontSize: 17, fontWeight: "600", color: theme.ink[900] },
    frameBody: { flex: 1 },
});
