import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { Btn, Icon, Micro, Wordmark, useTheme, type IconName, type JokkoTheme } from "@jokko/ui-mobile";
import {
  MOBILE_BUSINESS_SECTORS,
  MOBILE_TIMEZONES,
  MOBILE_WELCOME_SLIDES,
  buildOrganizationSlug,
  buildWhatsAppConnectUrl,
  canContinueMobileOnboarding,
  getInitialStepForArrival,
  getMobileOnboardingProgress,
  getMobileOnboardingStep,
  getNextMobileOnboardingStep,
  getPreviousMobileOnboardingStep,
  type MobileBusinessProfile,
  type MobileOnboardingArrival,
  type MobileOnboardingStepKey,
} from "./lib/mobile-onboarding";

declare const process: {
  env: {
    EXPO_PUBLIC_WEB_APP_URL?: string;
    EXPO_PUBLIC_WEB_URL?: string;
  };
};

type Props = {
  onOpenSpikes?: () => void;
  onComplete: () => void;
  onSubmitOnboarding?: (submission: MobileOnboardingSubmission) => Promise<void>;
  onStartInvite?: () => void;
  initialArrival?: MobileOnboardingArrival;
  isSubmitting?: boolean;
  submitError?: string | null;
};

export type PermissionDraft = {
  push: boolean;
  camera: boolean;
  microphone: boolean;
};

export type MobileOnboardingSubmission = {
  arrival: MobileOnboardingArrival;
  profile: MobileBusinessProfile;
  permissions: PermissionDraft;
  slug: string;
};

const initialProfile: MobileBusinessProfile = {
  businessName: "",
  sector: "Services",
  locale: "fr",
  timezone: "Europe/Paris",
};

const SLIDE_ICON: Record<string, IconName> = {
  reply: "inbox",
  handoff: "users",
  mobile: "phone",
};

