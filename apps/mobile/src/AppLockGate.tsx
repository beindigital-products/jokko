import { useEffect, useRef, type ReactNode } from "react";
import { AppState, View, type AppStateStatus } from "react-native";
import { hydrateAppLock, lockApp, useAppLock } from "./lib/app-lock-store";
import { LockScreen } from "./LockScreen";

/**
 * Wraps the whole app and overlays the biometric LockScreen when the lock is
 * enabled and engaged. Children stay mounted under the overlay so app state is
 * preserved across a lock/unlock. Pre-locks as the app leaves the foreground so
 * returning never flashes protected content.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
    const { enabled, locked, hydrated } = useAppLock();
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        void hydrateAppLock();
    }, []);

    useEffect(() => {
        const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
            const prev = appState.current;
            appState.current = next;
            if ((next === "background" || next === "inactive") && prev === "active") {
                lockApp();
            }
        });
        return () => sub.remove();
    }, []);

    return (
        <View style={{ flex: 1 }}>
            {children}
            {hydrated && enabled && locked ? <LockScreen /> : null}
        </View>
    );
}
