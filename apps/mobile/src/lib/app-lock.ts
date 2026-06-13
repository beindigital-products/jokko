/**
 * Pure helpers for the biometric app-lock (Face ID / Touch ID).
 * Framework-free so they're unit-testable without React Native or Expo.
 */

export const APP_LOCK_STORAGE_KEY = "jokko.global.appLock.enabled.v1";

export function parseAppLockEnabled(raw: string | null | undefined): boolean {
    return raw === "true";
}

export function serializeAppLockEnabled(enabled: boolean): string {
    return enabled ? "true" : "false";
}

/** Human label for the device's biometric method, preferring Face ID. */
export function biometricLabel({ hasFace, hasFinger }: { hasFace: boolean; hasFinger: boolean }): string {
    if (hasFace) return "Face ID";
    if (hasFinger) return "Touch ID";
    return "biométrie";
}
