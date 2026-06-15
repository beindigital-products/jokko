import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const MOBILE_DEVICE_ID_STORAGE_KEY = "jokko.global.deviceId.v1";

export type MobilePushPlatform = "ios" | "android" | "web" | "unknown";

export type PushPermissionResult = {
    requested: boolean;
    granted: boolean;
    status?: Notifications.PermissionStatus;
    deviceId?: string;
    expoPushToken?: string;
    platform: MobilePushPlatform;
    appVersion?: string;
    nativeBuildVersion?: string;
    tokenError?: string;
};

export async function requestPushPermissionIfNeeded(enabled: boolean): Promise<PushPermissionResult> {
    const platform = getMobilePushPlatform();
    if (!enabled) return { requested: false, granted: false, platform };

    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) {
        return registerPushToken({
            requested: false,
            granted: true,
            status: existing.status,
            platform,
        });
    }

    const requested = await Notifications.requestPermissionsAsync();
    const result = {
        requested: true,
        granted: requested.granted,
        status: requested.status,
        platform,
    };

    if (!requested.granted) {
        return result;
    }

    return registerPushToken(result);
}

export async function getOrCreateMobileDeviceId(): Promise<string> {
    const existing = await SecureStore.getItemAsync(MOBILE_DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;

    const next = createMobileDeviceId();
    await SecureStore.setItemAsync(MOBILE_DEVICE_ID_STORAGE_KEY, next);
    return next;
}

function getMobilePushPlatform(): MobilePushPlatform {
    if (Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web") {
        return Platform.OS;
    }

    return "unknown";
}

function createMobileDeviceId(): string {
    if (typeof globalThis.crypto?.randomUUID === "function") {
        return `mobile-${globalThis.crypto.randomUUID()}`;
    }

    return `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function registerPushToken(
    base: Pick<PushPermissionResult, "requested" | "granted" | "status" | "platform">
): Promise<PushPermissionResult> {
    try {
        const deviceId = await getOrCreateMobileDeviceId();
        const token = await Notifications.getExpoPushTokenAsync({
            deviceId,
            projectId: getExpoProjectId() ?? undefined,
        });

        return {
            ...base,
            deviceId,
            expoPushToken: token.data,
            appVersion: Constants.expoConfig?.version,
            nativeBuildVersion: getNativeBuildVersion(),
        };
    } catch (error) {
        return {
            ...base,
            tokenError: error instanceof Error ? error.message : "Unable to register push token.",
        };
    }
}

function getExpoProjectId(): string | null {
    return Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? null;
}

function getNativeBuildVersion(): string | undefined {
    const buildNumber = Constants.platform?.ios?.buildNumber;
    if (buildNumber) return buildNumber;

    const versionCode = Constants.platform?.android?.versionCode;
    if (typeof versionCode === "number") {
        return String(versionCode);
    }

    return undefined;
}
