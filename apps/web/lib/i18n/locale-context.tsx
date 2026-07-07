"use client";

/**
 * Locale context for the marketing landing — cookie-backed, SSR-safe.
 *
 * - Initial locale comes from the `NEXT_LOCALE` cookie (read server-side in the
 *   marketing layout) so the first paint is already in the right language.
 * - `setLocale` flips the language client-side (instant re-render) and persists
 *   the choice in the cookie so the next SSR render matches.
 * - Components read translated copy via `useLocale().m` (the message tree for the
 *   active locale, fully typed from `landing-messages.ts`).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  landingMessages,
  type LandingLocale,
  type LandingMessages,
} from "./landing-messages";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function normalizeLandingLocale(
  value: string | null | undefined,
): LandingLocale {
  return value?.toLowerCase().startsWith("en") ? "en" : "fr";
}

type LocaleContextValue = {
  locale: LandingLocale;
  setLocale: (locale: LandingLocale) => void;
  /** Message tree for the active locale. */
  m: LandingMessages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function persistLocale(locale: LandingLocale) {
  if (typeof document === "undefined") return;
  // 1 year, lax — readable by the server on the next request for SSR.
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // SSR + first client render default to French so the statically-rendered HTML
  // and the first hydration pass agree (no hydration mismatch, marketing pages
  // stay static). The persisted choice is applied right after mount.
  const [locale, setLocaleState] = useState<LandingLocale>("fr");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    const persisted = normalizeLandingLocale(match?.[1]);
    if (persisted !== "fr") {
      // SSR-safe by design: the cookie can only be read after mount, so applying
      // the persisted locale here is intentional (a lazy useState initializer
      // would read the cookie during render and cause a hydration mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(persisted);
      document.documentElement.lang = persisted;
    }
  }, []);

  const setLocale = useCallback((next: LandingLocale) => {
    setLocaleState(next);
    persistLocale(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    // `landingMessages[locale]` is the `fr | en` union (each `as const` with its
    // own literal types); cast to the canonical shape. Values are only ever read
    // as strings, so this is type-only and harmless.
    () => ({ locale, setLocale, m: landingMessages[locale] as LandingMessages }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Defensive fallback (e.g. component rendered outside the provider): French.
    return {
      locale: "fr",
      setLocale: () => {},
      m: landingMessages.fr,
    };
  }
  return ctx;
}
