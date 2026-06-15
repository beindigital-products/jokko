import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Icon, useTheme } from "@jokko/ui-mobile";

// Deterministic waveform shape (matches the design's Waveform pattern).
const BAR_HEIGHTS = Array.from({ length: 26 }, (_, i) => {
    const n = Math.sin(i * 0.7) * 0.5 + 0.5;
    const m = Math.cos(i * 1.3 + 0.4) * 0.35;
    return Math.max(0.2, Math.min(1, n * 0.8 + Math.abs(m)));
});

/**
 * Playable voice-note / audio bubble — play/pause + a progress-filled waveform +
 * the elapsed/total time, in the design's chat style. Uses expo-audio playback.
 */
export function AudioMessage({ uri, fallbackLabel, outbound }: { uri: string; fallbackLabel?: string; outbound: boolean }) {
    const { colors, font } = useTheme();
    const player = useAudioPlayer({ uri });
    const status = useAudioPlayerStatus(player);
    const fg = outbound ? colors.bubbleOutInk : colors.ink;
    const duration = status.duration || 0;
    const current = status.currentTime || 0;
    const progress = duration > 0 ? Math.min(1, current / duration) : 0;
    const playing = status.playing;

    const toggle = () => {
        if (playing) {
            player.pause();
            return;
        }
        if (duration > 0 && current >= duration - 0.15) player.seekTo(0);
        player.play();
    };

    const timeLabel = current > 0 || playing ? formatTime(current) : duration > 0 ? formatTime(duration) : fallbackLabel ?? "0:00";

    return (
        <View style={styles.row}>
            <Pressable
                onPress={toggle}
                accessibilityRole="button"
                accessibilityLabel={playing ? "Pause" : "Lire la note vocale"}
                style={[styles.play, { backgroundColor: outbound ? "rgba(242,239,232,0.18)" : colors.accent }]}
            >
                <Icon name={playing ? "pause" : "play"} size={14} color={outbound ? fg : "#fff"} strokeWidth={1.8} />
            </Pressable>
            <View style={styles.waveCol}>
                <View style={styles.wave}>
                    {BAR_HEIGHTS.map((h, i) => {
                        const filled = i / BAR_HEIGHTS.length <= progress;
                        return (
                            <View
                                key={i}
                                style={[
                                    styles.bar,
                                    {
                                        height: `${h * 100}%`,
                                        backgroundColor: filled
                                            ? outbound
                                                ? fg
                                                : colors.accent
                                            : outbound
                                              ? "rgba(242,239,232,0.35)"
                                              : colors.mute2,
                                    },
                                ]}
                            />
                        );
                    })}
                </View>
                <Text style={{ fontFamily: font.mono, fontSize: 10.5, color: fg, opacity: 0.6, marginTop: 4 }}>{timeLabel}</Text>
            </View>
        </View>
    );
}

function formatTime(seconds: number): string {
    const total = Math.max(0, Math.round(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 170 },
    play: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    waveCol: { flex: 1 },
    wave: { flexDirection: "row", alignItems: "center", gap: 2, height: 22 },
    bar: { flex: 1, minHeight: 3, borderRadius: 1 },
});
