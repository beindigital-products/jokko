import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Avatar, Icon, Micro, Pill, Row, SectionHead, useTheme, Wordmark, type JokkoTheme, type PillTone } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type OrgLite = { _id: Id<"organizations">; name: string; plan?: string };

export function MobileSettingsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { colors, font } = theme;
    const { signOut } = useAuthActions();

    const me = useQuery(api.users.me) as { name?: string; email?: string; image?: string } | null | undefined;
    const session = useQuery(api.sessions.current) as
        | { organization: { _id: Id<"organizations">; name: string; plan?: string } }
        | null
        | undefined;
    const role = useQuery(api.users.currentUserRole) as string | null | undefined;
    const team = useQuery(api.team.listMembers, {}) as { total?: number } | undefined;
    const invites = useQuery(api.invitations.list, {}) as { invitations?: unknown[] } | undefined;

    const [switcherOpen, setSwitcherOpen] = useState(false);

    const org = session?.organization;
    const roleUpper = (role ?? "").toUpperCase();
    const isOwner = roleUpper === "OWNER";
    const memberCount = team?.total ?? 0;
    const inviteCount = invites?.invitations?.length ?? 0;

    const version = Constants.expoConfig?.version ?? "1.0.0";
    const build = Constants.nativeBuildVersion ?? Constants.expoConfig?.ios?.buildNumber ?? "dev";

    const doSignOut = () => {
        Alert.alert("Se déconnecter ?", "Tu devras te reconnecter pour accéder à tes conversations.", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Se déconnecter",
                style: "destructive",
                onPress: async () => {
                    try {
                        await signOut();
                    } finally {
                        router.replace("/welcome");
                    }
                },
            },
        ]);
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            <View style={styles.header}>
                <Micro>{org?.name ?? "Mon compte"}</Micro>
                <Text style={[styles.title, { fontFamily: font.display, color: colors.ink }]}>Réglages</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile */}
                <View style={styles.block}>
                    <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                        <Avatar name={me?.name ?? me?.email ?? "?"} size={52} imageUrl={me?.image} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontSize: 15, color: colors.ink, fontFamily: font.sansSemibold }}>
                                {me?.name ?? "Mon profil"}
                            </Text>
                            {me?.email ? (
                                <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.mute, fontFamily: font.sans, marginTop: 2 }}>
                                    {me.email}
                                </Text>
                            ) : null}
                            {roleUpper ? (
                                <View style={{ marginTop: 7 }}>
                                    <Pill tone={roleTone(roleUpper)} size="sm">{roleUpper}</Pill>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* Active organization → switcher */}
                <View style={styles.block}>
                    <Pressable
                        onPress={() => setSwitcherOpen(true)}
                        style={({ pressed }) => [styles.orgCard, { backgroundColor: colors.ink }, pressed && { opacity: 0.9 }]}
                    >
                        <OrgGlyph theme={theme} name={org?.name ?? "?"} onDark />
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontFamily: font.mono, fontSize: 10, color: "rgba(242,239,232,0.55)", letterSpacing: 0.6 }}>
                                ORGANISATION ACTIVE
                            </Text>
                            <Text numberOfLines={1} style={{ fontSize: 14, color: colors.paper, fontFamily: font.sansSemibold, marginTop: 2 }}>
                                {org?.name ?? "—"}
                            </Text>
                        </View>
                        <Icon name="switch" size={18} color="rgba(242,239,232,0.6)" />
                    </Pressable>
                    <Text style={{ fontSize: 11.5, color: colors.mute, fontFamily: font.sans, marginTop: 8, paddingLeft: 4 }}>
                        Touchez pour basculer d'organisation.
                    </Text>
                </View>

                <SectionHead>Équipe</SectionHead>
                <Row
                    icon="users"
                    title="Membres"
                    sub={`${memberCount} actif${memberCount > 1 ? "s" : ""}${inviteCount > 0 ? ` · ${inviteCount} invitation${inviteCount > 1 ? "s" : ""}` : ""}`}
                    onPress={() => router.push("/settings/team")}
                />
                <Row icon="building" title="Numéros WhatsApp" sub="Gérés depuis le tableau de bord web" right={<WebHint theme={theme} />} accessory="none" />
                <Row icon="sticky-note" title="Modèles & raccourcis" sub="Gérer le Hub" onPress={() => router.push("/(tabs)/hub")} />

                <SectionHead>Préférences</SectionHead>
                <Row icon="bell" title="Notifications" sub="Push, in-app, par canal" onPress={() => router.push("/settings/notifications")} />
                <Row icon="moon" title="Apparence" right={<ValueText theme={theme}>Système</ValueText>} accessory="none" />
                <Row icon="globe" title="Langue" right={<ValueText theme={theme}>Français</ValueText>} accessory="none" />

                <SectionHead>Compte</SectionHead>
                <Row icon="shield" title="Confidentialité & sécurité" sub="Consentement, RGPD, suppression" onPress={() => router.push("/settings/privacy")} />
                <Row icon="bolt" title="Facturation" sub={`Plan ${planLabel(org?.plan)}`} onPress={() => router.push("/settings/billing")} />
                <Row icon="logout" title="Se déconnecter" danger accessory="none" onPress={doSignOut} />

                <View style={styles.footer}>
                    <Wordmark size={20} />
                    <Text style={{ fontFamily: font.mono, fontSize: 10, color: colors.mute, marginTop: 6, letterSpacing: 0.6 }}>
                        V{version} · BUILD {String(build).toUpperCase()}
                        {isOwner ? " · OWNER" : ""}
                    </Text>
                </View>
            </ScrollView>

            <OrgSwitcherSheet
                visible={switcherOpen}
                theme={theme}
                activeId={org?._id}
                onClose={() => setSwitcherOpen(false)}
            />
        </View>
    );
}

