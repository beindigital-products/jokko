"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { Bot, Briefcase, Building2, Clock, Link as LinkIcon, MapPin, Zap } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneInput } from "@/components/contacts/PhoneInput"
import { cn } from "@/lib/utils"
import { Field, SaveButton, SettingRow, SettingsCard } from "../_components/settings-card"

const TIMEZONES = [
    { value: "Africa/Dakar", label: "Dakar (GMT+0)" },
    { value: "Africa/Abidjan", label: "Abidjan (GMT+0)" },
    { value: "Africa/Lagos", label: "Lagos (GMT+1)" },
    { value: "Africa/Douala", label: "Douala (GMT+1)" },
    { value: "Africa/Casablanca", label: "Casablanca (GMT+1)" },
    { value: "Europe/Paris", label: "Paris (GMT+1)" },
    { value: "Africa/Johannesburg", label: "Johannesburg (GMT+2)" },
    { value: "Africa/Nairobi", label: "Nairobi (GMT+3)" },
    { value: "Europe/London", label: "Londres (GMT+0)" },
    { value: "America/New_York", label: "New York (GMT-5)" },
]

const DAYS = [
    { key: "monday", label: "Lundi" },
    { key: "tuesday", label: "Mardi" },
    { key: "wednesday", label: "Mercredi" },
    { key: "thursday", label: "Jeudi" },
    { key: "friday", label: "Vendredi" },
    { key: "saturday", label: "Samedi" },
    { key: "sunday", label: "Dimanche" },
]

type BusinessHour = { enabled: boolean; open: string; close: string }
type StoredBusinessHours = {
    schedule?: { day?: string; enabled?: boolean; start?: string; end?: string }[]
} & Record<string, unknown>

function isBusinessHour(value: unknown): value is BusinessHour {
    return typeof value === "object" && value !== null
}

const DEFAULT_BUSINESS_HOURS: Record<string, BusinessHour> = {
    monday: { enabled: true, open: "08:00", close: "18:00" },
    tuesday: { enabled: true, open: "08:00", close: "18:00" },
    wednesday: { enabled: true, open: "08:00", close: "18:00" },
    thursday: { enabled: true, open: "08:00", close: "18:00" },
    friday: { enabled: true, open: "08:00", close: "18:00" },
    saturday: { enabled: false, open: "09:00", close: "13:00" },
    sunday: { enabled: false, open: "09:00", close: "13:00" },
}

