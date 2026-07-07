import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Valid credit pack amounts (must match lib/credit-packs.ts)
const VALID_AMOUNTS = [5_000, 10_000, 25_000, 50_000, 100_000];

function getAppUrl(): string {
    return process.env.APP_URL || "https://app.jokko.co";
}

/**
 * Initiate a Wave payment for credit recharge.
 * Uses Wave Checkout API: https://docs.wave.com/
 */
export const initiateWavePayment = action({
    args: {
        amount: v.number(),
    },
    handler: async (ctx, args): Promise<{ url: string; paymentSessionId: string }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        // Validate amount
        if (!VALID_AMOUNTS.includes(args.amount)) {
            throw new Error("Montant invalide");
        }

        // Get current org
        const session = await ctx.runQuery(internal.sessions.getCurrentSession, {});
        if (!session?.organizationId) throw new Error("Aucune organisation active");

        const organizationId = session.organizationId as Id<"organizations">;
        const appUrl = getAppUrl();

        // Create payment session
        const { sessionId, publicReference } = await ctx.runMutation(
            internal.payments.createPaymentSession,
            {
                organizationId,
                userId,
                amount: args.amount,
                credits: args.amount, // 1:1 mapping FCFA → crédits
                provider: "WAVE",
            }
        );

        // Call Wave Checkout API
        const waveApiKey = process.env.WAVE_API_KEY;
        if (!waveApiKey) {
            throw new Error("Wave API non configurée. Contactez le support.");
        }

        const response = await fetch("https://api.wave.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${waveApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: String(args.amount), // Wave attend un string
                currency: "XOF",
                client_reference: publicReference,
                success_url: `${appUrl}/dashboard/billing/recharge?session=${sessionId}&status=success`,
                error_url: `${appUrl}/dashboard/billing/recharge?session=${sessionId}&status=error`,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Wave] Checkout creation failed:", response.status, errorText);
            await ctx.runMutation(internal.payments.failPayment, {
                sessionId,
                failureReason: `Wave API error: ${response.status}`,
                providerMetadata: { status: response.status, body: errorText },
            });
            throw new Error("Erreur lors de la création du paiement Wave. Réessayez.");
        }

        const data = await response.json();

        // Wave returns wave_launch_url for the checkout page
        const checkoutUrl = data.wave_launch_url;
        if (!checkoutUrl) {
            console.error("[Wave] No wave_launch_url in response:", JSON.stringify(data));
            await ctx.runMutation(internal.payments.failPayment, {
                sessionId,
                failureReason: "No wave_launch_url in Wave response",
                providerMetadata: data,
            });
            throw new Error("Erreur Wave : URL de paiement non reçue.");
        }

        // Update session with provider details
        await ctx.runMutation(internal.payments.updatePaymentSession, {
            sessionId,
            providerSessionId: data.id,
            checkoutUrl,
            providerMetadata: {
                wave_id: data.id,
                checkout_status: data.checkout_status,
            },
        });

        return { url: checkoutUrl, paymentSessionId: sessionId };
    },
});

/**
 * Initiate an Orange Money (Web Payment) payment for a credit recharge.
 *
 * NOTE: this is wired end-to-end per Orange's Web Payment spec but stays
 * DISABLED in the UI (PAYMENT_PROVIDERS.available = false in lib/credit-packs)
 * until a real merchant account is validated and its credentials are set:
 *   - ORANGE_MONEY_CLIENT_ID / ORANGE_MONEY_CLIENT_SECRET / ORANGE_MONEY_MERCHANT_KEY
 *   - ORANGE_MONEY_ENV = "dev" (sandbox) | "prod"  (default: "prod")
 * Flip `available` to true + run a sandbox payment before enabling in prod.
 * The credit-granting webhook lives in convex/http.ts (/api/orange-money/webhook).
 */
