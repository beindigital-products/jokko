import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { theme } from "@jokko/tokens";
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
            router.replace(firstLaunchSeen ? "/auth/sign-in" : "/auth/sign-up");
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
            <ActivityIndicator color={theme.accent.primary} />
            <Text style={styles.text}>{t("app.loading")}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.md,
        backgroundColor: theme.surface.default,
    },
    text: { fontSize: 14, color: theme.ink[500], fontWeight: "700" },
});