export function MobileOnboarding({
  onComplete,
  onSubmitOnboarding,
  onStartInvite,
  initialArrival = "new-workspace",
  isSubmitting = false,
  submitError,
}: Props) {
  const theme = useTheme();
  const { colors, font } = theme;
  const [phase, setPhase] = useState<"welcome" | "wizard">(initialArrival === "invite" ? "wizard" : "welcome");
  const [arrival, setArrival] = useState<MobileOnboardingArrival>(initialArrival);
  const [slideIndex, setSlideIndex] = useState(0);
  const [stepKey, setStepKey] = useState<MobileOnboardingStepKey>("business");
  const [profile, setProfile] = useState<MobileBusinessProfile>(initialProfile);
  const [permissions, setPermissions] = useState<PermissionDraft>({ push: true, camera: false, microphone: false });

  const currentSlide = MOBILE_WELCOME_SLIDES[slideIndex];
  const step = getMobileOnboardingStep(stepKey);
  const progress = getMobileOnboardingProgress(stepKey);
  const slug = useMemo(() => buildOrganizationSlug(profile.businessName), [profile.businessName]);
  const canContinue = canContinueMobileOnboarding(stepKey, profile, arrival);

  const startWizard = (nextArrival: MobileOnboardingArrival) => {
    setArrival(nextArrival);
    setStepKey(getInitialStepForArrival(nextArrival));
    setPhase("wizard");
    void Haptics.selectionAsync();
  };

  const nextSlide = () => {
    if (slideIndex < MOBILE_WELCOME_SLIDES.length - 1) {
      setSlideIndex((index) => index + 1);
      void Haptics.selectionAsync();
      return;
    }
    startWizard("new-workspace");
  };

  const goNext = async () => {
    if (!canContinue || isSubmitting) return;
    const next = getNextMobileOnboardingStep(stepKey, arrival);
    if (next) {
      setStepKey(next);
      void Haptics.selectionAsync();
      return;
    }
    try {
      await onSubmitOnboarding?.({ arrival, profile, permissions, slug });
    } catch {
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  const goBack = () => {
    const previous = getPreviousMobileOnboardingStep(stepKey, arrival);
    if (previous) {
      setStepKey(previous);
      void Haptics.selectionAsync();
      return;
    }
    setPhase("welcome");
  };

  if (phase === "welcome") {
    const last = slideIndex === MOBILE_WELCOME_SLIDES.length - 1;
    return (
      <View style={[styles.root, { backgroundColor: colors.paper }]}>
        <View style={styles.topBar}>
          <Wordmark size={24} />
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.paper2 }]}>
            <Icon name={SLIDE_ICON[currentSlide.key] ?? "inbox"} size={32} color={colors.accentInk} strokeWidth={1.6} />
          </View>
          <Text style={[styles.heroTitle, { fontFamily: font.display, color: colors.ink }]}>{currentSlide.title}</Text>
          <Text style={[styles.heroBody, { color: colors.mute, fontFamily: font.sans }]}>{currentSlide.body}</Text>

          <View style={styles.dots}>
            {MOBILE_WELCOME_SLIDES.map((slide, index) => (
              <View
                key={slide.key}
                style={[
                  styles.dot,
                  { backgroundColor: index === slideIndex ? colors.accent : colors.rule },
                  index === slideIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Btn tone="primary" size="lg" full iconRight="arrow-right" onPress={nextSlide}>
            {last ? "Créer mon espace" : "Continuer"}
          </Btn>
          <Btn tone="ghost" size="lg" full onPress={onStartInvite ?? (() => startWizard("invite"))}>
            J'ai une invitation
          </Btn>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.paper }]}>
      <View style={styles.wizardHeader}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.backButton}>
          <Icon name="chevron-left" size={20} color={colors.ink} />
          <Text style={{ color: colors.ink, fontSize: 14, fontFamily: font.sansMedium }}>Retour</Text>
        </Pressable>
        <Wordmark size={20} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.rule }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
      </View>

      <ScrollView contentContainerStyle={styles.wizardBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Micro>{arrival === "invite" ? "Invitation équipe" : "Nouvel espace"}</Micro>
        <Text style={[styles.stepTitle, { fontFamily: font.display, color: colors.ink }]}>{step.title}</Text>
        <Text style={[styles.stepDescription, { color: colors.mute, fontFamily: font.sans }]}>{step.description}</Text>

        {stepKey === "business" && <BusinessStep theme={theme} profile={profile} slug={slug} onChange={setProfile} />}
        {stepKey === "whatsapp" && <WhatsAppStep theme={theme} workspaceSlug={slug} onSkip={goNext} />}
        {stepKey === "permissions" && <PermissionsStep theme={theme} permissions={permissions} onChange={setPermissions} arrival={arrival} />}
        {stepKey === "done" && <DoneStep theme={theme} profile={profile} slug={slug} arrival={arrival} permissions={permissions} />}

        {submitError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.paper2, borderColor: colors.hot }]}>
            <Icon name="bell" size={16} color={colors.hot} strokeWidth={2} />
            <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: colors.hot, fontFamily: font.sans }}>{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.rule2, backgroundColor: colors.paper }]}>
        <Btn
          tone="primary"
          size="lg"
          full
          iconRight={stepKey === "done" ? "inbox" : "arrow-right"}
          disabled={!canContinue || isSubmitting}
          onPress={() => void goNext()}
        >
          {isSubmitting ? "Finalisation…" : stepKey === "done" ? "Ouvrir l'inbox" : step.skippable ? "Continuer" : "Suivant"}
        </Btn>
      </View>
    </View>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────

function BusinessStep({
  theme,
  profile,
  slug,
  onChange,
}: {
  theme: JokkoTheme;
  profile: MobileBusinessProfile;
  slug: string;
  onChange: (profile: MobileBusinessProfile) => void;
}) {
  const { colors, font } = theme;
  return (
    <View style={styles.stepContent}>
      <Field theme={theme} label="Nom de l'entreprise">
        <TextInput
          value={profile.businessName}
          onChangeText={(businessName) => onChange({ ...profile, businessName })}
          placeholder="Ex. Maison Dakar"
          placeholderTextColor={colors.mute}
          autoCapitalize="words"
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.rule, color: colors.ink, fontFamily: font.sans }]}
        />
      </Field>
      <Text style={{ fontSize: 12, color: colors.mute, fontFamily: font.mono, marginTop: -6 }}>
        app.jokko.io/{slug || "mon-espace"}
      </Text>

      <Field theme={theme} label="Secteur">
        <View style={styles.chipGrid}>
          {MOBILE_BUSINESS_SECTORS.map((sector) => (
            <Chip key={sector} theme={theme} label={sector} active={profile.sector === sector} onPress={() => onChange({ ...profile, sector })} />
          ))}
        </View>
      </Field>

      <Field theme={theme} label="Langue">
        <View style={[styles.segment, { backgroundColor: colors.paper2 }]}>
          <SegmentButton theme={theme} label="Français" active={profile.locale === "fr"} onPress={() => onChange({ ...profile, locale: "fr" })} />
          <SegmentButton theme={theme} label="English" active={profile.locale === "en"} onPress={() => onChange({ ...profile, locale: "en" })} />
        </View>
      </Field>

      <Field theme={theme} label="Fuseau horaire">
        <View style={styles.chipGrid}>
          {MOBILE_TIMEZONES.map((tz) => (
            <Chip key={tz.value} theme={theme} label={tz.label} active={profile.timezone === tz.value} onPress={() => onChange({ ...profile, timezone: tz.value })} />
          ))}
        </View>
      </Field>
    </View>
  );
}

