"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ArrowLeft, Check, Plus, Send, Trash2, Wand2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { isSimpleTemplateType } from "@/lib/dashboard/templates-data"
import {
    SUPPORTED_LANGUAGES,
    TEMPLATE_TYPE_CONFIGS,
    type ButtonType,
    type HeaderType,
    type TemplateCategory,
    type TemplateType,
} from "@/convex/lib/templateTypes"
import {
    WaChatFrame,
    WhatsAppBubble,
    highlightBody,
    type WaButton,
    type WaMedia,
} from "../primitives/WhatsAppBubble"
import { TemplateTypeGrid } from "./TemplateTypeGrid"

// ── Draft state ───────────────────────────────────────────────────────────────

interface DraftButton {
    type: ButtonType
    text: string
    /** URL / phone number / code, depending on the button type. */
    value: string
}

/** The structured payload handed to the page for a Convex `create`. */
export interface TemplateCreatePayload {
    type: TemplateType
    name: string
    language: string
    category: TemplateCategory
    header?: { type: HeaderType; text?: string }
    body: string
    footer?: string
    buttons: { type: ButtonType; text: string; value?: string }[]
}

/** Button types that carry a value (URL / phone / code) beside their label. */
function needsButtonValue(type: ButtonType): boolean {
    return type === "URL" || type === "PHONE_NUMBER" || type === "VOICE_CALL" || type === "COPY_CODE"
}

function buttonValuePlaceholder(type: ButtonType): string {
    if (type === "URL") return "https://votre-lien.com"
    if (type === "PHONE_NUMBER" || type === "VOICE_CALL") return "+221 77 123 45 67"
    if (type === "COPY_CODE") return "Code à copier"
    return "Valeur"
}

interface TemplateDraft {
    type: TemplateType
    name: string
    language: string
    category: TemplateCategory
    headerType: HeaderType
    headerText: string
    body: string
    footer: string
    buttons: DraftButton[]
}

const BUTTON_LABELS: Record<ButtonType, string> = {
    QUICK_REPLY: "Réponse rapide",
    URL: "Lien URL",
    PHONE_NUMBER: "Appel téléphone",
    COPY_CODE: "Copier le code",
    VOICE_CALL: "Appel vocal",
    CATALOG: "Catalogue",
    MPM: "Multi-produits",
    SPM: "Produit",
    OTP: "Code OTP",
}

const HEADER_LABELS: Record<HeaderType, string> = {
    NONE: "Aucun",
    TEXT: "Texte",
    IMAGE: "Image",
    VIDEO: "Vidéo",
    DOCUMENT: "Document",
    LOCATION: "Localisation",
}

/** Build a sensible initial draft for a freshly-picked type. */
function makeDraft(type: TemplateType): TemplateDraft {
    const config = TEMPLATE_TYPE_CONFIGS[type]
    const headerType: HeaderType = config.features.headerRequired
        ? (config.features.headerTypes.find((h) => h !== "NONE") ?? "NONE")
        : "NONE"
    const buttons: DraftButton[] =
        config.features.hasButtons && config.features.minButtons > 0
            ? [{ type: config.features.buttonTypes[0], text: "", value: "" }]
            : []
    return {
        type,
        name: "",
        language: "fr",
        category: config.categories[0],
        headerType,
        headerText: "",
        body: "Bonjour {{1}}, voici votre confirmation pour {{2}}. Merci de votre confiance.",
        footer: "",
        buttons,
    }
}

/** Map the WhatsApp button type to the shared bubble's icon kind. */
function buttonKind(type: ButtonType): WaButton["kind"] {
    if (type === "URL") return "url"
    if (type === "PHONE_NUMBER" || type === "VOICE_CALL") return "phone"
    return "reply"
}

