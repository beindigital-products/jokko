import { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import * as Clipboard from "expo-clipboard";
import { Btn, Icon, Micro, NavBar, NavButton, Pill, useTheme, type IconName, type JokkoTheme, type PillTone } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { parseTokens, splitTemplateBody, tokenLabel } from "./lib/template-vars";

type TemplateButton = { type: string; text: string; url?: string; phoneNumber?: string };

type TemplateHeader = { type: string; text?: string };

type TemplateDetail = {
    _id: Id<"templates">;
    name: string;
    description?: string;
    type: string;
    category: string;
    language: string;
    status?: string;
    body?: string;
    bodyExamples?: string[];
    footer?: string;
    header?: TemplateHeader;
    buttons?: TemplateButton[];
};

// WhatsApp preview palette — kept fixed in both themes (it mimics a WA message).
const WA_GREEN = "#DCF8C6";
const WA_INK = "#0C1F14";
const TOKEN_BG = "#EFEAFE";
const TOKEN_FG = "#4F1FCF";

export function MobileTemplateDetailScreen({ templateId }: { templateId: string | null }) {
    const router = useRouter();
    const theme = useTheme();
    const { colors, font } = theme;
    const typedId = templateId as Id<"templates"> | null;
    const template = useQuery(api.templates.queries.get, typedId ? { id: typedId } : "skip") as
        | TemplateDetail
        | null
        | undefined;

    const [copied, setCopied] = useState(false);
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)/hub");
    };

    if (!typedId || template === null) {
        return (
            <ErrorState
                theme={theme}
                title={!typedId ? "Modèle introuvable" : "Modèle indisponible"}
                body={!typedId ? "L'identifiant du modèle est manquant." : "Ce modèle n'existe pas dans l'organisation active."}
                onBack={goBack}
            />
        );
    }

    if (template === undefined) {
        return (
            <View style={[styles.center, { backgroundColor: colors.paper }]}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    const body = template.body ?? "";
    const tokens = parseTokens(body);
    const buttons = template.buttons ?? [];

    const copyBody = async () => {
        if (!body) return;
        await Clipboard.setStringAsync(body);
        setCopied(true);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 1600);
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.paper }]}>
            <NavBar left={<NavButton icon="chevron-left" onPress={goBack} />} center="Modèle" />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Micro>
                    {template.type.toUpperCase()} · {template.language.toUpperCase()} · {statusEyebrow(template.status)}
                </Micro>
                <Text style={[styles.title, { fontFamily: font.serifItalic, color: colors.ink }]}>{template.name}</Text>
                {template.description ? (
                    <Text style={[styles.desc, { color: colors.ink3, fontFamily: font.sans }]}>{template.description}</Text>
                ) : null}
                <View style={{ marginTop: 12 }}>
                    <StatusPill theme={theme} status={template.status} />
                </View>

                {/* Preview pane */}
                <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                    <Micro style={{ marginBottom: 10 }}>Aperçu</Micro>
                    <View style={styles.waBubble}>
                        {template.header?.text ? (
                            <Text style={[styles.waHeader, { fontFamily: font.sansSemibold }]}>{template.header.text}</Text>
                        ) : template.header && template.header.type !== "TEXT" ? (
                            <View style={styles.waMedia}>
                                <Icon name={headerIcon(template.header.type)} size={15} color={WA_INK} strokeWidth={1.8} />
                                <Text style={[styles.waMediaLabel, { fontFamily: font.monoMedium }]}>
                                    {template.header.type}
                                </Text>
                            </View>
                        ) : null}
                        <Text style={[styles.waBody, { fontFamily: font.sans }]}>
                            {body
                                ? splitTemplateBody(body).map((seg, i) =>
                                      seg.token === null ? (
                                          seg.text
                                      ) : (
                                          <Text key={i} style={{ backgroundColor: TOKEN_BG, color: TOKEN_FG, fontFamily: font.sansMedium }}>
                                              {` ${tokenLabel(seg.token, template.bodyExamples)} `}
                                          </Text>
                                      ),
                                  )
                                : "Aucun corps de message."}
                        </Text>
                        {template.footer ? (
                            <Text style={[styles.waFooter, { fontFamily: font.sans }]}>{template.footer}</Text>
                        ) : null}
                        <Text style={[styles.waTime, { fontFamily: font.mono }]}>11:32</Text>
                    </View>

                    {buttons.length > 0 ? (
                        <View style={styles.waButtons}>
                            {buttons.map((b, i) => (
                                <View key={`${b.type}-${i}`} style={[styles.waButton, { borderColor: colors.rule }]}>
                                    <Icon name={buttonIcon(b.type)} size={15} color={colors.accentInk} strokeWidth={1.8} />
                                    <Text numberOfLines={1} style={{ fontSize: 13, color: colors.accentInk, fontFamily: font.sansMedium }}>
                                        {b.text}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>

                {/* Variables */}
                {tokens.length > 0 ? (
                    <>
                        <Micro style={{ marginTop: 28, marginBottom: 10 }}>Variables · {tokens.length}</Micro>
                        <View style={{ gap: 10 }}>
                            {tokens.map((n) => (
                                <VarRow key={n} theme={theme} index={n} value={template.bodyExamples?.[n - 1]} />
                            ))}
                        </View>
                    </>
                ) : null}

                <Text style={[styles.note, { color: colors.mute, fontFamily: font.sans }]}>
                    Les modèles sont créés et approuvés depuis l'app web ou Meta. Sur mobile, vous les consultez et les
                    envoyez avec leurs variables directement depuis une conversation.
                </Text>
            </ScrollView>

            {/* Bottom bar — honest action (no recipient context here) */}
            <View style={[styles.bottomBar, { borderTopColor: colors.rule2, backgroundColor: colors.paper }]}>
                <Btn tone="soft" size="lg" full icon={copied ? "check" : "doc"} onPress={() => void copyBody()}>
                    {copied ? "Corps copié" : "Copier le corps"}
                </Btn>
            </View>
        </View>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusEyebrow(status?: string): string {
    switch ((status ?? "").toUpperCase()) {
        case "APPROVED":
            return "APPROUVÉ META";
        case "PENDING":
        case "IN_REVIEW":
        case "PENDING_REVIEW":
            return "EN ATTENTE META";
        case "REJECTED":
            return "REFUSÉ META";
        default:
            return "BROUILLON";
    }
}

function StatusPill({ theme, status }: { theme: JokkoTheme; status?: string }) {
    if (!status) return null;
    const s = status.toUpperCase();
    const tone: PillTone =
        s === "APPROVED" ? "good" : s === "REJECTED" ? "hot" : s.includes("PENDING") || s.includes("REVIEW") ? "warn" : "mute";
    const label = s === "APPROVED" ? "Approuvé" : s === "REJECTED" ? "Refusé" : tone === "warn" ? "En attente" : s;
    return <Pill tone={tone} size="md">{label}</Pill>;
}

function VarRow({ theme, index, value }: { theme: JokkoTheme; index: number; value?: string }) {
    const { colors, font } = theme;
    return (
        <View style={[styles.varRow, { backgroundColor: colors.card, borderColor: colors.rule }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Text style={{ fontFamily: font.monoMedium, fontSize: 11, color: colors.accentInk }}>{`{{${index}}}`}</Text>
                <Text style={{ fontSize: 11.5, color: colors.mute, fontFamily: font.sans }}>variable {index}</Text>
            </View>
            <Text style={{ fontSize: 15, color: value ? colors.ink : colors.mute, fontFamily: font.sansMedium }}>
                {value || "Renseignée à l'envoi"}
            </Text>
        </View>
    );
}

function headerIcon(type: string): IconName {
    if (type === "IMAGE") return "image";
    if (type === "VIDEO") return "video";
    if (type === "DOCUMENT") return "doc";
    return "doc";
}

function buttonIcon(type: string): IconName {
    if (type === "URL") return "globe";
    if (type === "PHONE_NUMBER") return "phone";
    if (type === "QUICK_REPLY") return "reply";
    return "forward";
}

function ErrorState({ theme, title, body, onBack }: { theme: JokkoTheme; title: string; body: string; onBack: () => void }) {
    const { colors, font } = theme;
    return (
        <View style={[styles.center, { backgroundColor: colors.paper, padding: 32, gap: 12 }]}>
            <Icon name="sticky-note" size={30} color={colors.mute} strokeWidth={1.5} />
            <Text style={{ fontFamily: font.display, fontSize: 20, color: colors.ink, textAlign: "center" }}>{title}</Text>
            <Text style={{ fontSize: 14, color: colors.mute, textAlign: "center", maxWidth: 300, fontFamily: font.sans }}>{body}</Text>
            <View style={{ marginTop: 6 }}>
                <Btn tone="ghost" onPress={onBack}>Retour au Hub</Btn>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    content: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 32 },
    title: { fontSize: 36, lineHeight: 38, letterSpacing: -0.5, marginTop: 8 },
    desc: { fontSize: 13.5, lineHeight: 20, marginTop: 8 },
    previewCard: { marginTop: 24, padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
    waBubble: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: WA_GREEN,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    waHeader: { fontSize: 14.5, color: WA_INK, marginBottom: 4 },
    waMedia: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, opacity: 0.8 },
    waMediaLabel: { fontSize: 10.5, color: WA_INK, letterSpacing: 0.5 },
    waBody: { fontSize: 14.5, lineHeight: 21, color: WA_INK },
    waFooter: { fontSize: 12, color: "rgba(12,31,20,0.55)", marginTop: 8 },
    waTime: { fontSize: 10, color: "rgba(12,31,20,0.45)", textAlign: "right", marginTop: 6 },
    waButtons: { marginTop: 8, gap: 6 },
    waButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 40,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    varRow: { padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    note: { fontSize: 12.5, lineHeight: 18, marginTop: 28 },
    bottomBar: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
});