function WhatsAppStep({ theme, workspaceSlug, onSkip }: { theme: JokkoTheme; workspaceSlug: string; onSkip: () => void }) {
  const { colors, font } = theme;
  const openWhatsAppConnect = async () => {
    await Haptics.selectionAsync();
    const url = buildWhatsAppConnectUrl({
      baseUrl: process.env.EXPO_PUBLIC_WEB_APP_URL ?? process.env.EXPO_PUBLIC_WEB_URL,
      workspaceSlug,
    });
    await Linking.openURL(url);
  };
  return (
    <View style={styles.stepContent}>
      <InfoRow theme={theme} icon="whatsapp" title="Connexion WhatsApp Business" body="La connexion complète passe par le flow web Meta, puis revient dans l'app via deep link." />
      <InfoRow theme={theme} icon="shield" title="Compte de revue" body="Le mode démo reste local-only pour Apple Review et Meta WABA Review." />
      <Btn tone="ghost" size="lg" full icon="arrow-up-right" onPress={() => void openWhatsAppConnect()}>
        Ouvrir la connexion web
      </Btn>
      <Pressable onPress={onSkip} style={styles.textAction}>
        <Text style={{ color: colors.mute, fontSize: 14, fontFamily: font.sansMedium }}>Configurer plus tard</Text>
      </Pressable>
    </View>
  );
}

function PermissionsStep({
  theme,
  permissions,
  arrival,
  onChange,
}: {
  theme: JokkoTheme;
  permissions: PermissionDraft;
  arrival: MobileOnboardingArrival;
  onChange: (permissions: PermissionDraft) => void;
}) {
  return (
    <View style={styles.stepContent}>
      {arrival === "invite" ? (
        <InfoRow theme={theme} icon="users" title="Espace existant" body="Les invitations sautent la création d'organisation et ouvrent directement les réglages utiles." />
      ) : null}
      <PermissionRow theme={theme} title="Notifications push" body="Nouveaux messages, mentions et assignations." value={permissions.push} onValueChange={(push) => onChange({ ...permissions, push })} />
      <PermissionRow theme={theme} title="Caméra" body="Demandée seulement quand tu joins une photo ou vidéo." value={permissions.camera} onValueChange={(camera) => onChange({ ...permissions, camera })} />
      <PermissionRow theme={theme} title="Micro" body="Demandé au moment d'enregistrer une note vocale." value={permissions.microphone} onValueChange={(microphone) => onChange({ ...permissions, microphone })} />
    </View>
  );
}

function DoneStep({
  theme,
  profile,
  slug,
  arrival,
  permissions,
}: {
  theme: JokkoTheme;
  profile: MobileBusinessProfile;
  slug: string;
  arrival: MobileOnboardingArrival;
  permissions: PermissionDraft;
}) {
  const { colors, font } = theme;
  const workspaceName = arrival === "invite" ? "Espace invité" : profile.businessName || "Nouvel espace";
  return (
    <View style={[styles.stepContent, { alignItems: "flex-start" }]}>
      <View style={[styles.doneIcon, { backgroundColor: colors.good }]}>
        <Icon name="check" size={30} color="#fff" strokeWidth={2.4} />
      </View>
      <Text style={{ fontSize: 26, lineHeight: 30, color: colors.ink, fontFamily: font.display, letterSpacing: -0.5 }}>{workspaceName} est prêt</Text>
      <Text style={{ fontSize: 15, lineHeight: 22, color: colors.mute, fontFamily: font.sans }}>
        {arrival === "invite"
          ? "L'inbox s'ouvrira sur les conversations de ton équipe."
          : `L'inbox s'ouvrira sur ${slug || "ton-espace"} avec WhatsApp configurable depuis les réglages.`}
      </Text>
      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.rule }]}>
        <SummaryRow theme={theme} label="Push" value={permissions.push ? "Activé" : "À demander plus tard"} divider />
        <SummaryRow theme={theme} label="Caméra" value={permissions.camera ? "Pré-autorisée" : "À la demande"} divider />
        <SummaryRow theme={theme} label="Micro" value={permissions.microphone ? "Pré-autorisé" : "À la demande"} />
      </View>
    </View>
  );
}

