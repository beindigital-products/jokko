import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { theme } from "@jokko/tokens";
import {
    PRIVACY_CONSENT_STORAGE_KEY,
    buildPrivacyConsentUpdate,
    createDefaultPrivacyConsent,
    parsePrivacyConsent,
    revokePrivacyConsent,
    serializePrivacyConsent,
    type PrivacyConsent,
} from "./lib/privacy-consent";

type SaveStatus = "idle" | "saving";

export function PrivacySettingsScreen() {
    const router = useRouter();
    const [loaded, setLoaded] = useState(false);
    const [savedConsent, setSavedConsent] = useState<PrivacyConsent | null>(null);
    const [draft, setDraft] = useState<PrivacyConsent>(() => createDefaultPrivacyConsent());
    const [status, setStatus] = useState<SaveStatus>("idle");
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        SecureStore.getItemAsync(PRIVACY_CONSENT_STORAGE_KEY)
            .then((raw) => {
                if (!mounted) return;
                const parsed = parsePrivacyConsent(raw);
                const next = parsed ?? createDefaultPrivacyConsent();
                setDraft(next);
                setSavedConsent(parsed);
                setLoaded(true);
            })
            .catch(() => {
                if (!mounted) return;
                const next = createDefaultPrivacyConsent();
                setDraft(next);
                setSavedConsent(null);
                setLoaded(true);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const hasChanges = useMemo(() => {
        if (!savedConsent) return true;
        return (
            savedConsent.crashReporting !== draft.crashReporting ||
            savedConsent.productAnalytics !== draft.productAnalytics
        );
    }, [draft.crashReporting, draft.productAnalytics, savedConsent]);

    const lastDecision = savedConsent ? formatDecisionDate(savedConsent.decidedAt) : "Non enregistré";

    const persistConsent = async (next: PrivacyConsent, successMessage: string) => {
        setStatus("saving");
        setMessage(null);
        try {
            await SecureStore.setItemAsync(PRIVACY_CONSENT_STORAGE_KEY, serializePrivacyConsent(next));
            setDraft(next);
            setSavedConsent(next);
            setMessage(successMessage);
        } catch {
            setMessage("Enregistrement local impossible. Réessaie depuis les réglages.");
        } finally {
            setStatus("idle");
        }
    };

    const saveChoices = () => {
        const next = buildPrivacyConsentUpdate(savedConsent ?? draft, {
            crashReporting: draft.crashReporting,
            productAnalytics: draft.productAnalytics,
        });
        void persistConsent(next, "Choix de confidentialité enregistrés.");
    };

    const revokeAll = () => {
        void persistConsent(revokePrivacyConsent(), "Consentement révoqué pour les diagnostics optionnels.");
    };

    if (!loaded) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retour réglages"
                    onPress={() => router.replace("/settings")}
                    hitSlop={10}
                    style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.ink[900]} />
                </Pressable>
                <Text style={styles.eyebrow}>Réglages</Text>
                <Text style={styles.title}>Confidentialité</Text>
                <Text style={styles.body}>
                    Ces choix sont stockés localement et peuvent être modifiés ou révoqués à tout moment.
                </Text>
            </View>

            <View style={styles.preferenceGroup}>
                <PreferenceSwitch
                    title="Crash reporting"
                    body="Envoie des diagnostics techniques sans contenu conversationnel pour corriger les crashs."
                    value={draft.crashReporting}
                    onValueChange={(crashReporting) => setDraft({ ...draft, crashReporting })}
                />
                <PreferenceSwitch
                    title="Analytics produit"
                    body="Mesure les parcours utilisés sans IDFA ni tracking publicitaire."
                    value={draft.productAnalytics}
                    onValueChange={(productAnalytics) => setDraft({ ...draft, productAnalytics })}
                />
            </View>

            <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={18} color={theme.ink[500]} />
                <Text style={styles.metaText}>Dernière décision : {lastDecision}</Text>
            </View>

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <Pressable
                accessibilityRole="button"
                disabled={!hasChanges || status === "saving"}
                onPress={saveChoices}
                style={({ pressed }) => [
                    styles.primaryAction,
                    (!hasChanges || status === "saving") && styles.disabled,
                    pressed && hasChanges && status !== "saving" && styles.pressed,
                ]}
            >
                <Text style={styles.primaryActionText}>
                    {status === "saving" ? "Enregistrement..." : "Enregistrer mes choix"}
                </Text>
                <Ionicons name="checkmark" size={18} color="#fff" />
            </Pressable>

            <Pressable
                accessibilityRole="button"
                disabled={status === "saving"}
                onPress={revokeAll}
                style={({ pressed }) => [
                    styles.dangerAction,
                    status === "saving" && styles.disabled,
                    pressed && status !== "saving" && styles.pressed,
                ]}
            >
                <Ionicons name="close-circle-outline" size={18} color={theme.semantic.danger} />
                <Text style={styles.dangerActionText}>Révoquer tous les choix optionnels</Text>
            </Pressable>
        </ScrollView>
    );
}

function PreferenceSwitch({
    title,
    body,
    value,
    onValueChange,
}: {
    title: string;
    body: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}) {
    return (
        <View style={styles.preferenceRow}>
            <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>{title}</Text>
                <Text style={styles.preferenceBody}>{body}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: theme.ink[300], true: theme.accent.primary }}
                thumbColor="#fff"
            />
        </View>
    );
}

function formatDecisionDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date invalide";

    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
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
    preferenceGroup: {
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
    },
    preferenceRow: {
        minHeight: 96,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    preferenceText: {
        flex: 1,
        minWidth: 0,
    },
    preferenceTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: theme.ink[900],
    },
    preferenceBody: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        color: theme.ink[500],
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
    },
    metaText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        color: theme.ink[500],
    },
    message: {
        marginTop: theme.spacing.md,
        fontSize: 13,
        lineHeight: 18,
        color: theme.semantic.success,
        fontWeight: "700",
    },
    primaryAction: {
        minHeight: 50,
        marginTop: theme.spacing.xl,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.ink[900],
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
    },
    primaryActionText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
    },
    dangerAction: {
        minHeight: 48,
        marginTop: theme.spacing.sm,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.semantic.danger,
        backgroundColor: theme.surface.default,
    },
    dangerActionText: {
        color: theme.semantic.danger,
        fontSize: 14,
        fontWeight: "800",
    },
    disabled: {
        opacity: 0.45,
    },
    pressed: {
        opacity: 0.65,
    },
});
