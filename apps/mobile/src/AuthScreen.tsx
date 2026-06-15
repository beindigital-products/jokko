import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Btn, Field, Icon, Micro, Screen, Wordmark, useTheme } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import { canSubmitAuthForm } from "./lib/auth-form";
import { validatePassword } from "./lib/password-validation";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "sign-in" | "sign-up";

type Props = {
  mode: AuthMode;
  redirectTo?: string;
  inviteToken?: string;
};

type AuthStatus = "idle" | "password" | "google" | "apple";

const COPY = {
  "sign-in": {
    eyebrow: "Connexion",
    titleLead: "Bon",
    titleItalic: "retour.",
    cta: "Se connecter",
    switchPrompt: "Pas encore de compte ?",
    switchCta: "Créer un compte",
    otherPath: "/auth/sign-up" as const,
    appleLabel: "Continuer avec Apple",
    googleLabel: "Continuer avec Google",
  },
  "sign-up": {
    eyebrow: "Création de compte",
    titleLead: "Rejoignez",
    titleItalic: "Jokko.",
    cta: "Créer mon compte",
    switchPrompt: "Déjà inscrit ?",
    switchCta: "Se connecter",
    otherPath: "/auth/sign-in" as const,
    appleLabel: "S'inscrire avec Apple",
    googleLabel: "S'inscrire avec Google",
  },
} as const;

