import { Icon, type IconName } from "@/components/dashboard/primitives/Icon"
import { CwInput, CwLabel, type WizardState } from "./_shared"
import type { TemplateCategory } from "./types"

interface CatOption {
    id: TemplateCategory | "Auth"
    icon: IconName
    title: string
    desc: string
    price: string
    disabled?: boolean
}

const CATS: CatOption[] = [
    { id: "Marketing", icon: "flag", title: "Marketing", desc: "Promos, nouveautés, réactivation", price: "€0.032" },
    { id: "Utility", icon: "doc", title: "Utility", desc: "Confirmations, rappels, suivi", price: "€0.011" },
    {
        id: "Auth",
        icon: "lock",
        title: "Authentification",
        desc: "Codes OTP — non éligible ici",
        price: "—",
        disabled: true,
    },
]

/**
 * StepName — Étape 1 (Objectif). Internal name + optional description + the Meta
 * category cards. The category drives the template list and per-conversation
 * pricing. Controlled by the shell. Recreates the design's step 1.
 */
export function StepName({ name, desc, cat, setName, setDesc, selectCat }: WizardState) {
    return (
        <div className="flex flex-col gap-[18px]">
            <div>
                <CwLabel hint="non visible par le client">Nom de la campagne</CwLabel>
                <CwInput value={name} onChange={setName} placeholder="ex. Promo Fête des Pères" />
            </div>

            <div>
                <CwLabel hint="optionnel">Description</CwLabel>
                <CwInput value={desc} onChange={setDesc} placeholder="Objectif, offre, contexte…" />
            </div>

            <div>
                <CwLabel>Catégorie Meta</CwLabel>
                <div className="grid grid-cols-3 gap-2">
                    {CATS.map((c) => {
                        const on = cat === c.id
                        return (
                            <button
                                key={c.id}
                                type="button"
                                disabled={c.disabled}
                                onClick={() => !c.disabled && selectCat(c.id as TemplateCategory)}
                                className="rounded-[10px] border px-[13px] py-3 text-left transition-colors"
                                style={{
                                    cursor: c.disabled ? "not-allowed" : "pointer",
                                    borderColor: on ? "var(--accent)" : "var(--ink-200)",
                                    background: on ? "rgba(105,56,239,0.05)" : "var(--paper-white)",
                                    opacity: c.disabled ? 0.5 : 1,
                                }}
                            >
                                <Icon name={c.icon} size={16} color={on ? "var(--accent)" : "var(--ink-500)"} />
                                <div className="mt-2 text-[13px] font-semibold tracking-[-0.005em] text-[var(--ink-900)]">
                                    {c.title}
                                </div>
                                <div className="mt-[3px] text-[11.5px] leading-[1.35] text-[var(--ink-soft)]">
                                    {c.desc}
                                </div>
                                <div
                                    className="mt-[7px] font-mono text-[10.5px] tabular-nums"
                                    style={{ color: on ? "var(--accent)" : "var(--ink-soft)" }}
                                >
                                    {c.price}
                                    {c.price !== "—" ? " / conv." : ""}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
