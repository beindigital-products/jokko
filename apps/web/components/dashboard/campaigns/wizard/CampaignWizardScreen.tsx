"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/primitives/Icon"
import { WizardStepper } from "./WizardStepper"
import { WhatsAppPreview } from "./WhatsAppPreview"
import { StepName } from "./StepName"
import { StepTemplate } from "./StepTemplate"
import { StepAudience } from "./StepAudience"
import { StepVariables } from "./StepVariables"
import { StepSend } from "./StepSend"
import { StepReview } from "./StepReview"
import type { WizardState } from "./_shared"
import { cwFmt } from "./wizard-data"
import { fcfa } from "@/lib/dashboard/overview-data"
import type {
    CampaignWizardData,
    SendMode,
    TemplateCategory,
    TemplateVar,
    WizardStepId,
} from "./types"

/** Resolved campaign draft the host maps onto `broadcasts.create`. */
export interface CampaignCreateInput {
    name: string
    description: string
    /** Selected template id (the WizardTemplate.id = real template `_id`). */
    templateId: string
    /** Selected audience option id ("all" or a tag id). */
    segId: string
    /** Selected sending channel id (the SendingNumber.id = channel `_id`). */
    numId: string
    mode: SendMode
    /** YYYY-MM-DD + HH:MM — only meaningful when `mode === "scheduled"`. */
    date: string
    time: string
}

interface CampaignWizardScreenProps {
    data: CampaignWizardData
    /** Modal visibility. */
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Start the wizard on a given step (Storybook / deep-link). */
    initialStep?: WizardStepId
    /** Owner can pick the sending number; others are locked to the first. */
    role?: "OWNER" | "ADMIN" | "AGENT"
    /** Persist the campaign (step 6 confirm). Return false to keep the modal open on error. */
    onCreate?: (input: CampaignCreateInput) => boolean | void | Promise<boolean | void>
}

/** Centered modal shell (backdrop + bounded paper card). */
function WizardOverlay({
    onClose,
    width,
    children,
}: {
    onClose: () => void
    width: number
    children: React.ReactNode
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Fermer"
                onClick={onClose}
                className="absolute inset-0 bg-[var(--ink-900)]/30 backdrop-blur-[1.5px]"
            />
            <div
                className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-2xl"
                style={{ maxWidth: width }}
            >
                {children}
            </div>
        </div>
    )
}

/** Per-step head (eyebrow + title + sub) shown under the page header. */
const HEADS: Record<WizardStepId, { eb: string; t: string; s: string }> = {
    1: {
        eb: "Étape 1 · objectif",
        t: "Nommez votre campagne",
        s: "Donnez-lui un nom interne et choisissez la catégorie Meta — elle détermine les modèles et la tarification.",
    },
    2: {
        eb: "Étape 2 · modèle",
        t: "Choisissez un modèle approuvé",
        s: "Seuls les modèles approuvés par Meta dans cette catégorie peuvent être diffusés.",
    },
    3: {
        eb: "Étape 3 · audience",
        t: "Sélectionnez l’audience",
        s: "Les contacts sans consentement, en doublon ou hors fenêtre sont automatiquement exclus.",
    },
    4: {
        eb: "Étape 4 · variables",
        t: "Renseignez les variables",
        s: "Associez chaque variable du modèle à un champ contact ou une valeur fixe.",
    },
    5: {
        eb: "Étape 5 · envoi",
        t: "Planifiez l’envoi",
        s: "Choisissez le numéro émetteur et le moment de diffusion.",
    },
    6: {
        eb: "Étape 6 · récap",
        t: "Vérifiez puis confirmez",
        s: "Un dernier coup d’œil avant la mise en file d’attente.",
    },
}

/**
 * CampaignWizardScreen — the interactive v3 campaign-creation flow as a page:
 * Objectif → Modèle → Audience → Variables → Envoi → Récap. The shell owns all
 * draft state, derives the audience / cost / balance numbers, and passes
 * state + setters to each step. A persistent right rail shows the live WhatsApp
 * preview and a running summary. Confirming at step 6 reveals the success
 * screen. Recreates the design's `CampaignWizard`.
 */
