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
import { useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
    filterMobileConversations,
    formatConversationTimestamp,
    getConversationDisplayName,
    getConversationInitials,
    getConversationPreview,
    type MobileConversationSearchFields,
    type MobileInboxFilter,
} from "./lib/mobile-inbox";

const filters: ReadonlyArray<{ key: MobileInboxFilter; label: string }> = [
    { key: "all", label: "Toutes" },
    { key: "unread", label: "Non lues" },
    { key: "mine", label: "À moi" },
];

type ConversationRowRecord = MobileConversationSearchFields & {
    _id: Id<"conversations">;
    status: string;
    channel: string;
    lastMessageDirection?: string;
    tags?: string[];
};

export function MobileInboxScreen() {
    const router = useRouter();
    const session = useQuery(api.sessions.current);
    const organizations = useQuery(api.organizations.listMine);
    const [filter, setFilter] = useState<MobileInboxFilter>("all");
    const [search, setSearch] = useState("");

    const activeOrganization = session?.organization ?? organizations?.[0] ?? null;
    const currentUserId = session?.membership?.userId ?? null;
    const conversations = useQuery(
        api.conversations.list,
        activeOrganization
            ? {
                organizationId: activeOrganization._id,
                filter,
                search: search.trim() || undefined,
            }
            : "skip",
    );

    const visibleConversations = useMemo(
        () => filterMobileConversations((conversations ?? []) as ConversationRowRecord[], filter, search, currentUserId),
        [conversations, currentUserId, filter, search],
    );

    const unreadCount = useMemo(
        () => (conversations ?? []).reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0),
        [conversations],
    );

    const isLoading = session === undefined || organizations === undefined || conversations === undefined;

    if (!activeOrganization && (session === undefined || organizations === undefined)) {
        return <LoadingState />;
    }

    if (!activeOrganization) {
        return (
            <EmptyInboxState
                title="Aucun espace actif"
                body="Crée ou rejoins un espace Jokko pour ouvrir l'inbox mobile."
                primaryLabel="Lancer l'onboarding"
                onPrimary={() => router.replace("/onboarding")}
                secondaryLabel="Réglages"
                onSecondary={() => router.push("/settings")}
            />
        );
    }

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerTitleBlock}>
                        <Text style={styles.orgName}>{activeOrganization.name}</Text>
                        <Text style={styles.title}>Inbox</Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Ouvrir les réglages"
                        onPress={() => router.push("/settings")}
                        hitSlop={10}
                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                    >
                        <Ionicons name="settings-outline" size={20} color={theme.ink[900]} />
                    </Pressable>
                </View>

                <View style={styles.statsRow}>
                    <StatusPill icon="chatbubbles-outline" label={`${visibleConversations.length} conversations`} />
                    <StatusPill icon="radio-button-on-outline" label={`${unreadCount} non lues`} accent={unreadCount > 0} />
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={theme.ink[500]} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Rechercher un contact"
                        placeholderTextColor={theme.ink[500]}
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                </View>

                <View style={styles.filters}>
                    {filters.map((item) => (
                        <Pressable
                            key={item.key}
                            accessibilityRole="button"
                            onPress={() => setFilter(item.key)}
                            style={({ pressed }) => [
                                styles.filterButton,
                                filter === item.key && styles.filterButtonActive,
                                pressed && styles.pressed,
                            ]}
                        >
                            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {isLoading ? (
                <LoadingState />
            ) : visibleConversations.length === 0 ? (
                <EmptyInboxState
                    title={search ? "Aucun résultat" : "Aucune conversation"}
                    body={search ? "Essaie un nom, un numéro ou un extrait de message différent." : "Connecte WhatsApp Business ou attends le premier message entrant."}
                    primaryLabel="Configurer WhatsApp"
                    onPrimary={() => router.replace("/onboarding")}
                    secondaryLabel="Voir les réglages"
                    onSecondary={() => router.push("/settings")}
                />
            ) : (
                <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
                    {visibleConversations.map((conversation) => (
                        <ConversationRow
                            key={conversation._id}
                            conversation={conversation}
                            onPress={() => router.push({
                                pathname: "/conversations/[id]",
                                params: { id: conversation._id },
                            } as never)}
                        />
                    ))}
                </ScrollView>
            )}
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

function EmptyInboxState({
    title,
    body,
    primaryLabel,
    secondaryLabel,
    onPrimary,
    onSecondary,
}: {
    title: string;
    body: string;
    primaryLabel: string;
    secondaryLabel: string;
    onPrimary: () => void;
    onSecondary: () => void;
}) {
    return (
        <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
                <Ionicons name="mail-open-outline" size={28} color={theme.accent.primary} />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyBody}>{body}</Text>
            <Pressable accessibilityRole="button" onPress={onPrimary} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}>
                <Text style={styles.primaryActionText}>{primaryLabel}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onSecondary} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
                <Text style={styles.secondaryActionText}>{secondaryLabel}</Text>
            </Pressable>
        </View>
    );
}

