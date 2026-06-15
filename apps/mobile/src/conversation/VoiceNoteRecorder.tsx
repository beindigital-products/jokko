import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { Icon, tint, useTheme } from "@jokko/ui-mobile";

const RECORDING_OPTIONS = {
    ...RecordingPresets.LOW_QUALITY,
    isMeteringEnabled: true,
};

const SPEEDS = [1, 1.5, 2] as const;
const BARS = Array.from({ length: 26 }, (_, i) => {
    const n = Math.sin(i * 0.7) * 0.5 + 0.5;
    const m = Math.cos(i * 1.3 + 0.4) * 0.35;
    return Math.max(0.2, Math.min(1, n * 0.8 + Math.abs(m)));
});

type Props = {
    disabled?: boolean;
    onSend: (recording: { uri: string; durationMillis: number }) => Promise<void>;
    /** Tells the composer to hide the rest of its controls while recording/previewing. */
    onActiveChange?: (active: boolean) => void;
};

/**
 * Record → preview → send voice notes. Recording shows a live timer; stopping
 * lands on a preview (play / scrub / speed) so nothing sends by accident.
 */
export function VoiceNoteRecorder({ disabled, onSend, onActiveChange }: Props) {
    const { colors, font } = useTheme();
    const recorder = useAudioRecorder(RECORDING_OPTIONS);
    const recorderState = useAudioRecorderState(recorder, 200);
    const [mode, setMode] = useState<"idle" | "recording" | "preview">("idle");
    const [preview, setPreview] = useState<{ uri: string; durationMillis: number } | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [rate, setRate] = useState<(typeof SPEEDS)[number]>(1);

    const player = useAudioPlayer(null);
    const playerStatus = useAudioPlayerStatus(player);

    useEffect(() => {
        onActiveChange?.(mode !== "idle");
    }, [mode, onActiveChange]);

    useEffect(() => {
        return () => {
            // The native recorder may already be released on unmount; guard every access.
            try {
                if (recorder.isRecording) void recorder.stop();
            } catch {
                // already disposed
            }
        };
    }, [recorder]);

    const start = async () => {
        try {
            const permission = await requestRecordingPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Micro refusé", "Autorise le microphone dans Réglages pour enregistrer une note vocale.");
                return;
            }
            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
            recorder.record();
            setMode("recording");
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            Alert.alert("Enregistrement impossible", error instanceof Error ? error.message : "Recorder indisponible");
        }
    };

    const stopToPreview = async () => {
        try {
            await recorder.stop();
            await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
            const uri = recorder.uri ?? recorderState.url;
            const durationMillis = recorderState.durationMillis;
            if (!uri) {
                Alert.alert("Note vocale vide", "Aucun enregistrement détecté, réessaie.");
                setMode("idle");
                return;
            }
            player.replace({ uri });
            player.setPlaybackRate(1);
            setRate(1);
            setPreview({ uri, durationMillis });
            setMode("preview");
        } catch (error) {
            Alert.alert("Note vocale", error instanceof Error ? error.message : "Arrêt impossible");
            setMode("idle");
        }
    };

    const discard = () => {
        try {
            player.pause();
        } catch {
            // no-op
        }
        setPreview(null);
        setMode("idle");
    };

    const togglePlay = () => {
        if (playerStatus.playing) {
            player.pause();
            return;
        }
        if (playerStatus.duration > 0 && playerStatus.currentTime >= playerStatus.duration - 0.15) player.seekTo(0);
        player.play();
    };

    const cycleSpeed = () => {
        const next = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
        setRate(next);
        player.setPlaybackRate(next);
    };

    const send = async () => {
        if (!preview) return;
        setIsSending(true);
        try {
            try {
                player.pause();
            } catch {
                // no-op
            }
            await onSend(preview);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPreview(null);
            setMode("idle");
        } catch (error) {
            Alert.alert("Note vocale", error instanceof Error ? error.message : "Envoi impossible");
        } finally {
            setIsSending(false);
        }
    };

    if (mode === "recording") {
        return (
            <View style={[styles.recordingRow, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                <Pressable accessibilityLabel="Annuler" onPress={discard} style={[styles.iconCircle, { backgroundColor: tint(colors.hot, 0.14) }]}>
                    <Icon name="trash" size={16} color={colors.hot} strokeWidth={1.8} />
                </Pressable>
                <View style={styles.timerBox}>
                    <View style={[styles.dot, { backgroundColor: colors.hot }]} />
                    <Text style={{ fontFamily: font.mono, fontSize: 14, color: colors.ink }}>{formatDuration(recorderState.durationMillis)}</Text>
                </View>
                <Pressable accessibilityLabel="Arrêter" onPress={() => void stopToPreview()} style={[styles.iconCircle, { backgroundColor: colors.ink }]}>
                    <View style={[styles.stopSquare, { backgroundColor: colors.paper }]} />
                </Pressable>
            </View>
        );
    }

    if (mode === "preview" && preview) {
        const duration = playerStatus.duration || preview.durationMillis / 1000;
        const progress = duration > 0 ? Math.min(1, playerStatus.currentTime / duration) : 0;
        return (
            <View style={{ flex: 1 }}>
                <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.rule }]}>
                    <Pressable accessibilityLabel="Supprimer" onPress={discard} style={[styles.iconCircle, { backgroundColor: tint(colors.hot, 0.14) }]}>
                        <Icon name="trash" size={16} color={colors.hot} strokeWidth={1.8} />
                    </Pressable>
                    <Pressable accessibilityLabel={playerStatus.playing ? "Pause" : "Lire"} onPress={togglePlay} style={[styles.iconCircle, { backgroundColor: colors.ink }]}>
                        <Icon name={playerStatus.playing ? "pause" : "play"} size={15} color={colors.paper} strokeWidth={1.8} />
                    </Pressable>
                    <View style={{ flex: 1, gap: 5 }}>
                        <View style={styles.wave}>
                            {BARS.map((h, i) => (
                                <View
                                    key={i}
                                    style={[styles.bar, { height: `${h * 100}%`, backgroundColor: i / BARS.length <= progress ? colors.accent : colors.mute2 }]}
                                />
                            ))}
                        </View>
                        <View style={styles.scrubRow}>
                            <Text style={{ fontFamily: font.mono, fontSize: 10.5, color: colors.mute }}>{formatSeconds(playerStatus.currentTime)}</Text>
                            <Pressable onPress={cycleSpeed} style={[styles.speed, { backgroundColor: colors.paper2 }]}>
                                <Text style={{ fontFamily: font.mono, fontSize: 9.5, color: colors.ink2 }}>{rate}x</Text>
                            </Pressable>
                            <Text style={{ fontFamily: font.mono, fontSize: 10.5, color: colors.ink2 }}>{formatSeconds(duration)}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.actionRow}>
                    <View style={styles.tagRow}>
                        <Icon name="mic" size={13} color={colors.mute} strokeWidth={1.8} />
                        <Text style={{ fontFamily: font.mono, fontSize: 11.5, color: colors.mute }}>NOTE VOCALE · {Math.round(preview.durationMillis / 1000)} s</Text>
                    </View>
                    <View style={styles.actionBtns}>
                        <Pressable onPress={discard} style={[styles.ghostBtn, { borderColor: colors.rule }]}>
                            <Text style={{ fontSize: 13, fontFamily: font.sansMedium, color: colors.ink3 }}>Réenregistrer</Text>
                        </Pressable>
                        <Pressable onPress={() => void send()} disabled={isSending} style={[styles.sendBtn, { backgroundColor: colors.accent, opacity: isSending ? 0.6 : 1 }]}>
                            <Icon name="send" size={15} color="#fff" strokeWidth={2} />
                            <Text style={{ fontSize: 14, fontFamily: font.sansMedium, color: "#fff" }}>Envoyer</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enregistrer une note vocale"
            disabled={disabled}
            onPress={() => void start()}
            style={({ pressed }) => [styles.micButton, { backgroundColor: colors.card, borderColor: colors.rule }, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
        >
            <Icon name="mic" size={20} color={colors.ink} strokeWidth={1.7} />
        </Pressable>
    );
}

function formatDuration(ms: number): string {
    const total = Math.floor(ms / 1000);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatSeconds(seconds: number): string {
    const total = Math.max(0, Math.round(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
    micButton: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
    recordingRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth },
    iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    stopSquare: { width: 13, height: 13, borderRadius: 3 },
    timerBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    previewCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
    wave: { flexDirection: "row", alignItems: "center", gap: 2, height: 22 },
    bar: { flex: 1, minHeight: 3, borderRadius: 1 },
    scrubRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    speed: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, paddingTop: 10, gap: 8 },
    tagRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
    actionBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
    ghostBtn: { height: 40, paddingHorizontal: 14, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
    sendBtn: { height: 40, paddingHorizontal: 16, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 8 },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.7 },
});
