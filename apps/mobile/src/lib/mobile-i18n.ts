import * as Localization from "expo-localization";
import i18next, { type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import { selectBestLocale, toI18nextResources } from "@jokko/i18n";

export function getDeviceLocaleTags(): string[] {
    return Localization.getLocales()
        .map((locale) => locale.languageTag)
        .filter((tag): tag is string => Boolean(tag));
}

export function createMobileI18n(localeTags: readonly string[] = getDeviceLocaleTags()): i18n {
    const instance = i18next.createInstance();
    instance.use(initReactI18next).init({
        compatibilityJSON: "v4",
        fallbackLng: "fr",
        initAsync: false,
        interpolation: {
            escapeValue: false,
        },
        lng: selectBestLocale(localeTags),
        resources: toI18nextResources(),
    });

    return instance;
}
