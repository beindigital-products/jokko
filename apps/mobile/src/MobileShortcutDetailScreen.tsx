import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { Btn, Icon, Micro, NavBar, NavButton, useTheme, type JokkoTheme } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ShortcutSheet } from "./conversation/ShortcutSheet";

type ShortcutDetail = {
    _id: Id<"shortcuts">;
    shortcut: string;
    text?: string;
    type?: string;
    createdAt: number;
    updatedAt?: number;
};

export function MobileShortcutDetailScreen({ shortcutId }: { shortcutId: string | null }) {
    const router = useRouter();
    const theme = useTheme();
    const { colors, font } = theme;
    const typedId = shortcutId as Id<"shortcuts"> | null;
    const shortcut = useQuery(api.shortcuts.get, typedId ? { id: typedId } : "skip") as
        | ShortcutDetail
        | null
        | undefined;
    const deleteShortcut = useMutation(api.shortcuts.deleteShortcut);
    const [busy, setBusy] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)/hub");
    };

    if (!typedId || shortcut === null) {
        return (
            <ErrorState
                theme={theme}
                title={!typedId ? "Raccourci introuvable" : "Raccourci indisponible"}
                body={!typedId ? "L'identifiant du raccourci est manquant." : "Ce raccourci n'existe pas dans l'organisation active."}
                onBack={goBack}
            />
        );
    }

    if (shortcut === undefined) {
        return (
            <View style={[styles.center, { backgroundColor: colors.paper }]}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    const name = shortcut.shortcut.replace(/^\//, "");
    const text = shortcut.text ?? "";

    const confirmDelete = () => {
        Alert.alert("Supprimer ce raccourci ?", "Cette action est définitive.", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Supprimer",
                style: "destructive",
                onPress: async () => {
                    setBusy(true);
                    try {
                        await deleteShortcut({ id: shortcut._id });
                        goBack();
                    } catch (error) {
                        Alert.alert("Suppression impossible", error instanceof Error ? error.message : "Réessaie.");
                    } finally {
                        setBusy(false);
                    }
                },
            },
        ]);
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            <NavBar
                left={<NavButton icon="chevron-left" onPress={goBack} />}
                center="Raccourci"
                right={<NavButton icon="edit" onPress={() => setEditOpen(true)} />}
            />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Micro>{(shortcut.type ?? "TEXT").toUpperCase()} · CRÉÉ LE {formatDate(shortcut.createdAt)}</Micro>

                <View style={[styles.nameChip, { backgroundColor: colors.ink }]}>
                    <Text style={{ fontFamily: font.monoMedium, fontSize: 22, color: colors.paper, letterSpacing: -0.4 }}>
                        /{name}
                    </Text>
                </View>

                <Micro style={{ marginTop: 24, marginBottom: 8 }}>Réponse</Micro>
                <View style={[styles.replyCard, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                    <Text style={{ fontSize: 15, lineHeight: 22, color: text ? colors.ink : colors.mute, fontFamily: font.sans }}>
                        {text || "Aucun texte associé."}
                    </Text>
                </View>

                <Text style={[styles.hint, { color: colors.mute, fontFamily: font.sans }]}>
                    Dans une conversation, tape « /{name} » puis Entrée pour insérer cette réponse.
                </Text>

                <View style={{ marginTop: 28 }}>
                    <Btn tone="danger" full icon="trash" disabled={busy} onPress={confirmDelete}>
                        {busy ? "Suppression…" : "Supprimer le raccourci"}
                    </Btn>
                </View>
            </ScrollView>

            <ShortcutSheet visible={editOpen} existing={shortcut} onClose={() => setEditOpen(false)} />
        </View>
    );
}

function formatDate(value: number): string {
    try {
        return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
        return "—";
    }
}

function ErrorState({ theme, title, body, onBack }: { theme: JokkoTheme; title: string; body: string; onBack: () => void }) {
    const { colors, font } = theme;
    return (
        <View style={[styles.center, { backgroundColor: colors.paper, padding: 32, gap: 12 }]}>
            <Icon name="bolt" size={30} color={colors.mute} strokeWidth={1.5} />
            <Text style={{ fontFamily: font.display, fontSize: 20, color: colors.ink, textAlign: "center" }}>{title}</Text>
            <Text style={{ fontSize: 14, color: colors.mute, textAlign: "center", maxWidth: 300, fontFamily: font.sans }}>{body}</Text>
            <View style={{ marginTop: 6 }}>
                <Btn tone="ghost" onPress={onBack}>Retour au Hub</Btn>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    content: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 32 },
    nameChip: { alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    replyCard: { padding: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
    hint: { fontSize: 12.5, lineHeight: 18, marginTop: 14 },
});
