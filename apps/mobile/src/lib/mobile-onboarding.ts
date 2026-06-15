export type MobileOnboardingStepKey = "business" | "whatsapp" | "permissions" | "done";
export type MobileOnboardingArrival = "new-workspace" | "invite";

export type MobileOnboardingSlide = {
    key: string;
    icon: string;
    title: string;
    body: string;
};

export type MobileBusinessProfile = {
    businessName: string;
    sector: string;
    locale: "fr" | "en";
    timezone: string;
};

export type MobileOnboardingStep = {
    key: MobileOnboardingStepKey;
    title: string;
    description: string;
    skippable: boolean;
};

export const MOBILE_WELCOME_SLIDES: readonly MobileOnboardingSlide[] = [
    {
        key: "reply",
        icon: "chatbubbles-outline",
        title: "Répondre vite, avec le bon contexte",
        body: "Inbox, contacts et historique WhatsApp restent accessibles quand l'équipe bouge.",
    },
    {
        key: "handoff",
        icon: "people-outline",
        title: "Travailler en équipe sans perdre le fil",
        body: "Assignments, notifications et modèles gardent chaque conversation au bon endroit.",
    },
    {
        key: "mobile",
        icon: "phone-portrait-outline",
        title: "Une app native, pas un dashboard réduit",
        body: "Gestes iOS, haptics, voice notes et médias sont pensés pour un usage terrain.",
    },
] as const;

export const MOBILE_ONBOARDING_STEPS: readonly MobileOnboardingStep[] = [
    {
        key: "business",
        title: "Espace entreprise",
        description: "Nom, secteur et langue de travail.",
        skippable: false,
    },
    {
        key: "whatsapp",
        title: "WhatsApp Business",
        description: "Connexion du numéro ou reprise plus tard.",
        skippable: true,
    },
    {
        key: "permissions",
        title: "Permissions utiles",
        description: "Push maintenant, caméra et micro au moment d'envoyer un média.",
        skippable: false,
    },
    {
        key: "done",
        title: "Prêt",
        description: "L'espace peut ouvrir sur l'inbox.",
        skippable: false,
    },
] as const;

export const MOBILE_BUSINESS_SECTORS = [
    "Restaurant",
    "Retail",
    "E-commerce",
    "Santé",
    "Éducation",
    "Services",
    "Autre",
] as const;

export const MOBILE_TIMEZONES = [
    { value: "Europe/Paris", label: "Paris" },
    { value: "Africa/Dakar", label: "Dakar" },
    { value: "Africa/Abidjan", label: "Abidjan" },
    { value: "Africa/Casablanca", label: "Casablanca" },
    { value: "UTC", label: "UTC" },
] as const;

export const MOBILE_WEB_APP_URL_FALLBACK = "https://app.jokko.io";

export function getMobileOnboardingStep(key: MobileOnboardingStepKey): MobileOnboardingStep {
    const step = MOBILE_ONBOARDING_STEPS.find((item) => item.key === key);
    if (!step) throw new Error(`Unknown onboarding step: ${key}`);
    return step;
}

export function getMobileOnboardingProgress(key: MobileOnboardingStepKey): number {
    const index = MOBILE_ONBOARDING_STEPS.findIndex((step) => step.key === key);
    if (index < 0) return 0;
    return Math.round(((index + 1) / MOBILE_ONBOARDING_STEPS.length) * 100);
}

export function getNextMobileOnboardingStep(
    current: MobileOnboardingStepKey,
    arrival: MobileOnboardingArrival = "new-workspace"
): MobileOnboardingStepKey | null {
    if (arrival === "invite" && current === "permissions") return "done";
    const index = MOBILE_ONBOARDING_STEPS.findIndex((step) => step.key === current);
    if (index < 0 || index >= MOBILE_ONBOARDING_STEPS.length - 1) return null;
    return MOBILE_ONBOARDING_STEPS[index + 1].key;
}

export function getPreviousMobileOnboardingStep(
    current: MobileOnboardingStepKey,
    arrival: MobileOnboardingArrival = "new-workspace"
): MobileOnboardingStepKey | null {
    if (arrival === "invite" && current === "permissions") return null;
    const index = MOBILE_ONBOARDING_STEPS.findIndex((step) => step.key === current);
    if (index <= 0) return null;
    return MOBILE_ONBOARDING_STEPS[index - 1].key;
}

export function getInitialStepForArrival(arrival: MobileOnboardingArrival): MobileOnboardingStepKey {
    return arrival === "invite" ? "permissions" : "business";
}

export function buildOrganizationSlug(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-")
        .slice(0, 63);
}

export function buildWhatsAppConnectUrl(input?: {
    baseUrl?: string | null;
    workspaceSlug?: string;
    source?: string;
}): string {
    const baseUrl = normalizeWebBaseUrl(input?.baseUrl);
    const params = [
        "tab=whatsapp",
        `source=${encodeURIComponent(input?.source ?? "mobile_onboarding")}`,
    ];
    const workspaceSlug = input?.workspaceSlug?.trim();
    if (workspaceSlug) params.push(`workspace=${encodeURIComponent(workspaceSlug)}`);

    return `${baseUrl}/dashboard/settings?${params.join("&")}`;
}

export function canContinueMobileOnboarding(
    step: MobileOnboardingStepKey,
    profile: MobileBusinessProfile,
    arrival: MobileOnboardingArrival = "new-workspace"
): boolean {
    if (arrival === "invite" && step === "permissions") return true;
    if (step !== "business") return true;

    return (
        profile.businessName.trim().length >= 2 &&
        profile.sector.trim().length > 0 &&
        profile.locale.length > 0 &&
        profile.timezone.trim().length > 0 &&
        buildOrganizationSlug(profile.businessName).length >= 3
    );
}

function normalizeWebBaseUrl(baseUrl: string | null | undefined): string {
    const trimmed = baseUrl?.trim().replace(/\/+$/g, "");
    return trimmed || MOBILE_WEB_APP_URL_FALLBACK;
}
