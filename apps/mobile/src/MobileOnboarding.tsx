import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { theme } from "@jokko/tokens";
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

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

declare const process: {
  env: {
    EXPO_PUBLIC_WEB_APP_URL?: string;
    EXPO_PUBLIC_WEB_URL?: string;
  };
};

type Props = {
  onOpenSpikes: () => void;
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

export function MobileOnboarding({
  onOpenSpikes,
  onComplete,
  onSubmitOnboarding,
  onStartInvite,
  initialArrival = "new-workspace",
  isSubmitting = false,
  submitError,
}: Props) {
  const [phase, setPhase] = useState<"welcome" | "wizard">(initialArrival === "invite" ? "wizard" : "welcome");
  const [arrival, setArrival] = useState<MobileOnboardingArrival>(initialArrival);
  const [slideIndex, setSlideIndex] = useState(0);
  const [stepKey, setStepKey] = useState<MobileOnboardingStepKey>("business");
  const [profile, setProfile] = useState<MobileBusinessProfile>(initialProfile);
  const [permissions, setPermissions] = useState<PermissionDraft>({
    push: true,
    camera: false,
    microphone: false,
  });
  const currentSlide = MOBILE_WELCOME_SLIDES[slideIndex];
  const step = getMobileOnboardingStep(stepKey);
  const progress = getMobileOnboardingProgress(stepKey);
  const slug = useMemo(() => buildOrganizationSlug(profile.businessName), [profile.businessName]);
  const canContinue = canContinueMobileOnboarding(stepKey, profile, arrival);

  const startWizard = (nextArrival: MobileOnboardingArrival) => {
    setArrival(nextArrival);
    setStepKey(getInitialStepForArrival(nextArrival));
    setPhase("wizard");
    Haptics.selectionAsync();
  };

  const nextSlide = () => {
    if (slideIndex < MOBILE_WELCOME_SLIDES.length - 1) {
      setSlideIndex((index) => index + 1);
      Haptics.selectionAsync();
      return;
    }
    startWizard("new-workspace");
  };

  const goNext = async () => {
    if (!canContinue || isSubmitting) return;
    const next = getNextMobileOnboardingStep(stepKey, arrival);
    if (next) {
      setStepKey(next);
      Haptics.selectionAsync();
      return;
    }
    try {
      await onSubmitOnboarding?.({ arrival, profile, permissions, slug });
    } catch {
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  const goBack = () => {
    const previous = getPreviousMobileOnboardingStep(stepKey, arrival);
    if (previous) {
      setStepKey(previous);
      Haptics.selectionAsync();
      return;
    }
    setPhase("welcome");
  };

  if (phase === "welcome") {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Text style={styles.brand}>Jokko</Text>
          <Pressable onPress={onOpenSpikes} hitSlop={10}>
            <Text style={styles.devLink}>Spikes</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={currentSlide.icon as IoniconName} size={34} color={theme.accent.primary} />
          </View>
          <Text style={styles.heroTitle}>{currentSlide.title}</Text>
          <Text style={styles.heroBody}>{currentSlide.body}</Text>

          <View style={styles.dots}>
            {MOBILE_WELCOME_SLIDES.map((slide, index) => (
              <View
                key={slide.key}
                style={[styles.dot, index === slideIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={nextSlide}>
            <Text style={styles.primaryButtonText}>
              {slideIndex === MOBILE_WELCOME_SLIDES.length - 1 ? "Créer mon espace" : "Continuer"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onStartInvite ?? (() => startWizard("invite"))}>
            <Text style={styles.secondaryButtonText}>J'ai une invitation</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.wizardHeader}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.backButton}>
          <Ionicons name="chevron-back" size={18} color={theme.accent.primary} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
        <Pressable onPress={onOpenSpikes} hitSlop={10}>
          <Text style={styles.devLink}>Spikes</Text>
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.wizardBody} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepEyebrow}>{arrival === "invite" ? "Invitation équipe" : "Nouvel espace"}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>

        {stepKey === "business" && (
          <BusinessStep profile={profile} slug={slug} onChange={setProfile} />
        )}
        {stepKey === "whatsapp" && <WhatsAppStep workspaceSlug={slug} onSkip={goNext} />}
        {stepKey === "permissions" && (
          <PermissionsStep permissions={permissions} onChange={setPermissions} arrival={arrival} />
        )}
        {stepKey === "done" && (
          <DoneStep profile={profile} slug={slug} arrival={arrival} permissions={permissions} />
        )}
        {submitError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.semantic.danger} />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
          onPress={goNext}
          disabled={!canContinue || isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Finalisation..." : stepKey === "done" ? "Ouvrir l'inbox" : step.skippable ? "Continuer" : "Suivant"}
          </Text>
          <Ionicons name={stepKey === "done" ? "mail-open-outline" : "arrow-forward"} size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function BusinessStep({
  profile,
  slug,
  onChange,
}: {
  profile: MobileBusinessProfile;
  slug: string;
  onChange: (profile: MobileBusinessProfile) => void;
}) {
  return (
    <View style={styles.stepContent}>
      <FieldLabel label="Nom de l'entreprise" />
      <TextInput
        value={profile.businessName}
        onChangeText={(businessName) => onChange({ ...profile, businessName })}
        placeholder="Ex. Maison Dakar"
        placeholderTextColor={theme.ink[500]}
        style={styles.input}
        autoCapitalize="words"
      />
      <Text style={styles.helper}>URL prévue : app.jokko.io/{slug || "mon-espace"}</Text>

      <FieldLabel label="Secteur" />
      <View style={styles.chipGrid}>
        {MOBILE_BUSINESS_SECTORS.map((sector) => (
          <Pressable
            key={sector}
            onPress={() => onChange({ ...profile, sector })}
            style={[styles.chip, profile.sector === sector && styles.chipActive]}
          >
            <Text style={[styles.chipText, profile.sector === sector && styles.chipTextActive]}>
              {sector}
            </Text>
          </Pressable>
        ))}
      </View>

      <FieldLabel label="Langue" />
      <View style={styles.segment}>
        <SegmentButton
          label="Français"
          active={profile.locale === "fr"}
          onPress={() => onChange({ ...profile, locale: "fr" })}
        />
        <SegmentButton
          label="English"
          active={profile.locale === "en"}
          onPress={() => onChange({ ...profile, locale: "en" })}
        />
      </View>

      <FieldLabel label="Fuseau horaire" />
      <View style={styles.chipGrid}>
        {MOBILE_TIMEZONES.map((timezone) => (
          <Pressable
            key={timezone.value}
            onPress={() => onChange({ ...profile, timezone: timezone.value })}
            style={[styles.chip, profile.timezone === timezone.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, profile.timezone === timezone.value && styles.chipTextActive]}>
              {timezone.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function WhatsAppStep({ workspaceSlug, onSkip }: { workspaceSlug: string; onSkip: () => void }) {
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
      <InfoRow icon="logo-whatsapp" title="Connexion WhatsApp Business" body="La connexion complète passera par le flow web Meta puis reviendra dans l'app via deep link." />
      <InfoRow icon="shield-checkmark-outline" title="Compte de revue" body="Le mode demo reste local-only pour Apple Review et Meta WABA Review." />
      <Pressable style={styles.outlineAction} onPress={openWhatsAppConnect}>
        <Ionicons name="open-outline" size={18} color={theme.accent.primary} />
        <Text style={styles.outlineActionText}>Ouvrir la connexion web</Text>
      </Pressable>
      <Pressable onPress={onSkip} style={styles.textAction}>
        <Text style={styles.textActionText}>Configurer plus tard</Text>
      </Pressable>
    </View>
  );
}

function PermissionsStep({
  permissions,
  arrival,
  onChange,
}: {
  permissions: PermissionDraft;
  arrival: MobileOnboardingArrival;
  onChange: (permissions: PermissionDraft) => void;
}) {
  return (
    <View style={styles.stepContent}>
      {arrival === "invite" && (
        <InfoRow
          icon="people-outline"
          title="Espace existant"
          body="Les invitations sautent la création d'organisation et ouvrent directement les réglages utiles."
        />
      )}
      <PermissionRow
        title="Notifications push"
        body="Nouveaux messages, mentions et assignments."
        value={permissions.push}
        onValueChange={(push) => onChange({ ...permissions, push })}
      />
      <PermissionRow
        title="Caméra"
        body="Demandée seulement quand tu joins une photo ou vidéo."
        value={permissions.camera}
        onValueChange={(camera) => onChange({ ...permissions, camera })}
      />
      <PermissionRow
        title="Micro"
        body="Demandé au moment d'enregistrer une note vocale."
        value={permissions.microphone}
        onValueChange={(microphone) => onChange({ ...permissions, microphone })}
      />
    </View>
  );
}

function DoneStep({
  profile,
  slug,
  arrival,
  permissions,
}: {
  profile: MobileBusinessProfile;
  slug: string;
  arrival: MobileOnboardingArrival;
  permissions: PermissionDraft;
}) {
  const workspaceName = arrival === "invite" ? "Espace invité" : profile.businessName || "Nouvel espace";
  return (
    <View style={styles.stepContent}>
      <View style={styles.doneIcon}>
        <Ionicons name="checkmark" size={32} color="#fff" />
      </View>
      <Text style={styles.doneTitle}>{workspaceName} est prêt</Text>
      <Text style={styles.doneBody}>
        {arrival === "invite"
          ? "L'inbox s'ouvrira sur les conversations de ton équipe."
          : `L'inbox s'ouvrira sur ${slug || "ton-espace"} avec WhatsApp configurable depuis les réglages.`}
      </Text>
      <View style={styles.summary}>
        <SummaryRow label="Push" value={permissions.push ? "Activé" : "À demander plus tard"} />
        <SummaryRow label="Caméra" value={permissions.camera ? "Pré-autorisée" : "Just-in-time"} />
        <SummaryRow label="Micro" value={permissions.microphone ? "Pré-autorisé" : "Just-in-time"} />
      </View>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({ icon, title, body }: { icon: IoniconName; title: string; body: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={theme.accent.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoBody}>{body}</Text>
      </View>
    </View>
  );
}

function PermissionRow({
  title,
  body,
  value,
  onValueChange,
}: {
  title: string;
  body: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.permissionRow}>
      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoBody}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.ink[300], true: theme.accent.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.surface.default },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  brand: { fontSize: 18, fontWeight: "800", color: theme.ink[900] },
  devLink: { fontSize: 14, fontWeight: "700", color: theme.accent.primary },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: theme.surface.raised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.ink[300],
    marginBottom: theme.spacing.xl,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "800",
    color: theme.ink[900],
    maxWidth: 340,
  },
  heroBody: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    lineHeight: 23,
    color: theme.ink[500],
    maxWidth: 340,
  },
  dots: { flexDirection: "row", gap: 7, marginTop: theme.spacing.xl },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.ink[300] },
  dotActive: { width: 24, backgroundColor: theme.accent.primary },
  actions: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  primaryButton: {
    minHeight: 50,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.ink[900],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  secondaryButton: {
    minHeight: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.surface.raised,
    borderWidth: 1,
    borderColor: theme.ink[300],
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: theme.ink[700], fontSize: 14, fontWeight: "700" },
  wizardHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 2 },
  backText: { color: theme.accent.primary, fontSize: 14, fontWeight: "700" },
  progressTrack: {
    height: 3,
    backgroundColor: theme.ink[300],
    marginHorizontal: theme.spacing.lg,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: theme.accent.primary },
  wizardBody: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  stepEyebrow: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "800",
    color: theme.accent.primary,
    marginBottom: 6,
  },
  stepTitle: { fontSize: 28, lineHeight: 33, fontWeight: "800", color: theme.ink[900] },
  stepDescription: { marginTop: 6, fontSize: 15, lineHeight: 22, color: theme.ink[500] },
  stepContent: { marginTop: theme.spacing.xl, gap: theme.spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: "800", color: theme.ink[700] },
  input: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.ink[300],
    backgroundColor: theme.surface.raised,
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    color: theme.ink[900],
  },
  helper: { fontSize: 12, color: theme.ink[500], marginTop: -6 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  chip: {
    minHeight: 38,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.ink[300],
    backgroundColor: theme.surface.raised,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  chipActive: { borderColor: theme.accent.primary, backgroundColor: "#EEF1FF" },
  chipText: { fontSize: 13, color: theme.ink[700], fontWeight: "700" },
  chipTextActive: { color: theme.accent.primary },
  segment: {
    flexDirection: "row",
    backgroundColor: theme.surface.sunken,
    borderRadius: theme.radius.pill,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentButtonActive: { backgroundColor: theme.surface.raised },
  segmentText: { fontSize: 13, fontWeight: "700", color: theme.ink[500] },
  segmentTextActive: { color: theme.ink[900] },
  infoRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    backgroundColor: theme.surface.raised,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.ink[300],
    padding: theme.spacing.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EEF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1, minWidth: 0 },
  infoTitle: { fontSize: 15, fontWeight: "800", color: theme.ink[900] },
  infoBody: { marginTop: 3, fontSize: 13, lineHeight: 18, color: theme.ink[500] },
  outlineAction: {
    minHeight: 48,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  outlineActionText: { color: theme.accent.primary, fontSize: 14, fontWeight: "800" },
  textAction: { alignItems: "center", paddingVertical: theme.spacing.sm },
  textActionText: { color: theme.ink[500], fontSize: 14, fontWeight: "700" },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.surface.raised,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.ink[300],
    padding: theme.spacing.md,
  },
  doneIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: theme.semantic.success,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: { fontSize: 25, lineHeight: 30, fontWeight: "800", color: theme.ink[900] },
  doneBody: { fontSize: 15, lineHeight: 22, color: theme.ink[500] },
  summary: {
    backgroundColor: theme.surface.raised,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.ink[300],
    overflow: "hidden",
  },
  summaryRow: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.ink[300],
  },
  summaryLabel: { fontSize: 13, color: theme.ink[500], fontWeight: "700" },
  summaryValue: { fontSize: 13, color: theme.ink[900], fontWeight: "800" },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.ink[300],
    backgroundColor: theme.surface.default,
  },
  errorBox: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "#F0C3C1",
    backgroundColor: "#FFF3F2",
    padding: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.semantic.danger,
  },
});
