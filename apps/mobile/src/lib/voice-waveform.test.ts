import { describe, expect, it } from "vitest";
import {
    appendMeteringSample,
    buildWaveformRects,
    createIdleWaveform,
    meteringDbToAmplitude,
    sampleFramesToAmplitude,
    summarizeFrameIntervals,
} from "./voice-waveform";

describe("Spike S7 — voice waveform helpers", () => {
    it("maps silence-like metering to zero", () => {
        expect(meteringDbToAmplitude(-160)).toBe(0);
        expect(meteringDbToAmplitude(undefined)).toBe(0);
    });

    it("maps normal voice metering into a visible amplitude", () => {
        const quietVoice = meteringDbToAmplitude(-42);
        const loudVoice = meteringDbToAmplitude(-12);

        expect(quietVoice).toBeGreaterThan(0);
        expect(loudVoice).toBeGreaterThan(quietVoice);
        expect(loudVoice).toBeLessThanOrEqual(1);
    });

    it("keeps the waveform buffer capped", () => {
        const samples = [0.1, 0.2, 0.3, 0.4];
        expect(appendMeteringSample(samples, 0.8, 3)).toEqual([0.3, 0.4, 0.8]);
    });

    it("computes RMS amplitude from PCM frames", () => {
        expect(sampleFramesToAmplitude([0, 0, 0])).toBe(0);
        expect(sampleFramesToAmplitude([1, -1, 1, -1])).toBe(1);
        expect(sampleFramesToAmplitude([0.5, -0.5])).toBeCloseTo(0.5, 5);
    });

    it("builds centered Skia rect geometry with minimum height", () => {
        const rects = buildWaveformRects([0, 0.5, 1], 90, 40, {
            gap: 3,
            minBarHeight: 4,
        });

        expect(rects).toHaveLength(3);
        expect(rects[0].height).toBe(4);
        expect(rects[1].height).toBeGreaterThan(rects[0].height);
        expect(rects[2].height).toBeGreaterThan(rects[1].height);
        expect(rects[0].y + rects[0].height / 2).toBe(20);
    });

    it("creates deterministic idle waveform samples", () => {
        expect(createIdleWaveform(4, 1)).toEqual(createIdleWaveform(4, 1));
        expect(createIdleWaveform(4, 1)).not.toEqual(createIdleWaveform(4, 2));
    });

    it("summarizes frame intervals with p95 FPS", () => {
        const stats = summarizeFrameIntervals([16, 17, 16, 18, 33, 16, 17, 16, 17, 18]);

        expect(stats.frameCount).toBe(10);
        expect(stats.p95FrameMs).toBe(33);
        expect(stats.p95Fps).toBeCloseTo(30.3, 1);
        expect(stats.avgFrameMs).toBeGreaterThan(0);
    });
});
