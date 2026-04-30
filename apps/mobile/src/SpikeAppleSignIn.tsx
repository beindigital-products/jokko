import { useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { theme } from "@jokko/tokens";

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";
const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

type VerifyResult = {
    valid: boolean;
    error?: string;
    claims?: {
        sub: string;
        email?: string;
        emailVerified?: boolean;
        isPrivateEmail?: boolean;
        nonce?: string;
        authTime?: number;
        iat: number;
        exp: number;
    };
};

export function SpikeAppleSignIn() {
    if (!convex) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Configuration manquante</Text>
                <Text style={styles.body}>
                    Définis <Text style={styles.code}>EXPO_PUBLIC_CONVEX_URL</Text> dans
                    l'environnement (fichier <Text style={styles.code}>.env</Text> à la racine
                    du monorepo) puis relance Expo.
                </Text>
                <Text style={styles.bodyDim}>
                    Exemple : <Text style={styles.code}>EXPO_PUBLIC_CONVEX_URL=https://YOURSLUG.convex.cloud</Text>
                </Text>
            </View>
        );
    }
    return (
        <ConvexProvider client={convex}>
            <SpikeAppleSignInInner />
        </ConvexProvider>
    );
}

function SpikeAppleSignInInner() {
    const [status, setStatus] = useState<"idle" | "signing" | "verifying" | "done" | "error">(
        "idle"
    );
    const [identityToken, setIdentityToken] = useState<string | null>(null);
    const [appleUserId, setAppleUserId] = useState<string | null>(null);
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const verifyAppleToken = useAction(api.spike_apple.verifyAppleToken);

    const handleAppleSignIn = async () => {
        if (Platform.OS !== "ios") {
            setErrorMsg("Sign in with Apple n'est disponible que sur iOS pour ce spike.");
            setStatus("error");
            return;
        }

        setStatus("signing");
        setErrorMsg(null);
        setVerifyResult(null);

        try {
            const isAvailable = await AppleAuthentication.isAvailableAsync();
            if (!isAvailable) {
                throw new Error(
                    "Apple Authentication non disponible (simulateur < iOS 13 ou compte non configuré)"
                );
            }

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                ],
            });

            const token = credential.identityToken;
            const user = credential.user;

            if (!token) {
                throw new Error("Pas d'identityToken reçu d'Apple");
            }

            setIdentityToken(token);
            setAppleUserId(user);
            setStatus("verifying");

            const result = await verifyAppleToken({
                identityToken: token,
            });

            setVerifyResult(result);
            setStatus("done");
        } catch (err: any) {
            if (err?.code === "ERR_REQUEST_CANCELED") {
                setStatus("idle");
                return;
            }
            setErrorMsg(err?.message ?? String(err));
            setStatus("error");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Spike S1 — Sign in with Apple + Convex</Text>
            <Text style={styles.body}>
                Ce spike valide la chaîne mobile native → Convex JWT verify. Tap sur le bouton
                pour déclencher Apple SignIn iOS, l'identityToken JWT est envoyé à l'action
                Convex <Text style={styles.code}>spike_apple.verifyAppleToken</Text> qui le
                vérifie contre les clés publiques Apple (JWKS).
            </Text>

            {Platform.OS === "ios" ? (
                <AppleAuthentication.AppleAuthenticationButton
                    buttonType={
                        AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                    }
                    buttonStyle={
                        AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                    }
                    cornerRadius={12}
                    style={styles.appleBtn}
                    onPress={handleAppleSignIn}
                />
            ) : (
                <View style={styles.notIosBox}>
                    <Text style={styles.bodyDim}>iOS uniquement.</Text>
                </View>
            )}

            {status === "signing" && (
                <View style={styles.statusRow}>
                    <ActivityIndicator color={theme.accent.primary} />
                    <Text style={styles.statusText}>Apple SignIn en cours…</Text>
                </View>
            )}

            {status === "verifying" && (
                <View style={styles.statusRow}>
                    <ActivityIndicator color={theme.accent.primary} />
                    <Text style={styles.statusText}>Convex vérifie le JWT…</Text>
                </View>
            )}

            {appleUserId && (
                <Section title="Apple user (stable across signins)">
                    <Text style={styles.code}>{appleUserId}</Text>
                </Section>
            )}

            {identityToken && (
                <Section title="identityToken JWT (header only)">
                    <Text style={styles.codeWrap}>
                        {identityToken.split(".")[0]}…
                    </Text>
                </Section>
            )}

            {verifyResult && (
                <Section
                    title={`Verdict Convex — ${verifyResult.valid ? "VALID ✓" : "INVALID ✗"}`}
                >
                    {verifyResult.error && (
                        <Text style={styles.errorText}>Erreur : {verifyResult.error}</Text>
                    )}
                    {verifyResult.claims && (
                        <View>
                            <ClaimRow label="sub" value={verifyResult.claims.sub} />
                            {verifyResult.claims.email && (
                                <ClaimRow label="email" value={verifyResult.claims.email} />
                            )}
                            {typeof verifyResult.claims.emailVerified === "boolean" && (
                                <ClaimRow
                                    label="email_verified"
                                    value={String(verifyResult.claims.emailVerified)}
                                />
                            )}
                            {typeof verifyResult.claims.isPrivateEmail === "boolean" && (
                                <ClaimRow
                                    label="is_private_email"
                                    value={String(verifyResult.claims.isPrivateEmail)}
                                />
                            )}
                            <ClaimRow
                                label="exp"
                                value={new Date(verifyResult.claims.exp * 1000).toISOString()}
                            />
                        </View>
                    )}
                </Section>
            )}

            {errorMsg && (
                <Section title="Erreur locale">
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </Section>
            )}
        </ScrollView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionBody}>{children}</View>
        </View>
    );
}

function ClaimRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.claimRow}>
            <Text style={styles.claimLabel}>{label}</Text>
            <Text style={styles.claimValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.xl,
        justifyContent: "center",
        backgroundColor: theme.surface.default,
    },
    scroll: {
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: theme.ink[900],
        marginBottom: theme.spacing.sm,
    },
    body: {
        fontSize: 14,
        color: theme.ink[700],
        lineHeight: 20,
        marginBottom: theme.spacing.md,
    },
    bodyDim: {
        fontSize: 13,
        color: theme.ink[500],
        lineHeight: 18,
    },
    code: {
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 12,
        color: theme.accent.primary,
    },
    codeWrap: {
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 11,
        color: theme.ink[700],
    },
    appleBtn: {
        height: 50,
        marginVertical: theme.spacing.md,
    },
    notIosBox: {
        padding: theme.spacing.md,
        backgroundColor: theme.surface.sunken,
        borderRadius: theme.radius.md,
        alignItems: "center",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginVertical: theme.spacing.sm,
    },
    statusText: {
        fontSize: 14,
        color: theme.ink[700],
    },
    section: {
        backgroundColor: theme.surface.raised,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.ink[300],
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: theme.ink[900],
        marginBottom: theme.spacing.xs,
    },
    sectionBody: {
        gap: theme.spacing.xs,
    },
    claimRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 2,
    },
    claimLabel: {
        fontSize: 12,
        color: theme.ink[500],
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    claimValue: {
        fontSize: 12,
        color: theme.ink[900],
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        flex: 1,
        textAlign: "right",
        marginLeft: theme.spacing.md,
    },
    errorText: {
        fontSize: 13,
        color: theme.semantic.danger,
        lineHeight: 18,
    },
});
