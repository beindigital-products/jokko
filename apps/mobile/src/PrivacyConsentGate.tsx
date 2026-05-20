import { useEffect, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { useTranslation } from "react-i18next";
import { ConsentModal } from "@jokko/ui-mobile";
import {
    PRIVACY_CONSENT_STORAGE_KEY,
    createDefaultPrivacyConsent,
    parsePrivacyConsent,
    serializePrivacyConsent,
    type PrivacyConsent,
} from "./lib/privacy-consent";

export function PrivacyConsentGate({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const [storedConsent, setStoredConsent] = useState<PrivacyConsent | null | undefined>(undefined);
    const [draft, setDraft] = useState(() => createDefaultPrivacyConsent());

    useEffect(() => {
        let mounted = true;

        SecureStore.getItemAsync(PRIVACY_CONSENT_STORAGE_KEY)
            .then((raw) => {
                if (!mounted) return;
                const parsed = parsePrivacyConsent(raw);
                if (parsed) {
                    setStoredConsent(parsed);
                    setDraft(parsed);
                    return;
                }
                setStoredConsent(null);
            })
            .catch(() => {
                if (mounted) setStoredConsent(null);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const accept = () => {
        const next = {
            ...draft,
            decidedAt: new Date().toISOString(),
        };
        SecureStore.setItemAsync(PRIVACY_CONSENT_STORAGE_KEY, serializePrivacyConsent(next))
            .then(() => setStoredConsent(next))
            .catch(() => setStoredConsent(next));
    };

    return (
        <>
            {children}
            <ConsentModal
                visible={storedConsent === null}
                value={draft}
                onChange={(value) => setDraft({ ...draft, ...value })}
                onAccept={accept}
                copy={{
                    title: t("privacy.title"),
                    body: t("privacy.body"),
                    crashTitle: t("privacy.crashTitle"),
                    crashBody: t("privacy.crashBody"),
                    analyticsTitle: t("privacy.analyticsTitle"),
                    analyticsBody: t("privacy.analyticsBody"),
                    accept: t("privacy.accept"),
                }}
            />
        </>
    );
}
