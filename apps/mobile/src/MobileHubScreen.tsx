import { useState } from "react";
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
import { usePaginatedQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ShortcutRecord = {
    _id: Id<"shortcuts">;
    shortcut: string;
    text?: string;
    type?: string;
    createdAt: number;
};

type TemplateRecord = {
    _id: Id<"templates">;
    name: string;
    category: string;
    type: string;
    language: string;
    status?: string;
    body?: string;
};

type HubTab = "shortcuts" | "templates";

export function MobileHubScreen() {
    const [tab, setTab] = useState<HubTab>("shortcuts");
    const [search, setSearch] = useState("");

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <Text style={styles.eyebrow}>Réponses & modèles</Text>
                <Text style={styles.title}>Hub</Text>
                <Text style={styles.subtitle}>
                    Accès rapide aux réponses sauvegardées et modèles WhatsApp officiels.
                </Text>

                <View style={styles.tabBar}>
                    <TabButton
                        label="Raccourcis"
                        active={tab === "shortcuts"}
                        onPress={() => setTab("shortcuts")}
                    />
                    <TabButton
                        label="Modèles"
                        active={tab === "templates"}
                        onPress={() => setTab("templates")}
                    />
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={theme.ink[500]} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={
                            tab === "shortcuts" ? "Chercher /raccourci" : "Chercher un modèle"
                        }
                        placeholderTextColor={theme.ink[500]}
                        style={styles.searchInput}
                        returnKeyType="search"
                        autoCapitalize="none"
                    />
                </View>
            </View>

            {tab === "shortcuts" ? (
                <ShortcutsList search={search} />
            ) : (
                <TemplatesList search={search} />
            )}
        </View>
    );
}

function TabButton({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [
                styles.tabButton,
                active && styles.tabButtonActive,
                pressed && styles.pressed,
            ]}
        >
            <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
        </Pressable>
    );
}

function ShortcutsList({ search }: { search: string }) {
    const router = useRouter();
    const { results, status, loadMore, isLoading } = usePaginatedQuery(
        api.shortcuts.list,
        { search: search.trim() || undefined },
        { initialNumItems: 30 },
    );
    const shortcuts = (results ?? []) as ShortcutRecord[];
    const isLoadingMore = status === "LoadingMore";
    const canLoadMore = status === "CanLoadMore" || isLoadingMore;

    if (isLoading && shortcuts.length === 0) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    if (shortcuts.length === 0) {
        return (
            <EmptyState
                icon="grid-outline"
                title={search ? "Aucun raccourci" : "Hub vide"}
                body={
                    search
                        ? "Aucune réponse rapide ne correspond à cette recherche."
                        : "Les réponses rapides créées sur le web apparaîtront ici."
                }
            />
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
            {shortcuts.map((shortcut) => (
                <ShortcutRow
                    key={shortcut._id}
                    shortcut={shortcut}
                    onPress={() => router.push(`/hub/shortcuts/${shortcut._id}`)}
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
    );
}

function TemplatesList({ search }: { search: string }) {
    const router = useRouter();
    const { results, status, loadMore, isLoading } = usePaginatedQuery(
        api.templates.queries.list,
        { search: search.trim() || undefined },
        { initialNumItems: 30 },
    );
    const templates = (results ?? []) as TemplateRecord[];
    const isLoadingMore = status === "LoadingMore";
    const canLoadMore = status === "CanLoadMore" || isLoadingMore;

    if (isLoading && templates.length === 0) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    if (templates.length === 0) {
        return (
            <EmptyState
                icon="document-text-outline"
                title={search ? "Aucun modèle" : "Aucun modèle WhatsApp"}
                body={
                    search
                        ? "Aucun modèle ne correspond à cette recherche."
                        : "Les modèles approuvés par Meta apparaîtront ici une fois synchronisés."
                }
            />
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
            {templates.map((template) => (
                <TemplateRow
                    key={template._id}
                    template={template}
                    onPress={() => router.push(`/hub/templates/${template._id}`)}
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
    );
}

function ShortcutRow({
    shortcut,
    onPress,
}: {
    shortcut: ShortcutRecord;
    onPress: () => void;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
            <View style={styles.rowIcon}>
                <Ionicons
                    name={getShortcutIcon(shortcut.type)}
                    size={20}
                    color={theme.accent.primary}
                />
            </View>
            <View style={styles.rowText}>
                <View style={styles.rowTitleLine}>
                    <Text style={styles.rowTitle}>{shortcut.shortcut}</Text>
                    <Text style={styles.rowTag}>{shortcut.type || "TEXT"}</Text>
                </View>
                <Text style={styles.rowBody} numberOfLines={2}>
                    {shortcut.text || "Réponse rapide sans texte."}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.ink[500]} />
        </Pressable>
    );
}

function TemplateRow({
    template,
    onPress,
}: {
    template: TemplateRecord;
    onPress: () => void;
}) {
    const status = (template.status ?? "PENDING").toUpperCase();
    const tone = templateStatusTone(status);
    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
            <View style={styles.rowIcon}>
                <Ionicons name="document-text-outline" size={20} color={theme.accent.primary} />
            </View>
            <View style={styles.rowText}>
                <View style={styles.rowTitleLine}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                        {template.name}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.statusPillText, { color: tone.fg }]}>{status}</Text>
                    </View>
                </View>
                <Text style={styles.rowBody} numberOfLines={2}>
                    {template.body ?? `${template.category} · ${template.language}`}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.ink[500]} />
        </Pressable>
    );
}

function EmptyState({
    icon,
    title,
    body,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    body: string;
}) {
    return (
        <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
                <Ionicons name={icon} size={30} color={theme.accent.primary} />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyBody}>{body}</Text>
        </View>
    );
}

function getShortcutIcon(type?: string): React.ComponentProps<typeof Ionicons>["name"] {
    if (type === "IMAGE") return "image-outline";
    if (type === "VIDEO") return "videocam-outline";
    if (type === "AUDIO") return "mic-outline";
    if (type === "DOCUMENT") return "document-text-outline";
    return "chatbox-ellipses-outline";
}

function templateStatusTone(status: string): { bg: string; fg: string } {
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

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.surface.default },
    header: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    eyebrow: {
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
        maxWidth: 340,
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[500],
        fontWeight: "600",
    },
    tabBar: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
    },
    tabButton: {
        paddingVertical: 8,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    tabButtonActive: {
        backgroundColor: theme.ink[900],
        borderColor: theme.ink[900],
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.ink[900],
    },
    tabButtonTextActive: {
        color: "#fff",
    },
    searchBox: {
        minHeight: 46,
        marginTop: theme.spacing.md,
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
    row: {
        minHeight: 88,
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
    rowIcon: {
        width: 46,
        height: 46,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF2FF",
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitleLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    rowTitle: {
        flex: 1,
        minWidth: 0,
        fontSize: 16,
        fontWeight: "800",
        color: theme.ink[900],
    },
    rowTag: {
        fontSize: 11,
        fontWeight: "800",
        color: theme.accent.primary,
    },
    rowBody: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 19,
        color: theme.ink[500],
        fontWeight: "600",
    },
    statusPill: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: "800",
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
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.65 },
});
