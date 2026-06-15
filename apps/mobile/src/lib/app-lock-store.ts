/**
 * App-lock store — a tiny module-level external store (same pattern as the
 * WebRTC peer singleton) exposing the biometric-lock state app-wide via
 * `useSyncExternalStore`, plus the async actions that touch SecureStore and
 * expo-local-authentication. No zustand (not a mobile dependency).
 */
import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { APP_LOCK_STORAGE_KEY, biometricLabel, parseAppLockEnabled, serializeAppLockEnabled } from "./app-lock";

export type AppLockState = { enabled: boolean; locked: boolean; hydrated: boolean };

let state: AppLockState = { enabled: false, locked: false, hydrated: false };
const listeners = new Set<() => void>();

function setState(partial: Partial<AppLockState>) {
    state = { ...state, ...partial };
    for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function getSnapshot() {
    return state;
}

export function useAppLock(): AppLockState {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Read the persisted flag on launch and lock immediately if enabled. */
export async function hydrateAppLock(): Promise<void> {
    let enabled = false;
    try {
        enabled = parseAppLockEnabled(await SecureStore.getItemAsync(APP_LOCK_STORAGE_KEY));
    } catch {
        enabled = false;
    }
    setState({ enabled, locked: enabled, hydrated: true });
}

/** Lock the app (e.g. when it leaves the foreground). No-op if disabled. */
export function lockApp(): void {
    if (state.enabled) setState({ locked: true });
}

/** Biometric availability + label for the current device. */
export async function getBiometricAvailability(): Promise<{ available: boolean; label: string }> {
    try {
        const [hasHardware, enrolled, types] = await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
            LocalAuthentication.supportedAuthenticationTypesAsync(),
        ]);
        const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        const hasFinger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
        return { available: hasHardware && enrolled, label: biometricLabel({ hasFace, hasFinger }) };
    } catch {
        return { available: false, label: "biométrie" };
    }
}

async function authenticate(promptMessage: string): Promise<boolean> {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            cancelLabel: "Annuler",
            disableDeviceFallback: false,
        });
        return result.success;
    } catch {
        return false;
    }
}

/** Prompt biometric to leave the lock screen. */
export async function tryUnlock(): Promise<boolean> {
    const ok = await authenticate("Déverrouiller Jokko");
    if (ok) setState({ locked: false });
    return ok;
}

/** Turn the lock on — requires a successful biometric check first. */
export async function enableAppLock(): Promise<boolean> {
    const ok = await authenticate("Activer le verrouillage");
    if (!ok) return false;
    try {
        await SecureStore.setItemAsync(APP_LOCK_STORAGE_KEY, serializeAppLockEnabled(true));
    } catch {
        // Ignore persistence failures — the in-memory flag still protects this session.
    }
    setState({ enabled: true, locked: false });
    return true;
}

/** Turn the lock off. */
export async function disableAppLock(): Promise<void> {
    try {
        await SecureStore.setItemAsync(APP_LOCK_STORAGE_KEY, serializeAppLockEnabled(false));
    } catch {
        // Ignore.
    }
    setState({ enabled: false, locked: false });
}
