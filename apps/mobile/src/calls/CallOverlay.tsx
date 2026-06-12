import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Icon, getTheme, type IconName } from "@jokko/ui-mobile";

export type CallPhase = "idle" | "incoming" | "outgoing" | "connecting" | "connected" | "ended" | "error";

type Props = {
    phase: CallPhase;
    contactName: string;
    direction: "INBOUND" | "OUTBOUND";
    connectedAt: number | null;
    muted: boolean;
    speaker: boolean;
    onAccept: () => void;
    onReject: () => void;
    onHangUp: () => void;
    onToggleMute: () => void;
    onToggleSpeaker: () => void;
};

const GREEN = "#25D08A";
const RED = "#FF5B5B";

/** Full-screen, always-dark call screen (incoming / dialing / connected). */
export function CallOverlay({
    phase,
    contactName,
    direction,
    connectedAt,
    muted,
    speaker,
    onAccept,
    onReject,
    onHangUp,
    onToggleMute,
    onToggleSpeaker,
}: Props) {
    const insets = useSafeAreaInsets();
    const theme = getTheme(true);
    const { colors, font } = theme;
    const elapsed = useElapsed(phase === "connected" ? connectedAt : null);

    const status =
        phase === "incoming"
            ? direction === "INBOUND"
                ? "Appel entrant"
                : "Appel"
            : phase === "outgoing"
              ? "Appel en cours…"
              : phase === "connecting"
                ? "Connexion…"
                : phase === "connected"
                  ? elapsed
                  : "Appel terminé";

    return (
        <Modal visible animationType="slide" onRequestClose={onHangUp} statusBarTranslucent>
            <View style={[styles.root, { backgroundColor: colors.paper, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 36 }]}>
                <View style={styles.head}>
                    <Text style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: 1, color: colors.mute, textTransform: "uppercase" }}>
                        {status}
                    </Text>
                </View>

                <View style={styles.center}>
                    <Avatar name={contactName} size={108} status="online" />
                    <Text style={{ marginTop: 22, fontFamily: font.display, fontSize: 26, letterSpacing: -0.4, color: colors.ink, textAlign: "center" }}>
                        {contactName}
                    </Text>
                    {phase === "connected" ? (
                        <Text style={{ marginTop: 6, fontFamily: font.mono, fontSize: 14, color: colors.mute }}>{elapsed}</Text>
                    ) : null}
                </View>

                {phase === "incoming" ? (
                    <View style={styles.incomingRow}>
                        <ControlButton label="Refuser" icon="phone" bg={RED} rotate onPress={onReject} />
                        <ControlButton label="Répondre" icon="phone" bg={GREEN} onPress={onAccept} />
                    </View>
                ) : (
                    <View style={styles.activeRow}>
                        <ControlButton
                            label="Muet"
                            icon={muted ? "mic-off" : "mic"}
                            bg={muted ? "#fff" : "rgba(255,255,255,0.12)"}
                            fg={muted ? colors.paper : colors.ink}
                            onPress={onToggleMute}
                        />
                        <ControlButton label="Raccrocher" icon="phone" bg={RED} rotate onPress={onHangUp} />
                        <ControlButton
                            label="Haut-parleur"
                            icon="speaker"
                            bg={speaker ? "#fff" : "rgba(255,255,255,0.12)"}
                            fg={speaker ? colors.paper : colors.ink}
                            onPress={onToggleSpeaker}
                        />
                    </View>
                )}
            </View>
        </Modal>
    );
}

function ControlButton({
    label,
    icon,
    bg,
    fg = "#fff",
    rotate = false,
    onPress,
}: {
    label: string;
    icon: IconName;
    bg: string;
    fg?: string;
    rotate?: boolean;
    onPress: () => void;
}) {
    const { font } = getTheme(true);
    return (
        <View style={styles.control}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={onPress}
                style={({ pressed }) => [styles.controlButton, { backgroundColor: bg }, pressed && styles.pressed]}
            >
                <Icon name={icon} size={26} color={fg} strokeWidth={1.8} style={rotate ? { transform: [{ rotate: "135deg" }] } : undefined} />
            </Pressable>
            <Text style={{ marginTop: 9, fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontFamily: font.sans }}>{label}</Text>
        </View>
    );
}

function useElapsed(connectedAt: number | null): string {
    const [, tick] = useState(0);
    useEffect(() => {
        if (!connectedAt) return;
        const id = setInterval(() => tick((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [connectedAt]);
    if (!connectedAt) return "0:00";
    const total = Math.max(0, Math.floor((Date.now() - connectedAt) / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28 },
    head: { alignItems: "center" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    incomingRow: { flexDirection: "row", justifyContent: "space-around", alignSelf: "stretch", paddingHorizontal: 24 },
    activeRow: { flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch", paddingHorizontal: 16 },
    control: { alignItems: "center" },
    controlButton: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
    pressed: { opacity: 0.75 },
});
