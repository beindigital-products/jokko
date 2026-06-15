"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import {
    ArrowUpRight,
    Bell,
    Check,
    Fingerprint,
    Globe,
    KeyRound,
    Palette,
    Plug,
    Shield,
    Trash2,
    Users,
    Webhook,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { Switch } from "@/components/ui/switch"
import { WebhookBox } from "@/components/dashboard/settings"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SaveButton, SettingRow, SettingsCard } from "../_components/settings-card"

// ── Notifications ────────────────────────────────────────────────────────────

const NOTIFS = [
    {
        id: "new-messages",
        title: "Nouveaux messages assignés",
        description: "Notification quand une nouvelle conversation m'est assignée.",
        defaultOn: true,
        locked: false,
    },
    {
        id: "mentions",
        title: "Mentions & commentaires",
        description: "Être notifié quand un membre me mentionne dans une note interne.",
        defaultOn: true,
        locked: false,
    },
    {
        id: "security-alerts",
        title: "Alertes système critiques",
        description: "Obligatoires pour la sécurité de votre compte.",
        defaultOn: true,
        locked: true,
    },
]

export function NotificationsSection() {
    const prefs = useQuery(api.notifications.getMyNotificationPreferences)
    const savePrefs = useMutation(api.notifications.saveNotificationPreferences)

    // Initialise from defaults; will be updated once prefs load.
    const [state, setState] = useState<Record<string, boolean>>(
        Object.fromEntries(NOTIFS.map((n) => [n.id, n.defaultOn])),
    )
    const [saving, setSaving] = useState(false)

    // Sync local state whenever the backend preferences load/change.
    useEffect(() => {
        if (!prefs) return
        setState({
            "new-messages": prefs.assignments,
            "mentions": prefs.mentions,
            "security-alerts": prefs.systemAlerts,
        })
    }, [prefs])

    const handleSave = async () => {
        setSaving(true)
        try {
            await savePrefs({
                assignments: state["new-messages"],
                mentions: state["mentions"],
                systemAlerts: state["security-alerts"],
            })
            toast.success("Préférences enregistrées")
        } catch {
            toast.error("Impossible d'enregistrer les préférences.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <SettingsCard
            icon={Bell}
            title="Préférences de notification"
            description="Contrôlez quand et comment vous êtes notifié"
            footer={<SaveButton onClick={handleSave} loading={saving}>Enregistrer les préférences</SaveButton>}
        >
            <div className="divide-y divide-[var(--ink-100)]">
                {NOTIFS.map((n) => (
                    <div key={n.id} className="py-4 first:pt-0 last:pb-0">
                        <SettingRow
                            title={n.title}
                            description={n.description}
                            disabled={n.locked}
                            control={
                                <Switch
                                    checked={n.locked ? true : state[n.id]}
                                    disabled={n.locked}
                                    onCheckedChange={(c) => setState((s) => ({ ...s, [n.id]: c }))}
                                />
                            }
                        />
                    </div>
                ))}
            </div>
        </SettingsCard>
    )
}

// ── Sécurité · 2FA ───────────────────────────────────────────────────────────

export function SecuritySection() {
    const deleteAccount = useMutation(api.users.deleteAccount)

    const handleDelete = async () => {
        try {
            await deleteAccount()
            window.location.href = "/auth/sign-in"
        } catch {
            toast.error("Impossible de supprimer le compte pour le moment.")
        }
    }

    return (
        <div className="space-y-5">
            <SettingsCard icon={Shield} title="Sécurité & connexion" description="Gérez vos identifiants de connexion">
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3.5">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)]">
                                <KeyRound className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-[13.5px] font-medium text-[var(--ink-900)]">Mot de passe</p>
                                <p className="text-[11px] text-[var(--ink-soft)]">Dernière modification il y a 3 mois</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => toast("Bientôt", { description: "Le changement de mot de passe arrive prochainement." })}
                            className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                        >
                            Modifier
                        </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3.5">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)]">
                                <Fingerprint className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-[13.5px] font-medium text-[var(--ink-900)]">Double authentification (2FA)</p>
                                <p className="text-[11px] text-[var(--ink-soft)]">Une couche de sécurité supplémentaire à la connexion.</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-[var(--paper-white)] px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                            À venir
                        </span>
                    </div>
                </div>
            </SettingsCard>

            <SettingsCard tone="danger" icon={Trash2} title="Suppression du compte" description="Cette action est irréversible">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] p-3.5 text-left transition-colors hover:bg-[var(--status-danger-soft)]/70"
                        >
                            <div>
                                <p className="text-[13.5px] font-medium text-[var(--status-danger)]">Supprimer mon compte</p>
                                <p className="text-[11px] text-[var(--status-danger)]/70">Toutes vos données personnelles seront effacées.</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--status-danger)] px-3 py-1.5 text-[12px] font-medium text-white">
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </span>
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action ne peut pas être annulée. Elle supprimera définitivement votre compte, vos
                                préférences et vous retirera de cette organisation.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-[var(--status-danger)] text-white hover:bg-[var(--status-danger)]/90">
                                Oui, supprimer mon compte
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </SettingsCard>
        </div>
    )
}

