import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";

type Preferences = {
    newMessages: boolean;
    assignments: boolean;
    mentions: boolean;
    systemAlerts: boolean;
    dndEnabled: boolean;
    dndStartHour: number;
    dndEndHour: number;
    dndWeekendsOnly: boolean;
    dndTimezone: string;
};

const DEFAULT_PREFS: Preferences = {
    newMessages: true,
    assignments: true,
    mentions: true,
    systemAlerts: true,
    dndEnabled: false,
    dndStartHour: 22,
    dndEndHour: 8,
    dndWeekendsOnly: false,
    dndTimezone: "UTC",
};

export function NotificationsSettingsScreen() {
    const router = useRouter();
    const remote = useQuery(api.notifications.getMyNotificationPreferences) as
        | (Preferences & { _id: string })
        | null
        | undefined;
    const save = useMutation(api.notifications.saveNotificationPreferences);

    const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (remote === undefined) return;
        if (remote === null) {
            setPrefs(DEFAULT_PREFS);
        } else {
            setPrefs({
                newMessages: remote.newMessages,
                assignments: remote.assignments,
                mentions: remote.mentions,
                systemAlerts: remote.systemAlerts,
                dndEnabled: remote.dndEnabled,
                dndStartHour: remote.dndStartHour,
                dndEndHour: remote.dndEndHour,
                dndWeekendsOnly: remote.dndWeekendsOnly,
                dndTimezone: remote.dndTimezone,
            });
        }
        setHasLoaded(true);
    }, [remote]);

    const masterEnabled = useMemo(
        () =>
            prefs.newMessages || prefs.assignments || prefs.mentions || prefs.systemAlerts,
        [prefs],
    );

    function patch(part: Partial<Preferences>) {
        setPrefs((current) => ({ ...current, ...part }));
    }

    async function persist(part: Partial<Preferences>) {
        const next = { ...prefs, ...part };
        setPrefs(next);
        setIsSaving(true);
        try {
            await save({
                newMessages: next.newMessages,
                assignments: next.assignments,
                mentions: next.mentions,
                systemAlerts: next.systemAlerts,
                dndEnabled: next.dndEnabled,
                dndStartHour: next.dndStartHour,
                dndEndHour: next.dndEndHour,
                dndWeekendsOnly: next.dndWeekendsOnly,
                dndTimezone: next.dndTimezone,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur inconnue";
            Alert.alert("Sauvegarde impossible", message);
        } finally {
            setIsSaving(false);
        }
    }

    function bumpHour(part: "dndStartHour" | "dndEndHour", delta: number) {
        const current = prefs[part];
        const next = ((current + delta) % 24 + 24) % 24;
        void persist({ [part]: next } as Partial<Preferences>);
    }

    if (!hasLoaded) {
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
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.ink[900]} />
                    <Text style={styles.backText}>Plus</Text>
                </Pressable>
                <Text style={styles.eyebrow}>Notifications</Text>
                <Text style={styles.title}>Préférences</Text>
                <Text style={styles.body}>
                    Choisissez les types de notifications que vous voulez recevoir et planifiez vos heures
                    de silence.
                </Text>
                {!masterEnabled ? (
                    <Text style={styles.warning}>
                        Toutes les catégories sont désactivées. Vous ne recevrez plus aucune notification
                        push.
                    </Text>
                ) : null}
            </View>

            <Section title="Catégories">
                <ToggleRow
                    icon="chatbubble-ellipses-outline"
                    title="Nouveaux messages"
                    body="Notifier à chaque nouveau message WhatsApp entrant."
                    value={prefs.newMessages}
                    onValueChange={(value) => persist({ newMessages: value })}
                />
                <ToggleRow
                    icon="person-add-outline"
                    title="Assignations"
                    body="Notifier quand une conversation vous est attribuée."
                    value={prefs.assignments}
                    onValueChange={(value) => persist({ assignments: value })}
                />
                <ToggleRow
                    icon="at-outline"
                    title="Mentions"
                    body="Notifier quand un coéquipier vous mentionne."
                    value={prefs.mentions}
                    onValueChange={(value) => persist({ mentions: value })}
                />
                <ToggleRow
                    icon="information-circle-outline"
                    title="Alertes système"
                    body="Quotas, problèmes de connexion, mises à jour importantes."
                    value={prefs.systemAlerts}
                    onValueChange={(value) => persist({ systemAlerts: value })}
                />
            </Section>

            <Section title="Ne pas déranger">
                <ToggleRow
                    icon="moon-outline"
                    title="Activer DND"
                    body="Couper les notifications pendant une plage horaire."
                    value={prefs.dndEnabled}
                    onValueChange={(value) => persist({ dndEnabled: value })}
                />
                <ToggleRow
                    icon="calendar-outline"
                    title="Week-ends uniquement"
                    body="Appliquer DND seulement le samedi et dimanche."
                    value={prefs.dndWeekendsOnly}
                    onValueChange={(value) => persist({ dndWeekendsOnly: value })}
                    disabled={!prefs.dndEnabled}
                />
                <HourRow
                    label="Début"
                    value={prefs.dndStartHour}
                    disabled={!prefs.dndEnabled}
                    onIncrement={() => bumpHour("dndStartHour", 1)}
                    onDecrement={() => bumpHour("dndStartHour", -1)}
                />
                <HourRow
                    label="Fin"
                    value={prefs.dndEndHour}
                    disabled={!prefs.dndEnabled}
                    onIncrement={() => bumpHour("dndEndHour", 1)}
                    onDecrement={() => bumpHour("dndEndHour", -1)}
                />
                <Text style={styles.timezoneNote}>Fuseau horaire : {prefs.dndTimezone}</Text>
            </Section>

            <Pressable
                accessibilityRole="button"
                onPress={() => {
                    void persist({
                        newMessages: true,
                        assignments: true,
                        mentions: true,
                        systemAlerts: true,
                        dndEnabled: false,
                    });
                    patch({ dndStartHour: 22, dndEndHour: 8, dndWeekendsOnly: false });
                }}
                style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
            >
                <Ionicons name="refresh-outline" size={16} color={theme.ink[900]} />
                <Text style={styles.resetText}>Réinitialiser</Text>
            </Pressable>

            {isSaving ? <Text style={styles.savingText}>Sauvegarde...</Text> : null}
        </ScrollView>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>{title}</Text>
            <View style={styles.card}>{children}</View>
        </View>
    );
}

