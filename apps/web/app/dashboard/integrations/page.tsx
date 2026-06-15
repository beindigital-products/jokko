"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureGate } from "@/components/plan/FeatureGate";
import { usePlanFeature } from "@/hooks/use-plan-feature";
import { useCurrentOrg } from "@/hooks/use-current-org";
import {
    IntegrationsScreen,
    IntegrationConnectDialog,
    IntegrationDetailModal,
    type ConnectTarget,
} from "@/components/dashboard/integrations";
import { DisconnectDialog } from "@/components/integrations/disconnect-dialog";
import { mapIntegrations, type ProviderDoc, type ConnectionDoc } from "@/lib/dashboard/integrations-data";
import { toast } from "sonner";
import { Sparkles, X } from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = {
    hubspot: "HubSpot",
    pipedrive: "Pipedrive",
    salesforce: "Salesforce",
    sellsy: "Sellsy",
    axonaut: "Axonaut",
    nocrm: "noCRM.io",
};

const PROVIDER_INSTANCE_HINT: Record<string, { label: string; placeholder: string } | undefined> = {
    nocrm: {
        label: "Sous-domaine noCRM.io",
        placeholder: "monentreprise (sera utilisé comme https://monentreprise.nocrm.io)",
    },
};

interface OAuthErrorMapping {
    title: string;
    description: string;
    severity: "error" | "warning" | "info";
}

const OAUTH_ERROR_MATRIX: Record<string, OAuthErrorMapping> = {
    another_provider_connected: { title: "Un CRM est déjà connecté", description: "Un seul CRM peut être connecté à la fois. Déconnectez le CRM actuel avant d'en ajouter un autre.", severity: "warning" },
    invalid_grant: { title: "Autorisation expirée", description: "Reconnectez-vous pour continuer.", severity: "error" },
    redirect_uri_mismatch: { title: "Configuration incorrecte", description: "L'URI de redirection côté fournisseur ne correspond pas. Contactez le support.", severity: "error" },
    scope_denied: { title: "Permissions refusées", description: "Vous avez refusé certaines permissions nécessaires. Réessayez.", severity: "warning" },
    access_denied: { title: "Permissions refusées", description: "Vous avez refusé certaines permissions nécessaires. Réessayez.", severity: "warning" },
    user_cancelled: { title: "Connexion annulée", description: "Vous avez annulé la connexion. Réessayez quand vous êtes prêt.", severity: "info" },
    provider_down: { title: "Service temporairement indisponible", description: "Réessayez dans quelques minutes.", severity: "warning" },
    rate_limited_callback: { title: "Trop de tentatives", description: "Patientez 5 minutes avant de réessayer.", severity: "warning" },
    state_expired: { title: "Tentative expirée", description: "Votre tentative a expiré après 10 minutes. Recommencez.", severity: "info" },
    state_consumed: { title: "Tentative déjà utilisée", description: "Recommencez une nouvelle connexion.", severity: "info" },
    missing_params: { title: "Paramètres manquants", description: "La réponse du fournisseur est incomplète. Recommencez.", severity: "error" },
    server_misconfigured: { title: "Configuration serveur", description: "Contactez le support : la plateforme n'est pas correctement configurée.", severity: "error" },
    oauth_exchange_failed: { title: "Échec de l'échange OAuth", description: "La connexion n'a pas pu être finalisée. Réessayez.", severity: "error" },
};

function resolveOAuthError(code: string): OAuthErrorMapping {
    return OAUTH_ERROR_MATRIX[code] ?? { title: "Connexion échouée", description: code, severity: "error" };
}

