"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { ExternalLink, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Icon } from "../primitives/Icon"
import { Chip } from "../primitives/Chip"
import { StatusDot } from "../primitives/StatusDot"
import { IntegrationLogo } from "./IntegrationLogo"
import { integrationScopes } from "./scopes"
import type { IntegrationCategory } from "./types"

interface IntegrationDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    connectionId: string | null
    name: string
    cat: IntegrationCategory
    onDisconnect: () => void
    onAdvanced: () => void
}

// Editable field mappings (the remote property feeding each Jokko field).
const MAP_FIELDS: { key: "firstName" | "lastName" | "email" | "phone" | "tags"; label: string; ph: string }[] = [
    { key: "firstName", label: "Prénom", ph: "firstname" },
    { key: "lastName", label: "Nom", ph: "lastname" },
    { key: "email", label: "Email", ph: "email" },
    { key: "phone", label: "Téléphone", ph: "phone" },
    { key: "tags", label: "Tags", ph: "ex. jokko_tags" },
]
// Enrichment fields not yet imported (kept informational).
const MAP_AUTO = ["Source", "Pôle assigné"]

type FieldMap = { firstName?: string; lastName?: string; email?: string; phone?: string; tags?: string }

const DIRECTIONS = (name: string) => [
    { id: "out", l: `Jokko → ${name}`, sub: "Pousse uniquement" },
    { id: "in", l: `${name} → Jokko`, sub: "Tire uniquement" },
    { id: "two", l: "Bidirectionnel", sub: "Recommandé" },
]

const FREQUENCIES = [
    { id: "rt", l: "Temps réel (webhooks)" },
    { id: "hourly", l: "Toutes les heures" },
    { id: "daily", l: "Quotidien · 03:00" },
]

function ComingSoon() {
    return (
        <span className="rounded border border-[var(--ink-200)] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em] text-[var(--ink-soft)]">
            à venir
        </span>
    )
}

function Eyebrow({ children, after }: { children: React.ReactNode; after?: React.ReactNode }) {
    return (
        <div className="mb-2.5 flex items-center gap-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                {children}
            </span>
            {after}
        </div>
    )
}

/**
 * IntegrationDetailModal — v3 connector config modal (design `IntegrationDetail`).
 * Real: status + recent syncs (audit log) + disconnect + advanced-diagnostics link.
 * Sync direction / field mapping / frequency are presented per the design but not
 * yet persisted by the backend (marked "à venir"). Self-fetches by connectionId.
 */
