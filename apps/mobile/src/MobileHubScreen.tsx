import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePaginatedQuery } from "convex/react";
import { Icon, Micro, NavButton, Pill, useTheme, type IconName, type JokkoTheme } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type TemplateRecord = {
    _id: Id<"templates">;
    name: string;
    category?: string;
    status?: string;
    body?: string;
};

type ShortcutRecord = { _id: Id<"shortcuts"> };

const SOON: { icon: IconName; label: string }[] = [
    { icon: "sparkle", label: "Suggestions IA" },
    { icon: "flag", label: "Tags automatiques" },
    { icon: "users", label: "Files d'attente" },
    { icon: "bolt", label: "Workflows" },
];

export function MobileHubScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { colors, font } = theme;

    const templatesPage = usePaginatedQuery(api.templates.queries.list, {}, { initialNumItems: 50 });
    const shortcutsPage = usePaginatedQuery(api.shortcuts.list, {}, { initialNumItems: 50 });
    const templates = useMemo(() => (templatesPage.results ?? []) as TemplateRecord[], [templatesPage.results]);
    const shortcuts = (shortcutsPage.results ?? []) as ShortcutRecord[];

    const approved = templates.filter((t) => t.status === "APPROVED").length;
    const pending = templates.filter((t) => t.status === "PENDING" || t.status === "IN_REVIEW" || t.status === "PENDING_REVIEW").length;
    const moreTemplates = templatesPage.status === "CanLoadMore";
    const moreShortcuts = shortcutsPage.status === "CanLoadMore";

    const openTemplates = () => router.push({ pathname: "/hub/list", params: { type: "templates" } });
    const openShortcuts = () => router.push({ pathname: "/hub/list", params: { type: "shortcuts" } });
    const openSearch = () => router.push({ pathname: "/hub/list", params: { type: "templates", focus: "1" } });

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Micro>Outils & automatisations</Micro>
                    <Text style={[styles.title, { fontFamily: font.display, color: colors.ink }]}>Hub</Text>
                </View>
                <NavButton icon="search" onPress={openSearch} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Two big tiles */}
                <View style={styles.tiles}>
                    <HubTile
                        theme={theme}
                        tone="ink"
                        icon="sticky-note"
                        title="Modèles WhatsApp"
                        sub={`${approved} approuvé${approved > 1 ? "s" : ""}${pending > 0 ? ` · ${pending} en attente` : ""}`}
                        stat={templates.length + (moreTemplates ? "+" : "")}
                        onPress={openTemplates}
                    />
                    <HubTile
                        theme={theme}
                        tone="paper"
                        icon="bolt"
                        title="Réponses rapides"
                        sub="Vos raccourcis d'équipe · /merci, /dispo…"
                        stat={shortcuts.length + (moreShortcuts ? "+" : "")}
                        onPress={openShortcuts}
                    />
                </View>

                <SectionHeader theme={theme}>Bientôt disponible</SectionHeader>
                <View style={styles.soonGrid}>
                    {SOON.map((item) => (
                        <View key={item.label} style={[styles.soonTile, { borderColor: colors.rule }]}>
                            <Icon name={item.icon} size={20} color={colors.mute} strokeWidth={1.5} />
                            <Text style={{ fontSize: 13, color: colors.ink3, fontFamily: font.sansMedium, marginTop: 8 }}>{item.label}</Text>
                            <Text style={{ fontSize: 9.5, color: colors.mute, fontFamily: font.mono, marginTop: 4, letterSpacing: 0.6 }}>BIENTÔT</Text>
                        </View>
                    ))}
                </View>

                <SectionHeader theme={theme} action="Tout voir" onAction={openTemplates}>
                    Modèles récents
                </SectionHeader>
                <View style={{ paddingHorizontal: 18 }}>
                    {templates.length === 0 ? (
                        <Text style={{ fontSize: 13.5, color: colors.mute, fontFamily: font.sans, paddingVertical: 8 }}>
                            Aucun modèle pour l'instant.
                        </Text>
                    ) : (
                        templates.slice(0, 5).map((template) => (
                            <Pressable
                                key={template._id}
                                onPress={() => router.push(`/hub/templates/${template._id}`)}
                                style={({ pressed }) => [styles.tplRow, { borderBottomColor: colors.rule2 }, pressed && { backgroundColor: colors.paper2 }]}
                            >
                                <View style={[styles.tplIcon, { backgroundColor: colors.paper2 }]}>
                                    <Icon name="sticky-note" size={17} color={colors.ink3} strokeWidth={1.6} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <Text numberOfLines={1} style={{ fontSize: 14.5, color: colors.ink, fontFamily: font.sansMedium, flexShrink: 1 }}>
                                            {template.name}
                                        </Text>
                                        {template.status && template.status !== "APPROVED" ? <Pill tone="warn" size="sm">en attente</Pill> : null}
                                    </View>
                                    {template.body ? (
                                        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.mute, fontFamily: font.sans, marginTop: 3 }}>
                                            {template.body}
                                        </Text>
                                    ) : null}
                                </View>
                                {template.category ? <Pill tone={template.category.toLowerCase() === "marketing" ? "accent" : "mute"} size="sm">{template.category}</Pill> : null}
                            </Pressable>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

function HubTile({
    theme,
    tone,
    icon,
    title,
    sub,
    stat,
    onPress,
}: {
    theme: JokkoTheme;
    tone: "ink" | "paper";
    icon: IconName;
    title: string;
    sub: string;
    stat: string;
    onPress: () => void;
}) {
    const { colors, font } = theme;
    const ink = tone === "ink";
    const fg = ink ? colors.paper : colors.ink;
    const muted = ink ? "rgba(242,239,232,0.65)" : colors.mute;
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.tile,
                { backgroundColor: ink ? colors.ink : colors.card, borderColor: ink ? "transparent" : colors.rule, borderWidth: ink ? 0 : StyleSheet.hairlineWidth },
                pressed && styles.pressed,
            ]}
        >
            <View style={[styles.tileIcon, { backgroundColor: ink ? "rgba(242,239,232,0.08)" : colors.paper2 }]}>
                <Icon name={icon} size={25} color={fg} strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: font.serifItalic, fontSize: 22, color: fg }}>{title}</Text>
                <Text style={{ fontSize: 12.5, color: muted, fontFamily: font.sans, marginTop: 3 }}>{sub}</Text>
            </View>
            <Text style={{ fontFamily: font.mono, fontSize: 30, color: fg, letterSpacing: -1 }}>{stat}</Text>
        </Pressable>
    );
}

function SectionHeader({ children, theme, action, onAction }: { children: string; theme: JokkoTheme; action?: string; onAction?: () => void }) {
    const { colors, font } = theme;
    return (
        <View style={styles.sectionHead}>
            <Text style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.mute }}>{children}</Text>
            {action && onAction ? (
                <Pressable onPress={onAction} hitSlop={8}>
                    <Text style={{ fontSize: 12.5, color: colors.accentInk, fontFamily: font.sansMedium }}>{action}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 },
    headerLeft: { flex: 1, minWidth: 0, gap: 6 },
    title: { fontSize: 40, lineHeight: 42, letterSpacing: -1 },
    content: { paddingBottom: 90 },
    tiles: { paddingHorizontal: 18, gap: 12 },
    tile: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 18 },
    tileIcon: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 26, paddingBottom: 10 },
    soonGrid: { paddingHorizontal: 18, flexDirection: "row", flexWrap: "wrap", gap: 10 },
    soonTile: { width: "47.5%", flexGrow: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: "dashed" },
    tplRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    tplIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    pressed: { opacity: 0.85 },
});