export function CampaignWizardScreen({
    data,
    open,
    onOpenChange,
    initialStep = 1,
    role = "OWNER",
    onCreate,
}: CampaignWizardScreenProps) {
    const [step, setStep] = useState<WizardStepId | "success">(initialStep)
    const [maxStep, setMaxStep] = useState<WizardStepId>(initialStep)
    const [submitting, setSubmitting] = useState(false)
    const [name, setName] = useState(data.initial.name)
    const [desc, setDesc] = useState(data.initial.desc)
    const [cat, setCat] = useState<TemplateCategory>(data.initial.cat)
    const [tplId, setTplId] = useState(data.initial.tplId)
    const [segId, setSegId] = useState(data.initial.segId)
    const [vars, setVars] = useState<TemplateVar[]>(() => {
        const t = data.templates.find((x) => x.id === data.initial.tplId)
        return (t?.vars ?? []).map((v) => ({ ...v }))
    })
    const [mode, setMode] = useState<SendMode>(data.initial.mode)
    const [date, setDate] = useState(data.initial.date)
    const [time, setTime] = useState(data.initial.time)
    const [numId, setNumId] = useState(data.initial.numId)

    const goStep = (n: WizardStepId) => {
        setStep(n)
        setMaxStep((m) => (n > m ? n : m))
    }
    const next = () => {
        if (typeof step === "number") goStep(Math.min(6, step + 1) as WizardStepId)
    }
    const back = () => {
        if (typeof step === "number") setStep(Math.max(1, step - 1) as WizardStepId)
    }

    const templatesInCat = data.templates.filter((t) => t.cat === cat)
    const tpl = data.templates.find((t) => t.id === tplId) ?? templatesInCat[0]
    const seg = data.segments.find((s) => s.id === segId) ?? data.segments[0]

    const selectTpl = (id: string) => {
        setTplId(id)
        const t = data.templates.find((x) => x.id === id)
        setVars((t?.vars ?? []).map((v) => ({ ...v })))
    }
    // Changing category snaps the template selection into that category.
    const selectCat = (c: TemplateCategory) => {
        setCat(c)
        const first = data.templates.find((t) => t.cat === c)
        if (first && tpl.cat !== c) selectTpl(first.id)
    }
    const setVar = (i: number, patch: Partial<TemplateVar>) =>
        setVars((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)))

    const eligible = seg.total - seg.excluded
    const perConv = data.price[cat]
    const cost = eligible * perConv
    const after = data.balance - cost
    const ok = after >= 0

    const { dateLabel, dateShort } = useMemo(() => {
        try {
            const d = new Date(date + "T00:00:00")
            return {
                dateLabel: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
                dateShort: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
            }
        } catch {
            return { dateLabel: date, dateShort: date }
        }
    }, [date])

    const state: WizardState = {
        data,
        role,
        name,
        desc,
        cat,
        tplId,
        segId,
        vars,
        mode,
        date,
        time,
        numId,
        setName,
        setDesc,
        selectCat,
        selectTpl,
        setSegId,
        setVar,
        setMode,
        setDate,
        setTime,
        setNumId,
        eligible,
        perConv,
        cost,
        after,
        ok,
        dateShort,
        dateLabel,
    }

    if (!open) return null
    const close = () => onOpenChange(false)

    const confirm = async () => {
        if (!ok || submitting) return
        if (!onCreate) {
            setStep("success")
            return
        }
        setSubmitting(true)
        try {
            const res = await onCreate({ name, description: desc, templateId: tplId, segId, numId, mode, date, time })
            if (res !== false) setStep("success")
        } finally {
            setSubmitting(false)
        }
    }

    // ── Success screen ────────────────────────────────────────────────────
    if (step === "success") {
        const reset = () => {
            setStep(1)
            setMaxStep(1)
        }
        return (
            <WizardOverlay onClose={close} width={560}>
                <SuccessScreen
                    mode={mode}
                    name={name}
                    eligible={eligible}
                    cost={cost}
                    dateShort={dateShort}
                    time={time}
                    onReset={reset}
                    onClose={close}
                />
            </WizardOverlay>
        )
    }

    const head = HEADS[step]
    const sendCta =
        mode === "now" ? "Envoyer maintenant" : `Planifier · ${dateShort} ${time}`

    return (
        <WizardOverlay onClose={close} width={980}>
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--ink-100)] px-6 pb-4 pt-5">
                <div className="min-w-0">
                    <div className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        {head.eb}
                    </div>
                    <h2 className="mt-1 font-editorial text-[24px] leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                        {head.t}
                    </h2>
                    <p className="mt-1.5 max-w-[520px] text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{head.s}</p>
                </div>
                <button
                    type="button"
                    aria-label="Fermer"
                    onClick={close}
                    className="-mr-1 rounded-lg p-1.5 text-[var(--ink-400)] transition hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]"
                >
                    <Icon name="close" size={16} />
                </button>
            </div>

            <WizardStepper current={step} maxStep={maxStep} onStepClick={goStep} />

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid gap-6 px-6 py-5" style={{ gridTemplateColumns: "minmax(0, 1fr) 312px" }}>
                    {/* Left — active step */}
                    <div className="min-w-0">
                        {step === 1 ? <StepName {...state} /> : null}
                        {step === 2 ? <StepTemplate {...state} /> : null}
                        {step === 3 ? <StepAudience {...state} /> : null}
                        {step === 4 ? <StepVariables {...state} /> : null}
                        {step === 5 ? <StepSend {...state} /> : null}
                        {step === 6 ? <StepReview {...state} /> : null}
                    </div>

                    {/* Right — persistent preview + summary rail */}
                    <SummaryRail state={state} tpl={tpl} />
                </div>
            </div>

            {/* Footer nav */}
            <div className="flex shrink-0 items-center justify-between gap-2.5 border-t border-[var(--ink-200)] bg-[var(--paper-warm)] px-[18px] py-3.5">
                <Button variant="ghost" onClick={close}>
                    Sauvegarder en brouillon
                </Button>
                <div className="flex items-center gap-2">
                    {step > 1 ? (
                        <Button variant="outline" onClick={back}>
                            <Icon name="chevron-left" size={16} />
                            Précédent
                        </Button>
                    ) : null}
                    {step < 6 ? (
                        <Button variant="accent" onClick={next}>
                            Continuer
                            <Icon name="chevron-right" size={16} />
                        </Button>
                    ) : (
                        <Button
                            variant={ok ? "accent" : "secondary"}
                            disabled={!ok || submitting}
                            onClick={confirm}
                        >
                            <Icon name="send" size={16} />
                            {sendCta}
                        </Button>
                    )}
                </div>
            </div>
        </WizardOverlay>
    )
}

