"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CrmLogo } from "@/components/integrations/crm-logo";
import { DisconnectDialog } from "@/components/integrations/disconnect-dialog";
import { Chip, type ChipTone } from "@/components/dashboard/primitives/Chip";
import { StatusDot, type StatusDotTone } from "@/components/dashboard/primitives/StatusDot";
import {
    ArrowLeft,
    Bug,
    AlertCircle,
    Activity,
    FileClock,
    RotateCw,
    KeyRound,
    Link2,
    Loader2,
} from "lucide-react";

type ConnectionStatus = "active" | "degraded" | "reconnect_required" | "disconnected";

const STATUS: Record<ConnectionStatus, { tone: ChipTone; dot: StatusDotTone; label: string }> = {
    active: { tone: "good", dot: "good", label: "Actif" },
    degraded: { tone: "warn", dot: "warn", label: "Dégradé" },
    reconnect_required: { tone: "danger", dot: "danger", label: "Reconnexion requise" },
    disconnected: { tone: "neutral", dot: "neutral", label: "Déconnecté" },
};

const SEVERITY: Record<string, ChipTone> = { info: "accent", warning: "warn", error: "danger" };

const PROVIDER_LABELS: Record<string, string> = {
    hubspot: "HubSpot",
    pipedrive: "Pipedrive",
    salesforce: "Salesforce",
    sellsy: "Sellsy",
    axonaut: "Axonaut",
    nocrm: "noCRM.io",
};

function formatDate(ms: number | undefined) {
    if (!ms) return "—";
    return new Date(ms).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });
}

// ── v3 building blocks ───────────────────────────────────────────────────────
function Section({
    icon: Icon,
    title,
    right,
    children,
}: {
    icon: React.ElementType;
    title: string;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--ink-100)] px-5 py-3.5">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[var(--ink-500)]" />
                    <h2 className="text-[13px] font-semibold tracking-tight text-[var(--ink-900)]">{title}</h2>
                </div>
                {right}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

