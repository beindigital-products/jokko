"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { CalendarIcon, Download } from "lucide-react"
import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    subMonths,
} from "date-fns"
import { fr } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import Papa from "papaparse"

import { api } from "@/convex/_generated/api"
import { AnalyticsScreen } from "@/components/dashboard/analytics"
import { mapAnalytics, type DashboardStats } from "@/lib/dashboard/analytics-data"
import { FeatureGate } from "@/components/billing/feature-gate"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<string, string> = { OWNER: "Propriétaire", ADMIN: "Admin", AGENT: "Agent" }

interface DatePreset {
    label: string
    getValue: () => { from: Date; to: Date }
}

const DATE_PRESETS: DatePreset[] = [
    { label: "Aujourd’hui", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: "Hier", getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
    { label: "Les 7 derniers jours", getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
    { label: "Les 14 derniers jours", getValue: () => ({ from: startOfDay(subDays(new Date(), 13)), to: endOfDay(new Date()) }) },
    { label: "Les 30 derniers jours", getValue: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
    { label: "Ce mois-ci", getValue: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
    { label: "Le mois dernier", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
]

/** v3 header button look (mirrors shell/HeaderButton default variant). */
const HEADER_BTN =
    "inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"

function DateControl({
    dateRange,
    activePreset,
    onChange,
}: {
    dateRange: { from: Date; to: Date }
    activePreset: string
    onChange: (range: { from: Date; to: Date }, preset: string) => void
}) {
    const [open, setOpen] = useState(false)
    const label =
        activePreset ||
        `${format(dateRange.from, "d MMM", { locale: fr })} – ${format(dateRange.to, "d MMM", { locale: fr })}`

    const handleCalendar = (range: DateRange | undefined) => {
        if (!range?.from) return
        onChange(
            { from: startOfDay(range.from), to: range.to ? endOfDay(range.to) : endOfDay(range.from) },
            "",
        )
        if (range.to) setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className={HEADER_BTN}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {label}
            </PopoverTrigger>
            <PopoverContent className="flex w-auto flex-col p-0 sm:flex-row" align="end" sideOffset={8}>
                <div className="border-b border-[var(--ink-100)] p-3 sm:w-48 sm:border-b-0 sm:border-r">
                    <div className="space-y-0.5">
                        {DATE_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => {
                                    onChange(preset.getValue(), preset.label)
                                    setOpen(false)
                                }}
                                className={cn(
                                    "w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs transition-colors",
                                    activePreset === preset.label
                                        ? "bg-[var(--accent-muted)] font-semibold text-[var(--accent)]"
                                        : "text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-2">
                    <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={handleCalendar}
                        locale={fr}
                        disabled={{ after: new Date() }}
                        captionLayout="dropdown"
                        defaultMonth={dateRange.from}
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}

function AnalyticsScreenSkeleton() {
    return (
        <div className="flex h-full w-full flex-col bg-[var(--paper-white)]">
            <div className="border-b border-[var(--ink-200)] px-8 pb-5 pt-7">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-2 h-7 w-44" />
                <Skeleton className="mt-2 h-4 w-96" />
            </div>
            <div className="flex-1 space-y-5 bg-[var(--paper-warm)]/30 px-7 pt-10">
                <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[110px] rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-5 lg:grid-cols-3">
                    <Skeleton className="h-[280px] rounded-xl lg:col-span-2" />
                    <Skeleton className="h-[280px] rounded-xl" />
                </div>
            </div>
        </div>
    )
}

function AccessDenied() {
    return (
        <div className="flex h-full w-full items-center justify-center bg-[var(--paper-white)] p-8">
            <div className="max-w-sm text-center">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                    Accès refusé
                </p>
                <h1 className="mt-1 font-display text-[22px] font-bold tracking-tight text-[var(--ink-900)]">
                    Réservé à l&apos;équipe d&apos;administration
                </h1>
                <p className="mt-2 text-sm text-[var(--ink-500)]">
                    Vous n&apos;avez pas les autorisations nécessaires pour consulter les statistiques.
                </p>
            </div>
        </div>
    )
}

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState(() => ({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    }))
    const [activePreset, setActivePreset] = useState("Les 30 derniers jours")

    const role = useQuery(api.users.currentUserRole)
    const stats = useQuery(api.analytics.getDashboardStats, {
        startDate: dateRange.from.getTime(),
        endDate: dateRange.to.getTime(),
    })

    if (role === undefined) return <AnalyticsScreenSkeleton />
    if (role === "AGENT") return <AccessDenied />
    if (!stats) return <AnalyticsScreenSkeleton />

    const data = mapAnalytics(stats as unknown as DashboardStats)
    const periodLabel =
        activePreset ||
        `${format(dateRange.from, "d MMM", { locale: fr })} – ${format(dateRange.to, "d MMM yyyy", { locale: fr })}`

    const handleExport = () => {
        const agents = stats.agents ?? []
        if (agents.length === 0) return
        const csv = Papa.unparse(
            agents.map((a) => ({
                Nom: a.name,
                Rôle: ROLE_LABELS[a.role] || a.role,
                "Messages envoyés": a.messagesCount,
                "Conv. traitées": a.handledConversations ?? 0,
                "Attributions en cours": a.conversationsCount,
                Réponses: a.responseCount ?? 0,
                "Temps de réponse moy.": a.avgResponseTime,
            })),
        )
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute(
            "download",
            `analytics_agents_${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}.csv`,
        )
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <FeatureGate feature="advancedStats">
            <AnalyticsScreen
                data={data}
                eyebrow={`Insights · ${periodLabel}`}
                actions={
                    <>
                        <DateControl
                            dateRange={dateRange}
                            activePreset={activePreset}
                            onChange={(range, preset) => {
                                setDateRange(range)
                                setActivePreset(preset)
                            }}
                        />
                        <button type="button" onClick={handleExport} className={HEADER_BTN}>
                            <Download className="h-3.5 w-3.5" />
                            Exporter
                        </button>
                    </>
                }
            />
        </FeatureGate>
    )
}
