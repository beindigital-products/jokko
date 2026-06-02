import { Input } from "@/components/ui/input"
import type { CampaignWizardData } from "./types"

/**
 * StepName — Étape 1 of the v3 campaign wizard. Names the campaign and gives it
 * an optional internal description. Presentational: values come from the fixture
 * draft, no real handlers.
 */
export function StepName({ data }: { data: CampaignWizardData }) {
    const { draft } = data

    return (
        <div className="space-y-6 px-8 py-8">
            <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Étape 1 · Nom
                </div>
                <h2 className="mt-1 font-display text-[20px] tracking-[-0.01em] text-[var(--ink-900)]">
                    Nommer la campagne
                </h2>
                <p className="mt-1 text-[13px] text-[var(--ink-500)]">
                    Un nom interne pour retrouver cette campagne dans vos rapports.
                    Vos contacts ne le verront jamais.
                </p>
            </div>

            <div className="max-w-xl space-y-5">
                <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-700)]">
                        Nom de la campagne
                    </label>
                    <Input defaultValue={draft.name} placeholder="Relance soldes d'été" />
                    <p className="mt-1.5 text-[11.5px] text-[var(--ink-soft)]">
                        Visible uniquement par votre équipe.
                    </p>
                </div>

                <div>
                    <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-700)]">
                        Description (optionnel)
                    </label>
                    <textarea
                        defaultValue={draft.description}
                        placeholder="Objectif, audience visée, offre…"
                        className="min-h-20 w-full rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-2 text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-500)] transition-all focus:border-[var(--accent)] focus:bg-[var(--paper-white)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)]"
                    />
                    <p className="mt-1.5 text-[11.5px] text-[var(--ink-soft)]">
                        Une note rapide pour le contexte. Aucun impact sur l&apos;envoi.
                    </p>
                </div>
            </div>
        </div>
    )
}
