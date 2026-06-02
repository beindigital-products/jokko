"use client"

import { useState } from "react"

import { Banner } from "@/components/dashboard/primitives/Banner"

/**
 * NotificationBanner — prompts the user to enable browser notifications, using
 * the v3 {@link Banner} primitive (neutral tone). Shows only while permission
 * is neither granted nor denied-and-dismissed; the CTA requests permission and
 * "Plus tard" hides it for the session.
 */
export function NotificationBanner() {
    const [permission, setPermission] = useState<NotificationPermission>(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission
        }
        return "granted"
    })
    const [dismissed, setDismissed] = useState(false)

    if (permission === "granted" || dismissed) return null

    const enableNotifications = () => {
        Notification.requestPermission().then(setPermission)
    }

    return (
        <div className="px-3 pt-3 sm:px-4 lg:px-6">
            <Banner
                tone="neutral"
                data-state="notifications"
                eyebrow="Notifications"
                title="Activez les notifications"
                body="pour ne jamais manquer un message important de vos clients."
                cta="Activer les notifications"
                ctaTone="primary"
                onCtaClick={enableNotifications}
                dismissible
                onDismiss={() => setDismissed(true)}
            />
        </div>
    )
}
