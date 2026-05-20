import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { theme } from "@jokko/tokens";
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
            setError("Renseigne un e-mail valide.");
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
            if (message) {
                setError(message);
            } else {
                setSent(true);
            }
        } finally {
            setState("idle");
        }
    };

    const confirmReset = async () => {
        if (state !== "idle") return;
        if (!looksLikeEmail(normalizedEmail)) {
            setError("Renseigne l'e-mail du compte.");
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

    return (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Pressable style={styles.backButton} onPress={() => router.replace("/auth/sign-in")}>
                <Ionicons name="chevron-back" size={18} color={theme.accent.primary} />
                <Text style={styles.backButtonText}>Connexion</Text>
            </Pressable>

            <View style={styles.iconShell}>
                <Ionicons name="key-outline" size={28} color={theme.accent.primary} />
            </View>
            <Text style={styles.title}>
                {mode === "request" ? "Mot de passe oublié" : "Nouveau mot de passe"}
            </Text>
            <Text style={styles.subtitle}>
                {mode === "request"
                    ? "Entre ton e-mail professionnel pour recevoir le lien de réinitialisation."
                    : "Colle le code reçu par e-mail et choisis un nouveau mot de passe."}
            </Text>

            <AuthField
                label="E-mail professionnel"
                value={email}
                onChangeText={setEmail}
                placeholder="vous@entreprise.com"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
            />

            {mode === "confirm" && (
                <>
                    <AuthField
                        label="Code"
                        value={code}
                        onChangeText={setCode}
                        placeholder="Code reçu par e-mail"
                        autoCapitalize="none"
                        textContentType="oneTimeCode"
                    />
                    <AuthField
                        label="Nouveau mot de passe"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="10 caractères, majuscule, chiffre"
                        secureTextEntry={!showPassword}
                        textContentType="newPassword"
                        suffix={
                            <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.ink[500]} />
                            </Pressable>
                        }
                    />
                    <AuthField
                        label="Confirmer"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Répéter le mot de passe"
                        secureTextEntry={!showPassword}
                        textContentType="newPassword"
                    />
                </>
            )}

            {sent && (
                <View style={styles.successBox}>
                    <Ionicons name="mail-outline" size={18} color={theme.semantic.success} />
                    <Text style={styles.successText}>
                        Si ce compte existe, un e-mail de réinitialisation vient d'être envoyé.
                    </Text>
                </View>
            )}

            {error && (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color={theme.semantic.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <Pressable
                style={[styles.primaryButton, state !== "idle" && styles.disabled]}
                onPress={mode === "request" ? requestReset : confirmReset}
                disabled={state !== "idle"}
            >
                {state === "submitting" ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Text style={styles.primaryButtonText}>
                            {mode === "request" ? "Envoyer le lien" : "Changer le mot de passe"}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                )}
            </Pressable>

            {mode === "request" && (
                <Pressable
                    style={styles.secondaryButton}
                    onPress={() => router.push({
                        pathname: "/auth/reset-password",
                        params: { email: normalizedEmail || undefined },
                    } as never)}
                >
                    <Text style={styles.secondaryButtonText}>J'ai déjà un code</Text>
                </Pressable>
            )}
        </ScrollView>
    );
}

function AuthField({
    label,
    suffix,
    ...inputProps
}: React.ComponentProps<typeof TextInput> & { label: string; suffix?: React.ReactNode }) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.inputShell}>
                <TextInput
                    {...inputProps}
                    placeholderTextColor={theme.ink[500]}
                    style={styles.input}
                />
                {suffix}
            </View>
        </View>
    );
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
    if (message.includes("Invalid code")) {
        return "Code invalide ou expiré.";
    }
    if (message.includes("Le mot de passe doit")) {
        return message;
    }
    return "Impossible de changer le mot de passe pour le moment.";
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
        justifyContent: "center",
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
    },
    backButton: {
        position: "absolute",
        left: theme.spacing.xl,
        top: theme.spacing.xl,
        minHeight: 36,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
    },
    backButtonText: { color: theme.accent.primary, fontSize: 14, fontWeight: "800" },
    iconShell: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EAF8F0",
        marginBottom: theme.spacing.lg,
    },
    title: { fontSize: 32, lineHeight: 38, fontWeight: "800", color: theme.ink[900] },
    subtitle: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl, fontSize: 15, lineHeight: 22, color: theme.ink[500] },
    field: { marginBottom: theme.spacing.md },
    fieldLabel: { fontSize: 13, fontWeight: "800", color: theme.ink[700], marginBottom: 6 },
    inputShell: {
        minHeight: 50,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: theme.spacing.md,
    },
    input: { flex: 1, minHeight: 48, fontSize: 16, color: theme.ink[900] },
    successBox: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        alignItems: "flex-start",
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: "#B7E2C4",
        backgroundColor: "#F1FBF5",
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    successText: { flex: 1, fontSize: 13, lineHeight: 18, color: theme.semantic.success },
    errorBox: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        alignItems: "flex-start",
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: "#F0C3C1",
        backgroundColor: "#FFF3F2",
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    errorText: { flex: 1, fontSize: 13, lineHeight: 18, color: theme.semantic.danger },
    primaryButton: {
        minHeight: 50,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.ink[900],
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: theme.spacing.sm,
    },
    primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
    disabled: { opacity: 0.5 },
    secondaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: theme.spacing.md },
    secondaryButtonText: { color: theme.accent.primary, fontSize: 14, fontWeight: "800" },
});