// ── Small parts ──────────────────────────────────────────────────────────────

function Field({ theme, label, children }: { theme: JokkoTheme; label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Micro>{label}</Micro>
      {children}
    </View>
  );
}

function Chip({ theme, label, active, onPress }: { theme: JokkoTheme; label: string; active: boolean; onPress: () => void }) {
  const { colors, font } = theme;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accentSoft : colors.card,
          borderColor: active ? colors.accent : colors.rule,
        },
      ]}
    >
      <Text style={{ fontSize: 13, fontFamily: font.sansMedium, color: active ? colors.accentInk : colors.ink3 }}>{label}</Text>
    </Pressable>
  );
}

function SegmentButton({ theme, label, active, onPress }: { theme: JokkoTheme; label: string; active: boolean; onPress: () => void }) {
  const { colors, font } = theme;
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && { backgroundColor: colors.card }]}>
      <Text style={{ fontSize: 13, fontFamily: font.sansMedium, color: active ? colors.ink : colors.mute }}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({ theme, icon, title, body }: { theme: JokkoTheme; icon: IconName; title: string; body: string }) {
  const { colors, font } = theme;
  return (
    <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.rule }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.paper2 }]}>
        <Icon name={icon} size={20} color={colors.accentInk} strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, color: colors.ink, fontFamily: font.sansSemibold }}>{title}</Text>
        <Text style={{ marginTop: 3, fontSize: 13, lineHeight: 18, color: colors.mute, fontFamily: font.sans }}>{body}</Text>
      </View>
    </View>
  );
}

function PermissionRow({ theme, title, body, value, onValueChange }: { theme: JokkoTheme; title: string; body: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const { colors, font } = theme;
  return (
    <View style={[styles.permissionRow, { backgroundColor: colors.card, borderColor: colors.rule }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, color: colors.ink, fontFamily: font.sansSemibold }}>{title}</Text>
        <Text style={{ marginTop: 3, fontSize: 13, lineHeight: 18, color: colors.mute, fontFamily: font.sans }}>{body}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.rule, true: colors.accent }} thumbColor="#fff" />
    </View>
  );
}

function SummaryRow({ theme, label, value, divider = false }: { theme: JokkoTheme; label: string; value: string; divider?: boolean }) {
  const { colors, font } = theme;
  return (
    <View style={[styles.summaryRow, divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule2 }]}>
      <Text style={{ fontSize: 13, color: colors.mute, fontFamily: font.sans }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.ink, fontFamily: font.sansMedium }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  hero: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 24 },
  heroIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 26 },
  heroTitle: { fontSize: 33, lineHeight: 37, letterSpacing: -0.8, maxWidth: 340 },
  heroBody: { marginTop: 12, fontSize: 16, lineHeight: 23, maxWidth: 340 },
  dots: { flexDirection: "row", gap: 7, marginTop: 28 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotActive: { width: 24 },
  actions: { padding: 20, gap: 10 },
  wizardHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { flexDirection: "row", alignItems: "center", gap: 2 },
  progressTrack: { height: 3, marginHorizontal: 18, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%" },
  wizardBody: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  stepTitle: { fontSize: 28, lineHeight: 32, letterSpacing: -0.6, marginTop: 8 },
  stepDescription: { marginTop: 6, fontSize: 15, lineHeight: 22 },
  stepContent: { marginTop: 24, gap: 16 },
  input: { minHeight: 50, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 16 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 38, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  segment: { flexDirection: "row", borderRadius: 999, padding: 3 },
  segmentButton: { flex: 1, minHeight: 38, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  infoRow: { flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  infoIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  textAction: { alignItems: "center", paddingVertical: 8 },
  permissionRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  doneIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  summary: { width: "100%", borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", marginTop: 4 },
  summaryRow: { minHeight: 46, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  errorBox: { flexDirection: "row", gap: 8, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginTop: 16 },
});
