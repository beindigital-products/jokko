import { convexAuth } from "@convex-dev/auth/server";
import Apple from "@auth/core/providers/apple";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { DataModel } from "./_generated/dataModel";
import { sendPasswordResetEmail } from "./lib/email";

function authRedirectFallback(): string {
    return process.env.SITE_URL ?? process.env.CONVEX_SITE_URL ?? "/";
}

function isAllowedAuthRedirect(redirectTo: string): boolean {
    if (redirectTo.startsWith("/")) return true;
    if (redirectTo.startsWith("jokko://auth/callback")) return true;

    const allowedOrigins = [process.env.SITE_URL, process.env.CONVEX_SITE_URL]
        .filter((value): value is string => typeof value === "string" && value.length > 0);

    return allowedOrigins.some((origin) => redirectTo.startsWith(origin));
}

export const { auth, signIn, signOut, store } = convexAuth({
    providers: [
        Apple,
        Google,
        Password<DataModel>({
            profile(params) {
                // RGPD : si le client envoie un timestamp acceptedTermsAt
                // au sign-up, on le persiste sur le user record. Pas requis
                // pour les flows reset / verify (timestamp déjà présent).
                const rawTerms = params.acceptedTermsAt;
                const acceptedTermsAt =
                    typeof rawTerms === "number"
                        ? rawTerms
                        : typeof rawTerms === "string" && rawTerms.length > 0
                          ? Number(rawTerms)
                          : undefined;
                return {
                    email: params.email as string,
                    name: params.name as string,
                    emailVerified: params.emailVerificationTime as string,
                    ...(acceptedTermsAt !== undefined && Number.isFinite(acceptedTermsAt)
                        ? { acceptedTermsAt }
                        : {}),
                };
            },
            validatePasswordRequirements: (password: string) => {
                if (password.length < 10) {
                    throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
                }
                if (!/[A-Z]/.test(password)) {
                    throw new Error("Le mot de passe doit contenir au moins une majuscule.");
                }
                if (!/[a-z]/.test(password)) {
                    throw new Error("Le mot de passe doit contenir au moins une minuscule.");
                }
                if (!/[0-9]/.test(password)) {
                    throw new Error("Le mot de passe doit contenir au moins un chiffre.");
                }
            },
            reset: Email({
                id: "password-reset",
                maxAge: 30 * 60,
                sendVerificationRequest: async ({ identifier, url }) => {
                    await sendPasswordResetEmail({
                        to: identifier,
                        resetUrl: url,
                    });
                },
            }),
        }),
    ],
    callbacks: {
        async redirect({ redirectTo }) {
            return isAllowedAuthRedirect(redirectTo) ? redirectTo : authRedirectFallback();
        },
    },
});
