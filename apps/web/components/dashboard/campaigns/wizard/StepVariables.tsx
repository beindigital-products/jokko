"use client"

import { useState } from "react"

import { Icon } from "@/components/dashboard/primitives/Icon"
import { CwInput, CwLabel, type WizardState } from "./_shared"
import { cwResolve, cwSources } from "./wizard-data"
import type { VariableSourceId } from "./types"

/**
 * StepVariables — Étape 4 (Variables). One card per template variable: token
 * chip, live rendered example, a source dropdown (contact field / fixed value)
 * and, when "Valeur fixe", a text input for the literal. Controlled by the shell
 * (the dropdown open-state is local). Recreates the design's step 4.
 */
export function StepVariables({ data, tplId, vars, setVar }: WizardState) {
    const [openVar, setOpenVar] = useState(-1)
    const sources = cwSources()
    const tpl = data.templates.find((t) => t.id === tplId) ?? data.templates[0]

    return (
        <div className="flex flex-col gap-2">
            <CwLabel hint={tpl.name}>Variables du modèle</CwLabel>

            {vars.length === 0 ? (
                <p className="text-[12.5px] text-[var(--ink-soft)]">Ce modèle ne contient aucune variable.</p>
            ) : null}

            {vars.map((v, i) => {
                const isFixed = v.src === "fixed"
                const current = sources.find((s) => s.id === v.src) ?? sources[0]
                return (
                    <div
                        key={v.token}
                        className="rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-3"
                    >
                        <div className="mb-2.5 flex items-center gap-2.5">
                            <span className="rounded-md bg-[var(--accent-muted)] px-2 py-0.5 font-mono text-[13px] font-semibold tabular-nums text-[var(--accent)]">
                                {v.token}
                            </span>
                            <span className="text-[12px] text-[var(--ink-soft)]">
                                exemple rendu : <b className="text-[var(--ink-700)]">{cwResolve(v)}</b>
                            </span>
                        </div>

                        <div className={isFixed ? "grid grid-cols-2 gap-2" : "grid grid-cols-1"}>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setOpenVar(openVar === i ? -1 : i)}
                                    className="flex h-9 w-full items-center justify-between gap-2 rounded-[9px] border bg-[var(--paper-warm)] px-3 text-[13px] tracking-[-0.005em] text-[var(--ink-900)]"
                                    style={{ borderColor: openVar === i ? "var(--accent)" : "var(--ink-200)" }}
                                >
                                    <span className="min-w-0 truncate whitespace-nowrap">{current.label}</span>
                                    <Icon name="chevron-down" size={14} color="var(--ink-soft)" />
                                </button>

                                {openVar === i ? (
                                    <div className="absolute left-0 right-0 top-10 z-10 overflow-hidden rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-white)] p-1 shadow-[0_12px_30px_-8px_rgba(10,10,10,0.22)]">
                                        {sources.map((s) => {
                                            const on = s.id === v.src
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setVar(i, { src: s.id as VariableSourceId })
                                                        setOpenVar(-1)
                                                    }}
                                                    className="flex w-full items-center justify-between gap-2 rounded-[7px] px-2.5 py-2 text-left text-[13px] text-[var(--ink-900)]"
                                                    style={{ background: on ? "rgba(105,56,239,0.05)" : "transparent" }}
                                                >
                                                    {s.label}
                                                    {on ? (
                                                        <Icon name="check" size={13} color="var(--accent)" strokeWidth={2.4} />
                                                    ) : null}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : null}
                            </div>

                            {isFixed ? (
                                <CwInput
                                    value={v.fixed || ""}
                                    onChange={(val) => setVar(i, { fixed: val })}
                                    placeholder="Valeur à insérer"
                                />
                            ) : null}
                        </div>
                    </div>
                )
            })}

            <div className="flex items-center gap-[7px] text-[11.5px] text-[var(--ink-soft)]">
                <Icon name="help-circle" size={13} color="var(--ink-soft)" />
                Les champs contact sont remplis individuellement pour chaque destinataire.
            </div>
        </div>
    )
}
