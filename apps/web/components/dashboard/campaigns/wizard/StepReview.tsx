import { Check } from "lucide-react"

import { WhatsAppPreview } from "./WhatsAppPreview"
import type { CampaignWizardData } from "./types"

function ReviewRow({ label, value, locked }: { label: string; value: string; locked?: boolean }) {
    return (
        <div className="grid grid-cols-[160px_1fr] items-start gap-3.5">
            <div className="pt-0.5 text-[12px] text-[var(--ink-soft)]">{label}</div>
            <div className="text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink-900)]">
                {value}
                {locked ? (
                    <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--status-warn)]">
                        · verrouillé · Owner
                    </span>
                ) : null}
            </div>
        </div>
    )
}

/**
 * StepReview — the final "Récap" panel. Left: review fields + a compliance
 * note + the estimated cost. Right: the WhatsApp preview + mapped variables.
 * Recreates the design's campaign-wizard review step.
 */
export function StepReview({ data }: { data: CampaignWizardData }) {
    const { draft, cost } = data
    const template = data.templates.find((t) => t.id === draft.templateId) ?? data.templates[0]
    const number = data.sendingNumbers.find((n) => n.id === draft.sendingNumberId) ?? data.sendingNumbers[0]
    const audienceValue =
        draft.audienceType === "all"
            ? `Tous les contacts · ${draft.audienceCount} · ${draft.audienceExcluded} exclus (opt-out)`
            : `${draft.audienceTags.join(", ")} · ${draft.audienceCount} contacts · ${draft.audienceExcluded} exclus (opt-out)`

    return (
        <div className="px-8 py-8">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Étape 6 · Récapitulatif
            </div>
            <h2 className="mt-1 font-display text-[22px] font-medium tracking-tight text-[var(--ink-900)]">
                Vérifiez puis confirmez l&apos;envoi
            </h2>

            <div className="mt-6 grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) 320px" }}>
                {/* Left — review + compliance + cost */}
                <div className="flex flex-col gap-3.5">
                    <ReviewRow label="Nom" value={draft.name} />
                    {draft.description ? <ReviewRow label="Description" value={draft.description} /> : null}
                    <ReviewRow
                        label="Modèle Meta"
                        value={template ? `${template.name} · ${template.lang} · approuvé` : "—"}
                    />
                    <ReviewRow label="Audience" value={audienceValue} />
                    <ReviewRow
                        label="Numéro d'envoi"
                        value={number ? `${number.city} · ${number.number}` : "—"}
                    />
                    <ReviewRow
                        label="Planification"
                        value={draft.schedule === "now" ? "Envoi immédiat" : draft.scheduleLabel}
                    />

                    {/* Compliance */}
                    <div className="mt-1.5 flex gap-2.5 rounded-lg border border-[var(--status-good)]/25 bg-[var(--status-good)]/[0.06] px-3.5 py-3 text-[12.5px] text-[var(--ink-700)]">
                        <Check className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--status-good)]" strokeWidth={2.6} />
                        <div>
                            <b className="text-[var(--status-good)]">Conformité OK</b> · {draft.audienceCount}{" "}
                            contacts ont donné leur consentement et sont éligibles à la catégorie Marketing.
                        </div>
                    </div>

                    {/* Cost */}
                    <div className="rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-warm)] px-4 py-3.5">
                        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                            Coût estimé
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="font-display text-[28px] font-medium tabular-nums tracking-tight text-[var(--ink-900)]">
                                {cost.amount}
                            </span>
                            <span className="text-[11px] text-[var(--ink-soft)]">{cost.detail}</span>
                        </div>
                        <div
                            className="mt-2 font-mono text-[11px] tabular-nums"
                            style={{ color: cost.ok ? "var(--status-good)" : "var(--status-danger)" }}
                        >
                            Solde après : {cost.balanceAfter} · {cost.ok ? "OK" : "insuffisant"}
                        </div>
                    </div>
                </div>

                {/* Right — preview + variables */}
                <div className="flex flex-col gap-2.5">
                    <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        Aperçu
                    </div>
                    {template ? <WhatsAppPreview template={template} variables={draft.variables} /> : null}
                    <div className="mt-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        Variables mappées
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {draft.variables.map((v) => (
                            <div
                                key={v.token}
                                className="flex items-baseline gap-2 rounded-md bg-[var(--paper-warm)] px-2 py-1.5 text-[11.5px]"
                            >
                                <span className="font-mono text-[var(--accent)] tabular-nums">{v.token}</span>
                                <span className="flex-1 text-[var(--ink-700)]">{v.source}</span>
                                <span className="font-mono text-[var(--ink-soft)] tabular-nums">{v.example}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
