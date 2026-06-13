import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Btn, Icon, ThemeProvider, Wordmark, getTheme } from "@jokko/ui-mobile";
import { tryUnlock } from "./lib/app-lock-store";

const PAPER = "#F2EFE8";

/**
 * Full-screen biometric lock overlay. Auto-prompts Face ID / Touch ID on mount;
 * the button re-prompts after a cancel/failure.
 */
export function LockScreen() {
    const insets = useSafeAreaInsets();
    const { font } = getTheme(true);
    const [busy, setBusy] = useState(false);

    const unlock = async () => {
        if (busy) return;
        setBusy(true);
        try {
            await tryUnlock();
        } finally {
            setBusy(false);
        }
    };

    // Prompt once as soon as the lock appears.
    useEffect(() => {
        void unlock();
    }, []);

    return (
        <ThemeProvider dark>
            <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
                <StatusBar style="light" />
                <View style={styles.center}>
                    <Wordmark size={40} color={PAPER} />
                    <View style={styles.lockBadge}>
                        <Icon name="lock" size={26} color={PAPER} strokeWidth={1.6} />
                    </View>
                    <Text style={[styles.title, { fontFamily: font.display }]}>Application verrouillée</Text>
                    <Text style={[styles.sub, { fontFamily: font.sans }]}>
                        Authentifiez-vous pour accéder à vos conversations.
                    </Text>
                </View>
                <Btn tone="accent" size="lg" full icon="fingerprint" disabled={busy} onPress={() => void unlock()}>
                    {busy ? "Authentification…" : "Déverrouiller"}
                </Btn>
            </View>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    root: { ...StyleSheet.absoluteFillObject, zIndex: 100, paddingHorizontal: 24, backgroundColor: "#0A0A0A" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18 },
    lockBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "rgba(242,239,232,0.16)",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
    },
    title: { fontSize: 22, color: PAPER, letterSpacing: -0.4 },
    sub: { fontSize: 14, lineHeight: 20, color: "rgba(242,239,232,0.5)", textAlign: "center", maxWidth: 280 },
});
