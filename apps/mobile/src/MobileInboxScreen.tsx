import { Fragment, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import {
    Avatar,
    Btn,
    Icon,
    Micro,
    NavButton,
    SectionHead,
    Skeleton,
    useTheme,
    type IconName,
} from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
    computeInboxCounts,
    filterMobileConversations,
    formatConversationTimestamp,
    getConversationDisplayName,
    groupInboxConversations,
    inboxMessageKind,
    type MobileConversationSearchFields,
    type MobileInboxFilter,
} from "./lib/mobile-inbox";

type ConversationRowRecord = MobileConversationSearchFields & {
    _id: Id<"conversations">;
    status: string;
    channel: string;
    lastMessageDirection?: string;
    tags?: string[];
};

type RowActions = {
    pin: (id: Id<"conversations">) => void;
    assign: (id: Id<"conversations">) => void;
    resolve: (id: Id<"conversations">) => void;
    archive: (id: Id<"conversations">) => void;
};

const FILTERS: { key: MobileInboxFilter; label: string }[] = [
    { key: "all", label: "Tout" },
    { key: "unread", label: "Non lus" },
    { key: "mine", label: "Assignés à moi" },
    { key: "archived", label: "Archives" },
];

export function MobileInboxScreen() {
    const router = useRouter();
    const { colors, font } = useTheme();
    const session = useQuery(api.sessions.current);
    const organizations = useQuery(api.organizations.listMine);
    const [filter, setFilter] = useState<MobileInboxFilter>("all");
    const [search, setSearch] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);

    const activeOrganization = session?.organization ?? organizations?.[0] ?? null;
    const currentUserId = session?.membership?.userId ?? null;

    const togglePin = useMutation(api.conversations.togglePin);
    const assignToMe = useMutation(api.conversations.assignToMe);
    const resolveConversation = useMutation(api.conversations.resolve);
    const archiveConversation = useMutation(api.conversations.archive);
    const actions = useMemo<RowActions>(
        () => ({
            pin: (id) => void togglePin({ id }),
            assign: (id) => void assignToMe({ id }),
            resolve: (id) => void resolveConversation({ id }),
            archive: (id) => void archiveConversation({ id }),
        }),
        [togglePin, assignToMe, resolveConversation, archiveConversation],
    );

    // The full (non-archived) set drives the all/unread/mine views + chip counts;
    // archived is loaded on demand. Search + final sort are applied client-side.
    const allConversations = useQuery(
        api.conversations.list,
        activeOrganization ? { organizationId: activeOrganization._id, filter: "all" } : "skip",
    ) as ConversationRowRecord[] | undefined;
    const archivedConversations = useQuery(
        api.conversations.list,
        activeOrganization && filter === "archived"
            ? { organizationId: activeOrganization._id, filter: "archived" }
            : "skip",
    ) as ConversationRowRecord[] | undefined;

    const source = filter === "archived" ? archivedConversations : allConversations;
    const visibleConversations = useMemo(
        () => filterMobileConversations((source ?? []) as ConversationRowRecord[], filter, search, currentUserId),
        [source, filter, search, currentUserId],
    );
    const counts = useMemo(
        () => computeInboxCounts((allConversations ?? []) as ConversationRowRecord[], currentUserId),
        [allConversations, currentUserId],
    );
    const groups = useMemo(() => groupInboxConversations(visibleConversations), [visibleConversations]);
    const breathingId = groups.today[0]?._id;

    const isBootstrapping = session === undefined && organizations === undefined;
    const isListLoading = filter === "archived" ? archivedConversations === undefined : allConversations === undefined;

    const openConversation = (id: string) =>
        router.push({ pathname: "/conversations/[id]", params: { id } } as never);

    if (!activeOrganization) {
        if (isBootstrapping) return <InboxLoading />;
        return (
            <InboxMessage
                icon="inbox"
                title="Aucun espace actif"
                body="Créez ou rejoignez un espace Jokko pour ouvrir l'inbox."
                cta="Lancer l'onboarding"
                onCta={() => router.replace("/onboarding")}
            />
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            {/* Header — eyebrow + title on the left, actions aligned to the title baseline on the right. */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Micro>
                        {`${activeOrganization.name} · ${counts.all} ${counts.all === 1 ? "ouverte" : "ouvertes"}`}
                    </Micro>
                    <Text style={[styles.title, { fontFamily: font.display, color: colors.ink }]}>Inbox</Text>
                </View>
                <View style={styles.headerIcons}>
                    <NavButton icon="search" onPress={() => setSearchOpen((open) => !open)} />
                    <NavButton icon="filter" onPress={() => setSearchOpen((open) => !open)} />
                </View>
            </View>

            {searchOpen ? (
                <View style={styles.searchWrap}>
                    <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                        <Icon name="search" size={18} color={colors.mute} />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Rechercher un contact, un message…"
                            placeholderTextColor={colors.mute}
                            style={[styles.searchInput, { color: colors.ink }]}
                            autoFocus
                            returnKeyType="search"
                        />
                        {search.length > 0 ? (
                            <Pressable onPress={() => setSearch("")} hitSlop={8}>
                                <Icon name="close" size={16} color={colors.mute} />
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            ) : null}

            <View style={styles.chipsWrap}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chips}
                    keyboardShouldPersistTaps="handled"
                >
                    {FILTERS.map((item) => {
                        const count =
                            item.key === "all"
                                ? counts.all
                                : item.key === "unread"
                                  ? counts.unread
                                  : item.key === "mine"
                                    ? counts.mine
                                    : archivedConversations?.length;
                        return (
                            <FilterChip
                                key={item.key}
                                label={item.label}
                                count={count}
                                active={filter === item.key}
                                onPress={() => setFilter(item.key)}
                            />
                        );
                    })}
                </ScrollView>
            </View>

            {isListLoading ? (
                <InboxSkeleton />
            ) : visibleConversations.length === 0 ? (
                <InboxMessage
                    icon={search ? "search" : "inbox"}
                    title={search ? "Aucun résultat" : filter === "archived" ? "Aucune archive" : "Aucune conversation"}
                    body={
                        search
                            ? "Essayez un autre nom, numéro ou extrait de message."
                            : "Connectez WhatsApp Business ou attendez le premier message entrant."
                    }
                    cta={search ? undefined : "Configurer WhatsApp"}
                    onCta={search ? undefined : () => router.replace("/onboarding")}
                />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Section title="Épinglés" rows={groups.pinned} breathingId={breathingId} onOpen={openConversation} actions={actions} />
                    <Section title="Aujourd'hui" rows={groups.today} breathingId={breathingId} onOpen={openConversation} actions={actions} />
                    <Section title="Plus tôt" rows={groups.earlier} breathingId={breathingId} onOpen={openConversation} actions={actions} count={false} />
                </ScrollView>
            )}
        </View>
    );
}

function Section({
    title,
    rows,
    breathingId,
    onOpen,
    actions,
    count = true,
}: {
    title: string;
    rows: ConversationRowRecord[];
    breathingId?: string;
    onOpen: (id: string) => void;
    actions: RowActions;
    count?: boolean;
}) {
    if (rows.length === 0) return null;
    return (
        <Fragment>
            <SectionHead>{count ? `${title} · ${rows.length}` : title}</SectionHead>
            {rows.map((conversation) => (
                <InboxRow
                    key={conversation._id}
                    conversation={conversation}
                    breathing={conversation._id === breathingId}
                    onPress={() => onOpen(conversation._id)}
                    actions={actions}
                />
            ))}
        </Fragment>
    );
}

function InboxRow({
    conversation,
    breathing,
    onPress,
    actions,
}: {
    conversation: ConversationRowRecord;
    breathing: boolean;
    onPress: () => void;
    actions: RowActions;
}) {
    const { colors, font } = useTheme();
    const swipeRef = useRef<Swipeable>(null);
    const unread = conversation.unreadCount ?? 0;
    const name = getConversationDisplayName(conversation);
    const time = formatConversationTimestamp(conversation.lastMessageAt);
    const preview = conversation.preview?.trim() || "Aucun message pour le moment";
    const isOutbound = conversation.lastMessageDirection === "OUTBOUND";
    const kind = inboxMessageKind(conversation.preview);
    const assignee = conversation.assignedTo?.user?.name;
    const kindIcon: IconName | null =
        kind === "voice" ? "mic" : kind === "doc" ? "doc" : kind === "image" ? "image" : null;

    const run = (action: (id: Id<"conversations">) => void) => {
        swipeRef.current?.close();
        action(conversation._id);
    };

    return (
        <Swipeable
            ref={swipeRef}
            friction={1.6}
            leftThreshold={56}
            rightThreshold={56}
            overshootLeft={false}
            overshootRight={false}
            renderLeftActions={() => (
                <View style={styles.leftActions}>
                    <SwipeAction
                        icon="pin"
                        label={conversation.isPinned ? "Désépingler" : "Épingler"}
                        bg={colors.accent}
                        fg="#fff"
                        width={96}
                        onPress={() => run(actions.pin)}
                    />
                </View>
            )}
            renderRightActions={() => (
                <View style={styles.rightActions}>
                    <SwipeAction icon="user" label="Assigner" bg={colors.ink} fg={colors.paper} onPress={() => run(actions.assign)} />
                    <SwipeAction icon="circle-check" label="Résoudre" bg={colors.good} fg="#fff" onPress={() => run(actions.resolve)} />
                    <SwipeAction icon="archive" label="Archiver" bg={colors.mute} fg="#fff" onPress={() => run(actions.archive)} />
                </View>
            )}
        >
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: colors.rule2, backgroundColor: breathing ? colors.accentSoft : colors.paper },
                    pressed && !breathing ? { backgroundColor: colors.paper2 } : null,
                ]}
            >
                {breathing ? <View style={[styles.breathBar, { backgroundColor: colors.accent }]} /> : null}
                <Avatar name={name} size={48} />
                <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                        <View style={styles.rowName}>
                            <Text
                                numberOfLines={1}
                                style={{
                                    fontSize: 15.5,
                                    fontFamily: unread > 0 ? font.sansSemibold : font.sansMedium,
                                    color: colors.ink,
                                    letterSpacing: -0.15,
                                }}
                            >
                                {name}
                            </Text>
                            {conversation.isPinned ? <Icon name="pin" size={11} color={colors.mute} strokeWidth={2} /> : null}
                        </View>
                        <Text
                            style={{
                                fontFamily: font.mono,
                                fontSize: 11.5,
                                color: unread > 0 ? colors.accentInk : colors.mute,
                            }}
                        >
                            {time}
                        </Text>
                    </View>
                    <View style={styles.rowBottom}>
                        <View style={styles.previewWrap}>
                            {isOutbound ? <Icon name="check-double" size={14} color={colors.mute} strokeWidth={2} /> : null}
                            {kindIcon ? (
                                <Icon name={kindIcon} size={14} color={kind === "voice" ? colors.accentInk : colors.mute} strokeWidth={2} />
                            ) : null}
                            <Text
                                numberOfLines={1}
                                style={{
                                    flex: 1,
                                    fontSize: 13.5,
                                    color: unread > 0 ? colors.ink2 : colors.mute,
                                    fontFamily: font.sans,
                                }}
                            >
                                {preview}
                            </Text>
                        </View>
                        <View style={styles.rowTrailing}>
                            {assignee ? (
                                <View style={[styles.assignee, { backgroundColor: colors.ink }]}>
                                    <Text style={{ color: colors.paper, fontSize: 9.5, fontFamily: font.sansSemibold }}>
                                        {assignee[0]?.toUpperCase()}
                                    </Text>
                                </View>
                            ) : null}
                            {unread > 0 ? (
                                <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                                    <Text style={{ color: "#fff", fontSize: 10.5, fontFamily: font.monoMedium }}>
                                        {unread > 99 ? "99+" : unread}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>
            </Pressable>
        </Swipeable>
    );
}

function SwipeAction({
    icon,
    label,
    bg,
    fg,
    onPress,
    width = 80,
}: {
    icon: IconName;
    label: string;
    bg: string;
    fg: string;
    onPress: () => void;
    width?: number;
}) {
    const { font } = useTheme();
    return (
        <Pressable onPress={onPress} style={[styles.swipeAction, { width, backgroundColor: bg }]}>
            <Icon name={icon} size={20} color={fg} strokeWidth={1.9} />
            <Text style={{ color: fg, fontSize: 11, fontFamily: font.sansMedium }}>{label}</Text>
        </Pressable>
    );
}

function FilterChip({
    label,
    count,
    active,
    onPress,
}: {
    label: string;
    count?: number;
    active: boolean;
    onPress: () => void;
}) {
    const { colors, font } = useTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={[
                styles.chip,
                active
                    ? { backgroundColor: colors.ink }
                    : { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.rule },
            ]}
        >
            <Text style={{ fontSize: 13, fontFamily: font.sansMedium, color: active ? colors.paper : colors.ink3 }}>
                {label}
            </Text>
            {typeof count === "number" ? (
                <Text style={{ fontSize: 12, fontFamily: font.mono, color: active ? colors.paper : colors.mute, opacity: 0.6 }}>
                    {count}
                </Text>
            ) : null}
        </Pressable>
    );
}

function InboxSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={{ paddingTop: 8 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.row, { borderBottomColor: colors.rule2 }]}>
                    <Skeleton w={48} h={48} r={24} />
                    <View style={[styles.rowBody, { gap: 8 }]}>
                        <Skeleton w="55%" h={13} />
                        <Skeleton w="80%" h={11} />
                    </View>
                </View>
            ))}
        </View>
    );
}

function InboxLoading() {
    const { colors } = useTheme();
    return <View style={[styles.center, { backgroundColor: colors.paper }]} />;
}

function InboxMessage({
    icon,
    title,
    body,
    cta,
    onCta,
}: {
    icon: IconName;
    title: string;
    body: string;
    cta?: string;
    onCta?: () => void;
}) {
    const { colors, font } = useTheme();
    return (
        <View style={[styles.center, { backgroundColor: colors.paper }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.paper2, borderColor: colors.rule }]}>
                <Icon name={icon} size={26} color={colors.ink3} />
            </View>
            <Text style={{ fontSize: 20, fontFamily: font.display, color: colors.ink, marginTop: 18, letterSpacing: -0.4 }}>
                {title}
            </Text>
            <Text
                style={{
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.mute,
                    fontFamily: font.sans,
                    textAlign: "center",
                    marginTop: 8,
                    maxWidth: 280,
                }}
            >
                {body}
            </Text>
            {cta && onCta ? (
                <Btn tone="primary" size="md" iconRight="arrow-right" onPress={onCta} style={{ marginTop: 22 }}>
                    {cta}
                </Btn>
            ) : null}
        </View>
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
    searchWrap: { paddingHorizontal: 18, paddingBottom: 10 },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        height: 46,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: 15, padding: 0 },
    chipsWrap: { paddingBottom: 12 },
    chips: { paddingHorizontal: 18, gap: 8, flexDirection: "row" },
    chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999 },
    list: { paddingBottom: 20 },
    row: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
        alignItems: "flex-start",
        borderBottomWidth: StyleSheet.hairlineWidth,
        position: "relative",
    },
    breathBar: { position: "absolute", top: 0, bottom: 0, left: 0, width: 3 },
    rowBody: { flex: 1, minWidth: 0 },
    rowTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
    rowName: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, minWidth: 0 },
    rowBottom: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginTop: 3 },
    previewWrap: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, minWidth: 0 },
    rowTrailing: { flexDirection: "row", alignItems: "center", gap: 6 },
    assignee: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
    unreadBadge: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, alignItems: "center", justifyContent: "center" },
    leftActions: { flexDirection: "row" },
    rightActions: { flexDirection: "row" },
    swipeAction: { alignItems: "center", justifyContent: "center", gap: 5 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
    emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
