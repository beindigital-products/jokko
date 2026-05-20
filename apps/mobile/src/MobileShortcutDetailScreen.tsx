import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ShortcutDetail = {
    _id: Id<"shortcuts">;
    shortcut: string;
    text?: string;
    type?: string;
    createdAt: number;
    updatedAt?: number;
};

type Props = {
    shortcutId: string | null;
};

export function MobileShortcutDetailScreen({ shortcutId }: Props) {
    const router = useRouter();
    const typedId = shortcutId as Id<"shortcuts"> | null;
    const shortcut = useQuery(
        api.shortcuts.get,
        typedId ? { id: typedId } : "skip",
    ) as ShortcutDetail | null | undefined;
    const deleteShortcut = useMutation(api.shortcuts.deleteShortcut);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!typedId) {
        return (
            <StateScreen
                title="Raccourci introuvable"
                body="L'identifiant du raccourci est manquant."
                onBack={() => router.replace("/(tabs)/hub")}
            />
        );
    }

    if (shortcut === undefined) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    if (shortcut === null) {
        return (
            <StateScreen
                title="Raccourci indisponible"
                body="Ce raccourci n'existe pas dans l'organisation active."
                onBack={() => router.replace("/(tabs)/hub")}
            />
        );
    }

    function handleDelete() {
        if (!typedId) return;
        Alert.alert(
            "Supprimer ce raccourci ?",
            "Cette action est définitive.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await deleteShortcut({ id: typedId });
                            router.back();
                        } catch (error) {
                            const message =
                                error instanceof Error ? error.message : "Erreur inconnue";
                            Alert.alert("Suppression impossible", message);
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ],
        );
    }

    const type = shortcut.type ?? "TEXT";
    const text = shortcut.text ?? "";

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.ink[900]} />
                    <Text style={styles.backText}>Hub</Text>
                </Pressable>
                <Text style={styles.eyebrow}>{type}</Text>
                <Text style={styles.title}>{shortcut.shortcut}</Text>
                <Text style={styles.subtitle}>
                    Créé le {formatDate(shortcut.createdAt)}
                    {shortcut.updatedAt && shortcut.updatedAt !== shortcut.createdAt
                        ? ` · maj ${formatDate(shortcut.updatedAt)}`
                        : ""}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Réponse</Text>
                <View style={styles.bodyBox}>
                    <Text style={styles.bodyText}>
                        {text.length > 0 ? text : "Aucun texte associé."}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Édition</Text>
                <Text style={styles.helperText}>
                    L'édition complète des raccourcis se fait depuis l'app web. Sur mobile, vous pouvez les
                    consulter ou les supprimer.
                </Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={handleDelete}
                    disabled={isDeleting}
                    style={({ pressed }) => [
                        styles.dangerButton,
                        isDeleting && styles.disabled,
                        pressed && !isDeleting && styles.pressed,
                    ]}
                >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.dangerButtonText}>
                        {isDeleting ? "Suppression..." : "Supprimer"}
                    </Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

function StateScreen({
    title,
    body,
    onBack,
}: {
    title: string;
    body: string;
    onBack: () => void;
}) {
    return (
        <View style={styles.empty}>
            <Ionicons name="alert-circle-outline" size={32} color={theme.ink[500]} />
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyBody}>{body}</Text>
            <Pressable
                accessibilityRole="button"
                onPress={onBack}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
                <Text style={styles.primaryButtonText}>Retour au Hub</Text>
            </Pressable>
        </View>
    );
}

function formatDate(value: number): string {
    try {
        return new Date(value).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
        gap: theme.spacing.xl,
    },
    header: { gap: theme.spacing.xs },
    backButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    backText: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.ink[900],
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.accent.primary,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: theme.ink[900],
    },
    subtitle: {
        marginTop: theme.spacing.xs,
        fontSize: 13,
        color: theme.ink[500],
        fontWeight: "600",
    },
    section: { gap: theme.spacing.sm },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        color: theme.ink[500],
    },
    bodyBox: {
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    bodyText: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.ink[900],
    },
    helperText: {
        fontSize: 13,
        lineHeight: 19,
        color: theme.ink[500],
    },
    dangerButton: {
        marginTop: theme.spacing.sm,
        minHeight: 46,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
        borderRadius: theme.radius.pill,
        backgroundColor: "#dc2626",
    },
    dangerButtonText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 14,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: theme.ink[900],
        textAlign: "center",
    },
    emptyBody: {
        fontSize: 14,
        color: theme.ink[500],
        textAlign: "center",
        maxWidth: 320,
    },
    primaryButton: {
        marginTop: theme.spacing.md,
        minHeight: 46,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.ink[900],
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 14,
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.7 },
});