// ── Right rail ────────────────────────────────────────────────────────────
function SummaryRail({ state, tpl }: { state: WizardState; tpl: CampaignWizardData["templates"][number] }) {
    const { mode, dateShort, time, eligible, cost, ok, vars, data } = state
    const summary = [
        { k: "Modèle", v: tpl.name, mono: false },
        { k: "Audience", v: cwFmt(eligible), mono: true },
        { k: "Envoi", v: mode === "now" ? "Maintenant" : `${dateShort} · ${time}`, mono: false },
        { k: "Coût est.", v: fcfa(cost), mono: true },
    ]
    return (
        <div className="flex min-w-0 flex-col gap-3">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Aperçu WhatsApp
            </div>
            <WhatsAppPreview template={tpl} variables={vars} />

            <div className="mt-0.5 flex flex-col gap-[9px] rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-3">
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Récapitulatif
                </div>
                {summary.map((r) => (
                    <div key={r.k} className="flex items-baseline justify-between gap-2.5">
                        <span className="whitespace-nowrap text-[12px] text-[var(--ink-soft)]">{r.k}</span>
                        <span
                            className="min-w-0 truncate whitespace-nowrap text-right text-[12.5px] font-medium text-[var(--ink-900)]"
                            style={{ fontFamily: r.mono ? "var(--font-mono)" : "inherit" }}
                        >
                            {r.v}
                        </span>
                    </div>
                ))}
                <div className="my-px h-px bg-[var(--ink-200)]" />
                <div className="flex items-baseline justify-between">
                    <span className="whitespace-nowrap text-[11.5px] text-[var(--ink-soft)]">Crédit dispo</span>
                    <span
                        className="font-mono text-[11.5px] tabular-nums"
                        style={{ color: ok ? "var(--status-good)" : "var(--status-danger)" }}
                    >
                        {fcfa(data.balance)}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ── Success screen ──────────────────────────────────────────────────────────
function SuccessScreen({
    mode,
    name,
    eligible,
    cost,
    dateShort,
    time,
    onReset,
    onClose,
}: {
    mode: SendMode
    name: string
    eligible: number
    cost: number
    dateShort: string
    time: string
    onReset: () => void
    onClose?: () => void
}) {
    const stats = [
        { k: "Audience", v: cwFmt(eligible) },
        { k: "Coût estimé", v: fcfa(cost) },
        { k: "Démarrage", v: mode === "now" ? "Maintenant" : `${dateShort} · ${time}` },
    ]
    return (
        <div className="w-full px-9 py-9">
            <div className="w-full max-w-[560px]">
                <div className="text-center">
                    <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ background: "rgba(19,138,78,0.12)" }}
                    >
                        <Icon name={mode === "now" ? "send" : "clock"} size={30} color="var(--status-good)" strokeWidth={2} />
                    </div>
                    <h2 className="mt-[18px] font-display text-[28px] font-bold tracking-[-0.01em] text-[var(--ink-900)]">
                        {mode === "now" ? "Campagne en cours d’envoi" : "Campagne planifiée"}
                    </h2>
                    <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] leading-[1.5] text-[var(--ink-500)]">
                        {mode === "now"
                            ? `« ${name} » est en file d’attente pour ${cwFmt(eligible)} contacts. La livraison démarre maintenant.`
                            : `« ${name} » démarrera le ${dateShort} à ${time}. Vous pouvez encore la modifier jusqu’à l’envoi.`}
                    </p>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-3 border-y border-[var(--ink-200)] py-4">
                    {stats.map((m) => (
                        <div key={m.k} className="text-center">
                            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                                {m.k}
                            </div>
                            <div className="mt-1.5 font-display text-[22px] font-medium tabular-nums tracking-[-0.01em] text-[var(--ink-900)]">
                                {m.v}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-center gap-2.5">
                    <Button variant="outline" onClick={onReset}>
                        <Icon name="plus" size={16} />
                        Créer une autre
                    </Button>
                    <Button variant="accent" onClick={onClose}>
                        Voir la campagne
                        <Icon name="arrow-right" size={16} />
                    </Button>
                </div>
            </div>
        </div>
    )
}