export const initiateOrangeMoneyPayment = action({
    args: {
        amount: v.number(),
    },
    handler: async (ctx, args): Promise<{ url: string; paymentSessionId: string }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Non authentifié");

        if (!VALID_AMOUNTS.includes(args.amount)) {
            throw new Error("Montant invalide");
        }

        const clientId = process.env.ORANGE_MONEY_CLIENT_ID;
        const clientSecret = process.env.ORANGE_MONEY_CLIENT_SECRET;
        const merchantKey = process.env.ORANGE_MONEY_MERCHANT_KEY;
        // Validate config BEFORE creating a session (no orphan PENDING rows).
        if (!clientId || !clientSecret || !merchantKey) {
            throw new Error("Orange Money n'est pas encore configuré. Contactez le support.");
        }

        const isSandbox = (process.env.ORANGE_MONEY_ENV ?? "prod") === "dev";
        const basePath = isSandbox
            ? "https://api.orange.com/orange-money-webpay/dev/v1"
            : "https://api.orange.com/orange-money-webpay/v1";
        // Sandbox uses the test currency "OUV"; production uses XOF.
        const currency = isSandbox ? "OUV" : "XOF";

        const session = await ctx.runQuery(internal.sessions.getCurrentSession, {});
        if (!session?.organizationId) throw new Error("Aucune organisation active");
        const organizationId = session.organizationId as Id<"organizations">;
        const appUrl = getAppUrl();

        const { sessionId, publicReference } = await ctx.runMutation(
            internal.payments.createPaymentSession,
            {
                organizationId,
                userId,
                amount: args.amount,
                credits: args.amount, // 1:1 FCFA → crédits
                provider: "ORANGE_MONEY",
            }
        );

        const fail = async (reason: string, meta?: Record<string, unknown>) => {
            await ctx.runMutation(internal.payments.failPayment, {
                sessionId,
                failureReason: reason,
                providerMetadata: meta,
            });
        };

        // 1. OAuth client-credentials token.
        const tokenRes = await fetch("https://api.orange.com/oauth/v3/token", {
            method: "POST",
            headers: {
                Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        });
        if (!tokenRes.ok) {
            await fail(`Orange OAuth error: ${tokenRes.status}`);
            throw new Error("Erreur d'authentification Orange Money. Réessayez.");
        }
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        if (!accessToken) {
            await fail("No access_token from Orange OAuth", tokenData);
            throw new Error("Erreur Orange Money : jeton non reçu.");
        }

        // 2. Initiate the web payment. order_id = our publicReference so the
        //    webhook can match the notification back to this session.
        const payRes = await fetch(`${basePath}/webpayment`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                merchant_key: merchantKey,
                currency,
                order_id: publicReference,
                amount: args.amount,
                return_url: `${appUrl}/dashboard/billing/recharge?session=${sessionId}&status=success`,
                cancel_url: `${appUrl}/dashboard/billing/recharge?session=${sessionId}&status=cancel`,
                notif_url: `${process.env.CONVEX_SITE_URL ?? ""}/api/orange-money/webhook`,
                lang: "fr",
            }),
        });
        if (!payRes.ok) {
            const errorText = await payRes.text();
            await fail(`Orange webpayment error: ${payRes.status}`, { status: payRes.status, body: errorText });
            throw new Error("Erreur lors de la création du paiement Orange Money. Réessayez.");
        }
        const payData = await payRes.json();
        const paymentUrl = payData.payment_url;
        if (!paymentUrl) {
            await fail("No payment_url from Orange", payData);
            throw new Error("Erreur Orange Money : URL de paiement non reçue.");
        }

        // Persist the notif_token so the webhook can authenticate the callback,
        // and key the session on order_id (publicReference) for lookup.
        await ctx.runMutation(internal.payments.updatePaymentSession, {
            sessionId,
            providerSessionId: publicReference,
            checkoutUrl: paymentUrl,
            providerMetadata: {
                pay_token: payData.pay_token,
                notif_token: payData.notif_token,
                order_id: publicReference,
            },
        });

        return { url: paymentUrl, paymentSessionId: sessionId };
    },
});
