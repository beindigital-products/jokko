import { describe, expect, it } from "vitest";
import {
    CONVEX_BACKGROUND_PAUSE_AFTER_MS,
    CONVEX_BATTERY_DRAIN_WARN_PERCENT_PER_HOUR,
    CONVEX_SLOW_CONNECTION_TIMEOUT_MS,
    decideConvexConnection,
    decideConvexRealtimeMode,
    getConvexRetryDelayMs,
    summarizeBatteryDrain,
} from "./convex-connection-policy";

describe("Spike S8 — Convex connection policy", () => {
    it("stays silent when Convex is connected", () => {
        expect(
            decideConvexConnection({
                phase: "connected",
                nowMs: 1_000,
                phaseStartedAtMs: 0,
            })
        ).toMatchObject({
            banner: "none",
            queueWrites: false,
            retryDelayMs: 0,
        });
    });

    it("shows a slow connection banner after 10 seconds without blocking sends", () => {
        const decision = decideConvexConnection({
            phase: "connecting",
            nowMs: CONVEX_SLOW_CONNECTION_TIMEOUT_MS + 1,
            phaseStartedAtMs: 0,
            pendingMutationCount: 2,
        });

        expect(decision.banner).toBe("slow");
        expect(decision.title).toBe("Connexion lente");
        expect(decision.queueWrites).toBe(true);
        expect(decision.message).toContain("2 envois en attente");
    });

    it("separates offline network from Convex service degradation", () => {
        const offline = decideConvexConnection({
            phase: "reconnecting",
            nowMs: 500,
            phaseStartedAtMs: 0,
            networkReachable: false,
        });
        const degraded = decideConvexConnection({
            phase: "reconnecting",
            nowMs: 500,
            phaseStartedAtMs: 0,
            statusPageHealthy: false,
        });

        expect(offline.banner).toBe("offline");
        expect(offline.showStatusPageAction).toBe(false);
        expect(degraded.banner).toBe("degraded");
        expect(degraded.showStatusPageAction).toBe(true);
    });

    it("caps retry backoff at 30 seconds", () => {
        expect(getConvexRetryDelayMs(0)).toBe(0);
        expect(getConvexRetryDelayMs(1)).toBe(1_000);
        expect(getConvexRetryDelayMs(3)).toBe(5_000);
        expect(getConvexRetryDelayMs(99)).toBe(30_000);
    });

    it("summarizes unplugged battery drain per hour", () => {
        const summary = summarizeBatteryDrain([
            { atMs: 0, batteryLevelPercent: 90, isCharging: false },
            { atMs: 30 * 60_000, batteryLevelPercent: 86, isCharging: false },
        ]);

        expect(summary.sampleCount).toBe(2);
        expect(summary.elapsedMs).toBe(30 * 60_000);
        expect(summary.drainPercentPerHour).toBe(8);
    });

    it("ignores charging samples for battery drain", () => {
        const summary = summarizeBatteryDrain([
            { atMs: 0, batteryLevelPercent: 60, isCharging: true },
            { atMs: 10 * 60_000, batteryLevelPercent: 62, isCharging: true },
        ]);

        expect(summary.sampleCount).toBe(0);
        expect(summary.drainPercentPerHour).toBe(0);
    });

    it("pauses realtime in background and throttles in low power mode", () => {
        expect(decideConvexRealtimeMode({ appVisibility: "background" })).toBe("paused");
        expect(
            decideConvexRealtimeMode({
                appVisibility: "inactive",
                backgroundedAtMs: 0,
                nowMs: CONVEX_BACKGROUND_PAUSE_AFTER_MS,
            })
        ).toBe("paused");
        expect(
            decideConvexRealtimeMode({
                appVisibility: "active",
                isLowPowerModeEnabled: true,
            })
        ).toBe("throttled");
    });

    it("throttles active realtime when drain crosses the battery budget", () => {
        expect(
            decideConvexRealtimeMode({
                appVisibility: "active",
                drainPercentPerHour: CONVEX_BATTERY_DRAIN_WARN_PERCENT_PER_HOUR,
            })
        ).toBe("throttled");
        expect(
            decideConvexRealtimeMode({
                appVisibility: "active",
                isCharging: true,
                drainPercentPerHour: 50,
            })
        ).toBe("live");
    });
});
