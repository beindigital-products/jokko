import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation } from "convex/react";
import { Btn, Icon, Micro, useTheme, type JokkoTheme } from "@jokko/ui-mobile";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type EditableShortcut = {
    _id: Id<"shortcuts">;
    shortcut: string;
    text?: string | null;
};

type Props = {
    visible: boolean;
    existing?: EditableShortcut | null;
    onClose: () => void;
};

export function ShortcutSheet({ visible, existing, onClose }: Props) {
    const theme = useTheme();
    const { colors, font } = theme;
    const createShortcut = useMutation(api.shortcuts.create);
    const updateShortcut = useMutation(api.shortcuts.update);
    const isEdit = Boolean(existing);

    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!visible) return;
        // Show the shortcut without its leading "/" — the field renders the slash.
        setName((existing?.shortcut ?? "").replace(/^\//, ""));
        setText(existing?.text ?? "");
    }, [visible, existing]);

    const save = async () => {
        const cleanName = name.trim().replace(/^\//, "").replace(/\s+/g, "");
        if (cleanName.length < 2) {
            Alert.alert("Raccourci invalide", "Choisis un nom d'au moins 2 caractères (ex. merci).");
            return;
        }
        if (text.trim().length === 0) {
            Alert.alert("Réponse vide", "Renseigne le texte envoyé par ce raccourci.");
            return;
        }
        setBusy(true);
        try {
            if (existing) {
                await updateShortcut({ id: existing._id, shortcut: cleanName, text: text.trim() });
            } else {
                await createShortcut({ shortcut: cleanName, text: text.trim() });
            }
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Réessaie.";
            Alert.alert("Enregistrement impossible", message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kav} pointerEvents="box-none">
                <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                    <View style={styles.handle}>
                        <View style={[styles.handleBar, { backgroundColor: colors.rule }]} />
                    </View>
                    <View style={[styles.header, { borderBottomColor: colors.rule }]}>
                        <Text style={[styles.title, { color: colors.ink, fontFamily: font.display }]}>
                            {isEdit ? "Modifier le raccourci" : "Nouveau raccourci"}
                        </Text>
                        <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.card }]}>
                            <Icon name="close" size={17} color={colors.ink3} />
                        </Pressable>
                    </View>
                    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                        <View style={{ gap: 6 }}>
                            <Micro>Raccourci</Micro>
                            <View style={[styles.slashField, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                                <Text style={{ fontFamily: font.monoMedium, fontSize: 16, color: colors.accentInk }}>/</Text>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="merci"
                                    placeholderTextColor={colors.mute}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={{ flex: 1, fontSize: 16, color: colors.ink, fontFamily: font.mono, padding: 0 }}
                                />
                            </View>
                            <Text style={{ fontSize: 11.5, color: colors.mute, fontFamily: font.sans }}>
                                Tape « /{name.trim().replace(/^\//, "") || "merci"} » dans une conversation pour l'insérer.
                            </Text>
                        </View>

                        <View style={{ gap: 6 }}>
                            <Micro>Réponse</Micro>
                            <TextInput
                                value={text}
                                onChangeText={setText}
                                placeholder="Merci pour votre message ! Nous revenons vers vous très vite."
                                placeholderTextColor={colors.mute}
                                multiline
                                style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.rule, color: colors.ink, fontFamily: font.sans }]}
                            />
                        </View>

                        <View style={{ marginTop: 4 }}>
                            <Btn tone="accent" full disabled={busy} onPress={() => void save()}>
                                {busy ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le raccourci"}
                            </Btn>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
    kav: { flex: 1, justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28, maxHeight: "88%" },
    handle: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
    handleBar: { width: 38, height: 4, borderRadius: 2 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    title: { fontSize: 18, letterSpacing: -0.2 },
    close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    body: { paddingHorizontal: 18, paddingTop: 14, gap: 16, paddingBottom: 8 },
    slashField: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14 },
    textArea: { minHeight: 110, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, lineHeight: 21, textAlignVertical: "top" },
});
