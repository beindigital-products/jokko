import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

// Show push notifications while the app is in the FOREGROUND (banner + sound).
// Without this, Expo silently drops foreground notifications.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

function conversationIdFromLink(link: unknown): string | null {
    if (typeof link !== "string") return null;
    const match = link.match(/\/conversations\/([^/?#]+)/);
    return match?.[1] ?? null;
}

function openFromData(data: unknown): void {
    if (!data || typeof data !== "object") return;
    const conversationId = conversationIdFromLink((data as Record<string, unknown>).link);
    if (conversationId) {
        router.push({ pathname: "/conversations/[id]", params: { id: conversationId } });
    }
}

/**
 * Bridges a tapped push notification to in-app navigation. Uses
 * `useLastNotificationResponse` so it covers BOTH a cold start (app launched by
 * tapping the notification) and a warm tap (app already running) — deduped by the
 * notification's request identifier so a re-render never re-navigates. Renders
 * nothing; uses the imperative `router` so it works anywhere in the tree.
 */
export function PushNavigation() {
    const lastResponse = Notifications.useLastNotificationResponse();
    const handledIdentifier = useRef<string | null>(null);

    useEffect(() => {
        if (!lastResponse) return;
        const identifier = lastResponse.notification.request.identifier;
        if (handledIdentifier.current === identifier) return;
        handledIdentifier.current = identifier;
        openFromData(lastResponse.notification.request.content.data);
    }, [lastResponse]);

    return null;
}
