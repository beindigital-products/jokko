import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { Icon, Micro, NavButton, SectionHead, Skeleton, tint, useTheme, type IconName, type JokkoTheme } from "@jokko/ui-mobile";
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
    const theme = useTheme();
    const { colors, font } = theme;
    const notifications = useQuery(api.notifications.list) as NotificationRecord[] | undefined;
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    const unread = notifications?.filter((n) => !n.isRead).length ?? 0;
    const total = notifications?.length ?? 0;

    const openNotification = async (n: NotificationRecord) => {
        if (!n.isRead) await markAsRead({ notificationId: n._id });
        const conversationId = conversationIdFromLink(n.link);
        if (conversationId) {
            router.push({ pathname: "/conversations/[id]", params: { id: conversationId } } as never);
        }
    };

    const eyebrow = total === 0 ? "Centre d'alertes" : `${total} événement${total > 1 ? "s" : ""} · ${unread > 0 ? `${unread} non lu${unread > 1 ? "s" : ""}` : "à jour"}`;

    const now = Date.now();
    const list = notifications ?? [];
    const today = list.filter((n) => isSameDay(n.createdAt, now));
    const earlier = list.filter((n) => !isSameDay(n.createdAt, now));

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Micro>{eyebrow}</Micro>
                    <Text style={[styles.title, { fontFamily: font.display, color: colors.ink }]}>Activité</Text>
                </View>
                {unread > 0 ? <NavButton icon="check" onPress={() => void markAllAsRead()} /> : null}
            </View>

            {notifications === undefined ? (
                <LoadingList theme={theme} />
            ) : total === 0 ? (
                <EmptyState theme={theme} />
            ) : (
                <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {today.length > 0 ? (
                        <Fragment>
                            <SectionHead>Aujourd'hui</SectionHead>
                            {today.map((n) => (
                                <NotifRow key={n._id} theme={theme} n={n} onPress={() => void openNotification(n)} />
                            ))}
                        </Fragment>
                    ) : null}
                    {earlier.length > 0 ? (
                        <Fragment>
                            <SectionHead>Plus tôt</SectionHead>
                            {earlier.map((n) => (
                                <NotifRow key={n._id} theme={theme} n={n} onPress={() => void openNotification(n)} />
                            ))}
                        </Fragment>
                    ) : null}
                </ScrollView>
            )}
        </View>
    );
}

function NotifRow({ theme, n, onPress }: { theme: JokkoTheme; n: NotificationRecord; onPress: () => void }) {
    const { colors, font } = theme;
    const v = notifVisual(n.type, colors);
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, { borderBottomColor: colors.rule2 }, pressed && { backgroundColor: colors.paper2 }]}
        >
            <View style={[styles.iconCircle, { backgroundColor: tint(v.color, 0.14) }]}>
                <Icon name={v.icon} size={19} color={v.color} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 14.5, color: colors.ink, fontFamily: font.sansSemibold, letterSpacing: -0.1 }}>
                    {n.title}
                </Text>
                {n.message ? (
                    <Text numberOfLines={2} style={{ fontSize: 13, color: colors.ink3, fontFamily: font.sans, lineHeight: 18, marginTop: 2 }}>
                        {n.message}
                    </Text>
                ) : null}
                <Text style={{ fontFamily: font.mono, fontSize: 10.5, color: colors.mute, letterSpacing: 0.4, marginTop: 5 }}>
                    {formatRelativeTime(n.createdAt).toUpperCase()}
                </Text>
            </View>
            {!n.isRead ? <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} /> : null}
        </Pressable>
    );
}

function LoadingList({ theme }: { theme: JokkoTheme }) {
    return (
        <View style={{ paddingTop: 12 }}>
            <SectionHead>Aujourd'hui</SectionHead>
            {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.row, { borderBottomColor: theme.colors.rule2 }]}>
                    <Skeleton w={42} h={42} r={21} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <Skeleton w="55%" h={13} />
                        <Skeleton w="85%" h={11} />
                        <Skeleton w={56} h={9} />
                    </View>
                </View>
            ))}
        </View>
    );
}

function EmptyState({ theme }: { theme: JokkoTheme }) {
    const { colors, font } = theme;
    return (
        <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name="bell" size={28} color={colors.mute} strokeWidth={1.6} />
            </View>
            <Text style={{ fontFamily: font.display, fontSize: 24, color: colors.ink, textAlign: "center" }}>Tout est calme</Text>
            <Text style={{ fontSize: 14.5, color: colors.mute, textAlign: "center", maxWidth: 300, lineHeight: 21, fontFamily: font.sans, marginTop: 6 }}>
                Les assignations, mentions et alertes système apparaîtront ici.
            </Text>
        </View>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function notifVisual(type: string, colors: JokkoTheme["colors"]): { icon: IconName; color: string } {
    switch (type.toUpperCase()) {
        case "MENTION":
            return { icon: "reply", color: colors.accent };
        case "ASSIGNMENT":
            return { icon: "users", color: colors.good };
        case "MESSAGE":
        case "NEW_MESSAGE":
            return { icon: "whatsapp", color: colors.ink };
        default:
            return { icon: "bell", color: colors.ink };
    }
}

function isSameDay(a: number, b: number): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function conversationIdFromLink(link?: string): string | null {
    if (!link) return null;
    const match = link.match(/\/conversations\/([^/?#]+)/);
    return match?.[1] ?? null;
}

function formatRelativeTime(timestamp: number): string {
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
    if (minutes < 1) return "Maintenant";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} j`;
    return new Date(timestamp).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
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
        paddingBottom: 10,
    },
    headerLeft: { flex: 1, minWidth: 0, gap: 6 },
    title: { fontSize: 40, lineHeight: 42, letterSpacing: -1 },
    listContent: { paddingBottom: 24 },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
    unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    emptyIcon: { width: 68, height: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 18 },
});
