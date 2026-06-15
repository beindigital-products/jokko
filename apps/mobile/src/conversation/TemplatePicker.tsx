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
import { useQuery } from "convex/react";
import { Icon, useTheme } from "@jokko/ui-mobile";
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
    /** Controlled open state — when provided the picker is driven by the parent. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Hide the built-in icon trigger (the parent renders its own CTA). */
    hideTrigger?: boolean;
};

/**
 * Templates picker for the conversation composer.
 *
 * V1.5+ scope: lists APPROVED templates whose body has no `{{N}}`
 * placeholders. Templates with placeholders require a parameter-fill UI
 * that's intentionally deferred (avoids shipping a half-baked form).
 */
export function TemplatePicker({ disabled, onSelect, open: controlledOpen, onOpenChange, hideTrigger }: Props) {
    const { colors, font } = useTheme();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = (value: boolean) => {
        if (onOpenChange) onOpenChange(value);
        else setInternalOpen(value);
    };

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
            {hideTrigger ? null : (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Insérer un modèle WhatsApp"
                    disabled={disabled}
                    onPress={() => setOpen(true)}
                    hitSlop={8}
                    style={({ pressed }) => [
                        styles.iconButton,
                        { backgroundColor: colors.card, borderColor: colors.rule },
                        disabled && styles.disabled,
                        pressed && !disabled && styles.pressed,
                    ]}
                >
                    <Icon name="sticky-note" size={19} color={colors.ink} strokeWidth={1.7} />
                </Pressable>
            )}

            <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
                <Pressable accessibilityLabel="Fermer la sélection de modèle" style={styles.backdrop} onPress={() => setOpen(false)} />
                <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                    <View style={styles.handle}>
                        <View style={[styles.handleBar, { backgroundColor: colors.rule }]} />
                    </View>
                    <View style={[styles.sheetHeader, { borderBottomColor: colors.rule }]}>
                        <View>
                            <Text style={[styles.eyebrow, { color: colors.mute, fontFamily: font.mono }]}>WHATSAPP</Text>
                            <Text style={[styles.sheetTitle, { color: colors.ink, fontFamily: font.display }]}>Modèles approuvés</Text>
                        </View>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setOpen(false)}
                            hitSlop={10}
                            style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.card }, pressed && styles.pressed]}
                        >
                            <Icon name="close" size={18} color={colors.ink3} />
                        </Pressable>
                    </View>

                    {templatesPage === undefined ? (
                        <View style={styles.center}>
                            <ActivityIndicator color={colors.accent} />
                        </View>
                    ) : approved.length === 0 ? (
                        <View style={styles.center}>
                            <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: font.sansSemibold }]}>Aucun modèle disponible</Text>
                            <Text style={[styles.emptyBody, { color: colors.mute, fontFamily: font.sans }]}>
                                Seuls les modèles approuvés sans paramètres apparaissent ici.
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
                                        { backgroundColor: colors.card, borderColor: colors.rule },
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <View style={styles.templateHeader}>
                                        <Text style={[styles.templateName, { color: colors.ink, fontFamily: font.sansSemibold }]} numberOfLines={1}>
                                            {tpl.name}
                                        </Text>
                                        <Text style={[styles.templateMeta, { color: colors.mute, fontFamily: font.mono, backgroundColor: colors.paper2 }]}>
                                            {tpl.language.toUpperCase()}
                                        </Text>
                                    </View>
                                    {tpl.body ? (
                                        <Text style={[styles.templateBody, { color: colors.ink3, fontFamily: font.sans }]} numberOfLines={3}>
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
        borderWidth: StyleSheet.hairlineWidth,
    },
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
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    eyebrow: { fontSize: 10, letterSpacing: 1.2, marginBottom: 3 },
    sheetTitle: { fontSize: 20, letterSpacing: -0.3 },
    closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    list: { padding: 16, gap: 10 },
    templateRow: { padding: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 6 },
    templateHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
    templateName: { flex: 1, fontSize: 14.5 },
    templateMeta: { fontSize: 10, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
    templateBody: { fontSize: 13, lineHeight: 18 },
    center: { alignItems: "center", justifyContent: "center", padding: 32, minHeight: 200 },
    emptyTitle: { fontSize: 16 },
    emptyBody: { marginTop: 6, textAlign: "center", fontSize: 13, lineHeight: 18, maxWidth: 280 },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.65 },
});
