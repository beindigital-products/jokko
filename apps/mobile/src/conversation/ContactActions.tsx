import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useAction, useMutation, useQuery } from "convex/react";
import { Btn, Icon, useTheme, type IconName, type JokkoTheme } from "@jokko/ui-mobile";
import { api } from "../../../../convex/_generated/api";
import { parseContactsCsv } from "../lib/contacts-csv";

type Mode = "menu" | "manual" | "csv" | "crm";

type Props = { visible: boolean; onClose: () => void };

const CRM_LABELS: Record<string, string> = {
    hubspot: "HubSpot",
    pipedrive: "Pipedrive",
    salesforce: "Salesforce",
    zoho: "Zoho",
    sellsy: "Sellsy",
    brevo: "Brevo",
    axonaut: "Axonaut",
    nocrm: "noCRM",
};

export function ContactActions({ visible, onClose }: Props) {
    const theme = useTheme();
    const { colors, font } = theme;
    const [mode, setMode] = useState<Mode>("menu");

    useEffect(() => {
        if (visible) setMode("menu");
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kav} pointerEvents="box-none">
                <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                    <View style={styles.handle}>
                        <View style={[styles.handleBar, { backgroundColor: colors.rule }]} />
                    </View>
                    <View style={[styles.header, { borderBottomColor: colors.rule }]}>
                        {mode !== "menu" ? (
                            <Pressable onPress={() => setMode("menu")} hitSlop={10} style={styles.headerBtn}>
                                <Icon name="chevron-left" size={20} color={colors.ink} strokeWidth={2} />
                            </Pressable>
                        ) : (
                            <View style={styles.headerBtn} />
                        )}
                        <Text style={[styles.title, { color: colors.ink, fontFamily: font.display }]}>
                            {mode === "menu" ? "Ajouter des contacts" : mode === "manual" ? "Nouveau contact" : mode === "csv" ? "Import CSV" : "Import CRM"}
                        </Text>
                        <Pressable onPress={onClose} hitSlop={10} style={[styles.headerBtn, styles.close, { backgroundColor: colors.card }]}>
                            <Icon name="close" size={17} color={colors.ink3} />
                        </Pressable>
                    </View>

                    {mode === "menu" ? <MenuView theme={theme} onPick={setMode} /> : null}
                    {mode === "manual" ? <ManualView theme={theme} onDone={onClose} /> : null}
                    {mode === "csv" ? <CsvView theme={theme} onDone={onClose} /> : null}
                    {mode === "crm" ? <CrmView theme={theme} /> : null}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

function MenuView({ theme, onPick }: { theme: JokkoTheme; onPick: (mode: Mode) => void }) {
    const { colors, font } = theme;
    const rows: { mode: Mode; icon: IconName; label: string; sub: string }[] = [
        { mode: "manual", icon: "user", label: "Ajouter manuellement", sub: "Saisir un contact à la main" },
        { mode: "csv", icon: "doc", label: "Importer un CSV", sub: "Téléverser une liste de contacts" },
        { mode: "crm", icon: "switch", label: "Importer depuis un CRM", sub: "Synchroniser un CRM connecté" },
    ];
    return (
        <View style={styles.body}>
            {rows.map((row) => (
                <Pressable
                    key={row.mode}
                    onPress={() => onPick(row.mode)}
                    style={({ pressed }) => [styles.menuRow, { borderColor: colors.rule, backgroundColor: pressed ? colors.paper2 : colors.card }]}
                >
                    <View style={[styles.menuIcon, { backgroundColor: colors.paper2 }]}>
                        <Icon name={row.icon} size={19} color={colors.ink} strokeWidth={1.7} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 14.5, color: colors.ink, fontFamily: font.sansSemibold }}>{row.label}</Text>
                        <Text style={{ fontSize: 12.5, color: colors.mute, fontFamily: font.sans, marginTop: 1 }}>{row.sub}</Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={colors.mute2} />
                </Pressable>
            ))}
        </View>
    );
}