function ConversationRow({ conversation, onPress }: { conversation: ConversationRowRecord; onPress: () => void }) {
    const unreadCount = conversation.unreadCount ?? 0;
    const isOutbound = conversation.lastMessageDirection === "OUTBOUND";

    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.conversationRow, pressed && styles.pressed]}
        >
            <View style={[styles.avatar, unreadCount > 0 && styles.avatarUnread]}>
                <Text style={styles.avatarText}>{getConversationInitials(conversation)}</Text>
            </View>
            <View style={styles.conversationText}>
                <View style={styles.conversationTitleRow}>
                    <Text style={styles.conversationTitle} numberOfLines={1}>
                        {getConversationDisplayName(conversation)}
                    </Text>
                    <Text style={styles.timeText}>{formatConversationTimestamp(conversation.lastMessageAt)}</Text>
                </View>
                <View style={styles.previewRow}>
                    {isOutbound ? <Ionicons name="return-up-forward-outline" size={13} color={theme.ink[500]} /> : null}
                    <Text style={styles.previewText} numberOfLines={1}>
                        {getConversationPreview(conversation)}
                    </Text>
                </View>
                <View style={styles.metaLine}>
                    <Text style={styles.channelText}>{conversation.channel}</Text>
                    {conversation.assignedTo?.user?.name ? (
                        <Text style={styles.assigneeText} numberOfLines={1}>
                            {conversation.assignedTo.user.name}
                        </Text>
                    ) : (
                        <Text style={styles.assigneeText}>Non assignée</Text>
                    )}
                </View>
            </View>
            <View style={styles.rowTrailing}>
                {conversation.isPinned ? <Ionicons name="bookmark" size={14} color={theme.accent.primary} /> : null}
                {unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                    </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={theme.ink[500]} />
            </View>
        </Pressable>
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

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.surface.default,
    },
    header: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.surface.default,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.lg,
    },
    headerTitleBlock: {
        flex: 1,
        minWidth: 0,
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
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
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
    filters: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    filterButton: {
        minHeight: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    filterButtonActive: {
        backgroundColor: theme.ink[900],
        borderColor: theme.ink[900],
    },
    filterText: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.ink[500],
    },
    filterTextActive: {
        color: "#fff",
    },
    listContent: {
        padding: theme.spacing.md,
    },
    conversationRow: {
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
    avatarUnread: {
        borderColor: theme.accent.primary,
        backgroundColor: "#EEF2FF",
    },
    avatarText: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.ink[900],
    },
    conversationText: {
        flex: 1,
        minWidth: 0,
    },
    conversationTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    conversationTitle: {
        flex: 1,
        minWidth: 0,
        fontSize: 16,
        fontWeight: "800",
        color: theme.ink[900],
    },
    timeText: {
        fontSize: 12,
        color: theme.ink[500],
        fontWeight: "700",
    },
    previewRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginTop: 4,
    },
    previewText: {
        flex: 1,
        minWidth: 0,
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[500],
    },
    metaLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xs,
    },
    channelText: {
        fontSize: 11,
        fontWeight: "800",
        color: theme.accent.primary,
        textTransform: "uppercase",
    },
    assigneeText: {
        flex: 1,
        minWidth: 0,
        fontSize: 11,
        color: theme.ink[500],
        fontWeight: "700",
    },
    rowTrailing: {
        minWidth: 30,
        alignItems: "flex-end",
        gap: theme.spacing.xs,
    },
    unreadBadge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacing.xs,
        backgroundColor: theme.accent.primary,
    },
    unreadText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "800",
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
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
        marginBottom: theme.spacing.xl,
        maxWidth: 320,
        fontSize: 15,
        lineHeight: 22,
        color: theme.ink[500],
        textAlign: "center",
    },
    primaryAction: {
        minHeight: 50,
        alignSelf: "stretch",
        borderRadius: theme.radius.pill,
        backgroundColor: theme.ink[900],
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    primaryActionText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
    },
    secondaryAction: {
        minHeight: 46,
        alignSelf: "stretch",
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryActionText: {
        color: theme.accent.primary,
        fontSize: 14,
        fontWeight: "800",
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    pressed: {
        opacity: 0.65,
    },
});