export function AuthScreen({ mode, redirectTo, inviteToken }: Props) {
  const router = useRouter();
  const { colors, font, dark } = useTheme();
  const { signIn } = useAuthActions();
  const ensureUser = useMutation(api.users.ensureUser);
  const acceptInvitation = useMutation(api.invitations.acceptLink);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[mode];
  const isInvite = !!inviteToken && mode === "sign-up";
  const passwordValid = useMemo(() => validatePassword(password), [password]);

  const finishAuth = async () => {
    await ensureUser();
    if (inviteToken) {
      await acceptInvitation({ token: inviteToken });
      router.replace("/inbox");
      return;
    }
    router.replace((redirectTo || "/boot") as never);
  };

  const submitPassword = async () => {
    if (status !== "idle") return;
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Renseignez l'e-mail et le mot de passe.");
      return;
    }
    if (mode === "sign-up" && !passwordValid.valid) {
      setError(passwordValid.message);
      return;
    }
    if (mode === "sign-up" && !acceptedTerms) {
      setError("Acceptez les conditions pour créer votre compte.");
      return;
    }

    setStatus("password");
    try {
      await signIn("password", {
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        password,
        flow: mode === "sign-in" ? "signIn" : "signUp",
        ...(mode === "sign-up" ? { acceptedTermsAt: Date.now() } : {}),
      });
      await finishAuth();
    } catch (err) {
      setError(getAuthErrorMessage(err, mode));
    } finally {
      setStatus("idle");
    }
  };

  const submitOAuth = async (provider: "google" | "apple") => {
    if (status !== "idle") return;
    if (provider === "apple" && Platform.OS !== "ios") {
      setError("Sign in with Apple est disponible sur iOS uniquement.");
      return;
    }
    setStatus(provider);
    setError(null);
    try {
      const redirectUri = Linking.createURL("auth/callback");
      const result = await signIn(provider, { redirectTo: redirectUri });
      if (!result.redirect) {
        await finishAuth();
        return;
      }
      const browserResult = await WebBrowser.openAuthSessionAsync(
        result.redirect.toString(),
        redirectUri,
      );
      if (browserResult.type !== "success") {
        setError(`Connexion ${provider === "apple" ? "Apple" : "Google"} annulée.`);
        return;
      }
      const parsed = Linking.parse(browserResult.url);
      const code = parsed.queryParams?.code;
      if (typeof code !== "string") {
        setError("Retour d'authentification invalide.");
        return;
      }
      await signIn(undefined as never, { code });
      await finishAuth();
    } catch (err) {
      const cancelled =
        typeof err === "object" && err !== null && "code" in err && err.code === "ERR_REQUEST_CANCELED";
      if (!cancelled) setError(getAuthErrorMessage(err, mode));
    } finally {
      setStatus("idle");
    }
  };

  const switchMode = () => {
    router.replace({
      pathname: copy.otherPath,
      params: { redirectTo: redirectTo || undefined, inviteToken: inviteToken || undefined },
    } as never);
  };

  const busy = status !== "idle";
  // Gate the submit button (greyed until valid) — see canSubmitAuthForm.
  const canSubmit = canSubmitAuthForm({ mode, email, password, acceptedTerms });

  return (
    <Screen>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Wordmark size={22} />
        </View>
        <Micro style={{ marginBottom: 10 }}>{isInvite ? "Invitation équipe" : copy.eyebrow}</Micro>
        <Text style={[styles.title, { color: colors.ink, fontFamily: font.display }]}>
          {isInvite ? "Rejoignez votre " : `${copy.titleLead} `}
          <Text style={{ fontFamily: font.displayItalic }}>{isInvite ? "équipe." : copy.titleItalic}</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Providers */}
        <View style={{ gap: 10 }}>
          {Platform.OS === "ios" ? (
            <Btn
              tone="ghost"
              size="lg"
              full
              onPress={() => submitOAuth("apple")}
              style={styles.providerBtn}
            >
              <View style={styles.providerInner}>
                {status === "apple" ? (
                  <ActivityIndicator color={colors.ink} />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={19} color={colors.ink} />
                    <Text style={[styles.providerLabel, { color: colors.ink, fontFamily: font.sansMedium }]}>
                      {copy.appleLabel}
                    </Text>
                  </>
                )}
              </View>
            </Btn>
          ) : null}
          <Btn tone="ghost" size="lg" full onPress={() => submitOAuth("google")} style={styles.providerBtn}>
            <View style={styles.providerInner}>
              {status === "google" ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color={colors.ink} />
                  <Text style={[styles.providerLabel, { color: colors.ink, fontFamily: font.sansMedium }]}>
                    {copy.googleLabel}
                  </Text>
                </>
              )}
            </View>
          </Btn>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.rule }]} />
          <Micro>{mode === "sign-in" ? "ou par e-mail" : "ou"}</Micro>
          <View style={[styles.divider, { backgroundColor: colors.rule }]} />
        </View>

        {/* Fields */}
        <Field
          label="E-mail professionnel"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@société.com"
          icon="mail"
          keyboardType="email-address"
        />
        <View style={{ height: 12 }} />
        <Field
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder={mode === "sign-up" ? "10 caractères, 1 majuscule, 1 chiffre" : "Votre mot de passe"}
          icon="lock"
          secureTextEntry={!showPassword}
          onToggleSecure={() => setShowPassword((v) => !v)}
          hint={mode === "sign-up" && password.length > 0 && !passwordValid.valid ? passwordValid.message : undefined}
          error={mode === "sign-up" && password.length > 0 && !passwordValid.valid}
        />

        {mode === "sign-in" ? (
          <Pressable
            style={styles.forgot}
            onPress={() =>
              router.push({
                pathname: "/auth/forgot-password",
                params: { email: email.trim() || undefined },
              } as never)
            }
          >
            <Text style={[styles.forgotText, { color: colors.accentInk, fontFamily: font.sansMedium }]}>
              Mot de passe oublié ?
            </Text>
          </Pressable>
        ) : null}

        {mode === "sign-up" ? (
          <Pressable style={styles.terms} onPress={() => setAcceptedTerms((v) => !v)}>
            <View
              style={[
                styles.checkbox,
                { backgroundColor: acceptedTerms ? colors.ink : "transparent", borderColor: colors.rule },
              ]}
            >
              {acceptedTerms ? <Icon name="check" size={13} color={colors.paper} strokeWidth={3} /> : null}
            </View>
            <Text style={[styles.termsText, { color: colors.ink3, fontFamily: font.sans }]}>
              J'accepte les{" "}
              <Text style={{ color: colors.ink, fontFamily: font.sansMedium }}>Conditions générales</Text> et la{" "}
              <Text style={{ color: colors.ink, fontFamily: font.sansMedium }}>Politique de confidentialité</Text> de
              Jokko.
            </Text>
          </Pressable>
        ) : null}

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: hotTint(colors.hot), borderColor: colors.hot }]}>
            <Icon name="circle" size={16} color={colors.hot} />
            <Text style={[styles.errorText, { color: colors.hot, fontFamily: font.sans }]}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* CTA + switch */}
      <View style={styles.footer}>
        <Btn
          tone={dark ? "accent" : "primary"}
          size="lg"
          full
          iconRight="arrow-right"
          disabled={busy || !canSubmit}
          onPress={submitPassword}
        >
          {status === "password" ? <ActivityIndicator color={colors.paper} /> : copy.cta}
        </Btn>
        <View style={styles.switchRow}>
          <Text style={[styles.switchPrompt, { color: colors.ink3, fontFamily: font.sans }]}>
            {copy.switchPrompt}{" "}
          </Text>
          <Pressable onPress={switchMode} hitSlop={6}>
            <Text style={[styles.switchCta, { color: colors.ink, fontFamily: font.sansSemibold }]}>
              {copy.switchCta}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function hotTint(hot: string): string {
  // light error background — works for both hex and rgba inputs
  if (hot.startsWith("#") && hot.length === 7) {
    const r = parseInt(hot.slice(1, 3), 16);
    const g = parseInt(hot.slice(3, 5), 16);
    const b = parseInt(hot.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.08)`;
  }
  return "rgba(220,56,56,0.08)";
}

function getAuthErrorMessage(error: unknown, mode: AuthMode): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("InvalidAccountId") || message.includes("InvalidSecret")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (message.includes("already exists")) {
    return "Un compte existe déjà avec cet e-mail.";
  }
  if (message.includes("Le mot de passe doit")) {
    return message;
  }
  return mode === "sign-in"
    ? "Connexion impossible pour le moment."
    : "Création du compte impossible pour le moment.";
}

const styles = StyleSheet.create({
  scrollFlex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  headerTop: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { fontSize: 40, lineHeight: 42, letterSpacing: -0.8 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  providerBtn: { justifyContent: "flex-start" },
  providerInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  providerLabel: { fontSize: 16 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 20 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  forgot: { alignSelf: "flex-end", marginTop: 10 },
  forgotText: { fontSize: 13 },
  terms: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 16, paddingHorizontal: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  termsText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginTop: 16,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 18 },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 14 },
  switchPrompt: { fontSize: 13.5 },
  switchCta: { fontSize: 13.5, textDecorationLine: "underline" },
});