const iconInputClass = "h-9 rounded-l-none"
function IconBox({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
    return (
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-[var(--ink-soft)]">
            <Icon className="h-3.5 w-3.5" />
        </span>
    )
}

export function OrganizationSection() {
    const orgSettings = useQuery(api.organizations.getOrgSettings)
    const updateOrg = useMutation(api.organizations.updateOrganization)
    const updateSettings = useMutation(api.organizations.updateOrgSettings)
    const assignmentSettings = useQuery(api.assignments.getAssignmentSettings)
    const updateAssignment = useMutation(api.assignments.updateAssignmentSettings)

    const [orgName, setOrgName] = useState("")
    const [sector, setSector] = useState("")
    const [website, setWebsite] = useState("")
    const [orgPhone, setOrgPhone] = useState("")
    const [address, setAddress] = useState("")
    const [timezone, setTimezone] = useState("")
    const [orgInitialized, setOrgInitialized] = useState(false)

    const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
    const [autoReplyMessage, setAutoReplyMessage] = useState("")
    const [autoReplyInitialized, setAutoReplyInitialized] = useState(false)

    const [businessHours, setBusinessHours] = useState(DEFAULT_BUSINESS_HOURS)
    const [hoursInitialized, setHoursInitialized] = useState(false)

    const [autoAssignEnabled, setAutoAssignEnabled] = useState(true)
    const [maxConcurrentChats, setMaxConcurrentChats] = useState(5)
    const [excludeOfflineAgents, setExcludeOfflineAgents] = useState(true)
    const [assignmentInitialized, setAssignmentInitialized] = useState(false)

    const [savingOrg, setSavingOrg] = useState(false)
    const [savingSettings, setSavingSettings] = useState(false)
    const [savingAssignment, setSavingAssignment] = useState(false)

    if (orgSettings && !orgInitialized) {
        setOrgName(orgSettings.name || "")
        setSector(orgSettings.businessSector || "")
        setWebsite(orgSettings.website || "")
        setOrgPhone(orgSettings.phone || "")
        setAddress(orgSettings.address || "")
        setTimezone(orgSettings.timezone || "Africa/Dakar")
        setOrgInitialized(true)
    }

    if (orgSettings?.settings && !autoReplyInitialized) {
        setAutoReplyEnabled(orgSettings.settings.autoReplyEnabled || false)
        setAutoReplyMessage(
            orgSettings.settings.autoReplyMessage ||
                "Merci pour votre message. Un agent vous répondra dans les plus brefs délais.",
        )
        setAutoReplyInitialized(true)
    }

    if (orgSettings?.settings && !hoursInitialized) {
        if (orgSettings.settings.businessHours) {
            const bh = orgSettings.settings.businessHours as StoredBusinessHours
            if (bh?.schedule) {
                const converted = { ...DEFAULT_BUSINESS_HOURS }
                for (const item of bh.schedule) {
                    if (item.day && converted[item.day]) {
                        converted[item.day] = {
                            enabled: item.enabled ?? false,
                            open: item.start || "08:00",
                            close: item.end || "18:00",
                        }
                    }
                }
                setBusinessHours(converted)
            } else {
                const converted = { ...DEFAULT_BUSINESS_HOURS }
                for (const day of Object.keys(DEFAULT_BUSINESS_HOURS)) {
                    const value = bh[day]
                    if (isBusinessHour(value)) converted[day] = { ...converted[day], ...value }
                }
                setBusinessHours(converted)
            }
        }
        setHoursInitialized(true)
    }

    if (assignmentSettings && !assignmentInitialized) {
        setAutoAssignEnabled(assignmentSettings.autoAssignEnabled ?? true)
        setMaxConcurrentChats(assignmentSettings.maxConcurrentChats ?? 5)
        setExcludeOfflineAgents(assignmentSettings.excludeOfflineAgents ?? true)
        setAssignmentInitialized(true)
    }

    const handleSaveOrg = async () => {
        try {
            setSavingOrg(true)
            await updateOrg({
                name: orgName,
                businessSector: sector,
                website: website || undefined,
                phone: orgPhone || undefined,
                address: address || undefined,
                timezone,
            })
            toast.success("Organisation mise à jour")
        } catch {
            toast.error("Impossible de mettre à jour l'organisation.")
        } finally {
            setSavingOrg(false)
        }
    }

    const handleSaveSettings = async () => {
        try {
            setSavingSettings(true)
            await updateSettings({
                autoReplyEnabled,
                autoReplyMessage,
                businessHours: {
                    enabled: Object.values(businessHours).some((d) => d.enabled),
                    schedule: Object.entries(businessHours).map(([day, cfg]) => ({
                        day,
                        enabled: cfg.enabled,
                        start: cfg.open,
                        end: cfg.close,
                    })),
                },
            })
            toast.success("Paramètres mis à jour")
        } catch {
            toast.error("Impossible de mettre à jour les paramètres.")
        } finally {
            setSavingSettings(false)
        }
    }

    const handleSaveAssignment = async () => {
        try {
            setSavingAssignment(true)
            await updateAssignment({ autoAssignEnabled, maxConcurrentChats, excludeOfflineAgents })
            toast.success("Règles d'attribution mises à jour")
        } catch {
            toast.error("Impossible de mettre à jour les règles d'attribution.")
        } finally {
            setSavingAssignment(false)
        }
    }

    const updateDayHours = <F extends keyof BusinessHour>(day: string, field: F, value: BusinessHour[F]) => {
        setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
    }

    if (!orgSettings) {
        return <div className="h-64 animate-pulse rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)]" />
    }

    return (
        <div className="space-y-5">
            <SettingsCard
                icon={Building2}
                title="Profil de l'organisation"
                description="Informations générales de votre entreprise"
                footer={<SaveButton onClick={handleSaveOrg} loading={savingOrg} />}
            >
                <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nom de l'organisation" htmlFor="org-name">
                        <div className="flex">
                            <IconBox icon={Building2} />
                            <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Nom de votre entreprise" className={iconInputClass} />
                        </div>
                    </Field>
                    <Field label="Secteur d'activité" htmlFor="org-sector">
                        <div className="flex">
                            <IconBox icon={Briefcase} />
                            <Input id="org-sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ex : E-commerce, Santé…" className={iconInputClass} />
                        </div>
                    </Field>
                    <Field label="Site web" htmlFor="org-website">
                        <div className="flex">
                            <IconBox icon={LinkIcon} />
                            <Input id="org-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://votresite.com" className={iconInputClass} />
                        </div>
                    </Field>
                    <Field label="Téléphone" htmlFor="org-phone">
                        <PhoneInput id="org-phone" value={orgPhone} onChange={setOrgPhone} placeholder="+221 77 123 45 67" />
                    </Field>
                    <Field label="Adresse" htmlFor="org-address">
                        <div className="flex">
                            <IconBox icon={MapPin} />
                            <Input id="org-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse de votre entreprise" className={iconInputClass} />
                        </div>
                    </Field>
                    <Field label="Fuseau horaire" htmlFor="org-timezone">
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Sélectionnez un fuseau horaire" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value} className="text-sm">
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </SettingsCard>

            <SettingsCard
                icon={Bot}
                title="Réponse automatique"
                description="Message envoyé quand aucun agent n'est disponible"
                headerRight={<Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />}
                footer={<SaveButton onClick={handleSaveSettings} loading={savingSettings} />}
            >
                {autoReplyEnabled ? (
                    <Field
                        label="Message de réponse automatique"
                        htmlFor="auto-reply-msg"
                        hint="Envoyé aux clients en dehors des horaires d'ouverture ou quand aucun agent n'est en ligne."
                    >
                        <Textarea
                            id="auto-reply-msg"
                            value={autoReplyMessage}
                            onChange={(e) => setAutoReplyMessage(e.target.value)}
                            rows={3}
                            className="resize-none text-sm"
                        />
                    </Field>
                ) : (
                    <p className="text-[13px] text-[var(--ink-soft)]">Activez la réponse automatique pour configurer le message.</p>
                )}
            </SettingsCard>

            <SettingsCard
                icon={Clock}
                title="Horaires d'ouverture"
                description="Définissez les heures de disponibilité de votre équipe"
                footer={<SaveButton onClick={handleSaveSettings} loading={savingSettings}>Enregistrer les horaires</SaveButton>}
            >
                <div className="divide-y divide-[var(--ink-100)]">
                    {DAYS.map((day) => {
                        const cfg = businessHours[day.key]
                        return (
                            <div key={day.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                <div className="flex min-w-[130px] items-center gap-3">
                                    <Switch checked={cfg?.enabled ?? false} onCheckedChange={(c) => updateDayHours(day.key, "enabled", c)} />
                                    <span className={cn("text-[13.5px] font-medium", cfg?.enabled ? "text-[var(--ink-900)]" : "text-[var(--ink-soft)]")}>
                                        {day.label}
                                    </span>
                                </div>
                                {cfg?.enabled ? (
                                    <div className="flex items-center gap-2">
                                        <Input type="time" value={cfg.open || "08:00"} onChange={(e) => updateDayHours(day.key, "open", e.target.value)} className="h-8 w-28 text-xs" />
                                        <span className="text-xs text-[var(--ink-soft)]">à</span>
                                        <Input type="time" value={cfg.close || "18:00"} onChange={(e) => updateDayHours(day.key, "close", e.target.value)} className="h-8 w-28 text-xs" />
                                    </div>
                                ) : (
                                    <span className="font-mono text-[11px] text-[var(--ink-soft)]">Fermé</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </SettingsCard>

            <SettingsCard
                icon={Zap}
                title="Attribution automatique"
                description="Distribuer les conversations aux agents disponibles"
                headerRight={<Switch checked={autoAssignEnabled} onCheckedChange={setAutoAssignEnabled} />}
                footer={<SaveButton onClick={handleSaveAssignment} loading={savingAssignment}>Enregistrer les règles</SaveButton>}
            >
                {autoAssignEnabled ? (
                    <div className="space-y-5">
                        <Field label="Conversations simultanées max par agent" htmlFor="max-chats" hint="Limite le nombre de conversations actives qu'un agent gère en parallèle.">
                            <Input
                                id="max-chats"
                                type="number"
                                min={1}
                                max={50}
                                value={maxConcurrentChats}
                                onChange={(e) => setMaxConcurrentChats(parseInt(e.target.value) || 5)}
                                className="h-9 w-24 text-sm"
                            />
                        </Field>
                        <div className="h-px bg-[var(--ink-100)]" />
                        <SettingRow
                            title="Exclure les agents hors ligne"
                            description="Ne pas attribuer de conversations aux agents qui ne sont pas en ligne."
                            control={<Switch checked={excludeOfflineAgents} onCheckedChange={setExcludeOfflineAgents} />}
                        />
                    </div>
                ) : (
                    <p className="text-[13px] text-[var(--ink-soft)]">Activez l&apos;attribution automatique pour configurer les règles.</p>
                )}
            </SettingsCard>
        </div>
    )
}