// ── Org switcher sheet ───────────────────────────────────────────────────────

function OrgSwitcherSheet({
    visible,
    theme,
    activeId,
    onClose,
}: {
    visible: boolean;
    theme: JokkoTheme;
    activeId?: Id<"organizations">;
    onClose: () => void;
}) {
    const { colors, font } = theme;
    const router = useRouter();
    const orgs = useQuery(api.organizations.listMine) as OrgLite[] | undefined;
    const switchOrg = useMutation(api.sessions.switchOrganization);
    const [busy, setBusy] = useState<string | null>(null);

    // Active org first, then the rest in their natural order.
    const sorted = [...(orgs ?? [])].sort((a, b) => Number(b._id === activeId) - Number(a._id === activeId));

    const choose = async (o: OrgLite) => {
        if (o._id === activeId) {
            onClose();
            return;
        }
        setBusy(o._id);
        try {
            await switchOrg({ organizationId: o._id });
            onClose();
        } catch (error) {
            Alert.alert("Changement impossible", error instanceof Error ? error.message : "Réessaie.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                <View style={styles.handle}>
                    <View style={[styles.handleBar, { backgroundColor: colors.rule }]} />
                </View>
                <View style={{ paddingHorizontal: 22, paddingBottom: 10 }}>
                    <Micro style={{ marginBottom: 4 }}>Vos organisations</Micro>
                    <Text style={{ fontFamily: font.display, fontSize: 28, letterSpacing: -1, color: colors.ink }}>Basculer d'équipe</Text>
                </View>
                <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4 }}>
                    {sorted.map((o) => {
                        const active = o._id === activeId;
                        return (
                            <Pressable
                                key={o._id}
                                onPress={() => void choose(o)}
                                style={({ pressed }) => [
                                    styles.orgRow,
                                    { backgroundColor: active ? colors.ink : colors.card, borderColor: active ? "transparent" : colors.rule },
                                    pressed && { opacity: 0.85 },
                                ]}
                            >
                                <OrgGlyph theme={theme} name={o.name} onDark={active} muted={!active} />
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text numberOfLines={1} style={{ fontSize: 14.5, fontFamily: font.sansMedium, color: active ? colors.paper : colors.ink }}>
                                        {o.name}
                                    </Text>
                                    <Text style={{ fontFamily: font.mono, fontSize: 11, marginTop: 2, color: active ? "rgba(242,239,232,0.65)" : colors.mute }}>
                                        PLAN {planLabel(o.plan).toUpperCase()}
                                    </Text>
                                </View>
                                {busy === o._id ? (
                                    <Text style={{ color: active ? colors.paper : colors.mute, fontFamily: font.mono, fontSize: 11 }}>…</Text>
                                ) : active ? (
                                    <Icon name="check" size={18} color={colors.paper} strokeWidth={2.4} />
                                ) : null}
                            </Pressable>
                        );
                    })}

                    <Pressable
                        onPress={() => {
                            onClose();
                            router.push("/onboarding");
                        }}
                        style={({ pressed }) => [styles.createRow, { borderColor: colors.rule }, pressed && { opacity: 0.7 }]}
                    >
                        <View style={[styles.createGlyph, { backgroundColor: colors.paper2 }]}>
                            <Icon name="plus" size={20} color={colors.ink3} />
                        </View>
                        <Text style={{ fontSize: 14, fontFamily: font.sansMedium, color: colors.ink }}>Créer une organisation</Text>
                    </Pressable>
                </ScrollView>
            </View>
        </Modal>
    );
}