function ToggleRow({
    icon,
    title,
    body,
    value,
    onValueChange,
    disabled,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    body: string;
    value: boolean;
    onValueChange: (next: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <View style={[styles.row, disabled && styles.disabled]}>
            <View style={styles.rowIcon}>
                <Ionicons name={icon} size={20} color={theme.accent.primary} />
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowBody}>{body}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ true: theme.accent.primary, false: theme.ink[300] }}
            />
        </View>
    );
}

function HourRow({
    label,
    value,
    disabled,
    onIncrement,
    onDecrement,
}: {
    label: string;
    value: number;
    disabled?: boolean;
    onIncrement: () => void;
    onDecrement: () => void;
}) {
    return (
        <View style={[styles.row, disabled && styles.disabled]}>
            <View style={styles.rowIcon}>
                <Ionicons name="time-outline" size={20} color={theme.accent.primary} />
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{label}</Text>
                <Text style={styles.rowBody}>{formatHour(value)}</Text>
            </View>
            <View style={styles.stepper}>
                <Pressable
                    accessibilityRole="button"
                    disabled={disabled}
                    onPress={onDecrement}
                    style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                >
                    <Ionicons name="remove" size={16} color={theme.ink[900]} />
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    disabled={disabled}
                    onPress={onIncrement}
                    style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
                >
                    <Ionicons name="add" size={16} color={theme.ink[900]} />
                </Pressable>
            </View>
        </View>
    );
}

function formatHour(hour: number): string {
    return `${String(hour).padStart(2, "0")}:00`;
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
    backText: { fontSize: 14, fontWeight: "700", color: theme.ink[900] },
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
    body: {
        marginTop: theme.spacing.xs,
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[500],
    },
    warning: {
        marginTop: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.md,
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        fontSize: 13,
        fontWeight: "700",
    },
    section: { gap: theme.spacing.sm },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        color: theme.ink[500],
    },
    card: {
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
        overflow: "hidden",
    },
    row: {
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.sunken,
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 15, fontWeight: "800", color: theme.ink[900] },
    rowBody: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 17,
        color: theme.ink[500],
    },
    stepper: {
        flexDirection: "row",
        gap: theme.spacing.xs,
    },
    stepperButton: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.sunken,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    timezoneNote: {
        marginTop: theme.spacing.xs,
        fontSize: 12,
        color: theme.ink[500],
    },
    resetButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 10,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    resetText: {
        fontSize: 13,
        fontWeight: "700",
        color: theme.ink[900],
    },
    savingText: {
        textAlign: "center",
        fontSize: 12,
        color: theme.ink[500],
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.7 },
});