function Row({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
    return (
        <div className="flex items-center justify-between border-b border-[var(--ink-100)] py-2.5 last:border-b-0">
            <div className="flex items-center gap-2 text-[13px] text-[var(--ink-500)]">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{label}</span>
            </div>
            <span className="font-mono text-[12.5px] tabular-nums text-[var(--ink-900)]">{value}</span>
        </div>
    );
}

function EmptyBox({ icon: Icon, tone, title, sub }: { icon: React.ElementType; tone?: string; title: string; sub?: string }) {
    return (
        <div className="rounded-lg border border-[var(--ink-100)] bg-[var(--paper-warm)] p-6 text-center">
            <Icon className={cn("mx-auto mb-2 h-6 w-6", tone ?? "text-[var(--ink-400)]")} />
            <p className="text-sm font-medium text-[var(--ink-900)]">{title}</p>
            {sub ? <p className="mt-0.5 text-xs text-[var(--ink-500)]">{sub}</p> : null}
        </div>
    );
}

export default function ConnectionDetailsPage({ params }: { params: Promise<{ connectionId: string }> }) {
    const { connectionId } = use(params);
    const id = connectionId as Id<"crmConnections">;

    const connection = useQuery(api.crm.connections.getConnection, { connectionId: id });
    const auditLog = useQuery(api.crm.admin.listAuditLog, { connectionId: id, limit: 50 });
    const dlqItems = useQuery(api.crm.admin.listDLQItems, { connectionId: id, limit: 50 });
    const providers = useQuery(api.crm.connections.listAvailableProviders);

    const setDebugMode = useMutation(api.crm.admin.setDebugMode);
    const replayItem = useMutation(api.crm.admin.replayDLQItem);
    const disconnect = useAction(api.crm.connections.disconnect);
    const router = useRouter();

    const [togglingDebug, setTogglingDebug] = useState(false);
    const [replayingId, setReplayingId] = useState<string | null>(null);
    const [disconnectOpen, setDisconnectOpen] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    async function handleDisconnect() {
        setDisconnecting(true);
        try {
            await disconnect({ connectionId: id });
            toast.success("Connexion déconnectée");
            router.push("/dashboard/integrations");
        } catch (e) {
            toast.error(`Échec de la déconnexion : ${e instanceof Error ? e.message : "inconnu"}`);
            setDisconnecting(false);
        }
    }

    async function handleToggleDebug(enabled: boolean) {
        setTogglingDebug(true);
        try {
            await setDebugMode({ connectionId: id, enabled });
            toast.success(enabled ? "Debug mode activé (expire dans 24h)" : "Debug mode désactivé");
        } catch (e) {
            toast.error(`Échec du changement de debug mode : ${e instanceof Error ? e.message : "inconnu"}`);
        } finally {
            setTogglingDebug(false);
        }
    }

    async function handleReplay(queueItemId: Id<"crmSyncQueue">) {
        setReplayingId(queueItemId);
        try {
            await replayItem({ queueItemId });
            toast.success("Élément remis en file d'attente");
        } catch (e) {
            toast.error(`Échec du replay : ${e instanceof Error ? e.message : "inconnu"}`);
        } finally {
            setReplayingId(null);
        }
    }

    if (connection === undefined) {
        return (
            <div className="flex h-full w-full flex-col gap-5 p-8">
                <Skeleton className="h-14 w-72" />
                <Skeleton className="h-48 w-full max-w-3xl rounded-xl" />
                <Skeleton className="h-40 w-full max-w-3xl rounded-xl" />
            </div>
        );
    }

    if (connection === null) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <div className="max-w-md rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-8 text-center">
                    <h2 className="font-display text-lg font-bold text-[var(--ink-900)]">Connexion introuvable</h2>
                    <p className="mt-1.5 text-sm text-[var(--ink-500)]">
                        Cette connexion n&apos;existe plus ou vous n&apos;y avez pas accès.
                    </p>
                    <Link
                        href="/dashboard/integrations"
                        className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Retour aux intégrations
                    </Link>
                </div>
            </div>
        );
    }

    const s = STATUS[connection.status as ConnectionStatus] ?? STATUS.disconnected;
    const providerLabel = PROVIDER_LABELS[connection.provider] ?? connection.provider;

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            {/* Header */}
            <div className="shrink-0 border-b border-[var(--ink-200)] px-4 pb-5 pt-5 sm:px-8 sm:pt-6">
                <Link
                    href="/dashboard/integrations"
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-900)]"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Intégrations
                </Link>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-2">
                            <CrmLogo provider={connection.provider} className="h-full w-full" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="font-display text-[22px] font-bold tracking-tight text-[var(--ink-900)]">
                                {providerLabel}
                            </h1>
                            <p className="mt-0.5 truncate text-[13px] text-[var(--ink-500)]">
                                {connection.remoteAccountLabel ?? `Connexion #${connection._id.slice(0, 12)}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Chip tone={s.tone}>
                            <StatusDot tone={s.dot} />
                            {s.label}
                        </Chip>
                        {connection.status !== "disconnected" && (
                            <button
                                type="button"
                                onClick={() => setDisconnectOpen(true)}
                                className="rounded-md border border-[var(--status-danger)]/30 px-3 py-1.5 text-[13px] font-medium text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger-soft)]"
                            >
                                Déconnecter
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <DisconnectDialog
                open={disconnectOpen}
                providerId={connection.provider}
                providerLabel={providerLabel}
                category="CRM"
                supportsRemoteRevoke={providers?.find((p) => p.key === connection.provider)?.supportsRevoke ?? false}
                busy={disconnecting}
                onCancel={() => setDisconnectOpen(false)}
                onConfirm={handleDisconnect}
            />

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-[var(--paper-warm)] px-4 py-6 sm:px-8">
                <div className="mx-auto max-w-3xl space-y-5">
                    {/* Settings */}
                    <Section icon={Activity} title="Paramètres de connexion">
                        <div className="space-y-0">
                            <Row
                                label="Mode d'authentification"
                                icon={connection.authMode === "oauth2" ? Link2 : KeyRound}
                                value={connection.authMode === "oauth2" ? "OAuth 2.0" : "Clé API"}
                            />
                            <Row label="Mode d'échelle" value={connection.scalingMode === "large" ? "Large" : "Standard"} />
                            <Row label="Connecté le" value={formatDate(connection.connectedAt)} />
                            <Row label="Dernière synchronisation" value={formatDate(connection.lastSyncAt)} />
                            <Row label="Dernier polling" value={formatDate(connection.lastPollAt)} />
                            {connection.tokenExpiresAt ? (
                                <Row label="Expiration du token" value={formatDate(connection.tokenExpiresAt)} />
                            ) : null}
                        </div>

                        {connection.lastErrorMessageSanitized ? (
                            <div className="mt-4 rounded-lg border border-[var(--status-danger)]/20 bg-[var(--status-danger-soft)] p-3">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-danger)]" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-[var(--ink-900)]">Dernière erreur</div>
                                        <div className="mt-0.5 text-xs text-[var(--status-danger)]">
                                            [{connection.lastErrorCode}] {connection.lastErrorMessageSanitized}
                                        </div>
                                        <div className="mt-1 font-mono text-[11px] text-[var(--ink-soft)]">
                                            {formatDate(connection.lastErrorAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-4 flex items-center justify-between gap-4 border-t border-[var(--ink-100)] pt-4">
                            <div className="flex items-start gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--paper-warm)]">
                                    <Bug className="h-4 w-4 text-[var(--ink-500)]" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-[var(--ink-900)]">Mode débogage</div>
                                    <div className="text-xs text-[var(--ink-500)]">
                                        Logs détaillés pendant 24h. Expire automatiquement.
                                    </div>
                                </div>
                            </div>
                            <Switch
                                checked={Boolean(connection.debugMode)}
                                onCheckedChange={handleToggleDebug}
                                disabled={togglingDebug}
                                className="data-[state=checked]:bg-[var(--accent)]"
                            />
                        </div>
                    </Section>

                    {/* DLQ */}
                    <Section
                        icon={AlertCircle}
                        title="File d'attente en échec (DLQ)"
                        right={
                            dlqItems && dlqItems.length > 0 ? (
                                <Chip tone="danger">{dlqItems.length}</Chip>
                            ) : null
                        }
                    >
                        {dlqItems === undefined ? (
                            <Skeleton className="h-20 rounded-lg" />
                        ) : dlqItems.length === 0 ? (
                            <EmptyBox
                                icon={Activity}
                                tone="text-[var(--status-good)]"
                                title="Aucun élément en échec"
                                sub="La file de synchronisation fonctionne correctement."
                            />
                        ) : (
                            <div className="space-y-2">
                                {dlqItems.map((item) => (
                                    <div
                                        key={item._id}
                                        className="flex items-start justify-between gap-3 rounded-lg border border-[var(--ink-100)] bg-[var(--paper-warm)] p-3"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <Chip tone={item.status === "dead_letter" ? "danger" : "warn"}>
                                                    {item.status}
                                                </Chip>
                                                <span className="font-medium text-[var(--ink-900)]">{item.eventType}</span>
                                                <span className="font-mono text-xs text-[var(--ink-soft)]">
                                                    {item.entityType ?? "?"}#{item.entityId ?? "?"}
                                                </span>
                                            </div>
                                            {item.lastError ? (
                                                <div className="truncate text-xs text-[var(--status-danger)]">{item.lastError}</div>
                                            ) : null}
                                            <div className="font-mono text-[11px] text-[var(--ink-soft)]">
                                                {item.retryCount} tentative(s) · Dernière : {formatDate(item.lastAttemptAt)}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleReplay(item._id)}
                                            disabled={replayingId === item._id}
                                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-60"
                                        >
                                            {replayingId === item._id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <RotateCw className="h-3 w-3" />
                                            )}
                                            Rejouer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Audit log */}
                    <Section
                        icon={FileClock}
                        title="Journal d'audit"
                        right={
                            auditLog && auditLog.length > 0 ? (
                                <span className="font-mono text-[11px] text-[var(--ink-soft)]">
                                    {auditLog.length} événements
                                </span>
                            ) : null
                        }
                    >
                        {auditLog === undefined ? (
                            <Skeleton className="h-24 rounded-lg" />
                        ) : auditLog.length === 0 ? (
                            <EmptyBox icon={FileClock} title="Aucune entrée dans le journal." />
                        ) : (
                            <div className="space-y-0.5">
                                {auditLog.map((entry) => (
                                    <div
                                        key={entry._id}
                                        className="flex items-center gap-3 border-b border-[var(--ink-100)] px-1 py-2 last:border-b-0"
                                    >
                                        <Chip tone={SEVERITY[entry.severity] ?? "accent"}>{entry.severity}</Chip>
                                        <span className="truncate font-mono text-xs text-[var(--ink-700)]">{entry.action}</span>
                                        {entry.entityType ? (
                                            <span className="truncate font-mono text-[11px] text-[var(--ink-soft)]">
                                                {entry.entityType}#{entry.entityId ?? "?"}
                                            </span>
                                        ) : null}
                                        <span className="ml-auto whitespace-nowrap font-mono text-[11px] text-[var(--ink-soft)]">
                                            {formatDate(entry.createdAt)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                </div>
            </div>
        </div>
    );
}