export function IntegrationDetailModal({
    open,
    onOpenChange,
    connectionId,
    name,
    cat,
    onDisconnect,
    onAdvanced,
}: IntegrationDetailModalProps) {
    // Local overrides win until saved; otherwise reflect the persisted value.
    const [dirOverride, setDirOverride] = useState<"out" | "in" | "two" | null>(null)
    const [freqOverride, setFreqOverride] = useState<"rt" | "hourly" | "daily" | null>(null)
    const [mapOverride, setMapOverride] = useState<FieldMap | null>(null)
    const [saving, setSaving] = useState(false)

    const connection = useQuery(
        api.crm.connections.getConnection,
        connectionId ? { connectionId: connectionId as Id<"crmConnections"> } : "skip",
    )
    const audit = useQuery(
        api.crm.admin.listAuditLog,
        connectionId ? { connectionId: connectionId as Id<"crmConnections">, limit: 8 } : "skip",
    )
    const savePreferences = useMutation(api.crm.connections.updateSyncPreferences)

    if (!open || !connectionId) return null

    const provider = connection?.provider ?? name.toLowerCase()
    const isCRM = cat === "CRM"
    const close = () => onOpenChange(false)

    const dir = dirOverride ?? (connection?.syncDirection as "out" | "in" | "two" | undefined) ?? "two"
    const freq = freqOverride ?? (connection?.syncFrequency as "rt" | "hourly" | "daily" | undefined) ?? "rt"
    const savedMap = (connection?.fieldMapping ?? {}) as FieldMap
    const map = mapOverride ?? savedMap
    const setMap = (k: keyof FieldMap, val: string) => setMapOverride({ ...map, [k]: val })
    const dirty =
        (dirOverride !== null && dirOverride !== connection?.syncDirection) ||
        (freqOverride !== null && freqOverride !== connection?.syncFrequency) ||
        mapOverride !== null

    const save = async () => {
        if (saving) return
        setSaving(true)
        try {
            // Trim + drop empties so cleared fields fall back to adapter defaults.
            const cleanMap: FieldMap = {}
            for (const f of MAP_FIELDS) {
                const val = (map[f.key] ?? "").trim()
                if (val) cleanMap[f.key] = val
            }
            await savePreferences({
                connectionId: connectionId as Id<"crmConnections">,
                syncDirection: dir,
                syncFrequency: freq,
                fieldMapping: cleanMap,
            })
            toast.success("Préférences de synchronisation enregistrées")
            setDirOverride(null)
            setFreqOverride(null)
            setMapOverride(null)
            onOpenChange(false)
        } catch {
            toast.error("Échec de l'enregistrement")
        } finally {
            setSaving(false)
        }
    }

    const syncs = (audit ?? []).map((e) => ({
        time: new Date(e.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        ok: e.severity !== "error",
        desc: e.action,
    }))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="Fermer" onClick={close} className="absolute inset-0 bg-[var(--ink-900)]/30 backdrop-blur-[1.5px]" />
            <div
                className="relative z-10 flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-2xl"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center gap-3.5 border-b border-[var(--ink-200)] px-6 pb-4 pt-5">
                    <IntegrationLogo id={provider} name={name} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="font-display text-[21px] font-bold tracking-tight text-[var(--ink-900)]">{name}</h2>
                            <Chip tone="good">
                                <StatusDot tone="good" />
                                Connecté
                            </Chip>
                        </div>
                        <p className="mt-0.5 truncate text-[12.5px] text-[var(--ink-soft)]">
                            {connection?.remoteAccountLabel ??
                                (connection?.lastSyncAt
                                    ? `Synchronisé ${new Date(connection.lastSyncAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                                    : "Connecteur actif")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-500)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-[18px] overflow-y-auto px-6 py-5">
                    {/* Direction */}
                    <div>
                        <Eyebrow>Sens de synchronisation</Eyebrow>
                        <div className="grid grid-cols-3 gap-2">
                            {DIRECTIONS(name).map((o) => {
                                const on = dir === o.id
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => setDirOverride(o.id as "out" | "in" | "two")}
                                        className={cn(
                                            "rounded-[10px] border px-3.5 py-3 text-left transition-colors",
                                            on ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:bg-[var(--paper-warm)]",
                                        )}
                                    >
                                        <div className="text-[13px] font-semibold tracking-[-0.005em] text-[var(--ink-900)]">{o.l}</div>
                                        <div className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">{o.sub}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Mapping / permissions */}
                    {isCRM ? (
                        <div>
                            <Eyebrow>Mapping des champs</Eyebrow>
                            <div className="flex flex-col gap-1.5">
                                {MAP_FIELDS.map((f) => (
                                    <div
                                        key={f.key}
                                        className="grid items-center gap-3 rounded-md bg-[var(--paper-warm)] px-3 py-1.5"
                                        style={{ gridTemplateColumns: "1fr 28px 1fr" }}
                                    >
                                        <span className="text-[12.5px] font-medium text-[var(--ink-900)]">{f.label}</span>
                                        <Icon name="switch" size={14} color="var(--ink-soft)" />
                                        <input
                                            value={map[f.key] ?? ""}
                                            onChange={(e) => setMap(f.key, e.target.value)}
                                            placeholder={f.ph}
                                            className="h-7 w-full rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2 font-mono text-[12px] text-[var(--ink-900)] outline-none transition-colors placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]"
                                        />
                                    </div>
                                ))}
                                {MAP_AUTO.map((label) => (
                                    <div
                                        key={label}
                                        className="grid items-center gap-3 rounded-md bg-[var(--paper-warm)] px-3 py-2 opacity-70"
                                        style={{ gridTemplateColumns: "1fr 28px 1fr" }}
                                    >
                                        <span className="text-[12.5px] font-medium text-[var(--ink-900)]">{label}</span>
                                        <Icon name="switch" size={14} color="var(--ink-soft)" />
                                        <span className="flex items-center gap-2">
                                            <span className="font-mono text-[12px] text-[var(--ink-soft)]">auto</span>
                                            <ComingSoon />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Eyebrow>Permissions accordées</Eyebrow>
                            <div className="flex flex-col gap-1.5">
                                {integrationScopes(cat).map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 rounded-md bg-[var(--paper-warm)] px-3 py-2.5">
                                        <Icon name={s.icon} size={14} color="var(--accent)" strokeWidth={1.9} />
                                        <span className="text-[12.5px] text-[var(--ink-700)]">{s.label}</span>
                                        <Icon name="circle-check" size={14} color="var(--status-good)" strokeWidth={1.9} className="ml-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Frequency + recent syncs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Eyebrow>Fréquence</Eyebrow>
                            <div className="flex flex-col gap-1.5">
                                {FREQUENCIES.map((f) => {
                                    const on = freq === f.id
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setFreqOverride(f.id as "rt" | "hourly" | "daily")}
                                            className={cn(
                                                "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[12.5px] transition-colors",
                                                on ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:bg-[var(--paper-warm)]",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                                                    on ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--ink-300)]",
                                                )}
                                            >
                                                {on ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                                            </span>
                                            <span className="text-[var(--ink-900)]">{f.l}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <div>
                            <Eyebrow>Dernières synchronisations</Eyebrow>
                            <div className="flex flex-col gap-1">
                                {syncs.length === 0 ? (
                                    <p className="rounded-lg border border-[var(--ink-100)] bg-[var(--paper-warm)] px-3 py-4 text-center text-[12px] text-[var(--ink-soft)]">
                                        Aucune activité récente.
                                    </p>
                                ) : (
                                    syncs.map((l, i) => (
                                        <div key={i} className="flex items-center gap-2.5 py-1 text-[11.5px]">
                                            <span className="min-w-[36px] font-mono text-[var(--ink-soft)]">{l.time}</span>
                                            <span
                                                className={cn(
                                                    "rounded px-1.5 py-px font-mono text-[9.5px] uppercase tracking-[0.05em]",
                                                    l.ok
                                                        ? "bg-[var(--status-good-soft)] text-[var(--status-good)]"
                                                        : "bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
                                                )}
                                            >
                                                {l.ok ? "OK" : "Échec"}
                                            </span>
                                            <span className="min-w-0 flex-1 truncate text-[var(--ink-500)]">{l.desc}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)] px-6 py-3.5">
                    <button
                        type="button"
                        onClick={onDisconnect}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger-soft)]"
                    >
                        <Icon name="logout" size={14} strokeWidth={1.8} />
                        Déconnecter {name}
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onAdvanced}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-white)]"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Diagnostics avancés
                        </button>
                        <button
                            type="button"
                            onClick={close}
                            className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                        >
                            Fermer
                        </button>
                        <button
                            type="button"
                            onClick={save}
                            disabled={!dirty || saving}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