/** Flatten a draft into the structured create payload (trim + drop empties). */
function draftToPayload(draft: TemplateDraft): TemplateCreatePayload {
    return {
        type: draft.type,
        name: draft.name.trim(),
        language: draft.language,
        category: draft.category,
        header: draft.headerType === "TEXT" ? { type: "TEXT", text: draft.headerText.trim() } : undefined,
        body: draft.body,
        footer: draft.footer.trim() || undefined,
        buttons: draft.buttons
            .filter((b) => b.text.trim())
            .map((b) => ({ type: b.type, text: b.text.trim(), value: b.value.trim() || undefined })),
    }
}

/** Map a draft's header to the bubble media (TEXT header rendered inline). */
function draftMedia(draft: TemplateDraft): WaMedia | null {
    switch (draft.headerType) {
        case "IMAGE":
            return { kind: "image" }
        case "VIDEO":
            return { kind: "video", duration: "0:18" }
        case "DOCUMENT":
            return { kind: "document", filename: "document.pdf", pages: 2, size: "240 ko" }
        case "LOCATION":
            return { kind: "location", name: "Atelier Bracquet", address: "18 rue de Sévigné, 75004 Paris" }
        default:
            return null
    }
}

// ── Lightweight v3 form controls ────────────────────────────────────────────────

function Field({
    label,
    hint,
    action,
    children,
}: {
    label: string
    hint?: string
    action?: ReactNode
    children: ReactNode
}) {
    return (
        <label className="block">
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--ink-700)]">{label}</span>
                {action}
            </div>
            {children}
            {hint ? <p className="mt-1 text-[10.5px] text-[var(--ink-soft)]">{hint}</p> : null}
        </label>
    )
}

const FIELD_CLS =
    "w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13px] text-[var(--ink-900)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"

function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn(FIELD_CLS, "h-9", props.className)} />
}

function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={cn(FIELD_CLS, "h-9 appearance-none pr-8", props.className)} />
}

// ── Builder (step 2) ────────────────────────────────────────────────────────────

function nextVarToken(body: string): string {
    const matches = body.match(/\{\{(\d+)\}\}/g)
    return ` {{${matches ? matches.length + 1 : 1}}} `
}

