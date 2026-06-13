import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { usePaginatedQuery } from "convex/react";
import { Btn, Icon, NavButton, Pill, useTheme, type JokkoTheme } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ShortcutSheet } from "./conversation/ShortcutSheet";

type HubListType = "templates" | "shortcuts";

type TemplateRecord = { _id: Id<"templates">; name: string; category?: string; status?: string; body?: string };
type ShortcutRecord = { _id: Id<"shortcuts">; shortcut: string; text?: string };

export function MobileHubListScreen({ type, focusSearch = false }: { type: HubListType; focusSearch?: boolean }) {
    const router = useRouter();
    const theme = useTheme();
    const { colors, font } = theme;
    const [search, setSearch] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const isTemplates = type === "templates";
    const query = search.trim() || undefined;

    const templatesPage = usePaginatedQuery(api.templates.queries.list, isTemplates ? { search: query } : "skip", { initialNumItems: 30 });
    const shortcutsPage = usePaginatedQuery(api.shortcuts.list, isTemplates ? "skip" : { search: query }, { initialNumItems: 30 });
    const page = isTemplates ? templatesPage : shortcutsPage;

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace("/hub");
    };

    const data = (page.results ?? []) as (TemplateRecord | ShortcutRecord)[];

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            <View style={[styles.navBar, { borderBottomColor: colors.rule2 }]}>
                <NavButton icon="chevron-left" onPress={goBack} />
                <Text style={{ flex: 1, textAlign: "center", fontFamily: font.sansSemibold, fontSize: 15, color: colors.ink }}>
                    {isTemplates ? "Modèles WhatsApp" : "Réponses rapides"}
                </Text>
                {isTemplates ? (
                    <View style={{ width: 40 }} />
                ) : (
                    <NavButton icon="plus" onPress={() => setSheetOpen(true)} />
                )}
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                <Icon name="search" size={17} color={colors.mute} strokeWidth={1.8} />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={isTemplates ? "Chercher un modèle" : "Chercher un raccourci"}
                    placeholderTextColor={colors.mute}
                    autoCapitalize="none"
                    autoFocus={focusSearch}
                    style={{ flex: 1, fontSize: 15, color: colors.ink, fontFamily: font.sans, paddingVertical: 0 }}
                    returnKeyType="search"
                />
            </View>

            <FlatList
                data={data}
                keyExtractor={(item) => item._id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={data.length === 0 ? styles.emptyContent : styles.listContent}
                renderItem={({ item }) =>
                    isTemplates ? (
                        <TemplateRow theme={theme} template={item as TemplateRecord} onPress={() => router.push(`/hub/templates/${item._id}`)} />
                    ) : (
                        <ShortcutRow theme={theme} shortcut={item as ShortcutRecord} onPress={() => router.push(`/hub/shortcuts/${item._id}`)} />
                    )
                }
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                    if (page.status === "CanLoadMore") page.loadMore(30);
                }}
                ListEmptyComponent={
                    page.isLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator color={colors.accent} />
                        </View>
                    ) : (
                        <View style={styles.center}>
                            <Text style={{ fontFamily: font.display, fontSize: 17, color: colors.ink }}>
                                {isTemplates ? "Aucun modèle" : "Aucun raccourci"}
                            </Text>
                            <Text style={{ marginTop: 6, fontSize: 14, color: colors.mute, fontFamily: font.sans, textAlign: "center", maxWidth: 280 }}>
                                {search ? "Essaie une autre recherche." : isTemplates ? "Crée tes modèles depuis le tableau de bord web." : "Ajoute des raccourcis pour répondre plus vite."}
                            </Text>
                            {!isTemplates && !search ? (
                                <View style={{ marginTop: 16 }}>
                                    <Btn tone="accent" icon="plus" onPress={() => setSheetOpen(true)}>
                                        Nouveau raccourci
                                    </Btn>
                                </View>
                            ) : null}
                        </View>
                    )
                }
                ListFooterComponent={page.status === "LoadingMore" ? <View style={styles.footer}><ActivityIndicator color={colors.mute} /></View> : null}
            />

            <ShortcutSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
        </View>
    );
}

function TemplateRow({ theme, template, onPress }: { theme: JokkoTheme; template: TemplateRecord; onPress: () => void }) {
    const { colors, font } = theme;
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: colors.rule2, backgroundColor: pressed ? colors.paper2 : colors.paper }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name="sticky-note" size={18} color={colors.ink3} strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14.5, color: colors.ink, fontFamily: font.sansMedium, flexShrink: 1 }}>{template.name}</Text>
                    {template.status && template.status !== "APPROVED" ? <Pill tone="warn" size="sm">en attente</Pill> : null}
                </View>
                {template.body ? (
                    <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.mute, fontFamily: font.sans, marginTop: 3 }}>{template.body}</Text>
                ) : null}
            </View>
            {template.category ? <Pill tone={template.category.toLowerCase() === "marketing" ? "accent" : "mute"} size="sm">{template.category}</Pill> : null}
        </Pressable>
    );
}

function ShortcutRow({ theme, shortcut, onPress }: { theme: JokkoTheme; shortcut: ShortcutRecord; onPress: () => void }) {
    const { colors, font } = theme;
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: colors.rule2, backgroundColor: pressed ? colors.paper2 : colors.paper }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name="bolt" size={18} color={colors.accentInk} strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 14.5, color: colors.ink, fontFamily: font.monoMedium }}>/{shortcut.shortcut.replace(/^\//, "")}</Text>
                {shortcut.text ? (
                    <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.mute, fontFamily: font.sans, marginTop: 3 }}>{shortcut.text}</Text>
                ) : null}
            </View>
            <Icon name="chevron-right" size={18} color={colors.mute2} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    navBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
    searchBox: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 18, marginTop: 10, marginBottom: 4, paddingHorizontal: 12, height: 44, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
    listContent: { paddingBottom: 40 },
    emptyContent: { flexGrow: 1 },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    footer: { paddingVertical: 20 },
});
