export const VOICE_WAVEFORM_BAR_COUNT = 48;
export const VOICE_POLL_INTERVAL_MS = 50;

export type WaveformRect = {
    index: number;
    value: number;
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
};

export type FrameStats = {
    frameCount: number;
    avgFrameMs: number;
    p95FrameMs: number;
    p95Fps: number;
};

export function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(1, Math.max(0, value));
}

export function meteringDbToAmplitude(
    db: number | null | undefined,
    options: { floorDb?: number; ceilingDb?: number } = {}
): number {
    if (db == null || !Number.isFinite(db)) return 0;

    const floorDb = options.floorDb ?? -60;
    const ceilingDb = options.ceilingDb ?? -6;
    const span = Math.max(1, ceilingDb - floorDb);
    const clamped = Math.min(ceilingDb, Math.max(floorDb, db));
    const linear = (clamped - floorDb) / span;

    return clamp01(Math.pow(linear, 0.72));
}

export function sampleFramesToAmplitude(frames: readonly number[]): number {
    if (frames.length === 0) return 0;

    const sumSquares = frames.reduce((sum, frame) => {
        const normalized = clamp01(Math.abs(frame));
        return sum + normalized * normalized;
    }, 0);

    return clamp01(Math.sqrt(sumSquares / frames.length));
}

export function appendMeteringSample(
    samples: readonly number[],
    amplitude: number,
    maxBars = VOICE_WAVEFORM_BAR_COUNT
): number[] {
    const next = clamp01(amplitude);
    const retained = samples.slice(Math.max(0, samples.length - maxBars + 1));
    return [...retained, next];
}

export function createIdleWaveform(barCount = VOICE_WAVEFORM_BAR_COUNT, phase = 0): number[] {
    return Array.from({ length: barCount }, (_, index) => {
        const slow = Math.sin(index * 0.55 + phase) * 0.055;
        const fast = Math.sin(index * 1.4 + phase * 1.35) * 0.025;
        return clamp01(0.12 + slow + fast);
    });
}

export function buildWaveformRects(
    samples: readonly number[],
    width: number,
    height: number,
    options: { gap?: number; minBarHeight?: number; maxBarHeightRatio?: number } = {}
): WaveformRect[] {
    if (samples.length === 0 || width <= 0 || height <= 0) return [];

    const gap = options.gap ?? 3;
    const minBarHeight = Math.min(options.minBarHeight ?? 4, height);
    const maxHeight = Math.max(minBarHeight, height * (options.maxBarHeightRatio ?? 0.9));
    const barWidth = Math.max(2, (width - gap * (samples.length - 1)) / samples.length);
    const totalWidth = samples.length * barWidth + (samples.length - 1) * gap;
    const startX = Math.max(0, (width - totalWidth) / 2);
    const centerY = height / 2;

    return samples.map((sample, index) => {
        const value = clamp01(sample);
        const barHeight = minBarHeight + value * (maxHeight - minBarHeight);
        return {
            index,
            value,
            x: startX + index * (barWidth + gap),
            y: centerY - barHeight / 2,
            width: barWidth,
            height: barHeight,
            radius: Math.min(barWidth / 2, barHeight / 2),
        };
    });
}

export function summarizeFrameIntervals(intervals: readonly number[]): FrameStats {
    const valid = intervals.filter((interval) => Number.isFinite(interval) && interval > 0);
    if (valid.length === 0) {
        return {
            frameCount: 0,
            avgFrameMs: 0,
            p95FrameMs: 0,
            p95Fps: 0,
        };
    }

    const sorted = [...valid].sort((a, b) => a - b);
    const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
    const p95FrameMs = sorted[p95Index];
    const avgFrameMs = valid.reduce((sum, interval) => sum + interval, 0) / valid.length;

    return {
        frameCount: valid.length,
        avgFrameMs,
        p95FrameMs,
        p95Fps: p95FrameMs > 0 ? 1000 / p95FrameMs : 0,
    };
}
