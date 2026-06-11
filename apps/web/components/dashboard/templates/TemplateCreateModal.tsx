"use client"

import { useMemo, useState, type ComponentType, type ReactNode } from "react"
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    FileText,
    HelpCircle,
    Image as ImageIcon,
    KeyRound,
    Loader2,
    Lock,
    Megaphone,
    Minus,
    Paperclip,
    Phone,
    Plus,
    Reply,
    Send,
    ShieldCheck,
    Trash2,
    Type,
    Video,
    X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
    type ButtonType,
    type HeaderType,
    type TemplateCategory,
    type TemplateType,
} from "@/convex/lib/templateTypes"
import { validateTemplate } from "@/convex/lib/templateValidation"
import {
    WaChatFrame,
    WhatsAppBubble,
    highlightBody,
    type WaButton,
    type WaMedia,
} from "../primitives/WhatsAppBubble"
import { TemplateTypeGrid } from "./TemplateTypeGrid"
import { TextField, TextareaField } from "./form-controls"

// ── Payload contract (consumed by modeles/page.tsx) ─────────────────────────────

/** The structured payload handed to the page for a Convex `create`. */
export interface TemplateCreatePayload {
    type: TemplateType
    name: string
    language: string
    category: TemplateCategory
    header?: { type: HeaderType; text?: string; mediaUrl?: string }
    body: string
    /** One example value per `{{N}}` token, ordered by token number. */
    bodyExamples?: string[]
    footer?: string
    buttons: { type: ButtonType; text: string; value?: string }[]
}

// ── Wizard data (mirrors the design's TB_* constants) ───────────────────────────

const CATS = [
    { id: "MARKETING", label: "Marketing", Icon: Megaphone, desc: "Promos, nouveautés, réactivation", price: "€0.032" },
    { id: "UTILITY", label: "Utility", Icon: FileText, desc: "Confirmations, rappels, suivi", price: "€0.011" },
    { id: "AUTHENTICATION", label: "Authentification", Icon: KeyRound, desc: "Codes OTP à usage unique", price: "€0.030" },
] as const

const LANGS = [
    { code: "fr", label: "Français", flag: "FR" },
    { code: "en", label: "English", flag: "EN" },
    { code: "wo", label: "Wolof", flag: "WO" },
    { code: "es", label: "Español", flag: "ES" },
    { code: "ar", label: "العربية", flag: "AR" },
] as const

const HEADERS = [
    { id: "none", Icon: Minus, label: "Aucun" },
    { id: "text", Icon: Type, label: "Texte" },
    { id: "image", Icon: ImageIcon, label: "Image" },
    { id: "doc", Icon: FileText, label: "Document" },
    { id: "video", Icon: Video, label: "Vidéo" },
] as const
type HeaderSel = (typeof HEADERS)[number]["id"]

const BTN_TYPES = [
    { id: "quick_reply", Icon: Reply, label: "Réponse rapide" },
    { id: "url", Icon: ExternalLink, label: "Lien URL" },
    { id: "phone", Icon: Phone, label: "Appel" },
] as const
type BtnSel = (typeof BTN_TYPES)[number]["id"]

interface DraftButton {
    type: BtnSel
    label: string
    value: string
}

/** Template types fully covered by the wizard — the rest go to the advanced editor. */
const WIZARD_HANDLED: ReadonlySet<TemplateType> = new Set<TemplateType>([
    "TEXT",
    "MEDIA",
    "QUICK_REPLY",
    "CALL_TO_ACTION",
    "AUTHENTICATION",
])

const HEADER_TYPE: Record<Exclude<HeaderSel, "none">, HeaderType> = {
    text: "TEXT",
    image: "IMAGE",
    doc: "DOCUMENT",
    video: "VIDEO",
}

