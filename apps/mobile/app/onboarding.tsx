import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Screen } from "@jokko/ui-mobile";
import { MobileOnboarding, type MobileOnboardingSubmission } from "../src/MobileOnboarding";
import { api } from "../../../convex/_generated/api";
import { FIRST_LAUNCH_SEEN_STORAGE_KEY, serializeFirstLaunchSeen } from "../src/lib/first-launch";
import { requestPushPermissionIfNeeded } from "../src/lib/mobile-permissions";

export default function OnboardingRoute() {
    const router = useRouter();
    const auth = useConvexAuth();
    const user = useQuery(api.users.me, auth.isAuthenticated ? {} : "skip");
    const createOrganization = useMutation(api.organizations.create);
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const registerPushDevice = useMutation(api.notifications.registerPushDevice);
    const saveNotificationPreferences = useMutation(api.notifications.saveNotificationPreferences);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.isLoading && !auth.isAuthenticated) {
            router.replace({
                pathname: "/auth/sign-up",
                params: { redirectTo: "/onboarding" },
            } as never);
        }
    }, [auth.isAuthenticated, auth.isLoading, router]);

    const submitOnboarding = async (submission: MobileOnboardingSubmission) => {
        if (!auth.isAuthenticated || !user) {
            router.replace({
                pathname: "/auth/sign-up",
                params: { redirectTo: "/onboarding" },
            } as never);
            throw new Error("Authentification requise.");
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            if (submission.arrival === "new-workspace") {
                await createOrganization({
                    name: submission.profile.businessName.trim(),
                    slug: submission.slug,
                    businessSector: submission.profile.sector,
                    timezone: submission.profile.timezone,
                    locale: submission.profile.locale,
                });
            }

            const pushPermission = await requestPushPermissionIfNeeded(submission.permissions.push);
            await saveNotificationPreferences({
                notificationsEnabled: pushPermission.granted,
                dndTimezone: submission.profile.timezone,
            });

            if (pushPermission.expoPushToken && pushPermission.deviceId) {
                await registerPushDevice({
                    expoPushToken: pushPermission.expoPushToken,
                    deviceId: pushPermission.deviceId,
                    platform: pushPermission.platform,
                    permissionStatus: pushPermission.status ?? "unknown",
                    appVersion: pushPermission.appVersion,
                    nativeBuildVersion: pushPermission.nativeBuildVersion,
                });
            }

            await completeOnboarding();
            await SecureStore.setItemAsync(FIRST_LAUNCH_SEEN_STORAGE_KEY, serializeFirstLaunchSeen(true));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Onboarding impossible pour le moment.";
            setSubmitError(message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Screen>
            <MobileOnboarding
                onComplete={() => router.replace("/inbox")}
                onStartInvite={() => router.replace("/auth/sign-in")}
                onSubmitOnboarding={submitOnboarding}
                isSubmitting={isSubmitting}
                submitError={submitError}
            />
        </Screen>
    );
}
