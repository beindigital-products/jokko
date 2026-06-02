import { Icon } from "@/components/dashboard/primitives/Icon"
import type { CampaignWizardData } from "./types"

/**
 * StepVariables — Étape 4 of the v3 campaign wizard. Map each {{N}} placeholder
 * of the chosen template to a data source, with a live example value.
 * Presentational: the mapping comes from the fixture draft.
 */
export function StepVariables({ data }: { data: CampaignWizardData }) {
    const { variables } = data.draft

    return (
        <div className="space-y-6 px-8 py-8">
            <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Étape 4 · Variables
                </div>
                <h2 className="mt-1 font-display text-[20px] tracking-[-0.01em] text-[var(--ink-900)]">
                    Personnaliser les variables
                </h2>
                <p className="mt-1 text-[13px] text-[var(--ink-500)]">
                    Reliez chaque variable du modèle à une donnée de contact ou à
                    une valeur fixe. L&apos;exemple montre le rendu pour un contact.
                </p>
            </div>

            <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-[22px] py-[18px]">
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    Variables du modèle
                </div>

                {variables.length === 0 ? (
                    <p className="mt-3 text-[12.5px] text-[var(--ink-soft)]">
                        Ce modèle ne contient aucune variable.
                    </p>
                ) : (
                    <div className="mt-[14px] flex flex-col gap-2">
                        {variables.map((v) => (
                            <div
                                key={v.token}
                                className="flex items-center gap-3 rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-2.5"
                            >
                                {/* Token chip */}
                                <span className="shrink-0 rounded-md bg-[var(--accent-muted)] px-2 py-1 font-mono text-[11px] font-medium text-[var(--accent)]">
                                    {v.token}
                                </span>

                                {/* Source — select-like field */}
                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-2">
                                    <span className="truncate text-[13px] text-[var(--ink-900)]">
                                        {v.source}
                                    </span>
                                    <Icon name="chevron-down" size={16} color="var(--ink-500)" />
                                </div>

                                {/* Example pill */}
                                <span className="shrink-0 rounded-md bg-[var(--paper-white)] px-2 py-1 font-mono text-[11px] text-[var(--ink-soft)]">
                                    {v.example}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <p className="mt-3 text-[11.5px] text-[var(--ink-soft)]">
                    Les variables proviennent du modèle sélectionné à l&apos;étape 2.
                </p>
            </div>
        </div>
    )
}