// ── Small parts ──────────────────────────────────────────────────────────────

function OrgGlyph({ theme, name, onDark = false, muted = false }: { theme: JokkoTheme; name: string; onDark?: boolean; muted?: boolean }) {
    const { colors, font } = theme;
    const bg = onDark ? "rgba(242,239,232,0.1)" : muted ? colors.paper2 : colors.paper2;
    const fg = onDark ? colors.paper : colors.ink;
    return (
        <View style={[styles.orgGlyph, { backgroundColor: bg }]}>
            <Text style={{ fontFamily: font.serifItalic, fontSize: 19, color: fg }}>{(name || "?").charAt(0).toUpperCase()}</Text>
        </View>
    );
}

function ValueText({ theme, children }: { theme: JokkoTheme; children: string }) {
    const { colors, font } = theme;
    return <Text style={{ fontSize: 13.5, color: colors.mute, fontFamily: font.sans }}>{children}</Text>;
}

function WebHint({ theme }: { theme: JokkoTheme }) {
    const { colors, font } = theme;
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name="arrow-up-right" size={13} color={colors.mute} strokeWidth={2} />
            <Text style={{ fontSize: 12.5, color: colors.mute, fontFamily: font.monoMedium, letterSpacing: 0.4 }}>WEB</Text>
        </View>
    );
}

function roleTone(role: string): PillTone {
    if (role === "OWNER") return "accent";
    if (role === "ADMIN") return "ink";
    return "ink";
}

function planLabel(plan?: string): string {
    switch ((plan ?? "").toUpperCase()) {
        case "FREE":
            return "Gratuit";
        case "STARTER":
            return "Starter";
        case "PRO":
            return "Pro";
        case "BUSINESS":
            return "Business";
        case "ENTERPRISE":
            return "Enterprise";
        default:
            return plan ? plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() : "—";
    }
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8, gap: 6 },
    title: { fontSize: 40, lineHeight: 42, letterSpacing: -1 },
    content: { paddingBottom: 32 },
    block: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 14 },
    profileCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
    orgCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14 },
    orgGlyph: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    footer: { paddingTop: 26, paddingBottom: 8, alignItems: "center" },
    // sheet
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,10,10,0.4)" },
    sheet: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "82%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 28 },
    handle: { alignItems: "center", paddingTop: 8, paddingBottom: 6 },
    handleBar: { width: 36, height: 5, borderRadius: 3 },
    orgRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
    createRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: "dashed" },
    createGlyph: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