const BTN_BACKEND_TYPE: Record<BtnSel, ButtonType> = {
    quick_reply: "QUICK_REPLY",
    url: "URL",
    phone: "PHONE_NUMBER",
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Sorted, de-duplicated list of `{{N}}` token numbers in a body. */
function tbTokens(body: string): number[] {
    const out: number[] = []
    const re = /\{\{(\d+)\}\}/g
    let m: RegExpExecArray | null
    while ((m = re.exec(body)) !== null) {
        const n = parseInt(m[1], 10)
        if (!out.includes(n)) out.push(n)
    }
    return out.sort((a, b) => a - b)
}

/**
 * Pick the backend template type from the freeform wizard state so the rigid
 * {@link validateTemplate} always passes: CTA buttons → CALL_TO_ACTION, quick
 * replies → QUICK_REPLY, media header → MEDIA, text header → QUICK_REPLY (its
 * minButtons isn't enforced), otherwise TEXT.
 */
function deriveType(header: HeaderSel, buttons: DraftButton[]): TemplateType {
    const hasCTA = buttons.some((b) => b.type === "url" || b.type === "phone")
    const hasQuick = buttons.some((b) => b.type === "quick_reply")
    if (hasCTA) return "CALL_TO_ACTION"
    if (hasQuick) return "QUICK_REPLY"
    if (header === "image" || header === "video" || header === "doc") return "MEDIA"
    if (header === "text") return "QUICK_REPLY"
    return "TEXT"
}

function maxButtonsFor(buttons: DraftButton[]): number {
    return buttons.some((b) => b.type === "url" || b.type === "phone") ? 2 : 3
}

interface WizardState {
    name: string
    langCode: string
    cat: TemplateCategory
    header: HeaderSel
    headerText: string
    body: string
    footer: string
    buttons: DraftButton[]
    samples: Record<number, string>
}

function buildPayload(s: WizardState): TemplateCreatePayload {
    const tokens = tbTokens(s.body)
    const header =
        s.header === "none"
            ? undefined
            : s.header === "text"
              ? { type: HEADER_TYPE.text, text: s.headerText.trim() }
              : { type: HEADER_TYPE[s.header] }
    const buttons = s.buttons
        .filter((b) => b.label.trim())
        .map((b) => ({
            type: BTN_BACKEND_TYPE[b.type],
            text: b.label.trim(),
            value: b.type === "quick_reply" ? undefined : b.value.trim() || undefined,
        }))
    return {
        type: deriveType(s.header, s.buttons),
        name: s.name.trim(),
        language: s.langCode,
        category: s.cat,
        header,
        body: s.body,
        bodyExamples: tokens.map((t) => s.samples[t] || ""),
        footer: s.footer.trim() || undefined,
        buttons,
    }
}

/** Shape the payload the way {@link validateTemplate} reads buttons (url/phoneNumber). */
function toValidationInput(p: TemplateCreatePayload) {
    return {
        ...p,
        buttons: p.buttons.map((b) => ({
            type: b.type,
            text: b.text,
            url: b.type === "URL" ? b.value : undefined,
            phoneNumber: b.type === "PHONE_NUMBER" ? b.value : undefined,
        })),
    }
}

function previewMedia(header: HeaderSel, headerText: string): WaMedia | null {
    if (header === "image") return { kind: "image" }
    if (header === "video") return { kind: "video", duration: "0:18" }
    if (header === "doc") return { kind: "document", filename: `${headerText.trim() || "document"}.pdf`, pages: 2, size: "240 ko" }
    return null
}

function btnKind(type: BtnSel): WaButton["kind"] {
    if (type === "url") return "url"
    if (type === "phone") return "phone"
    return "reply"
}

// ── Small UI atoms ──────────────────────────────────────────────────────────────

const EYEBROW = "font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]"

function WLabel({ children, hint }: { children: ReactNode; hint?: string }) {
    return (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-[12px] font-medium text-[var(--ink-700)]">{children}</span>
            {hint ? <span className="truncate text-[11px] text-[var(--ink-soft)]">{hint}</span> : null}
        </div>
    )
}

function SelectCard({
    on,
    onClick,
    className,
    children,
}: {
    on: boolean
    onClick: () => void
    className?: string
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-[10px] border text-left transition",
                on
                    ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                    : "border-[var(--ink-200)] bg-[var(--paper-white)] hover:border-[var(--ink-300)]",
                className,
            )}
        >
            {children}
        </button>
    )
}

