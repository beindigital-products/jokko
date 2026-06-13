import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation } from "convex/react";
import { Btn, Icon, useTheme, type JokkoTheme } from "@jokko/ui-mobile";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type EditableContact = {
    _id: Id<"contacts">;
    name?: string | null;
    phone: string;
    email?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    city?: string | null;
};

type Props = {
    visible: boolean;
    contact: EditableContact;
    tagNames: string[];
    onClose: () => void;
};

export function EditContactSheet({ visible, contact, tagNames, onClose }: Props) {
    const theme = useTheme();
    const { colors, font } = theme;
    const updateContact = useMutation(api.contacts.update);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [city, setCity] = useState("");
    const [busy, setBusy] = useState(false);

    // Prefill (and reset) from the contact each time the sheet opens.
    useEffect(() => {
        if (!visible) return;
        setName(contact.name ?? "");
        setPhone(contact.phone ?? "");
        setEmail(contact.email ?? "");
        setCompany(contact.company ?? "");
        setJobTitle(contact.jobTitle ?? "");
        setCity(contact.city ?? "");
    }, [visible, contact]);

    const save = async () => {
        if (phone.trim().length < 4) {
            Alert.alert("Numéro requis", "Renseigne un numéro de téléphone valide.");
            return;
        }
        setBusy(true);
        try {
            await updateContact({
                id: contact._id,
                tags: tagNames,
                name: name.trim() || undefined,
                phone: phone.trim(),
                email: email.trim() || undefined,
                company: company.trim() || undefined,
                jobTitle: jobTitle.trim() || undefined,
                city: city.trim() || undefined,
            });
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("CRM") || message.toUpperCase().includes("READONLY")) {
                Alert.alert("Contact synchronisé", "Ce contact est lié à un CRM. Modifie ses informations directement dans ton CRM.");
            } else {
                Alert.alert("Enregistrement impossible", message || "Réessaie.");
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.kav} pointerEvents="box-none">
                <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                    <View style={styles.handle}>
                        <View style={[styles.handleBar, { backgroundColor: colors.rule }]} />
                    </View>
                    <View style={[styles.header, { borderBottomColor: colors.rule }]}>
                        <Text style={[styles.title, { color: colors.ink, fontFamily: font.display }]}>Modifier le contact</Text>
                        <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.card }]}>
                            <Icon name="close" size={17} color={colors.ink3} />
                        </Pressable>
                    </View>
                    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                        <Field theme={theme} label="Nom" value={name} onChange={setName} placeholder="Awa Diallo" />
                        <Field theme={theme} label="Téléphone *" value={phone} onChange={setPhone} placeholder="+221 77 000 00 00" keyboardType="phone-pad" />
                        <Field theme={theme} label="E-mail" value={email} onChange={setEmail} placeholder="awa@exemple.com" keyboardType="email-address" />
                        <Field theme={theme} label="Entreprise" value={company} onChange={setCompany} placeholder="Atelier de Dakar" />
                        <Field theme={theme} label="Poste" value={jobTitle} onChange={setJobTitle} placeholder="Responsable achats" />
                        <Field theme={theme} label="Ville" value={city} onChange={setCity} placeholder="Dakar" />
                        <View style={{ marginTop: 4 }}>
                            <Btn tone="accent" full disabled={busy} onPress={() => void save()}>
                                {busy ? "Enregistrement…" : "Enregistrer"}
                            </Btn>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
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
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    title: { fontSize: 18, letterSpacing: -0.2 },
    close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    body: { paddingHorizontal: 18, paddingTop: 14, gap: 12, paddingBottom: 8 },
    input: { minHeight: 46, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 15 },
});