function TemplateBuilderForm({
    draft,
    set,
}: {
    draft: TemplateDraft
    set: (patch: Partial<TemplateDraft>) => void
}) {
    const config = TEMPLATE_TYPE_CONFIGS[draft.type]
    const f = config.features

    return (
        <div className="space-y-5">
            {/* Identity */}
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <Field label="Nom du modèle" hint="Minuscules, chiffres et underscores uniquement.">
                        <TextField
                            value={draft.name}
                            onChange={(e) => set({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                            placeholder="ex. confirmation_commande"
                            maxLength={64}
                        />
                    </Field>
                </div>
                <Field label="Langue">
                    <SelectField value={draft.language} onChange={(e) => set({ language: e.target.value })}>
                        {SUPPORTED_LANGUAGES.slice(0, 12).map((l) => (
                            <option key={l.code} value={l.code}>
                                {l.native}
                            </option>
                        ))}
                    </SelectField>
                </Field>
                <Field label="Catégorie">
                    <SelectField
                        value={draft.category}
                        onChange={(e) => set({ category: e.target.value as TemplateCategory })}
                    >
                        {config.categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </SelectField>
                </Field>
            </div>

            {/* Header */}
            {f.hasHeader && draft.type !== "CAROUSEL" ? (
                <div className="border-t border-[var(--ink-100)] pt-5">
                    <Field label="En-tête (header)">
                        <SelectField
                            value={draft.headerType}
                            onChange={(e) => set({ headerType: e.target.value as HeaderType })}
                        >
                            {/* v3 modal only does text headers — media headers
                                live in the advanced (legacy) builder. */}
                            {f.headerTypes
                                .filter((h) => h === "NONE" || h === "TEXT")
                                .map((h) => (
                                    <option key={h} value={h}>
                                        {HEADER_LABELS[h]}
                                    </option>
                                ))}
                        </SelectField>
                    </Field>
                    {draft.headerType === "TEXT" ? (
                        <div className="mt-2">
                            <TextField
                                value={draft.headerText}
                                onChange={(e) => set({ headerText: e.target.value })}
                                placeholder="Texte de l'en-tête"
                                maxLength={60}
                            />
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* Body */}
            {f.hasBody ? (
                <div className="border-t border-[var(--ink-100)] pt-5">
                    <Field
                        label="Message (body)"
                        action={
                            <button
                                type="button"
                                onClick={() => set({ body: draft.body + nextVarToken(draft.body) })}
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent)] hover:bg-[var(--accent-muted)]"
                            >
                                <Plus className="h-3 w-3" />
                                Variable
                            </button>
                        }
                    >
                        <textarea
                            value={draft.body}
                            onChange={(e) => set({ body: e.target.value })}
                            placeholder="Votre message… Utilisez {{1}}, {{2}} pour les variables."
                            className={cn(FIELD_CLS, "h-28 resize-none py-2 leading-relaxed")}
                        />
                    </Field>
                </div>
            ) : null}

            {/* Footer */}
            {f.hasFooter && draft.type !== "CAROUSEL" ? (
                <div className="border-t border-[var(--ink-100)] pt-5">
                    <Field label="Pied de page (footer)">
                        <TextField
                            value={draft.footer}
                            onChange={(e) => set({ footer: e.target.value })}
                            placeholder="Texte gris en bas du message"
                            maxLength={60}
                        />
                    </Field>
                </div>
            ) : null}

            {/* Buttons */}
            {f.hasButtons ? (
                <div className="border-t border-[var(--ink-100)] pt-5">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[var(--ink-700)]">
                            Boutons{" "}
                            <span className="font-normal text-[var(--ink-soft)]">
                                ({draft.buttons.length}/{f.maxButtons})
                            </span>
                        </span>
                        {draft.buttons.length < f.maxButtons ? (
                            <button
                                type="button"
                                onClick={() =>
                                    set({
                                        buttons: [...draft.buttons, { type: f.buttonTypes[0], text: "", value: "" }],
                                    })
                                }
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent)] hover:bg-[var(--accent-muted)]"
                            >
                                <Plus className="h-3 w-3" />
                                Ajouter
                            </button>
                        ) : null}
                    </div>
                    <div className="space-y-2">
                        {draft.buttons.map((b, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <SelectField
                                        value={b.type}
                                        onChange={(e) => {
                                            const buttons = [...draft.buttons]
                                            buttons[i] = { ...b, type: e.target.value as ButtonType }
                                            set({ buttons })
                                        }}
                                        className="h-9 w-[140px] shrink-0"
                                    >
                                        {f.buttonTypes.map((t) => (
                                            <option key={t} value={t}>
                                                {BUTTON_LABELS[t]}
                                            </option>
                                        ))}
                                    </SelectField>
                                    <TextField
                                        value={b.text}
                                        onChange={(e) => {
                                            const buttons = [...draft.buttons]
                                            buttons[i] = { ...b, text: e.target.value }
                                            set({ buttons })
                                        }}
                                        placeholder="Libellé du bouton"
                                        maxLength={25}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Supprimer le bouton"
                                        onClick={() => set({ buttons: draft.buttons.filter((_, j) => j !== i) })}
                                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--ink-200)] text-[var(--ink-400)] hover:bg-[var(--paper-warm)] hover:text-[var(--status-danger)]"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                {needsButtonValue(b.type) ? (
                                    <TextField
                                        value={b.value}
                                        onChange={(e) => {
                                            const buttons = [...draft.buttons]
                                            buttons[i] = { ...b, value: e.target.value }
                                            set({ buttons })
                                        }}
                                        placeholder={buttonValuePlaceholder(b.type)}
                                    />
                                ) : null}
                            </div>
                        ))}
                        {draft.buttons.length === 0 ? (
                            <p className="text-[12px] text-[var(--ink-soft)]">Aucun bouton ajouté.</p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

// ── Live preview (step 2 right rail) ────────────────────────────────────────────

function TemplateLivePreview({ draft }: { draft: TemplateDraft }) {
    const media = draftMedia(draft)
    const buttons: WaButton[] = draft.buttons
        .filter((b) => b.text.trim())
        .map((b) => ({ label: b.text, kind: buttonKind(b.type) }))

    const body: ReactNode = (
        <>
            {draft.headerType === "TEXT" && draft.headerText ? (
                <div className="mb-1 font-semibold text-[var(--ink-900)]">{draft.headerText}</div>
            ) : null}
            {draft.body ? (
                highlightBody(draft.body)
            ) : (
                <span className="text-[var(--ink-soft)]">Votre message apparaîtra ici…</span>
            )}
        </>
    )

    return (
        <div className="flex h-full flex-col">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                Aperçu WhatsApp
            </p>
            <div className="mt-3 flex-1">
                <WaChatFrame>
                    <WhatsAppBubble
                        media={media}
                        body={body}
                        footer={draft.footer || undefined}
                        buttons={buttons.length ? buttons : undefined}
                        time="11:32"
                    />
                </WaChatFrame>
            </div>
        </div>
    )
}

// ── Advanced type panel (step 2 for non-simple types) ──────────────────────────

/**
 * Shown when the picked type needs editors the v3 modal doesn't carry (media
 * upload, carousel cards, list sections, catalogs…). Routes to the legacy
 * builder via {@link onOpen}.
 */
function AdvancedTypePanel({ type, onOpen }: { type: TemplateType; onOpen: () => void }) {
    const config = TEMPLATE_TYPE_CONFIGS[type]
    return (
        <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]">
                <Wand2 className="h-5 w-5" />
            </div>
            <p className="mt-4 font-display text-[17px] text-[var(--ink-900)]">{config.labelFr}</p>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--ink-soft)]">
                {config.descriptionFr}. Ce type utilise l&apos;éditeur avancé (cartes, sections, médias…)
                avec aperçu dédié.
            </p>
            <button
                type="button"
                onClick={onOpen}
                className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white hover:bg-[var(--ink-700)]"
            >
                <Wand2 className="h-3.5 w-3.5" />
                Ouvrir l&apos;éditeur avancé
            </button>
        </div>
    )
}

// ── Modal ────────────────────────────────────────────────────────────────────

type Step = "type" | "build"

interface TemplateCreateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Pre-select a type to land directly in the builder (mostly for stories). */
    defaultType?: TemplateType
    /** Called with the structured payload when the draft is created / submitted. */
    onCreate?: (payload: TemplateCreatePayload, opts: { submit: boolean }) => void
    /** Called when the picked type needs the advanced (legacy) builder. */
    onAdvanced?: (type: TemplateType) => void
}

/**
 * TemplateCreateModal — v3 "Nouveau modèle" flow. Two steps: pick a template
 * type, then configure it (name / language / category / header / body /
 * footer / buttons) with a live WhatsApp preview powered by the shared
 * {@link WhatsAppBubble}. Presentational — no Convex wiring.
 */
export function TemplateCreateModal({
    open,
    onOpenChange,
    defaultType,
    onCreate,
    onAdvanced,
}: TemplateCreateModalProps) {
    const [step, setStep] = useState<Step>(defaultType ? "build" : "type")
    const [draft, setDraft] = useState<TemplateDraft | null>(
        defaultType ? makeDraft(defaultType) : null,
    )

    const config = draft ? TEMPLATE_TYPE_CONFIGS[draft.type] : null
    const set = (patch: Partial<TemplateDraft>) =>
        setDraft((d) => (d ? { ...d, ...patch } : d))

    const canCreate = useMemo(
        () => Boolean(draft && draft.name.trim() && draft.body.trim()),
        [draft],
    )

    if (!open) return null

    function pickType(type: TemplateType) {
        setDraft(makeDraft(type))
        setStep("build")
    }

    function close() {
        onOpenChange(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Fermer"
                onClick={close}
                className="absolute inset-0 bg-[var(--ink-900)]/30 backdrop-blur-[1px]"
            />

            <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[var(--ink-100)] px-6 pb-4 pt-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-display text-[18px] text-[var(--ink-900)]">Nouveau modèle</h2>
                            {config ? (
                                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                                    · {config.labelFr}
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-[var(--ink-soft)]">
                            {step === "type"
                                ? "Choisissez le type de message WhatsApp à créer."
                                : "Configurez le contenu. L'aperçu se met à jour en direct."}
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

                {/* Stepper */}
                <div className="flex items-center gap-2 border-b border-[var(--ink-100)] px-6 py-2.5">
                    {(["type", "build"] as Step[]).map((s, i) => {
                        const idx = step === "build" ? 1 : 0
                        const done = i < idx
                        const current = i === idx
                        return (
                            <div key={s} className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-semibold",
                                        done && "bg-[var(--accent)] text-white",
                                        current && "bg-[var(--accent-muted)] text-[var(--accent)] ring-1 ring-[var(--accent)]",
                                        !done && !current && "bg-[var(--paper-warm)] text-[var(--ink-soft)]",
                                    )}
                                >
                                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                                </span>
                                <span
                                    className={cn(
                                        "font-mono text-[9.5px] uppercase tracking-[0.1em]",
                                        current ? "text-[var(--ink-900)]" : "text-[var(--ink-soft)]",
                                    )}
                                >
                                    {s === "type" ? "Type" : "Configuration"}
                                </span>
                                {i === 0 ? <span className="h-px w-8 bg-[var(--ink-100)]" /> : null}
                            </div>
                        )
                    })}
                </div>

                {/* Body */}
                {step === "type" ? (
                    <div className="overflow-y-auto px-6 py-5">
                        <TemplateTypeGrid selectedType={draft?.type} onSelect={pickType} />
                    </div>
                ) : draft && isSimpleTemplateType(draft.type) ? (
                    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_340px]">
                        <div className="overflow-y-auto px-6 py-5">
                            <TemplateBuilderForm draft={draft} set={set} />
                        </div>
                        <div className="hidden border-l border-[var(--ink-200)] bg-[var(--paper-warm)] px-5 py-5 lg:block">
                            <TemplateLivePreview draft={draft} />
                        </div>
                    </div>
                ) : draft ? (
                    <AdvancedTypePanel
                        type={draft.type}
                        onOpen={() => {
                            onAdvanced?.(draft.type)
                            close()
                        }}
                    />
                ) : null}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[var(--ink-100)] bg-[var(--paper-warm)]/50 px-6 py-3.5">
                    <button
                        type="button"
                        onClick={() => (step === "build" && !defaultType ? setStep("type") : close())}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ink-200)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)]"
                    >
                        {step === "build" && !defaultType ? (
                            <>
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Retour
                            </>
                        ) : (
                            "Annuler"
                        )}
                    </button>

                    {step === "type" ? (
                        <span className="font-mono text-[11px] text-[var(--ink-soft)]">
                            Sélectionnez un type pour continuer
                        </span>
                    ) : draft && isSimpleTemplateType(draft.type) ? (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={!canCreate}
                                onClick={() => {
                                    onCreate?.(draftToPayload(draft), { submit: false })
                                    close()
                                }}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 text-[13px] font-medium text-[var(--ink-700)] hover:bg-[var(--paper-warm)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Créer le brouillon
                            </button>
                            <button
                                type="button"
                                disabled={!canCreate}
                                onClick={() => {
                                    onCreate?.(draftToPayload(draft), { submit: true })
                                    close()
                                }}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--ink-900)] px-4 text-[13px] font-medium text-white hover:bg-[var(--ink-700)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Send className="h-3.5 w-3.5" />
                                Soumettre à Meta
                            </button>
                        </div>
                    ) : (
                        <span className="font-mono text-[11px] text-[var(--ink-soft)]">
                            Éditeur avancé requis pour ce type
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
