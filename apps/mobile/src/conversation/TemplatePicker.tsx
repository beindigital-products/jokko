import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { templateBodyHasPlaceholders } from "../lib/template-placeholders";

type TemplateRow = {
    _id: Id<"templates">;
    name: string;
    body?: string;
    language: string;
    category: string;
    status: string;
};

type Props = {
    disabled?: boolean;
    onSelect: (templateId: Id<"templates">) => void;
};

/**
 * Templates picker for the conversation composer.
 *
 * V1.5+ scope: lists APPROVED templates whose body has no `{{N}}`
 * placeholders. Templates with placeholders require a parameter-fill UI
 * that's intentionally deferred (avoids shipping a half-baked form).
 */
export function TemplatePicker({ disabled, onSelect }: Props) {
    const [open, setOpen] = useState(false);
    const templatesPage = useQuery(
        api.templates.queries.list,
        open ? { paginationOpts: { numItems: 50, cursor: null }, status: "APPROVED" } : "skip",
    );

    const approved = useMemo<TemplateRow[]>(() => {
        const list = (templatesPage?.page ?? []) as TemplateRow[];
        return list.filter((tpl) => !templateBodyHasPlaceholders(tpl.body ?? ""));
    }, [templatesPage]);

    return (
        <>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Insérer un modèle WhatsApp"
                disabled={disabled}
                onPress={() => setOpen(true)}
                hitSlop={8}
                style={({ pressed }) => [
                    styles.iconButton,
                    disabled && styles.disabled,
                    pressed && !disabled && styles.pressed,
                ]}
            >
                <Ionicons name="document-text-outline" size={20} color={theme.ink[900]} />
            </Pressable>

            <Modal
                visible={open}
                transparent
                animationType="slide"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable
                    accessibilityLabel="Fermer la sélection de modèle"
                    style={styles.backdrop}
                    onPress={() => setOpen(false)}
                />
                <View style={styles.sheet}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>Modèles WhatsApp</Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setOpen(false)}
                            hitSlop={10}
                            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                        >
                            <Ionicons name="close" size={20} color={theme.ink[700]} />
                        </Pressable>
                    </View>

                    {templatesPage === undefined ? (
                        <View style={styles.center}>
                            <ActivityIndicator color={theme.accent.primary} />
                        </View>
                    ) : approved.length === 0 ? (
                        <View style={styles.center}>
                            <Text style={styles.emptyTitle}>Aucun modèle disponible</Text>
                            <Text style={styles.emptyBody}>
                                Seuls les modèles APPROUVÉS sans paramètres apparaissent ici.
                            </Text>
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.list}>
                            {approved.map((tpl) => (
                                <Pressable
                                    key={tpl._id}
                                    accessibilityRole="button"
                                    onPress={() => {
                                        setOpen(false);
                                        onSelect(tpl._id);
                                    }}
                                    style={({ pressed }) => [
                                        styles.templateRow,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <View style={styles.templateHeader}>
                                        <Text style={styles.templateName} numberOfLines={1}>
                                            {tpl.name}
                                        </Text>
                                        <Text style={styles.templateMeta}>
                                            {tpl.language.toUpperCase()}
                                        </Text>
                                    </View>
                                    {tpl.body ? (
                                        <Text style={styles.templateBody} numberOfLines={3}>
                                            {tpl.body}
                                        </Text>
                                    ) : null}
                                </Pressable>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    sheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "70%",
        backgroundColor: theme.surface.default,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: theme.spacing.xl,
    },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: theme.ink[900],
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    list: {
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    templateRow: {
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        gap: theme.spacing.xs,
    },
    templateHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    templateName: {
        flex: 1,
        fontSize: 14,
        fontWeight: "800",
        color: theme.ink[900],
    },
    templateMeta: {
        fontSize: 10,
        fontWeight: "800",
        color: theme.ink[500],
        backgroundColor: theme.surface.sunken,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    templateBody: {
        fontSize: 13,
        lineHeight: 18,
        color: theme.ink[700],
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.xl,
        minHeight: 180,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: theme.ink[900],
    },
    emptyBody: {
        marginTop: theme.spacing.xs,
        textAlign: "center",
        fontSize: 13,
        color: theme.ink[500],
        maxWidth: 280,
    },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.65 },
});
