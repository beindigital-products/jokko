import { useMemo, type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { I18nextProvider } from "react-i18next";
import { resolveConvexUrl } from "@jokko/convex-client";
import { MOBILE_AUTH_STORAGE_NAMESPACE, secureAuthStorage } from "./lib/auth-storage";
import { createMobileI18n } from "./lib/mobile-i18n";
import { PrivacyConsentGate } from "./PrivacyConsentGate";

declare const process: {
    env: {
        EXPO_PUBLIC_CONVEX_URL?: string;
    };
};

function createMobileConvexClient(url: string | undefined): ConvexReactClient | null {
    const resolvedUrl = resolveConvexUrl(url);
    return resolvedUrl ? new ConvexReactClient(resolvedUrl) : null;
}

export function MobileAppProviders({ children }: { children: ReactNode }) {
    const i18n = useMemo(() => createMobileI18n(), []);
    const convexClient = useMemo(
        () => createMobileConvexClient(process.env.EXPO_PUBLIC_CONVEX_URL),
        []
    );

    const content = (
        <I18nextProvider i18n={i18n}>
            <PrivacyConsentGate>{children}</PrivacyConsentGate>
        </I18nextProvider>
    );

    if (!convexClient) return content;

    return (
        <ConvexAuthProvider
            client={convexClient}
            storage={secureAuthStorage}
            storageNamespace={MOBILE_AUTH_STORAGE_NAMESPACE}
            shouldHandleCode={false}
            replaceURL={() => {}}
        >
            {content}
        </ConvexAuthProvider>
    );
}
