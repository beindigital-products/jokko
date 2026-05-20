import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { theme } from "@jokko/tokens";
import { api } from "../../../convex/_generated/api";
import { validatePassword } from "./lib/password-validation";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "sign-in" | "sign-up";

type Props = {
    mode: AuthMode;
    redirectTo?: string;
    inviteToken?: string;
};

type AuthStatus = "idle" | "password" | "google" | "apple";

export function AuthScreen({ mode, redirectTo, inviteToken }: Props) {
    const router = useRouter();
    const { signIn } = useAuthActions();
    const ensureUser = useMutation(api.users.ensureUser);
    const acceptInvitation = useMutation(api.invitations.acceptLink);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState<AuthStatus>("idle");
    const [error, setError] = useState<string | null>(null);

    const title = mode === "sign-in" ? "Connexion" : inviteToken ? "Rejoindre l'équipe" : "Créer mon espace";
    const subtitle = mode === "sign-in"
        ? "Connecte-toi pour reprendre tes conversations."
        : "Crée ton compte pour finaliser l'espace mobile Jokko.";
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
            setError("Renseigne l'e-mail et le mot de passe.");
            return;
        }
        if (mode === "sign-up" && name.trim().length < 2) {
            setError("Renseigne ton nom complet.");
            return;
        }
        if (mode === "sign-up" && !passwordValid.valid) {
            setError(passwordValid.message);
            return;
        }
        if (mode === "sign-up" && password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setStatus("password");
        try {
            await signIn("password", {
                email: normalizedEmail,
                name: name.trim() || normalizedEmail.split("@")[0],
                password,
                flow: mode === "sign-in" ? "signIn" : "signUp",
            });
            await finishAuth();
        } catch (err) {
            setError(getAuthErrorMessage(err, mode));
        } finally {
            setStatus("idle");
        }
    };

    const submitGoogle = async () => {
        if (status !== "idle") return;
        setStatus("google");
        setError(null);

        try {
            const redirectUri = Linking.createURL("auth/callback");
            const result = await signIn("google", { redirectTo: redirectUri });
            if (!result.redirect) {
                await finishAuth();
                return;
            }

            const browserResult = await WebBrowser.openAuthSessionAsync(
                result.redirect.toString(),
                redirectUri
            );
            if (browserResult.type !== "success") {
                setError("Connexion Google annulée.");
                return;
            }

            const parsed = Linking.parse(browserResult.url);
            const code = parsed.queryParams?.code;
            if (typeof code !== "string") {
                setError("Retour Google invalide.");
                return;
            }

            await signIn(undefined as never, { code });
            await finishAuth();
        } catch (err) {
            setError(getAuthErrorMessage(err, mode));
        } finally {
            setStatus("idle");
        }
    };

    const submitApple = async () => {
        if (status !== "idle") return;
        if (Platform.OS !== "ios") {
            setError("Sign in with Apple est disponible sur iOS uniquement.");
            return;
        }

        setStatus("apple");
        setError(null);

        try {
            const available = await AppleAuthentication.isAvailableAsync();
            if (!available) {
                setError("Apple Sign In n'est pas disponible sur cet appareil.");
                return;
            }

            const redirectUri = Linking.createURL("auth/callback");
            const result = await signIn("apple", { redirectTo: redirectUri });
            if (!result.redirect) {
                await finishAuth();
                return;
            }

            const browserResult = await WebBrowser.openAuthSessionAsync(
                result.redirect.toString(),
                redirectUri
            );
            if (browserResult.type !== "success") {
                setError("Connexion Apple annulée.");
                return;
            }

            const parsed = Linking.parse(browserResult.url);
            const code = parsed.queryParams?.code;
            if (typeof code !== "string") {
                setError("Retour Apple invalide.");
                return;
            }

            await signIn(undefined as never, { code });
            await finishAuth();
        } catch (err) {
            const cancelled = typeof err === "object" && err !== null && "code" in err && err.code === "ERR_REQUEST_CANCELED";
            if (!cancelled) setError(getAuthErrorMessage(err, mode));
        } finally {
            setStatus("idle");
        }
    };

    const switchMode = () => {
        const path = mode === "sign-in" ? "/auth/sign-up" : "/auth/sign-in";
        router.replace({
            pathname: path,
            params: {
                redirectTo: redirectTo || undefined,
                inviteToken: inviteToken || undefined,
            },
        } as never);
    };

    return (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                    <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
                </View>
                <Text style={styles.brand}>Jokko</Text>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.socialStack}>
                {Platform.OS === "ios" && (
                    <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={12}
                        style={styles.appleButton}
                        onPress={submitApple}
                    />
                )}
                <Pressable style={styles.oauthButton} onPress={submitGoogle}>
                    {status === "google" ? (
                        <ActivityIndicator color={theme.ink[900]} />
                    ) : (
                        <>
                            <Ionicons name="logo-google" size={18} color={theme.ink[900]} />
                            <Text style={styles.oauthButtonText}>Continuer avec Google</Text>
                        </>
                    )}
                </Pressable>
            </View>

            <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.divider} />
            </View>

            {mode === "sign-up" && (
                <AuthField
                    label="Nom complet"
                    value={name}
                    onChangeText={setName}
                    placeholder="Aminata Diouf"
                    autoCapitalize="words"
                    textContentType="name"
                />
            )}
            <AuthField
                label="E-mail professionnel"
                value={email}
                onChangeText={setEmail}
                placeholder="vous@entreprise.com"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
            />
            <AuthField
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder={mode === "sign-up" ? "10 caractères, majuscule, chiffre" : "Mot de passe"}
                secureTextEntry={!showPassword}
                textContentType={mode === "sign-up" ? "newPassword" : "password"}
                suffix={
                    <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.ink[500]} />
                    </Pressable>
                }
            />
            {mode === "sign-up" && (
                <AuthField
                    label="Confirmer"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Répéter le mot de passe"
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                />
            )}

            {mode === "sign-in" && (
                <Pressable
                    style={styles.forgotButton}
                    onPress={() => router.push({
                        pathname: "/auth/forgot-password",
                        params: { email: email.trim() || undefined },
                    } as never)}
                >
                    <Text style={styles.forgotButtonText}>Mot de passe oublié ?</Text>
                </Pressable>
            )}

            {error && (
                <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={18} color={theme.semantic.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <Pressable
                style={[styles.primaryButton, status !== "idle" && styles.disabled]}
                onPress={submitPassword}
                disabled={status !== "idle"}
            >
                {status === "password" ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Text style={styles.primaryButtonText}>
                            {mode === "sign-in" ? "Se connecter" : "Créer le compte"}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                )}
            </Pressable>

            <Pressable style={styles.switchButton} onPress={switchMode}>
                <Text style={styles.switchButtonText}>
                    {mode === "sign-in" ? "Pas encore de compte ? Créer un espace" : "Déjà un compte ? Se connecter"}
                </Text>
            </Pressable>
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

function getAuthErrorMessage(error: unknown, mode: AuthMode): string {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("InvalidAccountId") || message.includes("InvalidSecret")) {
        return "Email ou mot de passe incorrect.";
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
    scroll: {
        flexGrow: 1,
        justifyContent: "center",
        padding: theme.spacing.xl,
        backgroundColor: theme.surface.default,
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xxl,
    },
    brandMark: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.accent.primary,
    },
    brand: { fontSize: 18, fontWeight: "800", color: theme.ink[900] },
    title: { fontSize: 34, lineHeight: 39, fontWeight: "800", color: theme.ink[900] },
    subtitle: { marginTop: theme.spacing.sm, fontSize: 15, lineHeight: 22, color: theme.ink[500] },
    socialStack: { marginTop: theme.spacing.xl, gap: theme.spacing.sm },
    appleButton: { height: 50 },
    oauthButton: {
        minHeight: 50,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
    },
    oauthButtonText: { fontSize: 15, fontWeight: "800", color: theme.ink[900] },
    dividerRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginVertical: theme.spacing.xl },
    divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.ink[300] },
    dividerText: { fontSize: 12, fontWeight: "700", color: theme.ink[500] },
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
    forgotButton: { alignSelf: "flex-end", minHeight: 32, justifyContent: "center", marginTop: -theme.spacing.xs },
    forgotButtonText: { color: theme.accent.primary, fontSize: 13, fontWeight: "800" },
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
    switchButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: theme.spacing.md },
    switchButtonText: { color: theme.accent.primary, fontSize: 14, fontWeight: "800", textAlign: "center" },
});