function Stepper({
    steps,
    step,
    maxStep,
    onJump,
}: {
    steps: { id: number; l: string }[]
    step: number
    maxStep: number
    onJump: (id: number) => void
}) {
    return (
        <div className="flex gap-1.5 border-b border-[var(--ink-100)] px-6 py-3">
            {steps.map((s, i) => {
                const done = s.id < step
                const cur = s.id === step
                const reach = s.id <= maxStep
                return (
                    <div key={s.id} className="flex flex-1 items-center gap-1.5">
                        <button
                            type="button"
                            disabled={!reach}
                            onClick={() => reach && onJump(s.id)}
                            className="flex items-center gap-1.5 disabled:cursor-default"
                        >
                            <span
                                className={cn(
                                    "grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[10px] font-semibold",
                                    done && "bg-[var(--status-good)] text-white",
                                    cur && "bg-[var(--ink-900)] text-white",
                                    !done && !cur && "bg-[var(--paper-warm)] text-[var(--ink-soft)] ring-1 ring-inset ring-[var(--ink-200)]",
                                )}
                            >
                                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : s.id}
                            </span>
                            <span
                                className={cn(
                                    "whitespace-nowrap text-[11.5px]",
                                    cur ? "font-semibold text-[var(--ink-900)]" : reach ? "text-[var(--ink-500)]" : "text-[var(--ink-soft)]",
                                )}
                            >
                                {s.l}
                            </span>
                        </button>
                        {i < steps.length - 1 ? (
                            <span className={cn("h-px flex-1", done ? "bg-[var(--status-good)]" : "bg-[var(--ink-100)]")} />
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

/** Footer-rail action button (ink primary / bordered ghost / muted soft). */
function NavButton({
    tone = "ghost",
    onClick,
    disabled,
    iconLeft: IconLeft,
    iconRight: IconRight,
    children,
}: {
    tone?: "primary" | "ghost" | "soft"
    onClick?: () => void
    disabled?: boolean
    iconLeft?: ComponentType<{ className?: string }>
    iconRight?: ComponentType<{ className?: string }>
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium transition disabled:cursor-not-allowed",
                tone === "primary" && "bg-[var(--ink-900)] px-4 text-white hover:bg-[var(--ink-700)] disabled:opacity-50",
                tone === "ghost" && "border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)] disabled:opacity-50",
                tone === "soft" && "bg-[var(--paper-warm)] text-[var(--ink-soft)]",
            )}
        >
            {IconLeft ? <IconLeft className="h-3.5 w-3.5" /> : null}
            {children}
            {IconRight ? <IconRight className="h-3.5 w-3.5" /> : null}
        </button>
    )
}

// ── Right rail: live WhatsApp preview ───────────────────────────────────────────

function WizardPreview({ state }: { state: WizardState }) {
    const media = previewMedia(state.header, state.headerText)
    const waButtons: WaButton[] = state.buttons
        .filter((b) => b.label.trim())
        .map((b) => ({ label: b.label, kind: btnKind(b.type) }))
    const resolve = (tok: string) => {
        const n = parseInt(tok.replace(/\D/g, ""), 10)
        return state.samples[n]?.trim() || tok
    }
    const body: ReactNode = (
        <>
            {state.header === "text" && state.headerText ? (
                <div className="mb-1 font-semibold text-[var(--ink-900)]">{state.headerText}</div>
            ) : null}
            {state.body ? highlightBody(state.body, resolve) : <span className="text-[var(--ink-soft)]">Votre message apparaîtra ici…</span>}
        </>
    )
    return (
        <WhatsAppBubble
            media={media}
            body={body}
            footer={state.footer.trim() || undefined}
            buttons={waButtons.length ? waButtons : undefined}
            time="10:00"
        />
    )
}

// ── Modal shell ─────────────────────────────────────────────────────────────────

function Overlay({ onClose, width = 920, children }: { onClose: () => void; width?: number; children: ReactNode }) {
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

// ── Modal ───────────────────────────────────────────────────────────────────────

interface TemplateCreateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Persist the draft. Return `false` to keep the modal open (e.g. on error). */
    onCreate?: (payload: TemplateCreatePayload, opts: { submit: boolean }) => void | boolean | Promise<boolean | void>
    /** An advanced (structural) format was picked → hand off to the full-page editor. */
    onAdvanced?: (type: TemplateType) => void
}

const STEPS = [
    { id: 1, l: "Réglages" },
    { id: 2, l: "Contenu" },
    { id: 3, l: "Variables" },
    { id: 4, l: "Boutons" },
    { id: 5, l: "Récap" },
]

const HEADS: Record<number, { eb: string; t: string; s: string }> = {
    1: { eb: "Étape 1 · réglages", t: "Configurez le modèle", s: "Nom interne, catégorie Meta et langue — la catégorie fixe les règles de consentement et la tarification." },
    2: { eb: "Étape 2 · contenu", t: "Composez le message", s: "En-tête, corps et pied. Insérez {{1}}, {{2}}… pour personnaliser par destinataire." },
    3: { eb: "Étape 3 · variables", t: "Un exemple par variable", s: "Meta exige un exemple de rendu pour chaque variable avant d'approuver le modèle." },
    4: { eb: "Étape 4 · boutons", t: "Ajoutez des actions", s: "Jusqu'à 3 boutons : réponse rapide, lien URL ou appel téléphonique." },
    5: { eb: "Étape 5 · récap", t: "Vérifiez puis soumettez", s: "Un dernier contrôle avant l'envoi à Meta pour approbation." },
}

/**
 * TemplateCreateModal — the v3 "Nouveau modèle" 5-step wizard recreated from the
 * design handoff (`dialogs.jsx` `TemplateBuilder`): Réglages → Contenu →
 * Variables → Boutons → Récap, with a live WhatsApp preview + summary in the
 * right rail and a "Soumis à Meta" success screen. Wired through `onCreate`.
 */
export function TemplateCreateModal({ open, onOpenChange, onCreate, onAdvanced }: TemplateCreateModalProps) {
    const [step, setStep] = useState<number | "success">(1)
    const [maxStep, setMaxStep] = useState(1)
    const [advanced, setAdvanced] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [name, setName] = useState("")
    const [cat, setCat] = useState<TemplateCategory>("MARKETING")
    const [langCode, setLangCode] = useState("fr")
    const [header, setHeader] = useState<HeaderSel>("none")
    const [headerText, setHeaderText] = useState("")
    const [body, setBody] = useState("")
    const [footer, setFooter] = useState("")
    const [buttons, setButtons] = useState<DraftButton[]>([])
    const [samples, setSamples] = useState<Record<number, string>>({})

    const state: WizardState = { name, langCode, cat, header, headerText, body, footer, buttons, samples }
    const tokens = tbTokens(body)
    const catObj = CATS.find((c) => c.id === cat) ?? CATS[0]
    const langObj = LANGS.find((l) => l.code === langCode) ?? LANGS[0]
    const maxButtons = maxButtonsFor(buttons)

    const nameOk = /^[a-z0-9_]+$/.test(name) && name.length > 2
    const bodyOk = body.trim().length > 0 && body.length <= 1024
    const varsOk = tokens.every((t) => (samples[t] || "").trim().length > 0)

    const validation = useMemo(
        () => validateTemplate(toValidationInput(buildPayload(state))),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [name, langCode, cat, header, headerText, body, footer, buttons, samples],
    )
    const canSubmit = nameOk && bodyOk && varsOk && validation.valid
    const stepReady = (s: number) => (s === 1 ? nameOk : s === 2 ? bodyOk : s === 3 ? varsOk : true)

    if (!open) return null

    const close = () => onOpenChange(false)
    const goStep = (n: number) => {
        setStep(n)
        setMaxStep((m) => Math.max(m, n))
    }
    const next = () => goStep(Math.min(5, (typeof step === "number" ? step : 1) + 1))
    const back = () => setStep((s) => Math.max(1, (typeof s === "number" ? s : 1) - 1))
    const reset = () => {
        setStep(1)
        setMaxStep(1)
        setName("")
        setCat("MARKETING")
        setHeader("none")
        setHeaderText("")
        setBody("")
        setFooter("")
        setButtons([])
        setSamples({})
        setError(null)
    }

    const insertVar = () => {
        const n = tokens.length ? Math.max(...tokens) + 1 : 1
        setBody((b) => `${b}{{${n}}}`)
        setSamples((s) => ({ ...s, [n]: "" }))
    }
    const addButton = () => {
        if (buttons.length < maxButtons) setButtons((bs) => [...bs, { type: "quick_reply", label: "", value: "" }])
    }
    const setBtn = (i: number, patch: Partial<DraftButton>) =>
        setButtons((bs) => bs.map((b, j) => (j === i ? { ...b, ...patch } : b)))
    const rmBtn = (i: number) => setButtons((bs) => bs.filter((_, j) => j !== i))

    async function persist(submit: boolean) {
        setSubmitting(true)
        setError(null)
        try {
            const ok = await onCreate?.(buildPayload(state), { submit })
            if (ok === false) {
                setError("L'enregistrement a échoué. Réessayez.")
                return false
            }
            return true
        } catch {
            setError("L'enregistrement a échoué. Réessayez.")
            return false
        } finally {
            setSubmitting(false)
        }
    }

    const saveDraft = async () => {
        if (await persist(false)) close()
    }
    const submitToMeta = async () => {
        if (!canSubmit) return
        if (await persist(true)) setStep("success")
    }

    // ── Advanced formats picker ─────────────────────────────────────────────
    if (advanced) {
        return (
            <Overlay onClose={close} width={760}>
                <div className="flex items-start justify-between gap-4 border-b border-[var(--ink-100)] px-6 pb-4 pt-5">
                    <div>
                        <div className={EYEBROW}>Formats avancés</div>
                        <h2 className="mt-1 font-editorial text-[22px] leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                            Carrousel, liste, catalogue…
                        </h2>
                        <p className="mt-1.5 text-[12.5px] text-[var(--ink-soft)]">
                            Ces formats ouvrent l&apos;éditeur avancé dédié (cartes, sections, produits) avec aperçu temps réel.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Fermer"
                        onClick={close}
                        className="-mr-1 rounded-lg p-1.5 text-[var(--ink-400)] transition hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="overflow-y-auto px-6 py-5">
                    <TemplateTypeGrid filter={(t) => !WIZARD_HANDLED.has(t)} onSelect={(t) => onAdvanced?.(t)} />
                </div>
                <div className="flex items-center justify-between border-t border-[var(--ink-100)] bg-[var(--paper-warm)]/50 px-6 py-3.5">
                    <button
                        type="button"
                        onClick={() => setAdvanced(false)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ink-200)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] transition hover:bg-[var(--paper-warm)]"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Retour à l&apos;assistant
                    </button>
                    <span className="font-mono text-[11px] text-[var(--ink-soft)]">Sélectionnez un format avancé</span>
                </div>
            </Overlay>
        )
    }

    // ── Success screen ──────────────────────────────────────────────────────
    if (step === "success") {
        return (
            <Overlay onClose={close} width={560}>
                <div className="px-9 pb-6 pt-10 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--status-warn-soft)]">
                        <Clock className="h-7 w-7 text-[var(--status-warn)]" strokeWidth={2} />
                    </div>
                    <div className="mt-4 font-editorial text-[26px] leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                        Soumis à Meta
                    </div>
                    <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] leading-relaxed text-[var(--ink-500)]">
                        «&nbsp;{name}&nbsp;» est en cours de révision. Vous serez notifié dès la décision — délai habituel 1 à 24 h.
                    </p>
                </div>
                <div className="mx-9 grid grid-cols-3 gap-3 border-y border-[var(--ink-100)] py-4">
                    {[
                        { k: "Catégorie", v: catObj.label },
                        { k: "Variables", v: String(tokens.length) },
                        { k: "Boutons", v: String(buttons.filter((b) => b.label.trim()).length) },
                    ].map((m) => (
                        <div key={m.k} className="text-center">
                            <div className={EYEBROW}>{m.k}</div>
                            <div className="mt-1.5 font-editorial text-[22px] tracking-[-0.01em] text-[var(--ink-900)]">{m.v}</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center gap-2.5 px-9 pb-7 pt-5">
                    <NavButton tone="ghost" iconLeft={Plus} onClick={reset}>
                        Créer un autre
                    </NavButton>
                    <NavButton tone="primary" onClick={close}>
                        Voir mes modèles
                    </NavButton>
                </div>
            </Overlay>
        )
    }

    const h = HEADS[step]

    return (
        <Overlay onClose={close}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--ink-100)] px-6 pb-4 pt-5">
                <div className="min-w-0">
                    <div className={EYEBROW}>{h.eb}</div>
                    <h2 className="mt-1 font-editorial text-[24px] leading-tight tracking-[-0.01em] text-[var(--ink-900)]">{h.t}</h2>
                    <p className="mt-1.5 max-w-[520px] text-[12.5px] leading-relaxed text-[var(--ink-soft)]">{h.s}</p>
                </div>
                <button
                    type="button"
                    aria-label="Fermer"
                    onClick={close}
                    className="-mr-1 rounded-lg p-1.5 text-[var(--ink-400)] transition hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <Stepper steps={STEPS} step={step} maxStep={maxStep} onJump={goStep} />

            {/* Body: step content + right rail */}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[1fr_312px]">
                <div className="flex min-w-0 flex-col gap-[18px]">
                    {step === 1 && (
                        <>
                            <div>
                                <WLabel hint={nameOk ? "snake_case · non visible client" : "minuscules, chiffres et _"}>Nom interne</WLabel>
                                <TextField
                                    value={name}
                                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                                    placeholder="devis_envoye_fr"
                                    className="font-mono"
                                    maxLength={512}
                                />
                            </div>
                            <div>
                                <WLabel>Catégorie Meta</WLabel>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    {CATS.map((c) => {
                                        const on = cat === c.id
                                        return (
                                            <SelectCard key={c.id} on={on} onClick={() => setCat(c.id)} className="px-3 py-3">
                                                <c.Icon className={cn("h-4 w-4", on ? "text-[var(--accent)]" : "text-[var(--ink-500)]")} strokeWidth={1.6} />
                                                <div className="mt-2 text-[13px] font-semibold tracking-[-0.005em] text-[var(--ink-900)]">{c.label}</div>
                                                <div className="mt-[3px] text-[11.5px] leading-[1.35] text-[var(--ink-soft)]">{c.desc}</div>
                                                <div className={cn("mt-[7px] font-mono text-[10.5px] tabular-nums", on ? "text-[var(--accent)]" : "text-[var(--ink-soft)]")}>
                                                    {c.price} / conv.
                                                </div>
                                            </SelectCard>
                                        )
                                    })}
                                </div>
                            </div>
                            <div>
                                <WLabel hint={langObj.label}>Langue</WLabel>
                                <div className="flex flex-wrap gap-1.5">
                                    {LANGS.map((l) => {
                                        const on = l.code === langCode
                                        return (
                                            <SelectCard key={l.code} on={on} onClick={() => setLangCode(l.code)} className="flex items-center gap-2 px-3 py-2">
                                                <span className={cn("font-mono text-[11px] font-semibold", on ? "text-[var(--accent)]" : "text-[var(--ink-soft)]")}>{l.flag}</span>
                                                <span className="text-[13px] font-medium text-[var(--ink-900)]">{l.label}</span>
                                            </SelectCard>
                                        )
                                    })}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAdvanced(true)}
                                className="inline-flex items-center gap-1.5 self-start text-[12px] font-medium text-[var(--accent)] hover:underline"
                            >
                                Besoin d&apos;un carrousel, d&apos;une liste ou d&apos;un catalogue ? Format avancé
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div>
                                <WLabel hint="optionnel">Type d&apos;en-tête</WLabel>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {HEADERS.map((hh) => {
                                        const on = header === hh.id
                                        return (
                                            <SelectCard key={hh.id} on={on} onClick={() => setHeader(hh.id)} className="flex flex-col items-center gap-1.5 px-1.5 py-2.5">
                                                <hh.Icon className={cn("h-4 w-4", on ? "text-[var(--accent)]" : "text-[var(--ink-500)]")} strokeWidth={1.6} />
                                                <span className="text-[11.5px] font-medium text-[var(--ink-900)]">{hh.label}</span>
                                            </SelectCard>
                                        )
                                    })}
                                </div>
                                {header === "text" && (
                                    <div className="mt-2.5">
                                        <TextField value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Titre de l'en-tête (60 car. max)" maxLength={60} />
                                    </div>
                                )}
                                {(header === "image" || header === "doc" || header === "video") && (
                                    <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-dashed border-[var(--ink-200)] bg-[var(--paper-warm)] px-3.5 py-3">
                                        <Paperclip className="h-4 w-4 shrink-0 text-[var(--ink-soft)]" />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[12.5px] font-medium text-[var(--ink-900)]">
                                                Exemple de média · {HEADERS.find((x) => x.id === header)?.label}
                                            </div>
                                            <div className="mt-0.5 font-mono text-[11px] text-[var(--ink-soft)]">requis par Meta pour la revue</div>
                                        </div>
                                        <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 text-[12px] font-medium text-[var(--ink-700)]">
                                            <Paperclip className="h-3.5 w-3.5" />
                                            Joindre
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-baseline justify-between">
                                    <span className="text-[12px] font-medium text-[var(--ink-700)]">Corps du message</span>
                                    <button
                                        type="button"
                                        onClick={insertVar}
                                        title="Insère un champ personnalisé {{N}}, rempli automatiquement pour chaque contact à l'envoi."
                                        className="inline-flex items-center gap-1 rounded-md border border-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--accent)] transition hover:brightness-95"
                                    >
                                        <Plus className="h-3 w-3" />
                                        variable
                                    </button>
                                </div>
                                <TextareaField
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Saisissez votre message…"
                                    rows={5}
                                    className={cn("min-h-[96px]", !bodyOk && body.length > 0 && "border-[var(--status-danger)]/40 focus:border-[var(--status-danger)] focus:ring-[var(--status-danger)]")}
                                />
                                <div className="mt-1.5 flex gap-3.5 text-[11.5px] text-[var(--ink-soft)]">
                                    <span className={cn("font-mono tabular-nums", body.length > 1024 && "text-[var(--status-danger)]")}>{body.length} / 1024</span>
                                    <span>·</span>
                                    <span>{tokens.length} variable{tokens.length > 1 ? "s" : ""}</span>
                                </div>
                                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[var(--paper-warm)] px-2.5 py-2 text-[11.5px] leading-relaxed text-[var(--ink-soft)]">
                                    <HelpCircle className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
                                    <span>
                                        Les variables{" "}
                                        <span className="font-mono text-[var(--accent)]">{"{{1}}"}</span>,{" "}
                                        <span className="font-mono text-[var(--accent)]">{"{{2}}"}</span>… sont des champs
                                        personnalisés&nbsp;: à l&apos;envoi, chacune est remplacée par l&apos;info du contact
                                        (prénom, n° de commande…). Vous en donnerez un exemple à l&apos;étape suivante.
                                    </span>
                                </div>
                            </div>

                            <div>
                                <WLabel hint="optionnel · 60 car.">Pied de page</WLabel>
                                <TextField value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="ex. — L'équipe Atelier Bracquet" maxLength={60} />
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <WLabel hint={`${tokens.length} détectée${tokens.length > 1 ? "s" : ""}`}>Variables du corps</WLabel>
                            {tokens.length === 0 ? (
                                <div className="rounded-[10px] border border-dashed border-[var(--ink-200)] bg-[var(--paper-warm)] px-4 py-6 text-center">
                                    <HelpCircle className="mx-auto mb-2 h-5 w-5 text-[var(--ink-soft)]" />
                                    <div className="text-[13px] text-[var(--ink-500)]">Aucune variable dans ce modèle.</div>
                                    <div className="mt-1 text-[11.5px] text-[var(--ink-soft)]">Revenez à l&apos;étape Contenu pour insérer {"{{1}}"}.</div>
                                </div>
                            ) : (
                                tokens.map((t) => {
                                    const filled = (samples[t] || "").trim().length > 0
                                    return (
                                        <div
                                            key={t}
                                            className={cn(
                                                "rounded-[10px] border bg-[var(--paper-white)] px-3.5 py-3",
                                                filled ? "border-[var(--ink-200)]" : "border-[var(--status-danger)]/35",
                                            )}
                                        >
                                            <div className="mb-2 flex items-center gap-2.5">
                                                <span className="rounded-md bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[13px] font-semibold text-[var(--accent)]">{`{{${t}}}`}</span>
                                                <span className="text-[12px] text-[var(--ink-soft)]">exemple de rendu</span>
                                            </div>
                                            <TextField value={samples[t] || ""} onChange={(e) => setSamples((s) => ({ ...s, [t]: e.target.value }))} placeholder="ex. Margaux" />
                                        </div>
                                    )
                                })
                            )}
                            {tokens.length > 0 && (
                                <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-soft)]">
                                    <HelpCircle className="h-3.5 w-3.5" />À l&apos;envoi, chaque variable est remplie depuis la fiche contact.
                                </div>
                            )}
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <WLabel hint={`${buttons.length} / ${maxButtons}`}>Boutons</WLabel>
                            {buttons.length === 0 && (
                                <div className="rounded-[10px] border border-dashed border-[var(--ink-200)] bg-[var(--paper-warm)] px-4 py-4 text-center text-[12.5px] text-[var(--ink-500)]">
                                    Aucun bouton — le message sera envoyé sans action.
                                </div>
                            )}
                            {buttons.map((b, i) => {
                                const isReply = b.type === "quick_reply"
                                return (
                                    <div key={i} className="rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-3">
                                        <div className="mb-2.5 flex items-center gap-2">
                                            <div className="flex flex-1 gap-1 rounded-lg bg-[var(--paper-warm)] p-1">
                                                {BTN_TYPES.map((t) => {
                                                    const on = b.type === t.id
                                                    return (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            onClick={() => setBtn(i, { type: t.id })}
                                                            className={cn(
                                                                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-1.5 py-1.5 text-[11.5px] transition",
                                                                on ? "bg-[var(--paper-white)] font-semibold text-[var(--ink-900)] shadow-sm" : "font-medium text-[var(--ink-soft)] hover:text-[var(--ink-700)]",
                                                            )}
                                                        >
                                                            <t.Icon className={cn("h-3.5 w-3.5", on ? "text-[var(--accent)]" : "")} />
                                                            <span className="whitespace-nowrap">{t.label}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <button
                                                type="button"
                                                aria-label="Supprimer le bouton"
                                                onClick={() => rmBtn(i)}
                                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--ink-400)] transition hover:text-[var(--status-danger)]"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <div className={cn("grid gap-2", isReply ? "grid-cols-1" : "grid-cols-2")}>
                                            <TextField value={b.label} onChange={(e) => setBtn(i, { label: e.target.value })} placeholder="Texte du bouton" maxLength={25} />
                                            {!isReply && (
                                                <TextField
                                                    value={b.value}
                                                    onChange={(e) => setBtn(i, { value: e.target.value })}
                                                    className="font-mono"
                                                    placeholder={b.type === "url" ? "https://…" : "+33 1 84 60 12 88"}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {buttons.length < maxButtons && (
                                <button
                                    type="button"
                                    onClick={addButton}
                                    className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--ink-200)] py-2.5 text-[12.5px] font-medium text-[var(--ink-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Ajouter un bouton
                                </button>
                            )}
                            <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--ink-soft)]">
                                <HelpCircle className="h-3.5 w-3.5" />
                                Réponse rapide = renvoie un message. URL et Appel ouvrent un lien ou composent un numéro.
                            </div>
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { k: "Nom interne", v: name || "—", mono: true },
                                    { k: "Catégorie", v: `${catObj.label} · ${catObj.price} / conv.` },
                                    { k: "Langue", v: `${langObj.label} (${langObj.flag})` },
                                    { k: "En-tête", v: `${HEADERS.find((x) => x.id === header)?.label}${header === "text" && headerText ? ` · ${headerText}` : ""}` },
                                    { k: "Corps", v: `${body.length} caractères · ${tokens.length} variables` },
                                    {
                                        k: "Boutons",
                                        v: buttons.filter((b) => b.label.trim()).length
                                            ? buttons.filter((b) => b.label.trim()).map((b) => b.label).join(" · ")
                                            : "Aucun",
                                    },
                                ].map((f) => (
                                    <div key={f.k} className="grid grid-cols-[140px_1fr] items-start gap-3.5">
                                        <div className="pt-px text-[12px] text-[var(--ink-soft)]">{f.k}</div>
                                        <div className={cn("text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink-900)]", f.mono && "font-mono")}>{f.v}</div>
                                    </div>
                                ))}
                            </div>

                            {cat === "MARKETING" ? (
                                <div className="flex gap-2.5 rounded-[10px] border border-[var(--status-warn)]/25 bg-[var(--status-warn-soft)]/60 px-3.5 py-3 text-[12.5px] text-[var(--ink-700)]">
                                    <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--status-warn)]" />
                                    <div>
                                        <b className="text-[var(--status-warn)]">Catégorie Marketing</b> · seuls les contacts ayant donné leur consentement pourront recevoir ce modèle.
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2.5 rounded-[10px] border border-[var(--status-good)]/22 bg-[var(--status-good-soft)]/60 px-3.5 py-3 text-[12.5px] text-[var(--ink-700)]">
                                    <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--status-good)]" />
                                    <div>
                                        <b className="text-[var(--status-good)]">Catégorie {catObj.label}</b> · envoyable hors fenêtre 24 h, sans opt-in marketing.
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-warm)] px-4 py-3.5">
                                <Clock className="h-4 w-4 shrink-0 text-[var(--ink-500)]" />
                                <div className="flex-1">
                                    <div className="text-[13px] font-semibold text-[var(--ink-900)]">Revue Meta</div>
                                    <div className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">Décision automatique sous 1 à 24 h. Le modèle reste « En attente » jusque-là.</div>
                                </div>
                            </div>

                            {(!canSubmit || error) && (
                                <div className="flex items-center gap-1.5 text-[12px] text-[var(--status-danger)]">
                                    <Lock className="h-3 w-3" />
                                    {error
                                        ? error
                                        : !nameOk
                                          ? "Nom interne invalide."
                                          : !bodyOk
                                            ? "Le corps est vide ou trop long."
                                            : !varsOk
                                              ? "Une variable est sans exemple."
                                              : validation.errors[0] || "Vérifiez le modèle."}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Right rail */}
                <div className="flex min-w-0 flex-col gap-3">
                    <div className={EYEBROW}>Aperçu WhatsApp</div>
                    <WaChatFrame>
                        <WizardPreview state={state} />
                    </WaChatFrame>

                    <div className="mt-0.5 flex flex-col gap-2.5 rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-3">
                        <div className={EYEBROW}>Récapitulatif</div>
                        {[
                            { k: "Catégorie", v: catObj.label },
                            { k: "Langue", v: langObj.flag },
                            { k: "Variables", v: String(tokens.length) },
                            { k: "Boutons", v: String(buttons.filter((b) => b.label.trim()).length) },
                        ].map((r) => (
                            <div key={r.k} className="flex items-baseline justify-between gap-2.5">
                                <span className="whitespace-nowrap text-[12px] text-[var(--ink-soft)]">{r.k}</span>
                                <span className="truncate text-right font-mono text-[12px] font-medium tabular-nums text-[var(--ink-900)]">{r.v}</span>
                            </div>
                        ))}
                        <div className="my-px h-px bg-[var(--ink-100)]" />
                        <div className="flex items-baseline justify-between">
                            <span className="text-[11.5px] text-[var(--ink-soft)]">Statut</span>
                            <span className="font-mono text-[11.5px] text-[var(--status-warn)]">Brouillon</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between gap-2.5 border-t border-[var(--ink-100)] bg-[var(--paper-warm)]/50 px-5 py-3.5">
                <NavButton tone="ghost" onClick={saveDraft} disabled={submitting || !nameOk}>
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Sauvegarder en brouillon
                </NavButton>
                <div className="flex gap-2">
                    {step > 1 && (
                        <NavButton tone="ghost" iconLeft={ChevronLeft} onClick={back}>
                            Précédent
                        </NavButton>
                    )}
                    {step < 5 ? (
                        <NavButton tone={stepReady(step) ? "primary" : "soft"} iconRight={ChevronRight} onClick={() => stepReady(step) && next()} disabled={!stepReady(step)}>
                            Continuer
                        </NavButton>
                    ) : (
                        <NavButton tone={canSubmit ? "primary" : "soft"} iconRight={submitting ? undefined : Send} onClick={submitToMeta} disabled={!canSubmit || submitting}>
                            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Soumettre à Meta
                        </NavButton>
                    )}
                </div>
            </div>
        </Overlay>
    )
}
