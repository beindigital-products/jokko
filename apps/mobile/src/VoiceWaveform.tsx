import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Canvas, RoundedRect } from "@shopify/react-native-skia";
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
import {
  appendMeteringSample,
  buildWaveformRects,
  createIdleWaveform,
  meteringDbToAmplitude,
  summarizeFrameIntervals,
  VOICE_POLL_INTERVAL_MS,
  VOICE_WAVEFORM_BAR_COUNT,
  type FrameStats,
} from "./lib/voice-waveform";

type RecordingStatus = "idle" | "recording" | "stopped" | "permission-denied" | "error";

const RECORDING_OPTIONS = {
  ...RecordingPresets.LOW_QUALITY,
  isMeteringEnabled: true,
};

export function VoiceWaveform() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, VOICE_POLL_INTERVAL_MS);
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [samples, setSamples] = useState(() => createIdleWaveform());
  const [durationMillis, setDurationMillis] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frameStats = useFrameStats();
  const isRecording = status === "recording";

  useEffect(() => {
    if (!recorderState.isRecording) return;

    const amplitude = meteringDbToAmplitude(recorderState.metering);
    setDurationMillis(recorderState.durationMillis);
    setSamples((current) =>
      appendMeteringSample(current, amplitude, VOICE_WAVEFORM_BAR_COUNT)
    );
  }, [recorderState.durationMillis, recorderState.isRecording, recorderState.metering]);

  useEffect(() => {
    if (isRecording) return;

    let phase = 0;
    const interval = setInterval(() => {
      phase += 0.28;
      setSamples(createIdleWaveform(VOICE_WAVEFORM_BAR_COUNT, phase));
    }, 90);

    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    setRecordingUri(null);

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setStatus("permission-denied");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
      recorder.record();
      setDurationMillis(0);
      setSamples([]);
      setStatus("recording");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (recordingError) {
      setStatus("error");
      setError(recordingError instanceof Error ? recordingError.message : "Recorder error");
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      setRecordingUri(recorder.uri ?? recorderState.url);
      setDurationMillis(recorderState.durationMillis);
      setStatus("stopped");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (recordingError) {
      setStatus("error");
      setError(recordingError instanceof Error ? recordingError.message : "Stop error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setRecordingUri(null);
    setDurationMillis(0);
    setError(null);
  };

  const statusCopy = useMemo(() => {
    if (status === "recording") return "Enregistrement micro actif";
    if (status === "stopped") return recordingUri ? "Note vocale prête" : "Note vocale arrêtée";
    if (status === "permission-denied") return "Micro refusé";
    if (status === "error") return "Recorder indisponible";
    return "Prévisualisation waveform";
  }, [recordingUri, status]);

  return (
    <View style={styles.root}>
      <View style={styles.thread}>
        <View style={styles.bubble}>
          <Text style={styles.sender}>Awa · 10:42</Text>
          <Text style={styles.message}>
            Est-ce que je peux vous envoyer une note vocale pour expliquer le besoin ?
          </Text>
        </View>

        <View style={styles.composer}>
          <View style={styles.waveHeader}>
            <View style={[styles.liveDot, isRecording && styles.liveDotActive]} />
            <Text style={styles.waveTitle}>{statusCopy}</Text>
            <Text style={styles.timer}>{formatDuration(durationMillis)}</Text>
          </View>

          <WaveformCanvas samples={samples} active={isRecording} />

          <View style={styles.metricsRow}>
            <Metric label="poll" value={`${VOICE_POLL_INTERVAL_MS} ms`} />
            <Metric label="bars" value={`${samples.length}/${VOICE_WAVEFORM_BAR_COUNT}`} />
            <Metric label="p95" value={formatP95(frameStats)} tone={frameStats.p95Fps >= 55 ? "ok" : "warn"} />
          </View>
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        {isRecording ? (
          <Pressable style={[styles.primaryButton, styles.stopButton]} onPress={stopRecording}>
            <Ionicons name="stop" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Stop</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={startRecording}>
            <Ionicons name="mic" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Enregistrer</Text>
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={reset}>
          <Ionicons name="refresh" size={18} color={theme.ink[700]} />
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        Le POC poll `expo-audio` toutes les 50 ms avec metering activé. Le chiffre p95 vient de `requestAnimationFrame` sur l'écran actif.
      </Text>
    </View>
  );
}

function WaveformCanvas({ samples, active }: { samples: readonly number[]; active: boolean }) {
  const [size, setSize] = useState({ width: 1, height: 92 });
  const rects = useMemo(
    () =>
      buildWaveformRects(samples, size.width, size.height, {
        gap: 3,
        minBarHeight: 5,
        maxBarHeightRatio: 0.88,
      }),
    [samples, size.height, size.width]
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width: Math.max(1, width), height: Math.max(1, height) });
  };

  return (
    <View style={styles.waveformFrame} onLayout={onLayout}>
      <Canvas style={StyleSheet.absoluteFill}>
        {rects.map((rect) => (
          <RoundedRect
            key={rect.index}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            r={rect.radius}
            color={active ? theme.accent.primary : theme.ink[500]}
            opacity={active ? 0.95 : 0.5}
          />
        ))}
      </Canvas>
    </View>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[
          styles.metricValue,
          tone === "ok" && styles.metricOk,
          tone === "warn" && styles.metricWarn,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function useFrameStats(): FrameStats {
  const intervalsRef = useRef<number[]>([]);
  const lastFrameRef = useRef<number | null>(null);
  const lastReportRef = useRef(0);
  const [stats, setStats] = useState<FrameStats>(() => summarizeFrameIntervals([]));

  useEffect(() => {
    let frame: number;

    const loop = (timestamp: number) => {
      const lastFrame = lastFrameRef.current;
      if (lastFrame != null) {
        intervalsRef.current.push(timestamp - lastFrame);
        if (intervalsRef.current.length > 180) intervalsRef.current.shift();
      }

      lastFrameRef.current = timestamp;
      if (timestamp - lastReportRef.current > 700) {
        lastReportRef.current = timestamp;
        setStats(summarizeFrameIntervals(intervalsRef.current));
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return stats;
}

function formatDuration(durationMillis: number): string {
  const totalSeconds = Math.floor(durationMillis / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatP95(stats: FrameStats): string {
  if (stats.frameCount < 10) return "--";
  return `${Math.round(stats.p95Fps)} fps`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.surface.default },
  thread: {
    flex: 1,
    justifyContent: "flex-end",
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    backgroundColor: theme.surface.raised,
    borderRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.ink[300],
  },
  sender: { fontSize: 12, fontWeight: "700", color: theme.accent.primary, marginBottom: 4 },
  message: { fontSize: 15, lineHeight: 21, color: theme.ink[900] },
  composer: {
    backgroundColor: theme.surface.raised,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.ink[300],
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  waveHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.ink[300],
  },
  liveDotActive: { backgroundColor: theme.semantic.danger },
  waveTitle: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: "700", color: theme.ink[900] },
  timer: { fontSize: 13, fontVariant: ["tabular-nums"], color: theme.ink[500] },
  waveformFrame: {
    height: 92,
    overflow: "hidden",
    backgroundColor: theme.surface.sunken,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.ink[300],
  },
  metricsRow: { flexDirection: "row", gap: theme.spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: theme.surface.default,
    borderRadius: theme.radius.sm,
    paddingVertical: 7,
    paddingHorizontal: theme.spacing.sm,
    minWidth: 0,
  },
  metricLabel: { fontSize: 10, textTransform: "uppercase", color: theme.ink[500], marginBottom: 2 },
  metricValue: { fontSize: 13, fontWeight: "700", color: theme.ink[900] },
  metricOk: { color: theme.semantic.success },
  metricWarn: { color: theme.semantic.warning },
  error: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    color: theme.semantic.danger,
    fontSize: 12,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.ink[900],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  stopButton: { backgroundColor: theme.semantic.danger },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    minWidth: 104,
    minHeight: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.surface.raised,
    borderWidth: 1,
    borderColor: theme.ink[300],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  secondaryButtonText: { color: theme.ink[700], fontSize: 14, fontWeight: "700" },
  hint: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    fontSize: 12,
    color: theme.ink[500],
    lineHeight: 17,
    textAlign: "center",
  },
});
