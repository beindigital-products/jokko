export const DEFAULT_LOCALE = "fr";
export const SUPPORTED_LOCALES = ["fr", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const messages = {
  fr: {
    app: {
      name: "Jokko",
      loading: "Chargement de l'espace Jokko",
    },
    navigation: {
      spikes: "Spikes",
      menu: "Menu",
    },
    inbox: {
      readyTitle: "Inbox prête",
      readyBody:
        "Connecte WhatsApp Business depuis les réglages pour afficher les premières conversations.",
      openSettings: "Ouvrir les réglages",
      openSpikes: "Ouvrir les spikes",
      restartOnboarding: "Revoir l'onboarding",
    },
    spikes: {
      title: "Jokko · Spike signatures",
      subtitle: "Valider les signatures avant de les intégrer aux écrans réels.",
      onboarding: "Onboarding mobile",
      onboardingHint: "welcome carousel -> org wizard -> permissions",
      glassReply: "Signature #1 · Glass Reply",
      glassReplyHint: "long-press bulle -> lift + blur + réactions",
      inboxBreathing: "Signature #2 · Inbox Breathing",
      inboxBreathingHint: "nouveau message -> row respire",
      composeMorph: "Signature #3 · Compose Morph",
      composeMorphHint: "field qui morph + send qui naît",
      apple: "Spike S1 · Apple SignIn",
      appleHint: "Apple natif iOS -> Convex JWT verify",
      voice: "Spike S7 · Voice Waveform",
      voiceHint: "expo-audio metering -> waveform Skia + p95 FPS",
    },
    privacy: {
      title: "Confidentialité",
      body:
        "Jokko peut envoyer des diagnostics techniques pour corriger les crashs. Les analytics produit restent désactivés tant que tu ne les acceptes pas.",
      crashTitle: "Crash reporting",
      crashBody: "Activé par défaut pour maintenir le service. Désactivable ensuite dans les réglages.",
      analyticsTitle: "Analytics produit",
      analyticsBody: "Aide à comprendre les parcours utilisés, sans IDFA ni tracking publicitaire.",
      accept: "Enregistrer mes choix",
    },
  },
  en: {
    app: {
      name: "Jokko",
      loading: "Loading Jokko workspace",
    },
    navigation: {
      spikes: "Spikes",
      menu: "Menu",
    },
    inbox: {
      readyTitle: "Inbox ready",
      readyBody:
        "Connect WhatsApp Business from settings to display the first conversations.",
      openSettings: "Open settings",
      openSpikes: "Open spikes",
      restartOnboarding: "Replay onboarding",
    },
    spikes: {
      title: "Jokko · Signature spikes",
      subtitle: "Validate the signatures before integrating them into real screens.",
      onboarding: "Mobile onboarding",
      onboardingHint: "welcome carousel -> org wizard -> permissions",
      glassReply: "Signature #1 · Glass Reply",
      glassReplyHint: "long-press bubble -> lift + blur + reactions",
      inboxBreathing: "Signature #2 · Inbox Breathing",
      inboxBreathingHint: "new message -> breathing row",
      composeMorph: "Signature #3 · Compose Morph",
      composeMorphHint: "field morph + send appears",
      apple: "Spike S1 · Apple SignIn",
      appleHint: "native iOS Apple -> Convex JWT verify",
      voice: "Spike S7 · Voice Waveform",
      voiceHint: "expo-audio metering -> Skia waveform + p95 FPS",
    },
    privacy: {
      title: "Privacy",
      body:
        "Jokko can send technical diagnostics to fix crashes. Product analytics stay disabled until you opt in.",
      crashTitle: "Crash reporting",
      crashBody: "Enabled by default to maintain the service. You can disable it later in settings.",
      analyticsTitle: "Product analytics",
      analyticsBody: "Helps understand product usage without IDFA or advertising tracking.",
      accept: "Save choices",
    },
  },
} as const;

type MessageTree = typeof messages.fr;

type DotPrefix<Prefix extends string, Key extends string> = Prefix extends ""
  ? Key
  : `${Prefix}.${Key}`;

type DotKeys<T, Prefix extends string = ""> = {
  [Key in keyof T & string]: T[Key] extends string
    ? DotPrefix<Prefix, Key>
    : DotKeys<T[Key], DotPrefix<Prefix, Key>>;
}[keyof T & string];

export type TranslationKey = DotKeys<MessageTree>;

export function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  const normalized = (locale ?? "").toLowerCase();
  if (normalized.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

export function selectBestLocale(locales: readonly (string | null | undefined)[]): SupportedLocale {
  for (const locale of locales) {
    const supported = normalizeLocale(locale);
    if (supported !== DEFAULT_LOCALE || locale?.toLowerCase().startsWith(DEFAULT_LOCALE)) {
      return supported;
    }
  }
  return DEFAULT_LOCALE;
}

export function getMessage(locale: SupportedLocale, key: TranslationKey): string {
  const parts = key.split(".");
  let node: unknown = messages[locale];

  for (const part of parts) {
    if (!node || typeof node !== "object" || !(part in node)) {
      return key;
    }
    node = (node as Record<string, unknown>)[part];
  }

  return typeof node === "string" ? node : key;
}

export function interpolate(message: string, values: Record<string, string | number> = {}): string {
  return message.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}

export function translate(
  key: TranslationKey,
  locale: SupportedLocale = DEFAULT_LOCALE,
  values?: Record<string, string | number>
): string {
  return interpolate(getMessage(locale, key), values);
}

export function toI18nextResources() {
  return {
    fr: { translation: messages.fr },
    en: { translation: messages.en },
  };
}
