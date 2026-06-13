import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { usePaginatedQuery } from "convex/react";
import { Avatar, Icon, Micro, NavButton, useTheme, type JokkoTheme } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ContactRecord = {
    _id: Id<"contacts">;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone: string;
    isWhatsApp?: boolean | null;
    createdAt: number;
};

export function MobileContactsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { colors, font } = theme;
    const [search, setSearch] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);

    const { results, status, loadMore, isLoading } = usePaginatedQuery(
        api.contacts.list,
        { search: search.trim() || undefined },
        { initialNumItems: 50 },
    );
    const contacts = useMemo(() => (results ?? []) as ContactRecord[], [results]);

    // Group the loaded contacts alphabetically (the list paginates newest-first,
    // so this groups the loaded set; more groups fill in as you scroll).
    const sections = useMemo(() => {
        const groups = new Map<string, ContactRecord[]>();
        for (const contact of contacts) {
            const first = displayName(contact).trim().charAt(0).toUpperCase();
            const key = /[A-ZÀ-Ý]/.test(first) ? first : "#";
            const bucket = groups.get(key);
            if (bucket) bucket.push(contact);
            else groups.set(key, [contact]);
        }
        return Array.from(groups.entries())
            .sort((a, b) => a[0].localeCompare(b[0], "fr"))
            .map(([title, data]) => ({
                title,
                data: data.sort((x, y) => displayName(x).localeCompare(displayName(y), "fr")),
            }));
    }, [contacts]);

    const isSearching = search.trim().length > 0;

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            {/* Header — eyebrow + title on the left, icons aligned to the title baseline on the right. */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Micro>{`${contacts.length}${status === "CanLoadMore" ? "+" : ""} dans cet espace`}</Micro>
                    <Text style={[styles.title, { fontFamily: font.display, color: colors.ink }]}>Contacts</Text>
                </View>
                <View style={styles.headerIcons}>
                    <NavButton icon="search" onPress={() => setSearchOpen((open) => !open)} />
                    <NavButton
                        icon="plus"
                        onPress={() =>
                            Alert.alert("Ajouter un contact", "Les contacts se créent automatiquement à la première conversation WhatsApp.")
                        }
                    />
                </View>
            </View>

            {searchOpen ? (
                <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                    <Icon name="search" size={17} color={colors.mute} strokeWidth={1.8} />
                    <TextInput
                        autoFocus
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Nom, numéro, e-mail"
                        placeholderTextColor={colors.mute}
                        style={{ flex: 1, fontSize: 15, color: colors.ink, fontFamily: font.sans, paddingVertical: 0 }}
                        returnKeyType="search"
                    />
                    {search.length > 0 ? (
                        <Pressable onPress={() => setSearch("")} hitSlop={8}>
                            <Icon name="close" size={16} color={colors.mute} />
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            <SectionList
                sections={sections}
                keyExtractor={(item) => item._id}
                stickySectionHeadersEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={contacts.length === 0 ? styles.emptyContent : styles.listContent}
                renderSectionHeader={({ section }) => (
                    <View style={[styles.sectionHeader, { backgroundColor: colors.paper }]}>
                        <Text style={{ fontFamily: font.serifItalic, fontSize: 25, color: colors.ink }}>{section.title}</Text>
                        <View style={[styles.sectionRule, { backgroundColor: colors.rule2 }]} />
                    </View>
                )}
                renderItem={({ item }) => (
                    <ContactRow contact={item} theme={theme} onPress={() => router.push(`/contacts/${item._id}`)} />
                )}
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                    if (status === "CanLoadMore") loadMore(50);
                }}
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.center}>
                            <ActivityIndicator color={colors.accent} />
                        </View>
                    ) : (
                        <View style={styles.center}>
                            <View style={[styles.emptyIcon, { backgroundColor: colors.paper2, borderColor: colors.rule }]}>
                                <Icon name="users" size={26} color={colors.mute} strokeWidth={1.6} />
                            </View>
                            <Text style={{ fontFamily: font.display, fontSize: 18, color: colors.ink }}>
                                {isSearching ? "Aucun contact trouvé" : "Aucun contact"}
                            </Text>
                            <Text style={{ marginTop: 6, maxWidth: 280, textAlign: "center", fontSize: 14, lineHeight: 20, color: colors.mute, fontFamily: font.sans }}>
                                {isSearching
                                    ? "Essaie un autre nom, numéro ou e-mail."
                                    : "Les contacts apparaîtront ici dès la première conversation WhatsApp."}
                            </Text>
                        </View>
                    )
                }
                ListFooterComponent={
                    status === "LoadingMore" ? (
                        <View style={styles.footer}>
                            <ActivityIndicator color={colors.mute} />
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

function ContactRow({ contact, theme, onPress }: { contact: ContactRecord; theme: JokkoTheme; onPress: () => void }) {
    const { colors, font } = theme;
    const name = displayName(contact);
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.row, { borderBottomColor: colors.rule2, backgroundColor: pressed ? colors.paper2 : colors.paper }]}
        >
            <Avatar name={name} size={40} status={contact.isWhatsApp ? "online" : undefined} />
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 15, color: colors.ink, fontFamily: font.sansMedium }}>
                    {name}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 11.5, color: colors.mute, fontFamily: font.mono, marginTop: 2 }}>
                    {contact.phone}
                </Text>
            </View>
            {contact.isWhatsApp ? <Icon name="whatsapp" size={18} color={colors.waGreen} strokeWidth={1.6} /> : null}
        </Pressable>
    );
}

function displayName(contact: ContactRecord): string {
    return (
        contact.name?.trim() ||
        [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim() ||
        contact.phone ||
        "Contact"
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 14,
    },
    headerLeft: { flex: 1, minWidth: 0, gap: 6 },
    title: { fontSize: 40, lineHeight: 42, letterSpacing: -1 },
    headerIcons: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 2 },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 18,
        marginBottom: 6,
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    listContent: { paddingBottom: 90 },
    emptyContent: { flexGrow: 1 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 4 },
    sectionRule: { flex: 1, height: StyleSheet.hairlineWidth },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
    footer: { paddingVertical: 20 },
});
