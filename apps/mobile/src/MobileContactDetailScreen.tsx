import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type ContactDetailRecord = {
    _id: Id<"contacts">;
    organizationId: Id<"organizations">;
    phone: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    isWhatsApp?: boolean | null;
    isBlocked?: boolean | null;
    createdAt: number;
    updatedAt?: number;
    whatsappOptIn?: {
        status: "granted" | "revoked" | "unknown";
        source?: string;
        at?: number;
    };
    tags?: Array<{ id?: string; name: string; color?: string }>;
    notes?: Array<{ content: string; authorName?: string | null; createdAt: number }>;
};

type ConversationHistoryRecord = {
    _id: Id<"conversations">;
    status: string;
    createdAt: number;
    lastMessageAt: number;
    preview?: string | null;
    channel?: string | null;
};

type Props = {
    contactId: string | null;
};

export function MobileContactDetailScreen({ contactId }: Props) {
    const router = useRouter();
    const typedContactId = contactId as Id<"contacts"> | null;
    const contact = useQuery(
        api.contacts.get,
        typedContactId ? { id: typedContactId } : "skip",
    ) as ContactDetailRecord | null | undefined;
    const conversations = useQuery(
        api.conversations.listByContact,
        contact && typedContactId
            ? { contactId: typedContactId, organizationId: contact.organizationId }
            : "skip",
    ) as ConversationHistoryRecord[] | undefined;

    if (!typedContactId) {
        return (
            <StateScreen
                icon="person-circle-outline"
                title="Contact introuvable"
                body="Le lien ouvert ne contient pas de contact valide."
                onBack={() => router.replace("/contacts")}
            />
        );
    }

    if (contact === undefined) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={theme.accent.primary} />
            </View>
        );
    }

    if (contact === null) {
        return (
            <StateScreen
                icon="person-circle-outline"
                title="Contact indisponible"
                body="Ce contact n'existe pas dans l'organisation active ou n'est plus accessible."
                onBack={() => router.replace("/contacts")}
            />
        );
    }

    const displayName = getContactDisplayName(contact);
    const tags = contact.tags ?? [];
    const notes = contact.notes ?? [];
    const recentConversations = conversations?.slice(0, 4) ?? [];

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retour contacts"
                    onPress={() => router.replace("/contacts")}
                    hitSlop={10}
                    style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.ink[900]} />
                </Pressable>
                <View style={[styles.avatar, contact.isWhatsApp && styles.avatarWhatsapp]}>
                    <Text style={styles.avatarText}>{getContactInitials(displayName)}</Text>
                </View>
                <Text style={styles.title}>{displayName}</Text>
                <Text style={styles.phone}>{contact.phone}</Text>
                <View style={styles.statusRow}>
                    <StatusPill icon="logo-whatsapp" label={contact.isWhatsApp ? "WhatsApp" : "Hors WhatsApp"} accent={Boolean(contact.isWhatsApp)} />
                    <StatusPill icon="shield-checkmark-outline" label={getOptInLabel(contact.whatsappOptIn?.status)} accent={contact.whatsappOptIn?.status === "granted"} />
                    {contact.isBlocked ? <StatusPill icon="ban-outline" label="Bloqué" accent /> : null}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations</Text>
                <InfoRow icon="call-outline" label="Téléphone" value={contact.phone} />
                <InfoRow icon="mail-outline" label="Email" value={contact.email} />
                <InfoRow icon="business-outline" label="Société" value={formatCompany(contact)} />
                <InfoRow icon="location-outline" label="Adresse" value={formatLocation(contact)} />
                <InfoRow icon="calendar-outline" label="Créé" value={formatDate(contact.createdAt)} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                {tags.length > 0 ? (
                    <View style={styles.tagsRow}>
                        {tags.map((tag) => (
                            <View key={tag.id ?? tag.name} style={styles.tagPill}>
                                <Text style={styles.tagText}>{tag.name}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>Aucun tag</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Conversations</Text>
                {conversations === undefined ? (
                    <ActivityIndicator color={theme.accent.primary} />
                ) : recentConversations.length > 0 ? (
                    recentConversations.map((conversation) => (
                        <Pressable
                            key={conversation._id}
                            accessibilityRole="button"
                            onPress={() => router.push({
                                pathname: "/conversations/[id]",
                                params: { id: conversation._id },
                            } as never)}
                            style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}
                        >
                            <View style={styles.historyIcon}>
                                <Ionicons name="chatbubble-outline" size={18} color={theme.accent.primary} />
                            </View>
                            <View style={styles.historyText}>
                                <Text style={styles.historyTitle}>{getConversationStatusLabel(conversation.status)}</Text>
                                <Text style={styles.historyPreview} numberOfLines={2}>
                                    {conversation.preview || "Conversation sans aperçu."}
                                </Text>
                            </View>
                            <Text style={styles.historyDate}>{formatShortDate(conversation.lastMessageAt)}</Text>
                        </Pressable>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Aucune conversation</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                {notes.length > 0 ? (
                    notes.slice(0, 3).map((note) => (
                        <View key={`${note.createdAt}-${note.content}`} style={styles.noteRow}>
                            <Text style={styles.noteBody}>{note.content}</Text>
                            <Text style={styles.noteMeta}>
                                {[note.authorName || "Agent", formatShortDate(note.createdAt)].filter(Boolean).join(" · ")}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>Aucune note</Text>
                )}
            </View>
        </ScrollView>
    );
}

function StateScreen({
    icon,
    title,
    body,
    onBack,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    body: string;
    onBack: () => void;
}) {
    return (
        <View style={styles.state}>
            <View style={styles.emptyIcon}>
                <Ionicons name={icon} size={30} color={theme.accent.primary} />
            </View>
            <Text style={styles.stateTitle}>{title}</Text>
            <Text style={styles.stateBody}>{body}</Text>
            <Pressable
                accessibilityRole="button"
                onPress={onBack}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
                <Text style={styles.backButtonText}>Retour contacts</Text>
            </Pressable>
        </View>
    );
}

function StatusPill({ icon, label, accent = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; accent?: boolean }) {
    return (
        <View style={[styles.statusPill, accent && styles.statusPillAccent]}>
            <Ionicons name={icon} size={14} color={accent ? theme.accent.primary : theme.ink[500]} />
            <Text style={[styles.statusText, accent && styles.statusTextAccent]}>{label}</Text>
        </View>
    );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
                <Ionicons name={icon} size={17} color={theme.ink[500]} />
            </View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{value || "-"}</Text>
        </View>
    );
}

function getContactDisplayName(contact: ContactDetailRecord): string {
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

function getOptInLabel(status?: string): string {
    if (status === "granted") return "Opt-in valide";
    if (status === "revoked") return "Opt-in révoqué";
    return "Opt-in inconnu";
}

function getConversationStatusLabel(status: string): string {
    if (status === "OPEN") return "Ouverte";
    if (status === "SNOOZED") return "En attente";
    if (status === "RESOLVED") return "Résolue";
    if (status === "ARCHIVED") return "Archivée";
    return status;
}

function formatCompany(contact: ContactDetailRecord): string | null {
    return [contact.company, contact.jobTitle].filter(Boolean).join(" · ") || null;
}

function formatLocation(contact: ContactDetailRecord): string | null {
    return [contact.address, contact.city, contact.country].filter(Boolean).join(", ") || null;
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatShortDate(timestamp: number): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
    },
    header: {
        alignItems: "flex-start",
        paddingBottom: theme.spacing.xl,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    avatarWhatsapp: {
        borderColor: theme.accent.primary,
        backgroundColor: "#EEF2FF",
    },
    avatarText: {
        fontSize: 22,
        fontWeight: "800",
        color: theme.ink[900],
    },
    title: {
        marginTop: theme.spacing.lg,
        fontSize: 31,
        lineHeight: 37,
        fontWeight: "800",
        color: theme.ink[900],
    },
    phone: {
        marginTop: theme.spacing.xs,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "700",
        color: theme.ink[500],
    },
    statusRow: {
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
    statusText: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[500],
    },
    statusTextAccent: {
        color: theme.accent.primary,
    },
    section: {
        borderRadius: theme.radius.lg,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        marginBottom: theme.spacing.md,
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "800",
        color: theme.ink[900],
    },
    infoRow: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    infoIcon: {
        width: 30,
        height: 30,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.sunken,
    },
    infoLabel: {
        width: 86,
        fontSize: 13,
        fontWeight: "800",
        color: theme.ink[500],
    },
    infoValue: {
        flex: 1,
        minWidth: 0,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        color: theme.ink[900],
        textAlign: "right",
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.sm,
    },
    tagPill: {
        minHeight: 28,
        justifyContent: "center",
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.surface.sunken,
    },
    tagText: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[700],
    },
    historyRow: {
        minHeight: 74,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EEF2FF",
    },
    historyText: {
        flex: 1,
        minWidth: 0,
    },
    historyTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.ink[900],
    },
    historyPreview: {
        marginTop: 3,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
        color: theme.ink[500],
    },
    historyDate: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[500],
    },
    noteRow: {
        paddingVertical: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.ink[300],
    },
    noteBody: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "600",
        color: theme.ink[900],
    },
    noteMeta: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[500],
    },
    emptyText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        color: theme.ink[500],
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    state: {
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
    stateTitle: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: theme.ink[900],
        textAlign: "center",
    },
    stateBody: {
        marginTop: theme.spacing.sm,
        maxWidth: 320,
        fontSize: 15,
        lineHeight: 22,
        color: theme.ink[500],
        textAlign: "center",
    },
    backButton: {
        minHeight: 46,
        justifyContent: "center",
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.ink[900],
        marginTop: theme.spacing.xl,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "800",
        color: "#fff",
    },
    pressed: {
        opacity: 0.65,
    },
});