export default function IntegrationsPage() {
    const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature("integrations_crm");
    const providers = useQuery(api.crm.connections.listAvailableProviders);
    const connections = useQuery(api.crm.connections.listForCurrentOrganization);
    const optInStats = useQuery(api.crm.optin.getImportedOptInStats);
    const startOAuth = useAction(api.crm.oauth.start);
    const startOAuthLocal = useAction(api.crm.oauth.startLocal);
    const connectApiKey = useAction(api.crm.apikey.connectWithApiKey);
    const disconnect = useAction(api.crm.connections.disconnect);
    const { currentOrg } = useCurrentOrg();

    const router = useRouter();
    const searchParams = useSearchParams();

    const [connectTarget, setConnectTarget] = useState<ConnectTarget | null>(null);
    const [submittingConnect, setSubmittingConnect] = useState(false);
    const [detailKey, setDetailKey] = useState<string | null>(null);
    const [disconnectKey, setDisconnectKey] = useState<string | null>(null);
    const [disconnecting, setDisconnecting] = useState(false);
    const [showOptInBanner, setShowOptInBanner] = useState(false);

    useEffect(() => {
        const err = searchParams.get("error");
        const connected = searchParams.get("connected");
        const justConnected = searchParams.get("just_connected") === "1";
        if (err) {
            const mapping = resolveOAuthError(err);
            let title = mapping.title;
            let description = mapping.description;
            if (err === "another_provider_connected") {
                const existing = searchParams.get("existingProvider");
                const existingLabel = existing ? PROVIDER_LABELS[existing] ?? existing : null;
                if (existingLabel) {
                    title = `${existingLabel} est déjà connecté`;
                    description = `Un seul CRM peut être connecté à la fois. Déconnectez ${existingLabel} dans Intégrations avant d'ajouter un autre CRM.`;
                }
            } else if (mapping.severity === "error") {
                const detail = searchParams.get("detail");
                if (detail) title = `${title} : ${detail}`;
            }
            if (mapping.severity === "error") toast.error(title, { description });
            else toast.warning(title, { description });
            router.replace("/dashboard/integrations");
        } else if (connected) {
            toast.success(`Connecté avec succès à ${connected}`);
            router.replace("/dashboard/integrations?just_connected=1");
        } else if (justConnected) {
            setShowOptInBanner(true);
        }
    }, [searchParams, router]);

    type ConnectionRow = NonNullable<typeof connections>[number];
    const connectionByProvider = useMemo(() => {
        const map = new Map<string, ConnectionRow>();
        if (!connections) return map;
        for (const c of connections) {
            if (!map.has(c.provider) || c.status === "active") map.set(c.provider, c);
        }
        return map;
    }, [connections]);

    const activeConnection = useMemo(() => connections?.find((c) => c.status === "active") ?? null, [connections]);

    function onConnect(key: string) {
        const provider = providers?.find((p) => p.key === key);
        if (!provider) return;
        if (activeConnection && activeConnection.provider !== key) {
            const existingLabel = PROVIDER_LABELS[activeConnection.provider] ?? activeConnection.provider;
            toast.warning(`${existingLabel} est déjà connecté`, {
                description: `Un seul CRM peut être connecté à la fois. Déconnectez ${existingLabel} avant d'ajouter ${provider.displayName}.`,
            });
            return;
        }
        setConnectTarget({ id: provider.key, name: provider.displayName, cat: "CRM", authMode: provider.authMode });
    }

    async function handleConnectOAuth() {
        if (!connectTarget) return;
        setSubmittingConnect(true);
        try {
            const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
            const action = isLocalhost ? startOAuthLocal : startOAuth;
            const { authorizeUrl } = await action({ provider: connectTarget.id, scalingMode: "standard" });
            window.location.assign(authorizeUrl);
        } catch (e) {
            toast.error(`Impossible de démarrer la connexion : ${e instanceof Error ? e.message : "inconnu"}`);
            setSubmittingConnect(false);
        }
    }

    async function handleConnectApiKey(apiKey: string, instance?: string) {
        if (!connectTarget) return;
        setSubmittingConnect(true);
        try {
            await connectApiKey({
                provider: connectTarget.id,
                apiKey,
                instanceUrl: instance || undefined,
                scalingMode: "standard",
            });
            toast.success(`Connecté avec succès à ${connectTarget.name}`);
            setConnectTarget(null);
            router.replace("/dashboard/integrations?just_connected=1");
        } catch (e) {
            toast.error(`Connexion échouée : ${e instanceof Error ? e.message : "inconnu"}`);
        } finally {
            setSubmittingConnect(false);
        }
    }

    async function handleDisconnect() {
        if (!disconnectKey) return;
        const conn = connectionByProvider.get(disconnectKey);
        if (!conn) return;
        setDisconnecting(true);
        try {
            await disconnect({ connectionId: conn._id });
            toast.success(`${PROVIDER_LABELS[disconnectKey] ?? disconnectKey} déconnecté`);
            setDisconnectKey(null);
        } catch (e) {
            toast.error(`Échec de la déconnexion : ${e instanceof Error ? e.message : "inconnu"}`);
        } finally {
            setDisconnecting(false);
        }
    }

    if (planLoading || providers === undefined) {
        return (
            <div className="flex h-full w-full flex-col gap-6 p-8">
                <Skeleton className="h-16 w-72" />
                <Skeleton className="h-12 w-full" />
                <div className="grid gap-5 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!planAllowed) {
        return (
            <div className="p-4 sm:p-8">
                <h1 className="font-display text-xl font-bold tracking-tight text-[var(--ink-900)] sm:text-2xl">Intégrations</h1>
                <p className="mt-0.5 text-sm text-[var(--ink-500)]">
                    Connectez votre CRM pour synchroniser contacts et événements.
                </p>
                <div className="mt-6">
                    <FeatureGate feature="integrations_crm">{null}</FeatureGate>
                </div>
            </div>
        );
    }

    const data = mapIntegrations((providers ?? []) as ProviderDoc[], (connections ?? []) as ConnectionDoc[]);
    const showBanner = showOptInBanner && optInStats && optInStats.imported > 0;
    const detailConn = detailKey ? connectionByProvider.get(detailKey) : undefined;
    const disconnectProvider = disconnectKey ? providers?.find((p) => p.key === disconnectKey) : undefined;

    return (
        <>
            <IntegrationsScreen
                data={data}
                onConnect={onConnect}
                onConfigure={(key) => setDetailKey(key)}
                onDisconnect={(key) => setDisconnectKey(key)}
                onDocs={() => window.open("/docs/api", "_blank")}
                onRequest={() => router.push("/dashboard/help")}
                banner={
                    showBanner ? (
                        <div className="relative rounded-xl border border-[var(--status-good)]/25 bg-[var(--status-good-soft)] p-4 pr-10">
                            <div className="flex items-start gap-2.5">
                                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-good)]" />
                                <div>
                                    <div className="text-sm font-semibold text-[var(--ink-900)]">
                                        {optInStats!.imported} contacts importés · {optInStats!.granted} / {optInStats!.imported} opt-ins collectés
                                    </div>
                                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-700)]">
                                        Les contacts importés restent en statut <code className="rounded bg-[var(--status-good)]/10 px-1 py-0.5 text-xs text-[var(--ink-900)]">unknown</code>{" "}
                                        (RGPD). Collectez les opt-ins via une réponse WhatsApp entrante, un formulaire web, ou un import CSV attesté.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowOptInBanner(false)}
                                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[var(--status-good)] transition-colors hover:bg-[var(--status-good)]/10"
                                aria-label="Fermer"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ) : null
                }
            />

            {/* Connect consent modal */}
            <IntegrationConnectDialog
                key={connectTarget?.id ?? "none"}
                open={connectTarget !== null}
                onOpenChange={(o) => {
                    if (!o && !submittingConnect) setConnectTarget(null);
                }}
                integration={connectTarget}
                workspace={currentOrg?.name}
                instanceHint={connectTarget ? PROVIDER_INSTANCE_HINT[connectTarget.id] : undefined}
                submitting={submittingConnect}
                onConnectOAuth={handleConnectOAuth}
                onConnectApiKey={handleConnectApiKey}
            />

            {/* Detail / config modal */}
            <IntegrationDetailModal
                key={detailKey ?? "none"}
                open={detailKey !== null && detailConn !== undefined}
                onOpenChange={(o) => {
                    if (!o) setDetailKey(null);
                }}
                connectionId={detailConn?._id ?? null}
                name={detailKey ? PROVIDER_LABELS[detailKey] ?? detailKey : ""}
                cat="CRM"
                onAdvanced={() => {
                    if (detailConn) router.push(`/dashboard/integrations/${detailConn._id}`);
                }}
                onDisconnect={() => {
                    const key = detailKey;
                    setDetailKey(null);
                    setDisconnectKey(key);
                }}
            />

            {/* Disconnect confirmation */}
            <DisconnectDialog
                open={disconnectKey !== null}
                providerId={disconnectKey ?? undefined}
                providerLabel={disconnectKey ? PROVIDER_LABELS[disconnectKey] ?? disconnectKey : ""}
                category="CRM"
                supportsRemoteRevoke={disconnectProvider?.supportsRevoke ?? false}
                busy={disconnecting}
                onCancel={() => setDisconnectKey(null)}
                onConfirm={handleDisconnect}
            />
        </>
    );
}
