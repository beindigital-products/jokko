"use client"

import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"

import { Chip } from "../primitives/Chip"
import type { TemplateEntry } from "./TemplatePicker"

interface TemplateVariableFormProps {
    template: TemplateEntry
    /** Called with the body where `{{N}}` placeholders are replaced with
     *  the values entered. Returns also the raw values for callers that
     *  need them (audit / analytics). */
    onInsert?: (filledBody: string, values: Record<string, string>) => void
    onCancel?: () => void
}

/** Match `{{1}}`, `{{2}}` etc. Captures the index as a string. */
const VAR_REGEX = /\{\{(\d+)\}\}/g

function extractVariables(body: string): string[] {
    const set = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = VAR_REGEX.exec(body)) !== null) {
        set.add(m[1])
    }
    return Array.from(set).sort((a, b) => Number(a) - Number(b))
}

function fillBody(body: string, values: Record<string, string>): string {
    return body.replace(VAR_REGEX, (_, idx) => values[idx]?.trim() || `{{${idx}}}`)
}

/**
 * TemplateVariableForm — picked-template detail with one input per
 * `{{N}}` placeholder. Live preview below. Insert button propagates the
 * filled body to the composer textarea.
 */
export function TemplateVariableForm({
    template,
    onInsert,
    onCancel,
}: TemplateVariableFormProps) {
    const vars = useMemo(() => extractVariables(template.body), [template.body])
    const [values, setValues] = useState<Record<string, string>>({})

    const allFilled = vars.every((v) => values[v]?.trim().length)
    const preview = fillBody(template.body, values)

    return (
        <div className="overflow-hidden rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-sm">
            <div className="flex items-center gap-2 border-b border-[var(--ink-200)] px-3 py-2.5">
                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Retour à la liste des modèles"
                    className="rounded p-1 text-[var(--ink-400)] hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-[13px] font-semibold text-[var(--ink-900)]">
                    {template.name}
                </span>
                <Chip tone="accent">{template.language}</Chip>
                <Chip tone="good">Approuvé</Chip>
            </div>

            <div className="space-y-4 px-3 py-3">
                {vars.length === 0 ? (
                    <p className="text-[12px] text-[var(--ink-soft)]">
                        Ce modèle n&apos;a pas de variables. Cliquez sur Insérer pour
                        l&apos;ajouter au composer.
                    </p>
                ) : (
                    <div className="space-y-2.5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Variables — {vars.length}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {vars.map((v) => (
                                <label
                                    key={v}
                                    className="flex flex-col gap-1 text-[11.5px]"
                                >
                                    <span className="font-mono text-[var(--ink-soft)]">
                                        {`{{${v}}}`}
                                    </span>
                                    <input
                                        type="text"
                                        value={values[v] ?? ""}
                                        onChange={(e) =>
                                            setValues((s) => ({
                                                ...s,
                                                [v]: e.target.value,
                                            }))
                                        }
                                        placeholder={`Valeur pour {{${v}}}`}
                                        className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2 py-1.5 text-[12px] placeholder:text-[var(--ink-400)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-[var(--accent)]"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Aperçu
                    </p>
                    <div className="whitespace-pre-line rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-2.5 text-[12.5px] leading-relaxed text-[var(--ink-900)]">
                        {preview}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)]/40 px-3 py-2.5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium text-[var(--ink-soft)] hover:text-[var(--ink-900)]"
                >
                    Annuler
                </button>
                <button
                    type="button"
                    onClick={() => onInsert?.(preview, values)}
                    disabled={!allFilled}
                    className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Insérer
                </button>
            </div>
        </div>
    )
}
