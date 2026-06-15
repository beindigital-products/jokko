export const CONVEX_SLOW_CONNECTION_TIMEOUT_MS = 10_000;
export const CONVEX_DISCONNECTED_TIMEOUT_MS = 30_000;
export const CONVEX_RETRY_BACKOFF_MS = [1_000, 2_000, 5_000, 10_000, 30_000] as const;
export const CONVEX_BATTERY_DRAIN_WARN_PERCENT_PER_HOUR = 8;
export const CONVEX_BACKGROUND_PAUSE_AFTER_MS = 15_000;

export type ConvexConnectionPhase =
    | "connected"
    | "connecting"
    | "reconnecting"
    | "disconnected";

export type ConvexBannerKind = "none" | "slow" | "offline" | "degraded";
export type ConvexRealtimeMode = "live" | "throttled" | "paused";
export type AppVisibility = "active" | "inactive" | "background";

export type ConvexConnectionSnapshot = {
    phase: ConvexConnectionPhase;
    nowMs: number;
    phaseStartedAtMs: number;
    networkReachable?: boolean | null;
    statusPageHealthy?: boolean | null;
    pendingMutationCount?: number;
};

export type ConvexConnectionDecision = {
    banner: ConvexBannerKind;
    title: string | null;
    message: string | null;
    queueWrites: boolean;
    allowReadOnlyCache: boolean;
    showStatusPageAction: boolean;
    retryDelayMs: number;
};

export type BatteryDrainSample = {
    atMs: number;
    batteryLevelPercent: number;
    isCharging: boolean;
};

export type BatteryDrainSummary = {
    sampleCount: number;
    elapsedMs: number;
    drainPercentPerHour: number;
};

export type RealtimeModeInput = {
    appVisibility: AppVisibility;
    isLowPowerModeEnabled?: boolean;
    isCharging?: boolean;
    drainPercentPerHour?: number;
    backgroundedAtMs?: number;
    nowMs?: number;
};

export function getConvexRetryDelayMs(attempt: number): number {
    if (!Number.isFinite(attempt) || attempt <= 0) return 0;
    const index = Math.min(Math.floor(attempt) - 1, CONVEX_RETRY_BACKOFF_MS.length - 1);
    return CONVEX_RETRY_BACKOFF_MS[index];
}

export function decideConvexConnection(snapshot: ConvexConnectionSnapshot): ConvexConnectionDecision {
    const elapsedMs = Math.max(0, snapshot.nowMs - snapshot.phaseStartedAtMs);
    const pendingCount = snapshot.pendingMutationCount ?? 0;

    if (snapshot.networkReachable === false) {
        return {
            banner: "offline",
            title: "Hors ligne",
            message: queueMessage("Les messages restent en file locale.", pendingCount),
            queueWrites: true,
            allowReadOnlyCache: true,
            showStatusPageAction: false,
            retryDelayMs: getConvexRetryDelayMs(1),
        };
    }

    if (snapshot.statusPageHealthy === false) {
        return {
            banner: "degraded",
            title: "Service instable",
            message: queueMessage("Jokko réessaie en arrière-plan.", pendingCount),
            queueWrites: true,
            allowReadOnlyCache: true,
            showStatusPageAction: true,
            retryDelayMs: getConvexRetryDelayMs(2),
        };
    }

    if (snapshot.phase === "connected") {
        return {
            banner: "none",
            title: null,
            message: null,
            queueWrites: false,
            allowReadOnlyCache: false,
            showStatusPageAction: false,
            retryDelayMs: 0,
        };
    }

    if (elapsedMs >= CONVEX_DISCONNECTED_TIMEOUT_MS || snapshot.phase === "disconnected") {
        return {
            banner: "offline",
            title: "Reconnexion impossible",
            message: queueMessage("Lecture depuis le cache, envois en attente.", pendingCount),
            queueWrites: true,
            allowReadOnlyCache: true,
            showStatusPageAction: true,
            retryDelayMs: getConvexRetryDelayMs(4),
        };
    }

    if (elapsedMs >= CONVEX_SLOW_CONNECTION_TIMEOUT_MS) {
        return {
            banner: "slow",
            title: "Connexion lente",
            message: queueMessage("Les actions continuent, la synchro peut prendre du retard.", pendingCount),
            queueWrites: true,
            allowReadOnlyCache: true,
            showStatusPageAction: false,
            retryDelayMs: getConvexRetryDelayMs(2),
        };
    }

    return {
        banner: "none",
        title: null,
        message: null,
        queueWrites: false,
        allowReadOnlyCache: true,
        showStatusPageAction: false,
        retryDelayMs: 0,
    };
}

export function summarizeBatteryDrain(samples: readonly BatteryDrainSample[]): BatteryDrainSummary {
    const unplugged = samples
        .filter((sample) => !sample.isCharging)
        .filter((sample) => Number.isFinite(sample.atMs) && Number.isFinite(sample.batteryLevelPercent))
        .sort((a, b) => a.atMs - b.atMs);

    if (unplugged.length < 2) {
        return {
            sampleCount: unplugged.length,
            elapsedMs: 0,
            drainPercentPerHour: 0,
        };
    }

    const first = unplugged[0];
    const last = unplugged[unplugged.length - 1];
    const elapsedMs = Math.max(0, last.atMs - first.atMs);
    const drain = Math.max(0, first.batteryLevelPercent - last.batteryLevelPercent);
    const hours = elapsedMs / 3_600_000;

    return {
        sampleCount: unplugged.length,
        elapsedMs,
        drainPercentPerHour: hours > 0 ? drain / hours : 0,
    };
}

export function decideConvexRealtimeMode(input: RealtimeModeInput): ConvexRealtimeMode {
    if (input.appVisibility === "background") return "paused";

    if (input.appVisibility === "inactive") {
        const nowMs = input.nowMs ?? 0;
        const backgroundedAtMs = input.backgroundedAtMs ?? nowMs;
        return nowMs - backgroundedAtMs >= CONVEX_BACKGROUND_PAUSE_AFTER_MS ? "paused" : "throttled";
    }

    if (input.isCharging) return "live";
    if (input.isLowPowerModeEnabled) return "throttled";
    if ((input.drainPercentPerHour ?? 0) >= CONVEX_BATTERY_DRAIN_WARN_PERCENT_PER_HOUR) {
        return "throttled";
    }

    return "live";
}

function queueMessage(base: string, pendingCount: number): string {
    if (pendingCount <= 0) return base;
    return `${base} ${pendingCount} envoi${pendingCount > 1 ? "s" : ""} en attente.`;
}
