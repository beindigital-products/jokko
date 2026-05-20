import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePaginatedQuery, useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ContactRecord = {
    _id: Id<"contacts">;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone: string;
    email?: string | null;
    company?: string | null;
    isWhatsApp?: boolean | null;
    tags?: unknown[];
    createdAt: number;
};

export function MobileContactsScreen() {
    const router = useRouter();
    const session = useQuery(api.sessions.current);
    const organizations = useQuery(api.organizations.listMine);
    const [search, setSearch] = useState("");
    const {
        results,
        status,
        loadMore,
        isLoading,
    } = usePaginatedQuery(
        api.contacts.list,
        { search: search.trim() || undefined },
        { initialNumItems: 30 },
    );

    const activeOrganization = session?.organization ?? organizations?.[0] ?? null;
    const contacts = useMemo(() => (results ?? []) as ContactRecord[], [results]);
    const whatsappCount = contacts.filter((contact) => contact.isWhatsApp).length;
    const isLoadingMore = status === "LoadingMore";
    const canLoadMore = status === "CanLoadMore" || isLoadingMore;

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Text style={styles.orgName}>{activeOrganization?.name ?? "Jokko"}</Text>
                <Text style={styles.title}>Contacts</Text>
                <Text style={styles.subtitle}>Retrouve les clients WhatsApp, leurs sociétés et les derniers contacts importés.</Text>

                <View style={styles.statsRow}>
                    <StatusPill icon="people-outline" label={`${contacts.length} chargés`} />
                    <StatusPill icon="logo-whatsapp" label={`${whatsappCount} WhatsApp`} accent={whatsappCount > 0} />
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={theme.ink[500]} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Nom, numéro, email"
                        placeholderTextColor={theme.ink[500]}
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {isLoading && contacts.length === 0 ? (
                <LoadingState />
            ) : contacts.length === 0 ? (
                <EmptyContactsState search={search} />
            ) : (
                <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
                    {contacts.map((contact) => (
                        <ContactRow
                            key={contact._id}
                            contact={contact}
                            onPress={() => router.push({
                                pathname: "/contacts/[id]",
                                params: { id: contact._id },
                            } as never)}
                        />
                    ))}

                    {canLoadMore ? (
                        <Pressable
                            accessibilityRole="button"
                            disabled={isLoadingMore}
                            onPress={() => loadMore(30)}
                            style={({ pressed }) => [
                                styles.loadMoreButton,
                                isLoadingMore && styles.disabled,
                                pressed && !isLoadingMore && styles.pressed,
                            ]}
                        >
                            <Text style={styles.loadMoreText}>
                                {isLoadingMore ? "Chargement..." : "Charger plus"}
                            </Text>
                        </Pressable>
                    ) : (
                        <Text style={styles.endText}>Fin de la liste</Text>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

function ContactRow({ contact, onPress }: { contact: ContactRecord; onPress: () => void }) {
    const displayName = getContactDisplayName(contact);
    const tags = (contact.tags ?? []).map(getTagName).filter(Boolean).slice(0, 2);

    return (
        <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}>
            <View style={[styles.avatar, contact.isWhatsApp && styles.avatarWhatsapp]}>
                <Text style={styles.avatarText}>{getContactInitials(displayName)}</Text>
            </View>
            <View style={styles.contactText}>
                <View style={styles.contactTitleRow}>
                    <Text style={styles.contactTitle} numberOfLines={1}>{displayName}</Text>
                    {contact.isWhatsApp ? (
                        <View style={styles.whatsappBadge}>
                            <Ionicons name="logo-whatsapp" size={12} color={theme.accent.primary} />
                        </View>
                    ) : null}
                </View>
                <Text style={styles.contactPhone} numberOfLines={1}>{contact.phone}</Text>
                <View style={styles.metaRow}>
                    <Text style={styles.metaText} numberOfLines={1}>
                        {contact.company || contact.email || `Ajouté ${formatShortDate(contact.createdAt)}`}
                    </Text>
                </View>
                {tags.length > 0 ? (
                    <View style={styles.tagsRow}>
                        {tags.map((tag) => (
                            <View key={tag} style={styles.tagPill}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.ink[500]} />
        </Pressable>
    );
}

function EmptyContactsState({ search }: { search: string }) {
    return (
        <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={30} color={theme.accent.primary} />
            </View>
            <Text style={styles.emptyTitle}>{search ? "Aucun contact trouvé" : "Aucun contact"}</Text>
            <Text style={styles.emptyBody}>
                {search
                    ? "Essaie un autre nom, numéro ou email."
                    : "Les contacts apparaîtront ici dès qu'une conversation WhatsApp ou un import est disponible."}
            </Text>
        </View>
    );
}

function LoadingState() {
    return (
        <View style={styles.loading}>
            <ActivityIndicator color={theme.accent.primary} />
        </View>
    );
}

function StatusPill({ icon, label, accent = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; accent?: boolean }) {
    return (
        <View style={[styles.statusPill, accent && styles.statusPillAccent]}>
            <Ionicons name={icon} size={14} color={accent ? theme.accent.primary : theme.ink[500]} />
            <Text style={[styles.statusPillText, accent && styles.statusPillTextAccent]}>{label}</Text>
        </View>
    );
}

function getContactDisplayName(contact: ContactRecord): string {
    const fullName = contact.name?.trim();
    if (fullName) return fullName;
    const composed = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
    return composed || contact.phone || "Contact inconnu";
}

function getContactInitials(displayName: string): string {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getTagName(tag: unknown): string {
    if (typeof tag === "string") return tag;
    if (typeof tag === "object" && tag !== null && "name" in tag && typeof tag.name === "string") {
        return tag.name;
    }
    return "";
}

function formatShortDate(timestamp: number): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.surface.default,
    },
    header: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    orgName: {
        fontSize: 13,
        lineHeight: 18,
        color: theme.accent.primary,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    title: {
        marginTop: theme.spacing.xs,
        fontSize: 32,
        lineHeight: 38,
        color: theme.ink[900],
        fontWeight: "800",
    },
    subtitle: {
        marginTop: theme.spacing.sm,
        maxWidth: 330,
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[500],
        fontWeight: "600",
    },
    statsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
    },
    statusPill: {
        minHeight: 30,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    statusPillAccent: {
        borderColor: theme.accent.primary,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[500],
    },
    statusPillTextAccent: {
        color: theme.accent.primary,
    },
    searchBox: {
        minHeight: 46,
        marginTop: theme.spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        fontSize: 15,
        color: theme.ink[900],
        paddingVertical: theme.spacing.sm,
    },
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    contactRow: {
        minHeight: 92,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.sunken,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    avatarWhatsapp: {
        borderColor: theme.accent.primary,
        backgroundColor: "#EEF2FF",
    },
    avatarText: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.ink[900],
    },
    contactText: {
        flex: 1,
        minWidth: 0,
    },
    contactTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    contactTitle: {
        flex: 1,
        minWidth: 0,
        fontSize: 16,
        fontWeight: "800",
        color: theme.ink[900],
    },
    whatsappBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF2FF",
    },
    contactPhone: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[500],
        fontWeight: "700",
    },
    metaRow: {
        marginTop: 2,
    },
    metaText: {
        fontSize: 12,
        lineHeight: 17,
        color: theme.ink[500],
        fontWeight: "600",
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    tagPill: {
        minHeight: 22,
        justifyContent: "center",
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        backgroundColor: theme.surface.sunken,
    },
    tagText: {
        fontSize: 11,
        fontWeight: "800",
        color: theme.ink[700],
    },
    loadMoreButton: {
        minHeight: 46,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.ink[900],
        marginTop: theme.spacing.sm,
    },
    loadMoreText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
    },
    endText: {
        paddingVertical: theme.spacing.md,
        textAlign: "center",
        color: theme.ink[500],
        fontSize: 12,
        fontWeight: "700",
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.xl,
    },
    emptyIcon: {
        width: 68,
        height: 68,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
        marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.ink[900],
        textAlign: "center",
    },
    emptyBody: {
        marginTop: theme.spacing.sm,
        maxWidth: 320,
        fontSize: 15,
        lineHeight: 22,
        color: theme.ink[500],
        textAlign: "center",
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    pressed: {
        opacity: 0.65,
    },
    disabled: {
        opacity: 0.55,
    },
});
