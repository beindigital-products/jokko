import { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
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
import {
    passwordStrength,
    validatePassword,
    type PasswordStrength,
} from "./lib/password-validation";

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
        eyebrow: "BIENVENUE",
        title: "Reprenez vos\nconversations.",
        subtitle: "Reconnectez-vous à votre espace Jokko en quelques secondes.",
        cta: "Se connecter",
        switchPrompt: "Première fois sur Jokko ?",
        switchCta: "Créer un espace",
        otherPath: "/auth/sign-up" as const,
    },
    "sign-up": {
        eyebrow: "DÉMARREZ",
        title: "Centralisez\nvotre WhatsApp.",
        subtitle: "Créez l'espace de votre équipe en moins de trois minutes.",
        cta: "Créer mon espace",
        switchPrompt: "Déjà inscrit ?",
        switchCta: "Se connecter",
        otherPath: "/auth/sign-in" as const,
    },
} as const;

const SIGN_UP_TRUST = [
    { icon: "shield-checkmark-outline", label: "RGPD" },
    { icon: "flash-outline", label: "Setup < 3 min" },
    { icon: "lock-closed-outline", label: "Chiffré" },
] as const;

const TONE_COLORS: Record<PasswordStrength["tone"], string> = {
    neutral: theme.ink[300],
    danger: theme.semantic.danger,
    warning: theme.semantic.warning,
    success: theme.semantic.success,
};

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

    const copy = COPY[mode];
    const passwordValid = useMemo(() => validatePassword(password), [password]);
    const strength = useMemo(() => passwordStrength(password), [password]);

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
        if (mode === "sign-up" && name.trim().length < 2) {
            setError("Renseignez votre nom complet.");
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
                redirectUri,
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
                redirectUri,
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
            const cancelled =
                typeof err === "object" &&
                err !== null &&
                "code" in err &&
                err.code === "ERR_REQUEST_CANCELED";
            if (!cancelled) setError(getAuthErrorMessage(err, mode));
        } finally {
            setStatus("idle");
        }
    };

    const switchMode = () => {
        router.replace({
            pathname: copy.otherPath,
            params: {
                redirectTo: redirectTo || undefined,
                inviteToken: inviteToken || undefined,
            },
        } as never);
    };

    return (
        <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                    <Ionicons name="chatbubbles" size={18} color="#fff" />
                </View>
                <Text style={styles.brand}>Jokko</Text>
            </View>

            <ModeSwitcher mode={mode} onSwitch={switchMode} />

            <View style={styles.hero}>
                <Text style={styles.eyebrow}>
                    {inviteToken && mode === "sign-up" ? "INVITATION ÉQUIPE" : copy.eyebrow}
                </Text>
                <Text style={styles.title}>
                    {inviteToken && mode === "sign-up"
                        ? "Rejoignez votre\néquipe."
                        : copy.title}
                </Text>
                <Text style={styles.subtitle}>{copy.subtitle}</Text>
            </View>

            {mode === "sign-up" && !inviteToken ? <TrustRow /> : null}

            <View style={styles.socialStack}>
                {Platform.OS === "ios" && (
                    <AppleAuthentication.AppleAuthenticationButton
                        buttonType={
                            mode === "sign-in"
                                ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                                : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                        }
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={14}
                        style={styles.appleButton}
                        onPress={submitApple}
                    />
                )}
                <Pressable
                    style={({ pressed }) => [styles.oauthButton, pressed && styles.pressed]}
                    onPress={submitGoogle}
                    disabled={status !== "idle"}
                >
                    {status === "google" ? (
                        <ActivityIndicator color={theme.ink[900]} />
                    ) : (
                        <>
                            <Ionicons name="logo-google" size={18} color={theme.ink[900]} />
                            <Text style={styles.oauthButtonText}>
                                {mode === "sign-in"
                                    ? "Continuer avec Google"
                                    : "S'inscrire avec Google"}
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>

            <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OU PAR E-MAIL</Text>
                <View style={styles.divider} />
            </View>

            <View style={styles.form}>
                {mode === "sign-up" && (
                    <AuthField
                        label="Nom complet"
                        value={name}
                        onChangeText={setName}
                        placeholder="Aminata Diouf"
                        autoCapitalize="words"
                        textContentType="name"
                        leftIcon="person-outline"
                    />
                )}
                <AuthField
                    label="E-mail professionnel"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="vous@entreprise.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    leftIcon="mail-outline"
                />
                <AuthField
                    label="Mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    placeholder={
                        mode === "sign-up"
                            ? "10 caractères min., majuscule, chiffre"
                            : "Votre mot de passe"
                    }
                    secureTextEntry={!showPassword}
                    textContentType={mode === "sign-up" ? "newPassword" : "password"}
                    leftIcon="lock-closed-outline"
                    suffix={
                        <Pressable
                            onPress={() => setShowPassword((value) => !value)}
                            hitSlop={10}
                            accessibilityRole="button"
                            accessibilityLabel={
                                showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                            }
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color={theme.ink[500]}
                            />
                        </Pressable>
                    }
                />
                {mode === "sign-up" ? <StrengthMeter strength={strength} /> : null}
                {mode === "sign-up" && (
                    <AuthField
                        label="Confirmer"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Répéter le mot de passe"
                        secureTextEntry={!showPassword}
                        textContentType="newPassword"
                        leftIcon="checkmark-circle-outline"
                    />
                )}

                {mode === "sign-in" ? (
                    <Pressable
                        style={styles.forgotButton}
                        onPress={() =>
                            router.push({
                                pathname: "/auth/forgot-password",
                                params: { email: email.trim() || undefined },
                            } as never)
                        }
                    >
                        <Text style={styles.forgotButtonText}>Mot de passe oublié ?</Text>
                    </Pressable>
                ) : null}
            </View>

            {error && (
                <View style={styles.errorBox} accessibilityRole="alert">
                    <Ionicons name="alert-circle" size={18} color={theme.semantic.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <PrimaryCta
                label={copy.cta}
                loading={status === "password"}
                disabled={status !== "idle"}
                onPress={submitPassword}
            />

            {mode === "sign-up" ? (
                <Text style={styles.legal}>
                    En créant votre compte, vous acceptez nos{" "}
                    <Text style={styles.legalEmph}>Conditions</Text> et notre{" "}
                    <Text style={styles.legalEmph}>Politique de confidentialité</Text>.
                </Text>
            ) : null}

            <View style={styles.switchRow}>
                <Text style={styles.switchPrompt}>{copy.switchPrompt}</Text>
                <Pressable
                    onPress={switchMode}
                    hitSlop={6}
                    accessibilityRole="link"
                    accessibilityLabel={copy.switchCta}
                >
                    <Text style={styles.switchCta}>{copy.switchCta}</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

function ModeSwitcher({ mode, onSwitch }: { mode: AuthMode; onSwitch: () => void }) {
    return (
        <View style={styles.switcher} accessibilityRole="tablist">
            <SwitcherTab label="Connexion" active={mode === "sign-in"} onPress={mode === "sign-in" ? undefined : onSwitch} />
            <SwitcherTab label="Inscription" active={mode === "sign-up"} onPress={mode === "sign-up" ? undefined : onSwitch} />
        </View>
    );
}

function SwitcherTab({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress?: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={active}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
                styles.switcherTab,
                active && styles.switcherTabActive,
                pressed && !active && styles.pressed,
            ]}
        >
            <Text style={[styles.switcherLabel, active && styles.switcherLabelActive]}>
                {label}
            </Text>
        </Pressable>
    );
}

function TrustRow() {
    return (
        <View style={styles.trustRow}>
            {SIGN_UP_TRUST.map((item) => (
                <View key={item.label} style={styles.trustPill}>
                    <Ionicons
                        name={item.icon as React.ComponentProps<typeof Ionicons>["name"]}
                        size={13}
                        color={theme.ink[700]}
                    />
                    <Text style={styles.trustLabel}>{item.label}</Text>
                </View>
            ))}
        </View>
    );
}

function StrengthMeter({ strength }: { strength: PasswordStrength }) {
    const segments = [0, 1, 2, 3] as const;
    return (
        <View style={styles.meterRow}>
            <View style={styles.meterBars}>
                {segments.map((i) => {
                    const active = strength.score > i;
                    return (
                        <View
                            key={i}
                            style={[
                                styles.meterSegment,
                                {
                                    backgroundColor: active
                                        ? TONE_COLORS[strength.tone]
                                        : theme.ink[300],
                                },
                            ]}
                        />
                    );
                })}
            </View>
            <Text style={[styles.meterLabel, { color: TONE_COLORS[strength.tone] }]}>
                {strength.label}
            </Text>
        </View>
    );
}

function PrimaryCta({
    label,
    loading,
    disabled,
    onPress,
}: {
    label: string;
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () =>
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
    const onPressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                disabled={disabled}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={[styles.primaryButton, disabled && styles.disabled]}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Text style={styles.primaryButtonText}>{label}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                )}
            </Pressable>
        </Animated.View>
    );
}

function AuthField({
    label,
    leftIcon,
    suffix,
    ...inputProps
}: TextInputProps & {
    label: string;
    leftIcon?: React.ComponentProps<typeof Ionicons>["name"];
    suffix?: React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View
                style={[
                    styles.inputShell,
                    focused && styles.inputShellFocused,
                ]}
            >
                {leftIcon ? (
                    <Ionicons
                        name={leftIcon}
                        size={18}
                        color={focused ? theme.accent.primary : theme.ink[500]}
                        style={styles.inputIcon}
                    />
                ) : null}
                <TextInput
                    {...inputProps}
                    onFocus={(event) => {
                        setFocused(true);
                        inputProps.onFocus?.(event);
                    }}
                    onBlur={(event) => {
                        setFocused(false);
                        inputProps.onBlur?.(event);
                    }}
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
    scroll: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing.xxl * 1.5,
        backgroundColor: theme.surface.default,
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xl,
    },
    brandMark: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.ink[900],
    },
    brand: {
        fontSize: 17,
        fontWeight: "800",
        color: theme.ink[900],
        letterSpacing: -0.2,
    },

    switcher: {
        flexDirection: "row",
        padding: 4,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.surface.sunken,
        marginBottom: theme.spacing.xxl,
    },
    switcherTab: {
        flex: 1,
        minHeight: 38,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.radius.pill,
    },
    switcherTabActive: {
        backgroundColor: theme.surface.raised,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    switcherLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.ink[500],
        letterSpacing: 0.2,
    },
    switcherLabelActive: { color: theme.ink[900] },

    hero: { marginBottom: theme.spacing.xl },
    eyebrow: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.6,
        color: theme.accent.primary,
        marginBottom: theme.spacing.sm,
    },
    title: {
        fontSize: 36,
        lineHeight: 40,
        fontWeight: "800",
        color: theme.ink[900],
        letterSpacing: -1,
    },
    subtitle: {
        marginTop: theme.spacing.md,
        fontSize: 15,
        lineHeight: 22,
        color: theme.ink[500],
    },

    trustRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xl,
    },
    trustPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.surface.raised,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    trustLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: theme.ink[700],
        letterSpacing: 0.2,
    },

    socialStack: { gap: theme.spacing.sm },
    appleButton: { height: 52 },
    oauthButton: {
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.sm,
    },
    oauthButtonText: { fontSize: 15, fontWeight: "800", color: theme.ink[900] },

    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        marginVertical: theme.spacing.xl,
    },
    divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.ink[300] },
    dividerText: {
        fontSize: 10,
        fontWeight: "800",
        color: theme.ink[500],
        letterSpacing: 1.2,
    },

    form: { gap: theme.spacing.md },
    field: { gap: 6 },
    fieldLabel: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.ink[700],
        letterSpacing: 0.3,
    },
    inputShell: {
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: theme.ink[300],
        backgroundColor: theme.surface.raised,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    inputShellFocused: {
        borderColor: theme.accent.primary,
        shadowColor: theme.accent.primary,
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
    },
    inputIcon: { marginRight: 2 },
    input: { flex: 1, minHeight: 48, fontSize: 16, color: theme.ink[900] },

    meterRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginTop: -theme.spacing.xs,
    },
    meterBars: {
        flex: 1,
        flexDirection: "row",
        gap: 4,
    },
    meterSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    meterLabel: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.3,
        minWidth: 64,
        textAlign: "right",
    },

    forgotButton: {
        alignSelf: "flex-end",
        minHeight: 32,
        justifyContent: "center",
        marginTop: -theme.spacing.xs,
    },
    forgotButtonText: {
        color: theme.accent.primary,
        fontSize: 13,
        fontWeight: "800",
    },

    errorBox: {
        flexDirection: "row",
        gap: theme.spacing.sm,
        alignItems: "flex-start",
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: "#F0C3C1",
        backgroundColor: "#FFF3F2",
        padding: theme.spacing.md,
        marginTop: theme.spacing.lg,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        color: theme.semantic.danger,
        fontWeight: "600",
    },

    primaryButton: {
        minHeight: 56,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.ink[900],
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xl,
        shadowColor: theme.ink[900],
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: -0.2,
    },
    disabled: { opacity: 0.5 },

    legal: {
        marginTop: theme.spacing.md,
        fontSize: 11,
        lineHeight: 16,
        color: theme.ink[500],
        textAlign: "center",
        paddingHorizontal: theme.spacing.md,
    },
    legalEmph: { color: theme.ink[700], fontWeight: "700" },

    switchRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: theme.spacing.xl,
    },
    switchPrompt: {
        fontSize: 13,
        color: theme.ink[500],
    },
    switchCta: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.accent.primary,
    },

    pressed: { opacity: 0.7 },
});