// ── API · Webhooks ───────────────────────────────────────────────────────────

function webhookUrl(): string {
    const base = process.env.NEXT_PUBLIC_CONVEX_URL || ""
    const site = base.replace(".convex.cloud", ".convex.site")
    return site ? `${site}/api/whatsapp/webhook` : "https://<deployment>.convex.site/api/whatsapp/webhook"
}

export function ApiWebhooksSection() {
    return (
        <SettingsCard
            icon={Webhook}
            title="API & Webhooks"
            description="Endpoint entrant WhatsApp et accès programmatique"
        >
            <div className="space-y-5">
                <WebhookBox
                    url={webhookUrl()}
                    verifiedAgo=""
                    label="Webhook entrant WhatsApp · auto-configuré"
                />
                <p className="text-[12px] leading-relaxed text-[var(--ink-500)]">
                    Chaque numéro est connecté via Meta Business Cloud API. Le webhook entrant est auto-configuré à la
                    connexion et chaque requête est vérifiée par signature <span className="font-mono">HMAC-SHA256</span>.
                </p>
                <div className="h-px bg-[var(--ink-100)]" />
                <Link
                    href="/docs/api"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-2 text-[12.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                >
                    <ArrowUpRight className="h-3.5 w-3.5" /> Documentation API
                </Link>
            </div>
        </SettingsCard>
    )
}

// ── Confidentialité ──────────────────────────────────────────────────────────

export function PrivacySection() {
    return (
        <SettingsCard
            icon={Shield}
            title="Confidentialité & RGPD"
            description="Conformité et gestion de vos données"
        >
            <div className="space-y-4 text-[13px] leading-relaxed text-[var(--ink-700)]">
                <p>
                    Les conversations et contacts sont stockés de façon chiffrée et restent la propriété de votre
                    organisation. Vous pouvez demander la suppression d&apos;un contact à tout moment depuis sa fiche, ce qui
                    efface ses données et son historique de messages.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/legal/privacy"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-2 text-[12.5px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                    >
                        <ArrowUpRight className="h-3.5 w-3.5" /> Politique de confidentialité
                    </Link>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-2 text-[12.5px] font-medium text-[var(--ink-soft)]">
                        Export RGPD des données · À venir
                    </span>
                </div>
            </div>
        </SettingsCard>
    )
}

// ── Apparence ────────────────────────────────────────────────────────────────

export function AppearanceSection() {
    return (
        <SettingsCard
            icon={Palette}
            title="Interface & apparence"
            description="Personnalisez votre environnement de travail"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <p className="text-[12px] font-medium text-[var(--ink-700)]">Thème</p>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative flex h-20 w-32 items-center justify-center rounded-xl border-2 border-[var(--ink-900)] bg-[var(--paper-warm)] p-2">
                                <div className="h-full w-full space-y-1 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] p-2">
                                    <div className="h-2 w-1/2 rounded-full bg-[var(--ink-200)]" />
                                    <div className="h-2 w-3/4 rounded-full bg-[var(--ink-200)]" />
                                </div>
                                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)]">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                </span>
                            </div>
                            <span className="text-[12px] font-medium text-[var(--ink-900)]">Clair</span>
                        </div>
                        <div className="flex cursor-not-allowed flex-col items-center gap-2 opacity-40">
                            <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-[var(--ink-700)] bg-[var(--ink-900)] p-2">
                                <div className="h-full w-full space-y-1 rounded-lg border border-[var(--ink-700)] bg-[var(--ink-700)] p-2">
                                    <div className="h-2 w-1/2 rounded-full bg-[var(--ink-500)]" />
                                    <div className="h-2 w-3/4 rounded-full bg-[var(--ink-500)]" />
                                </div>
                            </div>
                            <span className="text-[12px] font-medium text-[var(--ink-soft)]">Sombre (bientôt)</span>
                        </div>
                    </div>
                </div>
                <div className="h-px bg-[var(--ink-100)]" />
                <div className="space-y-2">
                    <p className="text-[12px] font-medium text-[var(--ink-700)]">Langue de l&apos;interface</p>
                    <div className="flex max-w-sm items-center justify-between rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3">
                        <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 text-[var(--ink-soft)]" />
                            <span className="text-[13.5px] font-medium text-[var(--ink-900)]">Français</span>
                        </div>
                        <span className="rounded-full bg-[var(--paper-white)] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                            Défaut
                        </span>
                    </div>
                </div>
            </div>
        </SettingsCard>
    )
}

// ── Deep-link sections (Équipe, Intégrations) ────────────────────────────────

export function DeepLinkSection({
    icon,
    title,
    description,
    href,
    cta,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    href: string
    cta: string
}) {
    return (
        <SettingsCard icon={icon} title={title} description={description}>
            <Link
                href={href}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)]"
            >
                {cta}
                <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
        </SettingsCard>
    )
}

export const DEEP_LINK_ICONS = { team: Users, integrations: Plug }
