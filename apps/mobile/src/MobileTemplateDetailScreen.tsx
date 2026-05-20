import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type TemplateButton = {
    type: string;
    text: string;
    url?: string;
    phoneNumber?: string;
};

type TemplateDetail = {
    _id: Id<"templates">;
    name: string;
    slug?: string;
    description?: string;
    type: string;
    category: string;
    language: string;
    status?: string;
    body?: string;
    footer?: string;
    header?: { type: string; text?: string };
    buttons?: TemplateButton[];
    createdAt?: number;
    updatedAt?: number;
};

type Props = {
    templateId: string | null;
};

export function MobileTemplateDetailScreen({ templateId }: Props) {
    const router = useRouter();
    const typedId = templateId as Id<"templates"> | null;
    const template = useQuery(
        api.templates.queries.get,
        typedId ? { id: typedId } : "skip",
    ) as TemplateDetail | null | undefined;

    if (!typedId) {
        return (
            <ErrorState
                title="Modèle introuvable"
                body="L'identifiant du modèle est manquant."
                onBack={() => router.replace("/(tabs)/hub")}
            />
        );
    }

    if (template === undefined) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    if (template === null) {
        return (
            <ErrorState
                title="Modèle indisponible"
                body="Ce modèle n'existe pas dans l'organisation active."
                onBack={() => router.replace("/(tabs)/hub")}
            />
        );
    }

    const buttons = template.buttons ?? [];

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
                <View style={styles.statusRow}>
                    <Text style={styles.eyebrow}>{template.category}</Text>
                    <StatusPill status={template.status} />
                </View>
                <Text style={styles.title}>{template.name}</Text>
                <Text style={styles.subtitle}>
                    {template.type.toUpperCase()} · {template.language}
                </Text>
                {template.description ? (
                    <Text style={styles.description}>{template.description}</Text>
                ) : null}
            </View>

            {template.header ? (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>En-tête</Text>
                    <View style={styles.bubble}>
                        <Text style={styles.bubbleType}>
                            {template.header.type.toUpperCase()}
                        </Text>
                        {template.header.text ? (
                            <Text style={styles.bubbleText}>{template.header.text}</Text>
                        ) : null}
                    </View>
                </View>
            ) : null}

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Corps</Text>
                <View style={styles.bubble}>
                    <Text style={styles.bubbleText}>
                        {template.body ?? "Aucun corps de message."}
                    </Text>
                </View>
            </View>

            {template.footer ? (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Pied</Text>
                    <View style={styles.bubble}>
                        <Text style={styles.bubbleFooter}>{template.footer}</Text>
                    </View>
                </View>
            ) : null}

            {buttons.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Boutons</Text>
                    <View style={styles.buttonsGroup}>
                        {buttons.map((button, index) => (
                            <View key={`${button.type}-${index}`} style={styles.buttonRow}>
                                <Ionicons
                                    name={getButtonIcon(button.type)}
                                    size={16}
                                    color={theme.accent.primary}
                                />
                                <View style={styles.buttonText}>
                                    <Text style={styles.buttonLabel}>{button.text}</Text>
                                    <Text style={styles.buttonMeta}>
                                        {button.url ?? button.phoneNumber ?? button.type}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}

            <View style={styles.section}>
                <Text style={styles.helperText}>
                    Les modèles WhatsApp sont gérés depuis l'app web ou Meta Business Manager. Sur mobile,
                    vous pouvez uniquement les consulter.
                </Text>
            </View>
        </ScrollView>
    );
}

function StatusPill({ status }: { status?: string }) {
    if (!status) return null;
    const normalized = status.toUpperCase();
    const tone = statusTone(normalized);
    return (
        <View style={[styles.pill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.pillText, { color: tone.fg }]}>{normalized}</Text>
        </View>
    );
}

function statusTone(status: string): { bg: string; fg: string } {
    switch (status) {
        case "APPROVED":
            return { bg: "#DCFCE7", fg: "#166534" };
        case "PENDING":
            return { bg: "#FEF3C7", fg: "#92400E" };
        case "REJECTED":
            return { bg: "#FEE2E2", fg: "#991B1B" };
        default:
            return { bg: "#E0E7FF", fg: "#3730A3" };
    }
}

function getButtonIcon(type: string): IoniconName {
    if (type === "URL") return "link-outline";
    if (type === "PHONE_NUMBER") return "call-outline";
    if (type === "QUICK_REPLY") return "return-down-back-outline";
    return "radio-button-on-outline";
}

function ErrorState({
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
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.accent.primary,
        textTransform: "uppercase",
    },
    pill: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.pill,
    },
    pillText: { fontSize: 11, fontWeight: "800" },
    title: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: "800",
        color: theme.ink[900],
    },
    subtitle: {
        marginTop: theme.spacing.xs,
        fontSize: 13,
        color: theme.ink[500],
        fontWeight: "600",
    },
    description: {
        marginTop: theme.spacing.sm,
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[900],
    },
    section: { gap: theme.spacing.sm },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        color: theme.ink[500],
    },
    bubble: {
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
        gap: theme.spacing.xs,
    },
    bubbleType: {
        fontSize: 11,
        fontWeight: "800",
        color: theme.ink[500],
        textTransform: "uppercase",
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.ink[900],
    },
    bubbleFooter: {
        fontSize: 13,
        color: theme.ink[500],
    },
    buttonsGroup: { gap: theme.spacing.sm },
    buttonRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
    },
    buttonText: { flex: 1, minWidth: 0 },
    buttonLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.ink[900],
    },
    buttonMeta: {
        marginTop: 2,
        fontSize: 12,
        color: theme.ink[500],
    },
    helperText: {
        fontSize: 13,
        lineHeight: 19,
        color: theme.ink[500],
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
    pressed: { opacity: 0.7 },
});