function ManualView({ theme, onDone }: { theme: JokkoTheme; onDone: () => void }) {
    const { colors, font } = theme;
    const createContact = useMutation(api.contacts.create);
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [tags, setTags] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        if (phone.trim().length < 4) {
            Alert.alert("Numéro requis", "Renseigne un numéro de téléphone valide.");
            return;
        }
        setBusy(true);
        try {
            await createContact({
                phone: phone.trim(),
                name: name.trim() || undefined,
                email: email.trim() || undefined,
                company: company.trim() || undefined,
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            });
            onDone();
        } catch (error) {
            Alert.alert("Ajout impossible", error instanceof Error ? error.message : "Réessaie.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <ScrollView style={styles.body} contentContainerStyle={{ gap: 12, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            <Field theme={theme} label="Téléphone *" value={phone} onChange={setPhone} placeholder="+221 77 000 00 00" keyboardType="phone-pad" />
            <Field theme={theme} label="Nom" value={name} onChange={setName} placeholder="Awa Diallo" />
            <Field theme={theme} label="E-mail" value={email} onChange={setEmail} placeholder="awa@exemple.com" keyboardType="email-address" />
            <Field theme={theme} label="Entreprise" value={company} onChange={setCompany} placeholder="Atelier de Dakar" />
            <Field theme={theme} label="Tags (séparés par des virgules)" value={tags} onChange={setTags} placeholder="prospect, grossiste" />
            <View style={{ marginTop: 4 }}>
                <Btn tone="accent" full disabled={busy} onPress={() => void submit()}>
                    {busy ? "Ajout…" : "Ajouter le contact"}
                </Btn>
            </View>
        </ScrollView>
    );
}

function CsvView({ theme, onDone }: { theme: JokkoTheme; onDone: () => void }) {
    const { colors, font } = theme;
    const batchCreate = useMutation(api.contacts.batchCreate);
    const [rows, setRows] = useState<ReturnType<typeof parseContactsCsv> | null>(null);
    const [fileName, setFileName] = useState("");
    const [busy, setBusy] = useState(false);

    const pick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "text/plain", "*/*"], copyToCacheDirectory: true });
            if (result.canceled || !result.assets[0]) return;
            const asset = result.assets[0];
            const text = await (await fetch(asset.uri)).text();
            const parsed = parseContactsCsv(text);
            if (parsed.length === 0) {
                Alert.alert("CSV vide", "Aucun contact avec un numéro de téléphone n'a été détecté.");
                return;
            }
            setFileName(asset.name ?? "contacts.csv");
            setRows(parsed);
        } catch (error) {
            Alert.alert("Lecture impossible", error instanceof Error ? error.message : "Fichier illisible.");
        }
    };

    const importAll = async () => {
        if (!rows) return;
        setBusy(true);
        try {
            await batchCreate({ contacts: rows.map((r) => ({ ...r, tags: [] })) });
            Alert.alert("Import terminé", `${rows.length} contact${rows.length > 1 ? "s" : ""} importé${rows.length > 1 ? "s" : ""}.`);
            onDone();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Import impossible.";
            Alert.alert("Import impossible", message.includes("permission") ? "Tu n'as pas la permission d'importer des contacts." : message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={styles.body}>
            {!rows ? (
                <>
                    <Pressable onPress={() => void pick()} style={({ pressed }) => [styles.dropZone, { borderColor: colors.rule }, pressed && { backgroundColor: colors.paper2 }]}>
                        <Icon name="doc" size={26} color={colors.mute} strokeWidth={1.5} />
                        <Text style={{ fontSize: 14, color: colors.ink, fontFamily: font.sansMedium, marginTop: 10 }}>Choisir un fichier CSV</Text>
                        <Text style={{ fontSize: 12, color: colors.mute, fontFamily: font.sans, marginTop: 4, textAlign: "center" }}>
                            Colonnes reconnues : téléphone, nom, e-mail, entreprise
                        </Text>
                    </Pressable>
                </>
            ) : (
                <>
                    <View style={[styles.csvSummary, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                        <Icon name="circle-check" size={20} color={colors.good} strokeWidth={1.8} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontSize: 14, color: colors.ink, fontFamily: font.sansSemibold }}>
                                {rows.length} contact{rows.length > 1 ? "s" : ""} détecté{rows.length > 1 ? "s" : ""}
                            </Text>
                            <Text numberOfLines={1} style={{ fontSize: 12, color: colors.mute, fontFamily: font.mono, marginTop: 2 }}>{fileName}</Text>
                        </View>
                        <Pressable onPress={() => setRows(null)} hitSlop={8}>
                            <Icon name="close" size={16} color={colors.mute} />
                        </Pressable>
                    </View>
                    {rows.slice(0, 3).map((r, i) => (
                        <Text key={i} numberOfLines={1} style={{ fontSize: 12.5, color: colors.ink3, fontFamily: font.sans, paddingHorizontal: 4 }}>
                            · {r.name || r.phone} {r.name ? `(${r.phone})` : ""}
                        </Text>
                    ))}
                    <View style={{ marginTop: 12 }}>
                        <Btn tone="accent" full disabled={busy} onPress={() => void importAll()}>
                            {busy ? "Import…" : `Importer ${rows.length} contact${rows.length > 1 ? "s" : ""}`}
                        </Btn>
                    </View>
                </>
            )}
        </View>
    );
}

function CrmView({ theme }: { theme: JokkoTheme }) {
    const { colors, font } = theme;
    const connections = useQuery(api.crm.connections.listForCurrentOrganization);
    const triggerResync = useAction(api.crm.importer.triggerResync);
    const [busyId, setBusyId] = useState<string | null>(null);

    const list = useMemo(() => (connections ?? []) as { _id: string; provider: string; status: string }[], [connections]);

    const runImport = async (connectionId: string, label: string) => {
        setBusyId(connectionId);
        try {
            await triggerResync({ connectionId: connectionId as never });
            Alert.alert("Import lancé", `La synchronisation ${label} a démarré. Les contacts arriveront progressivement.`);
        } catch (error) {
            Alert.alert("Import impossible", error instanceof Error ? error.message : "Réessaie.");
        } finally {
            setBusyId(null);
        }
    };

    if (connections === undefined) {
        return (
            <View style={[styles.body, styles.center]}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    if (list.length === 0) {
        return (
            <View style={[styles.body, styles.center]}>
                <View style={[styles.menuIcon, { backgroundColor: colors.paper2, width: 56, height: 56, borderRadius: 18 }]}>
                    <Icon name="switch" size={24} color={colors.mute} strokeWidth={1.6} />
                </View>
                <Text style={{ fontSize: 15, color: colors.ink, fontFamily: font.sansSemibold, marginTop: 14, textAlign: "center" }}>Aucun CRM connecté</Text>
                <Text style={{ fontSize: 13, color: colors.mute, fontFamily: font.sans, marginTop: 6, textAlign: "center", maxWidth: 280, lineHeight: 19 }}>
                    Connecte un CRM (HubSpot, Pipedrive…) depuis Intégrations sur le tableau de bord web, puis lance l'import ici.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.body}>
            {list.map((connection) => {
                const label = CRM_LABELS[connection.provider] ?? connection.provider;
                const connected = connection.status === "connected" || connection.status === "active";
                return (
                    <View key={connection._id} style={[styles.menuRow, { borderColor: colors.rule, backgroundColor: colors.card }]}>
                        <View style={[styles.menuIcon, { backgroundColor: colors.paper2 }]}>
                            <Icon name="switch" size={18} color={colors.ink} strokeWidth={1.7} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontSize: 14.5, color: colors.ink, fontFamily: font.sansSemibold }}>{label}</Text>
                            <Text style={{ fontSize: 12, color: connected ? colors.good : colors.mute, fontFamily: font.mono, marginTop: 1 }}>
                                {connected ? "connecté" : connection.status}
                            </Text>
                        </View>
                        <Btn tone="ghost" size="sm" disabled={!connected || busyId === connection._id} onPress={() => void runImport(connection._id, label)}>
                            {busyId === connection._id ? "…" : "Importer"}
                        </Btn>
                    </View>
                );
            })}
        </View>
    );
}

function Field({
    theme,
    label,
    value,
    onChange,
    placeholder,
    keyboardType,
}: {
    theme: JokkoTheme;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboardType?: "phone-pad" | "email-address";
}) {
    const { colors, font } = theme;
    return (
        <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11.5, color: colors.mute, fontFamily: font.mono, letterSpacing: 0.3 }}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={colors.mute}
                keyboardType={keyboardType}
                autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.rule, color: colors.ink, fontFamily: font.sans }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
    kav: { flex: 1, justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28, maxHeight: "88%" },
    handle: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
    handleBar: { width: 38, height: 4, borderRadius: 2 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    headerBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
    close: { borderRadius: 17 },
    title: { fontSize: 18, letterSpacing: -0.2 },
    body: { paddingHorizontal: 18, paddingTop: 14, gap: 10 },
    center: { alignItems: "center", justifyContent: "center", minHeight: 220 },
    menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
    menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    input: { minHeight: 46, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 15 },
    dropZone: { alignItems: "center", justifyContent: "center", paddingVertical: 38, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed" },
    csvSummary: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
});
