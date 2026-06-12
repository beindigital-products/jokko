import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from "expo-audio";
import { theme } from "@jokko/tokens";

const RECORDING_OPTIONS = {
    ...RecordingPresets.LOW_QUALITY,
    isMeteringEnabled: true,
};

type Props = {
    disabled?: boolean;
    onSend: (recording: { uri: string; durationMillis: number }) => Promise<void>;
};

export function VoiceNoteRecorder({ disabled, onSend }: Props) {
    const recorder = useAudioRecorder(RECORDING_OPTIONS);
    const recorderState = useAudioRecorderState(recorder, 250);
    const [isRecording, setIsRecording] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        return () => {
            // On unmount (leaving the conversation) the native recorder may already
            // be released; touching it then throws NativeSharedObjectNotFound. Guard
            // every access so the cleanup can never crash the screen.
            try {
                if (recorder.isRecording) {
                    void recorder.stop();
                }
            } catch {
                // recorder already disposed — nothing to stop.
            }
        };
    }, [recorder]);

    const start = async () => {
        try {
            const permission = await requestRecordingPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    "Micro refusé",
                    "Autorise le microphone dans Réglages pour enregistrer une note vocale.",
                );
                return;
            }
            await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
            await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
            recorder.record();
            setIsRecording(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Recorder indisponible";
            Alert.alert("Enregistrement impossible", message);
        }
    };

    const cancel = async () => {
        try {
            await recorder.stop();
        } catch {
            // ignore
        }
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(
            () => undefined,
        );
        setIsRecording(false);
    };

    const finish = async () => {
        if (!isRecording) return;
        setIsSending(true);
        try {
            await recorder.stop();
            await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
            const uri = recorder.uri ?? recorderState.url;
            const duration = recorderState.durationMillis;
            setIsRecording(false);
            if (!uri) {
                Alert.alert("Note vocale vide", "Aucun enregistrement détecté, réessaie.");
                return;
            }
            await onSend({ uri, durationMillis: duration });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Envoi impossible";
            Alert.alert("Note vocale", message);
        } finally {
            setIsSending(false);
        }
    };

    if (isRecording) {
        return (
            <View style={styles.recordingRow}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Annuler la note vocale"
                    onPress={cancel}
                    disabled={isSending}
                    style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
                >
                    <Ionicons name="close" size={18} color={theme.semantic.danger} />
                </Pressable>
                <View style={styles.timerBox}>
                    <View style={styles.dot} />
                    <Text style={styles.timer}>{formatDuration(recorderState.durationMillis)}</Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Envoyer la note vocale"
                    onPress={finish}
                    disabled={isSending}
                    style={({ pressed }) => [
                        styles.send,
                        isSending && styles.disabled,
                        pressed && !isSending && styles.pressed,
                    ]}
                >
                    <Ionicons name="send" size={18} color="#fff" />
                </Pressable>
            </View>
        );
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enregistrer une note vocale"
            disabled={disabled}
            onPress={start}
            style={({ pressed }) => [
                styles.micButton,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
            ]}
        >
            <Ionicons name="mic" size={20} color={theme.ink[900]} />
        </Pressable>
    );
}

function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
    micButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    recordingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
        flex: 1,
    },
    cancel: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FEE2E2",
    },
    timerBox: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.semantic.danger,
    },
    timer: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.ink[900],
    },
    send: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.ink[900],
    },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.7 },
});
