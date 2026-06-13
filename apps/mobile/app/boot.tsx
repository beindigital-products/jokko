import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { Wordmark } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import { FIRST_LAUNCH_SEEN_STORAGE_KEY, parseFirstLaunchSeen } from "../src/lib/first-launch";

export default function BootRoute() {
    const router = useRouter();
    const auth = useConvexAuth();
    const { t } = useTranslation();
    const user = useQuery(api.users.me, auth.isAuthenticated ? {} : "skip");
    const organizations = useQuery(api.organizations.listMine, auth.isAuthenticated ? {} : "skip");
    const [firstLaunchSeen, setFirstLaunchSeen] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;
        SecureStore.getItemAsync(FIRST_LAUNCH_SEEN_STORAGE_KEY)
            .then((raw) => {
                if (mounted) setFirstLaunchSeen(parseFirstLaunchSeen(raw));
            })
            .catch(() => {
                if (mounted) setFirstLaunchSeen(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (firstLaunchSeen === null || auth.isLoading) return;

        if (!auth.isAuthenticated) {
            // First launch → editorial Welcome (funnels into auth). Returning,
            // signed-out users skip straight to sign-in.
            router.replace(firstLaunchSeen ? "/auth/sign-in" : "/welcome");
            return;
        }

        if (user === undefined || organizations === undefined) return;

        if (!user?.onboardingCompleted || organizations.length === 0) {
            router.replace("/onboarding");
            return;
        }

        router.replace("/inbox");
    }, [auth.isAuthenticated, auth.isLoading, firstLaunchSeen, organizations, router, user]);

    return (
        <View style={styles.root}>
            <View style={styles.center}>
                <Wordmark size={40} color="#F2EFE8" />
                <ActivityIndicator color="#6938EF" style={{ marginTop: 24 }} />
            </View>
            <Text style={styles.caption}>{t("app.loading")}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0A" },
    center: { alignItems: "center" },
    caption: {
        position: "absolute",
        bottom: 60,
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: "rgba(242,239,232,0.45)",
    },
});
