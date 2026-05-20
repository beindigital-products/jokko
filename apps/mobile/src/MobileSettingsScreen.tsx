import type { ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@jokko/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function MobileSettingsScreen() {
    const router = useRouter();

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.eyebrow}>Jokko</Text>
                <Text style={styles.title}>Plus</Text>
                <Text style={styles.body}>
                    Regroupe les préférences mobiles qui restent locales à l'app ou reliées au compte.
                </Text>
            </View>

            <View style={styles.section}>
                <SettingsRow
                    icon="card-outline"
                    title="Plan & facturation"
                    body="Voir l'abonnement, les quotas du cycle et le solde de crédits."
                    onPress={() => router.push("/settings/billing")}
                />
                <SettingsRow
                    icon="notifications-outline"
                    title="Notifications"
                    body="Choisir les catégories de notifications et planifier le mode Ne pas déranger."
                    onPress={() => router.push("/settings/notifications")}
                />
                <SettingsRow
                    icon="people-outline"
                    title="Équipe & agents"
                    body="Voir les membres de l'organisation, leurs rôles et les invitations en attente."
                    onPress={() => router.push("/settings/team")}
                />
                <SettingsRow
                    icon="shield-checkmark-outline"
                    title="Confidentialité"
                    body="Modifier ou révoquer le consentement crash reporting et analytics produit."
                    onPress={() => router.push("/settings/privacy")}
                />
                <SettingsRow
                    icon="repeat-outline"
                    title="Revoir l'onboarding"
                    body="Relancer le parcours d'accueil, les permissions et la configuration WhatsApp."
                    onPress={() => router.replace("/onboarding")}
                />
                <SettingsRow
                    icon="flask-outline"
                    title="Spikes"
                    body="Ouvrir les prototypes validés avant intégration dans les écrans réels."
                    onPress={() => router.push("/spikes")}
                />
            </View>
        </ScrollView>
    );
}

function SettingsRow({
    icon,
    title,
    body,
    onPress,
}: {
    icon: IconName;
    title: string;
    body: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
            <View style={styles.rowIcon}>
                <Ionicons name={icon} size={20} color={theme.accent.primary} />
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowBody}>{body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.ink[500]} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.accent.primary,
        textTransform: "uppercase",
    },
    title: {
        marginTop: theme.spacing.xs,
        fontSize: 32,
        lineHeight: 38,
        fontWeight: "800",
        color: theme.ink[900],
    },
    body: {
        marginTop: theme.spacing.sm,
        fontSize: 15,
        lineHeight: 22,
        color: theme.ink[500],
    },
    section: {
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
    },
    row: {
        minHeight: 88,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    rowIcon: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.sunken,
    },
    rowText: {
        flex: 1,
        minWidth: 0,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: theme.ink[900],
    },
    rowBody: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        color: theme.ink[500],
    },
    pressed: {
        opacity: 0.65,
    },
});
