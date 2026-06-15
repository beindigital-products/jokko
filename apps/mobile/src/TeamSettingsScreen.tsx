import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";

type Member = {
    id: string;
    role: string;
    poleName?: string;
    status: string;
    activeConversations: number;
    maxConversations: number;
    isCurrentUser: boolean;
    user: { name: string; email: string; avatar?: string };
};

type Invitation = {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    expiresAt: string;
};

type MembersPayload = {
    members: Member[];
    total: number;
    nonOwnerCount?: number;
    currentUserRole: string;
    limit?: number;
    planName?: string;
};

type InvitationsPayload = {
    invitations: Invitation[];
    total: number;
};

export function TeamSettingsScreen() {
    const router = useRouter();
    const team = useQuery(api.team.listMembers, {}) as MembersPayload | undefined;
    const invites = useQuery(api.invitations.list, {}) as InvitationsPayload | undefined;

    if (team === undefined || invites === undefined) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    const members = team.members ?? [];
    const isManager = team.currentUserRole === "owner" || team.currentUserRole === "admin";
    const limit = team.limit;

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.ink[900]} />
                    <Text style={styles.backText}>Plus</Text>
                </Pressable>
                <Text style={styles.eyebrow}>Organisation</Text>
                <Text style={styles.title}>Équipe & agents</Text>
                <Text style={styles.body}>
                    Vue d'ensemble des membres actifs et des invitations en attente. La gestion fine se fait
                    depuis l'app web.
                </Text>
                <View style={styles.statsRow}>
                    <Stat label="Membres" value={`${team.total}`} />
                    {limit !== undefined ? (
                        <Stat
                            label="Quota"
                            value={
                                team.nonOwnerCount !== undefined
                                    ? `${team.nonOwnerCount}/${limit}`
                                    : `${limit}`
                            }
                        />
                    ) : null}
                    <Stat label="En attente" value={`${invites.total}`} />
                </View>
            </View>

            <Section title="Membres">
                {members.length === 0 ? (
                    <EmptyText>Aucun membre dans l'organisation.</EmptyText>
                ) : (
                    <View style={styles.card}>
                        {members.map((member) => (
                            <MemberRow key={member.id} member={member} />
                        ))}
                    </View>
                )}
            </Section>

            <Section title="Invitations en attente">
                {invites.invitations.length === 0 ? (
                    <EmptyText>Aucune invitation en attente.</EmptyText>
                ) : (
                    <View style={styles.card}>
                        {invites.invitations.map((invite) => (
                            <InviteRow key={invite.id} invite={invite} />
                        ))}
                    </View>
                )}
            </Section>

            {isManager ? (
                <View style={styles.helpBox}>
                    <Ionicons name="information-circle-outline" size={18} color={theme.accent.primary} />
                    <Text style={styles.helpText}>
                        Les invitations, changements de rôle et suppressions se font depuis l'app web pour le
                        moment.
                    </Text>
                </View>
            ) : null}
        </ScrollView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>{title}</Text>
            {children}
        </View>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.stat}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function MemberRow({ member }: { member: Member }) {
    const initials = (member.user.name || member.user.email)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "?";
    const tone = roleTone(member.role);
    const presence = presenceTone(member.status);
    return (
        <View style={styles.row}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
                <View style={[styles.presenceDot, { backgroundColor: presence }]} />
            </View>
            <View style={styles.rowText}>
                <View style={styles.rowTitleLine}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                        {member.user.name || member.user.email}
                        {member.isCurrentUser ? " (vous)" : ""}
                    </Text>
                    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.pillText, { color: tone.fg }]}>
                            {labelRole(member.role)}
                        </Text>
                    </View>
                </View>
                <Text style={styles.rowBody} numberOfLines={1}>
                    {member.user.email}
                </Text>
                <Text style={styles.rowMeta}>
                    {member.poleName ? `${member.poleName} · ` : ""}
                    {member.activeConversations}/{member.maxConversations} convos actives
                </Text>
            </View>
        </View>
    );
}

