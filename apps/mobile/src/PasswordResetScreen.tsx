import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Btn, Field, Icon, Micro, NavButton, useTheme } from "@jokko/ui-mobile";
import { api } from "../../../convex/_generated/api";
import { validatePassword } from "./lib/password-validation";

type PasswordResetMode = "request" | "confirm";

type Props = {
  mode: PasswordResetMode;
  initialEmail?: string;
  initialCode?: string;
};

type SubmitState = "idle" | "submitting";

export function PasswordResetScreen({ mode, initialEmail = "", initialCode = "" }: Props) {
  const router = useRouter();
  const { colors, font, dark } = useTheme();
  const { signIn } = useAuthActions();
  const ensureUser = useMutation(api.users.ensureUser);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedEmail = email.trim().toLowerCase();
  const passwordValid = useMemo(() => validatePassword(newPassword), [newPassword]);

  const requestReset = async () => {
    if (state !== "idle") return;
    if (!looksLikeEmail(normalizedEmail)) {
      setError("Renseignez un e-mail valide.");
      return;
    }
    setState("submitting");
    setError(null);
    try {
      await signIn("password", {
        email: normalizedEmail,
        flow: "reset",
        redirectTo: Linking.createURL("auth/reset-password", {
          queryParams: { email: normalizedEmail },
        }),
      });
      setSent(true);
    } catch (err) {
      const message = resetRequestError(err);
      if (message) setError(message);
      else setSent(true);
    } finally {
      setState("idle");
    }
  };

  const confirmReset = async () => {
    if (state !== "idle") return;
    if (!looksLikeEmail(normalizedEmail)) {
      setError("Renseignez l'e-mail du compte.");
      return;
    }
    if (code.trim().length < 8) {
      setError("Le code de réinitialisation est incomplet.");
      return;
    }
    if (!passwordValid.valid) {
      setError(passwordValid.message);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setState("submitting");
    setError(null);
    try {
      await signIn("password", {
        email: normalizedEmail,
        code: code.trim(),
        newPassword,
        flow: "reset-verification",
      });
      await ensureUser();
      router.replace("/boot");
    } catch (err) {
      setError(resetConfirmError(err));
    } finally {
      setState("idle");
    }
  };

  const busy = state !== "idle";
  const isRequest = mode === "request";

  return (
    <View style={[styles.root, { backgroundColor: colors.paper }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <NavButton icon="chevron-left" onPress={() => router.replace("/auth/sign-in")} />
        </View>
        <Micro style={{ marginBottom: 10 }}>{isRequest ? "Mot de passe oublié" : "Nouveau mot de passe"}</Micro>
        <Text style={[styles.title, { color: colors.ink, fontFamily: font.display }]}>
          {isRequest ? "On vous " : "Choisissez-en "}
          <Text style={{ fontFamily: font.displayItalic }}>{isRequest ? "renvoie ça." : "un autre."}</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.ink3, fontFamily: font.sans }]}>
          {isRequest
            ? "Indiquez l'e-mail associé à votre compte. Nous vous enverrons un lien de réinitialisation valide 30 minutes."
            : "Collez le code reçu par e-mail et choisissez un nouveau mot de passe."}
        </Text>

        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@société.com"
          icon="mail"
          keyboardType="email-address"
        />

        {!isRequest ? (
          <>
            <View style={{ height: 12 }} />
            <Field label="Code reçu" value={code} onChangeText={setCode} placeholder="Code à 8 caractères" icon="shield" />
            <View style={{ height: 12 }} />
            <Field
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="10 caractères, 1 majuscule, 1 chiffre"
              icon="lock"
              secureTextEntry={!showPassword}
              onToggleSecure={() => setShowPassword((v) => !v)}
            />
            <View style={{ height: 12 }} />
            <Field
              label="Confirmer"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Répéter le mot de passe"
              icon="lock"
              secureTextEntry={!showPassword}
            />
          </>
        ) : null}

        {sent ? (
          <View style={[styles.sentBox, { backgroundColor: tint(colors.good, 0.08), borderColor: tint(colors.good, 0.25) }]}>
            <View style={[styles.sentIcon, { backgroundColor: colors.good }]}>
              <Icon name="check" size={16} color="#fff" strokeWidth={2.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sentTitle, { color: colors.ink, fontFamily: font.sansSemibold }]}>E-mail envoyé</Text>
              <Text style={[styles.sentBody, { color: colors.ink3, fontFamily: font.sans }]}>
                Si un compte existe, le lien arrive dans quelques secondes. Vérifiez aussi vos spams.
              </Text>
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: tint(colors.hot, 0.08), borderColor: colors.hot }]}>
            <Icon name="circle" size={16} color={colors.hot} />
            <Text style={[styles.errorText, { color: colors.hot, fontFamily: font.sans }]}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Btn
          tone={dark ? "accent" : "primary"}
          size="lg"
          full
          iconRight="arrow-right"
          disabled={busy}
          onPress={isRequest ? requestReset : confirmReset}
        >
          {busy ? <ActivityIndicator color={colors.paper} /> : isRequest ? "Envoyer le lien" : "Changer le mot de passe"}
        </Btn>
        {isRequest ? (
          <Pressable
            style={styles.secondary}
            onPress={() =>
              router.push({ pathname: "/auth/reset-password", params: { email: normalizedEmail || undefined } } as never)
            }
          >
            <Text style={[styles.secondaryText, { color: colors.accentInk, fontFamily: font.sansMedium }]}>
              J'ai déjà un code
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondary} onPress={() => router.replace("/auth/sign-in")}>
            <Text style={[styles.secondaryText, { color: colors.accentInk, fontFamily: font.sansMedium }]}>
              Retour à la connexion
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function tint(hex: string, alpha: number): string {
  if (hex.startsWith("#") && hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function resetRequestError(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("not enabled")) {
    return "La réinitialisation n'est pas configurée pour le moment.";
  }
  return null;
}

function resetConfirmError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Invalid code")) return "Code invalide ou expiré.";
  if (message.includes("Le mot de passe doit")) return message;
  return "Impossible de changer le mot de passe pour le moment.";
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  headerTop: { height: 44, flexDirection: "row", alignItems: "center", marginBottom: 18, marginLeft: -8 },
  title: { fontSize: 40, lineHeight: 42, letterSpacing: -0.8 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
  intro: { fontSize: 14.5, lineHeight: 22, marginBottom: 26 },
  sentBox: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginTop: 22 },
  sentIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sentTitle: { fontSize: 13.5, marginBottom: 2 },
  sentBody: { fontSize: 12.5, lineHeight: 18 },
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
  secondary: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  secondaryText: { fontSize: 14 },
});
