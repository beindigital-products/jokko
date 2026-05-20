import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type NotificationRecord = {
    _id: Id<"notifications">;
    title: string;
    message: string;
    type: string;
    link?: string;
    isRead: boolean;
    createdAt: number;
};

export function MobileNotificationsScreen() {
    const router = useRouter();
    const notifications = useQuery(api.notifications.list) as NotificationRecord[] | undefined;
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);
    const unreadCount = notifications?.filter((notification) => !notification.isRead).length ?? 0;

    const openNotification = async (notification: NotificationRecord) => {
        if (!notification.isRead) {
            await markAsRead({ notificationId: notification._id });
        }
        const conversationId = getConversationIdFromLink(notification.link);
        if (conversationId) {
            router.push({
                pathname: "/conversations/[id]",
                params: { id: conversationId },
            } as never);
        }
    };

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerText}>
                        <Text style={styles.eyebrow}>Centre d'alertes</Text>
                        <Text style={styles.title}>Notifications</Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Tout marquer comme lu"
                        disabled={unreadCount === 0}
                        onPress={() => markAllAsRead()}
                        style={({ pressed }) => [
                            styles.iconButton,
                            unreadCount === 0 && styles.disabled,
                            pressed && unreadCount > 0 && styles.pressed,
                        ]}
                    >
                        <Ionicons name="checkmark-done" size={20} color={theme.ink[900]} />
                    </Pressable>
                </View>
                <View style={styles.statsRow}>
                    <StatusPill icon="notifications-outline" label={`${notifications?.length ?? 0} récentes`} />
                    <StatusPill icon="radio-button-on-outline" label={`${unreadCount} non lues`} accent={unreadCount > 0} />
                </View>
            </View>

            {!notifications ? (
                <View style={styles.loading}>
                    <Ionicons name="sync-outline" size={24} color={theme.accent.primary} />
                </View>
            ) : notifications.length === 0 ? (
                <EmptyState />
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {notifications.map((notification) => (
                        <Pressable
                            key={notification._id}
                            accessibilityRole="button"
                            onPress={() => void openNotification(notification)}
                            style={({ pressed }) => [
                                styles.notificationRow,
                                !notification.isRead && styles.notificationUnread,
                                pressed && styles.pressed,
                            ]}
                        >
                            <View style={[styles.notificationIcon, !notification.isRead && styles.notificationIconUnread]}>
                                <Ionicons name={getNotificationIcon(notification.type)} size={18} color={theme.accent.primary} />
                            </View>
                            <View style={styles.notificationText}>
                                <View style={styles.notificationTitleRow}>
                                    <Text style={styles.notificationTitle} numberOfLines={1}>{notification.title}</Text>
                                    <Text style={styles.timeText}>{formatRelativeTime(notification.createdAt)}</Text>
                                </View>
                                <Text style={styles.notificationBody} numberOfLines={2}>{notification.message}</Text>
                            </View>
                            {!notification.isRead ? <View style={styles.unreadDot} /> : null}
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

function EmptyState() {
    return (
        <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={30} color={theme.accent.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyBody}>Les assignments, mentions et alertes système apparaîtront ici.</Text>
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

function getNotificationIcon(type: string): keyof typeof Ionicons.glyphMap {
    if (type === "ASSIGNMENT") return "person-add-outline";
    if (type === "MENTION") return "at-outline";
    if (type === "MESSAGE" || type === "NEW_MESSAGE") return "chatbubble-outline";
    return "alert-circle-outline";
}

function getConversationIdFromLink(link?: string): string | null {
    if (!link) return null;
    const match = link.match(/\/conversations\/([^/?#]+)/);
    return match?.[1] ?? null;
}

function formatRelativeTime(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const minutes = Math.max(0, Math.floor(diffMs / 60_000));
    if (minutes < 1) return "Maintenant";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    return `${days} j`;
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
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.lg,
    },
    headerText: { flex: 1, minWidth: 0 },
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
    statusPillAccent: { borderColor: theme.accent.primary },
    statusPillText: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[500],
    },
    statusPillTextAccent: { color: theme.accent.primary },
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    notificationRow: {
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
    notificationUnread: {
        borderColor: theme.accent.primary,
        backgroundColor: "#F5F7FF",
    },
    notificationIcon: {
        width: 42,
        height: 42,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.sunken,
    },
    notificationIconUnread: { backgroundColor: "#EEF2FF" },
    notificationText: { flex: 1, minWidth: 0 },
    notificationTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
    },
    notificationTitle: {
        flex: 1,
        minWidth: 0,
        fontSize: 15,
        fontWeight: "800",
        color: theme.ink[900],
    },
    timeText: {
        fontSize: 12,
        color: theme.ink[500],
        fontWeight: "700",
    },
    notificationBody: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 19,
        color: theme.ink[500],
        fontWeight: "600",
    },
    unreadDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: theme.accent.primary,
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
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.65 },
});
