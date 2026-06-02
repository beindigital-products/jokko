"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/primitives/Icon"
import { PageHeader } from "../../shell/PageHeader"
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
import type {
    CampaignWizardData,
    SendMode,
    TemplateCategory,
    TemplateVar,
    WizardStepId,
} from "./types"

interface CampaignWizardScreenProps {
    data: CampaignWizardData
    /** Start the wizard on a given step (Storybook / deep-link). */
    initialStep?: WizardStepId
    /** Owner can pick the sending number; others are locked to the first. */
    role?: "OWNER" | "ADMIN" | "AGENT"
    /** Called when the campaign is queued (after the success screen's CTAs). */
    onClose?: () => void
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
    initialStep = 1,
    role = "OWNER",
    onClose,
}: CampaignWizardScreenProps) {
    const [step, setStep] = useState<WizardStepId | "success">(initialStep)
    const [maxStep, setMaxStep] = useState<WizardStepId>(initialStep)
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

    // ── Success screen ────────────────────────────────────────────────────
    if (step === "success") {
        const reset = () => {
            setStep(1)
            setMaxStep(1)
        }
        return (
            <SuccessScreen
                mode={mode}
                name={name}
                eligible={eligible}
                cost={cost}
                dateShort={dateShort}
                time={time}
                onReset={reset}
                onClose={onClose}
            />
        )
    }

    const head = HEADS[step]
    const sendCta =
        mode === "now" ? "Envoyer maintenant" : `Planifier · ${dateShort} ${time}`

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader eyebrow={head.eb} title={head.t} description={head.s} />

            <WizardStepper current={step} maxStep={maxStep} onStepClick={goStep} />

            <div className="flex-1 overflow-y-auto">
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
                <Button variant="ghost" onClick={onClose}>
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
                            disabled={!ok}
                            onClick={() => ok && setStep("success")}
                        >
                            <Icon name="send" size={16} />
                            {sendCta}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Right rail ────────────────────────────────────────────────────────────
function SummaryRail({ state, tpl }: { state: WizardState; tpl: CampaignWizardData["templates"][number] }) {
    const { mode, dateShort, time, eligible, cost, ok, vars, data } = state
    const summary = [
        { k: "Modèle", v: tpl.name, mono: false },
        { k: "Audience", v: cwFmt(eligible), mono: true },
        { k: "Envoi", v: mode === "now" ? "Maintenant" : `${dateShort} · ${time}`, mono: false },
        { k: "Coût est.", v: `€${cost.toFixed(2)}`, mono: true },
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
                        €{data.balance.toFixed(2)}
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
        { k: "Coût estimé", v: `€${cost.toFixed(2)}` },
        { k: "Démarrage", v: mode === "now" ? "Maintenant" : `${dateShort} · ${time}` },
    ]
    return (
        <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-[var(--paper-white)] px-6 py-10">
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