function InviteRow({ invite }: { invite: Invitation }) {
    const tone = roleTone(invite.role);
    return (
        <View style={styles.row}>
            <View style={[styles.avatar, styles.avatarMuted]}>
                <Ionicons name="mail-outline" size={18} color={theme.ink[500]} />
            </View>
            <View style={styles.rowText}>
                <View style={styles.rowTitleLine}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                        {invite.email}
                    </Text>
                    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.pillText, { color: tone.fg }]}>
                            {labelRole(invite.role)}
                        </Text>
                    </View>
                </View>
                <Text style={styles.rowBody}>
                    Expire le {formatDate(invite.expiresAt)}
                </Text>
            </View>
        </View>
    );
}

function EmptyText({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.emptyTextBox}>
            <Text style={styles.emptyText}>{children}</Text>
        </View>
    );
}

function labelRole(role: string): string {
    switch (role.toLowerCase()) {
        case "owner":
            return "Owner";
        case "admin":
            return "Admin";
        case "agent":
            return "Agent";
        default:
            return role;
    }
}

function roleTone(role: string): { bg: string; fg: string } {
    switch (role.toLowerCase()) {
        case "owner":
            return { bg: "#FEE2E2", fg: "#991B1B" };
        case "admin":
            return { bg: "#E0E7FF", fg: "#3730A3" };
        case "agent":
            return { bg: "#DCFCE7", fg: "#166534" };
        default:
            return { bg: theme.surface.sunken, fg: theme.ink[900] };
    }
}

function presenceTone(status: string): string {
    switch (status) {
        case "ONLINE":
            return "#22C55E";
        case "BUSY":
            return "#F97316";
        case "AWAY":
            return "#FACC15";
        default:
            return theme.ink[500];
    }
}

function formatDate(value: string): string {
    try {
        return new Date(value).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return value;
    }
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
        gap: theme.spacing.xl,
    },
    header: { gap: theme.spacing.xs },
    backButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    backText: { fontSize: 14, fontWeight: "700", color: theme.ink[900] },
    eyebrow: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.accent.primary,
        textTransform: "uppercase",
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: "800",
        color: theme.ink[900],
    },
    body: {
        marginTop: theme.spacing.xs,
        fontSize: 14,
        lineHeight: 20,
        color: theme.ink[500],
    },
    statsRow: {
        marginTop: theme.spacing.md,
        flexDirection: "row",
        gap: theme.spacing.md,
    },
    stat: {
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    statValue: {
        fontSize: 22,
        fontWeight: "800",
        color: theme.ink[900],
    },
    statLabel: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: "700",
        color: theme.ink[500],
        textTransform: "uppercase",
    },
    section: { gap: theme.spacing.sm },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        color: theme.ink[500],
    },
    card: {
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
        overflow: "hidden",
    },
    row: {
        minHeight: 80,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.ink[300],
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF2FF",
        position: "relative",
    },
    avatarMuted: {
        backgroundColor: theme.surface.sunken,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.accent.primary,
    },
    presenceDot: {
        position: "absolute",
        right: -2,
        bottom: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: theme.surface.raised,
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
        fontSize: 15,
        fontWeight: "800",
        color: theme.ink[900],
    },
    pill: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
    },
    pillText: { fontSize: 10, fontWeight: "800" },
    rowBody: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 17,
        color: theme.ink[500],
    },
    rowMeta: {
        marginTop: 2,
        fontSize: 11,
        color: theme.ink[500],
        fontWeight: "600",
    },
    emptyTextBox: {
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    emptyText: {
        fontSize: 13,
        color: theme.ink[500],
        textAlign: "center",
    },
    helpBox: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    helpText: {
        flex: 1,
        fontSize: 12,
        color: theme.ink[500],
        lineHeight: 17,
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    pressed: { opacity: 0.7 },
});
