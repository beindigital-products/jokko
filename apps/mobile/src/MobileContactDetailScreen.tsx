import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { Avatar, Icon, NavButton, useTheme, type IconName, type JokkoTheme } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { EditContactSheet } from "./conversation/EditContactSheet";
import { uploadFileToConvex } from "./conversation/upload";

type ContactDetailRecord = {
    _id: Id<"contacts">;
    organizationId: Id<"organizations">;
    phone: string;
    profilePictureUrl?: string | null;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    city?: string | null;
    country?: string | null;
    isWhatsApp?: boolean | null;
    isBlocked?: boolean | null;
    createdAt: number;
    tags?: Array<{ id?: string; name: string; color?: string }>;
    notes?: Array<{ content: string; authorName?: string | null; createdAt: number }>;
};

type ConversationHistoryRecord = {
    _id: Id<"conversations">;
    status: string;
    lastMessageAt: number;
    preview?: string | null;
};

type Props = { contactId: string | null };

export function MobileContactDetailScreen({ contactId }: Props) {
    const router = useRouter();
    const theme = useTheme();
    const { colors, font } = theme;
    const typedContactId = contactId as Id<"contacts"> | null;

    const contact = useQuery(api.contacts.get, typedContactId ? { id: typedContactId } : "skip") as
        | ContactDetailRecord
        | null
        | undefined;
    const conversations = useQuery(
        api.conversations.listByContact,
        contact && typedContactId ? { contactId: typedContactId, organizationId: contact.organizationId } : "skip",
    ) as ConversationHistoryRecord[] | undefined;
    const updateContact = useMutation(api.contacts.update);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [noteDraft, setNoteDraft] = useState("");
    const [tagDraft, setTagDraft] = useState("");
    const [addingTag, setAddingTag] = useState(false);
    const [busy, setBusy] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const noteInputRef = useRef<TextInput>(null);

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace("/contacts");
    };

    if (!typedContactId || contact === null) {
        return (
            <View style={[styles.center, { backgroundColor: colors.paper }]}>
                <Text style={{ fontFamily: font.display, fontSize: 18, color: colors.ink }}>Contact introuvable</Text>
                <Pressable onPress={goBack} style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
                    <Text style={{ fontFamily: font.sansMedium, fontSize: 14, color: colors.accentInk }}>Retour</Text>
                </Pressable>
            </View>
        );
    }

    if (contact === undefined) {
        return (
            <View style={[styles.center, { backgroundColor: colors.paper }]}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    const displayName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.phone;
    const tags = contact.tags ?? [];
    const tagNames = tags.map((tag) => tag.name);
    const notes = (contact.notes ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
    const recent = conversations?.slice(0, 4) ?? [];
    const subtitle = [contact.phone, contact.city?.toUpperCase()].filter(Boolean).join(" · ");

    const runUpdate = async (args: { tags: string[]; addNote?: string }, label: string) => {
        if (busy) return;
        setBusy(true);
        try {
            await updateContact({ id: contact._id, ...args });
        } catch (error) {
            Alert.alert(label, error instanceof Error ? error.message : "Action impossible.");
            throw error;
        } finally {
            setBusy(false);
        }
    };

    const submitTag = async () => {
        const name = tagDraft.trim();
        setTagDraft("");
        setAddingTag(false);
        if (!name || tagNames.includes(name)) return;
        await runUpdate({ tags: [...tagNames, name] }, "Tag").catch(() => undefined);
    };

    const removeTag = (name: string) => {
        void runUpdate({ tags: tagNames.filter((n) => n !== name) }, "Tag").catch(() => undefined);
    };

    const submitNote = async () => {
        const content = noteDraft.trim();
        if (!content) return;
        setNoteDraft("");
        await runUpdate({ tags: tagNames, addNote: content }, "Note").catch(() => setNoteDraft(content));
    };

    const openMessage = () => {
        if (recent[0]) router.push(`/conversations/${recent[0]._id}`);
        else Alert.alert("Message", "Aucune conversation avec ce contact pour l'instant.");
    };

    const callContact = async () => {
        const url = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;
        try {
            if (await Linking.canOpenURL(url)) await Linking.openURL(url);
            else Alert.alert("Appel indisponible", "Les appels ne sont pas disponibles sur cet appareil.");
        } catch {
            Alert.alert("Appel", "Impossible de lancer l'appel.");
        }
    };

    const pickAvatar = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Accès photos refusé", "Autorise la photothèque dans Réglages pour changer la photo.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        setUploadingAvatar(true);
        try {
            const uploadUrl = await generateUploadUrl({});
            const storageId = await uploadFileToConvex(uploadUrl, asset.uri, asset.mimeType ?? "image/jpeg");
            await updateContact({ id: contact._id, tags: tagNames, profilePictureStorageId: storageId as Id<"_storage"> });
        } catch (error) {
            Alert.alert("Photo de profil", error instanceof Error ? error.message : "Mise à jour impossible.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.paper }}>
            <View style={[styles.navBar, { borderBottomColor: colors.rule2 }]}>
                <NavButton icon="chevron-left" onPress={goBack} />
                <Text numberOfLines={1} style={{ flex: 1, textAlign: "center", fontFamily: font.sansSemibold, fontSize: 15, color: colors.ink }}>
                    {displayName}
                </Text>
                <NavButton icon="edit" onPress={() => setEditOpen(true)} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {/* Editorial header */}
                <View style={styles.head}>
                    <Pressable onPress={() => void pickAvatar()} disabled={uploadingAvatar} accessibilityLabel="Changer la photo">
                        <Avatar name={displayName} size={88} imageUrl={contact.profilePictureUrl} />
                        <View style={[styles.avatarBadge, { backgroundColor: colors.ink, borderColor: colors.paper }]}>
                            {uploadingAvatar ? (
                                <ActivityIndicator size="small" color={colors.paper} />
                            ) : (
                                <Icon name="camera" size={13} color={colors.paper} strokeWidth={1.7} />
                            )}
                        </View>
                    </Pressable>
                    <Text style={{ fontFamily: font.display, fontSize: 32, letterSpacing: -0.5, color: colors.ink, marginTop: 16 }}>
                        {displayName}
                    </Text>
                    {subtitle ? (
                        <Text style={{ fontFamily: font.mono, fontSize: 12, color: colors.mute, marginTop: 7, letterSpacing: 0.3 }}>{subtitle}</Text>
                    ) : null}

                    {/* Tags */}
                    <View style={styles.tagsRow}>
                        {tags.map((tag) => (
                            <Pressable key={tag.id ?? tag.name} onPress={() => removeTag(tag.name)} disabled={busy}>
                                <View style={[styles.tagPill, { backgroundColor: colors.paper2, borderColor: colors.rule }]}>
                                    <Text style={{ fontSize: 12.5, fontFamily: font.sansMedium, color: colors.ink2 }}>{tag.name}</Text>
                                    <Icon name="close" size={12} color={colors.mute} strokeWidth={2} />
                                </View>
                            </Pressable>
                        ))}
                        {addingTag ? (
                            <View style={[styles.tagPill, { backgroundColor: colors.card, borderColor: colors.accent }]}>
                                <TextInput
                                    autoFocus
                                    value={tagDraft}
                                    onChangeText={setTagDraft}
                                    onSubmitEditing={() => void submitTag()}
                                    onBlur={() => void submitTag()}
                                    placeholder="tag"
                                    placeholderTextColor={colors.mute}
                                    style={{ minWidth: 56, fontSize: 12.5, color: colors.ink, fontFamily: font.sansMedium, padding: 0 }}
                                    returnKeyType="done"
                                />
                            </View>
                        ) : (
                            <Pressable onPress={() => setAddingTag(true)} disabled={busy}>
                                <View style={[styles.tagPill, styles.tagPillDashed, { borderColor: colors.rule }]}>
                                    <Icon name="plus" size={13} color={colors.mute} strokeWidth={2} />
                                    <Text style={{ fontSize: 12.5, fontFamily: font.sansMedium, color: colors.mute }}>ajouter</Text>
                                </View>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Action grid */}
                <View style={styles.actionGrid}>
                    <ActionCard icon="whatsapp" label="Message" theme={theme} onPress={openMessage} />
                    <ActionCard icon="phone" label="Appeler" theme={theme} onPress={() => void callContact()} />
                    <ActionCard icon="sticky-note" label="Note" theme={theme} onPress={() => noteInputRef.current?.focus()} />
                </View>

                {/* Notes */}
                <SectionHeader theme={theme}>Notes</SectionHeader>
                <View style={styles.sectionBody}>
                    <View style={[styles.noteComposer, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                        <TextInput
                            ref={noteInputRef}
                            value={noteDraft}
                            onChangeText={setNoteDraft}
                            placeholder="Ajouter une note interne…"
                            placeholderTextColor={colors.mute}
                            style={{ flex: 1, fontSize: 14, lineHeight: 19, color: colors.ink, fontFamily: font.sans, maxHeight: 110 }}
                            multiline
                        />
                        <Pressable
                            accessibilityLabel="Enregistrer la note"
                            onPress={() => void submitNote()}
                            disabled={busy || noteDraft.trim().length === 0}
                            style={({ pressed }) => [
                                styles.noteSend,
                                { backgroundColor: colors.ink, opacity: noteDraft.trim().length === 0 ? 0.35 : pressed ? 0.8 : 1 },
                            ]}
                        >
                            {busy ? <ActivityIndicator size="small" color={colors.paper} /> : <Icon name="arrow-up-right" size={16} color={colors.paper} strokeWidth={2} />}
                        </Pressable>
                    </View>
                    {notes.length === 0 ? (
                        <Text style={{ fontSize: 13, color: colors.mute, fontFamily: font.sans, paddingHorizontal: 4, paddingTop: 10 }}>
                            Aucune note pour l'instant.
                        </Text>
                    ) : (
                        notes.map((note) => (
                            <View key={`${note.createdAt}-${note.content}`} style={[styles.noteRow, { borderColor: colors.rule }]}>
                                <Text style={{ fontSize: 14, lineHeight: 20, color: colors.ink, fontFamily: font.sans }}>{note.content}</Text>
                                <Text style={{ fontSize: 11, color: colors.mute, fontFamily: font.mono, marginTop: 6 }}>
                                    {[note.authorName || "Agent", formatDate(note.createdAt)].join(" · ")}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Informations */}
                <SectionHeader theme={theme}>Informations</SectionHeader>
                <View style={styles.sectionBody}>
                    {contact.email ? <InfoRow icon="mail" label="E-mail" value={contact.email} theme={theme} /> : null}
                    {contact.company ? (
                        <InfoRow icon="building" label="Entreprise" value={[contact.company, contact.jobTitle].filter(Boolean).join(" · ")} theme={theme} />
                    ) : null}
                    {contact.city || contact.country ? (
                        <InfoRow icon="globe" label="Localisation" value={[contact.city, contact.country].filter(Boolean).join(", ")} theme={theme} />
                    ) : null}
                    <InfoRow icon="clock" label="Premier contact" value={formatDate(contact.createdAt)} theme={theme} />
                </View>

                {/* Recent conversations */}
                {recent.length > 0 ? (
                    <>
                        <SectionHeader theme={theme}>Conversations récentes</SectionHeader>
                        <View style={styles.sectionBody}>
                            {recent.map((conversation) => (
                                <Pressable
                                    key={conversation._id}
                                    onPress={() => router.push(`/conversations/${conversation._id}`)}
                                    style={({ pressed }) => [styles.convRow, { borderColor: colors.rule, backgroundColor: pressed ? colors.paper2 : colors.card }]}
                                >
                                    <View style={[styles.convIcon, { backgroundColor: colors.paper2 }]}>
                                        <Icon name="whatsapp" size={17} color={colors.waGreen} strokeWidth={1.6} />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text numberOfLines={1} style={{ fontSize: 14, color: colors.ink, fontFamily: font.sansMedium }}>
                                            {conversation.preview?.trim() || "Conversation"}
                                        </Text>
                                        <Text style={{ fontSize: 11.5, color: colors.mute, fontFamily: font.mono, marginTop: 2 }}>
                                            {formatDate(conversation.lastMessageAt)} · {conversation.status === "RESOLVED" ? "résolue" : "ouverte"}
                                        </Text>
                                    </View>
                                    <Icon name="chevron-right" size={18} color={colors.mute2} />
                                </Pressable>
                            ))}
                        </View>
                    </>
                ) : null}
            </ScrollView>

            <EditContactSheet visible={editOpen} contact={contact} tagNames={tagNames} onClose={() => setEditOpen(false)} />
        </View>
    );
}

function ActionCard({ icon, label, theme, onPress }: { icon: IconName; label: string; theme: JokkoTheme; onPress: () => void }) {
    const { colors, font } = theme;
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.card, borderColor: colors.rule }, pressed && styles.pressed]}>
            <Icon name={icon} size={22} color={colors.ink} strokeWidth={1.6} />
            <Text style={{ fontSize: 11, color: colors.ink3, fontFamily: font.sansMedium, marginTop: 7 }}>{label}</Text>
        </Pressable>
    );
}

function InfoRow({ icon, label, value, theme }: { icon: IconName; label: string; value: string; theme: JokkoTheme }) {
    const { colors, font } = theme;
    return (
        <View style={[styles.infoRow, { borderColor: colors.rule }]}>
            <View style={[styles.infoIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name={icon} size={17} color={colors.ink3} strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11.5, color: colors.mute, fontFamily: font.mono, letterSpacing: 0.3 }}>{label}</Text>
                <Text style={{ fontSize: 14.5, color: colors.ink, fontFamily: font.sans, marginTop: 2 }}>{value}</Text>
            </View>
        </View>
    );
}

function SectionHeader({ children, theme }: { children: string; theme: JokkoTheme }) {
    const { colors, font } = theme;
    return (
        <Text style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.mute, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 10 }}>
            {children}
        </Text>
    );
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    backLink: { paddingHorizontal: 16, paddingVertical: 8 },
    navBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
    content: { paddingBottom: 48 },
    head: { paddingHorizontal: 24, paddingTop: 24, alignItems: "flex-start" },
    avatarBadge: { position: "absolute", right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2 },
    tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
    tagPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
    tagPillDashed: { borderStyle: "dashed", backgroundColor: "transparent" },
    actionGrid: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingTop: 22 },
    actionCard: { flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
    sectionBody: { paddingHorizontal: 18, gap: 8 },
    noteComposer: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
    noteSend: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    noteRow: { padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    infoRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 11, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    convRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 11, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    convIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    pressed: { opacity: 0.7 },
});
