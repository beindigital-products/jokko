import { Chip } from "@/components/dashboard/primitives/Chip"
import { Icon } from "@/components/dashboard/primitives/Icon"
import { WhatsAppPreview } from "./WhatsAppPreview"
import type { CampaignWizardData, TemplateStatus, WizardTemplate } from "./types"

const STATUS_META: Record<TemplateStatus, { tone: "good" | "warn" | "danger"; label: string }> = {
    approved: { tone: "good", label: "Approuvé" },
    pending: { tone: "warn", label: "En attente" },
    rejected: { tone: "danger", label: "Rejeté" },
}

/**
 * StepTemplate — Étape 2 of the v3 campaign wizard. Pick the Meta-approved
 * template to broadcast; a live WhatsApp preview tracks the selection.
 * Presentational: selection is derived from the fixture draft.
 */
export function StepTemplate({ data }: { data: CampaignWizardData }) {
    const { draft, templates } = data
    const selected: WizardTemplate | undefined =
        templates.find((t) => t.id === draft.templateId) ?? templates[0]

    return (
        <div className="space-y-6 px-8 py-8">
            <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Étape 2 · Modèle
                </div>
                <h2 className="mt-1 font-display text-[20px] tracking-[-0.01em] text-[var(--ink-900)]">
                    Choisir le modèle
                </h2>
                <p className="mt-1 text-[13px] text-[var(--ink-500)]">
                    Seuls les modèles approuvés par Meta peuvent être diffusés en
                    masse. L&apos;aperçu se met à jour à droite.
                </p>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) 320px" }}>
                {/* Left — selectable template list */}
                <div className="flex flex-col gap-2">
                    {templates.map((t) => {
                        const isSel = t.id === selected?.id
                        const status = STATUS_META[t.status]
                        return (
                            <div
                                key={t.id}
                                className="cursor-pointer rounded-xl border px-[18px] py-3.5 transition-colors"
                                style={{
                                    background: isSel
                                        ? "rgba(105,56,239,0.05)"
                                        : "var(--paper-white)",
                                    borderColor: isSel
                                        ? "var(--accent)"
                                        : "var(--ink-200)",
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="min-w-0 flex-1 truncate font-display text-[15px] tracking-[-0.005em] text-[var(--ink-900)]">
                                        {t.name}
                                    </div>
                                    {isSel ? (
                                        <Icon name="check" size={16} color="var(--accent)" />
                                    ) : null}
                                </div>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    <Chip tone="neutral">{t.category}</Chip>
                                    <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--ink-500)]">
                                        {t.lang}
                                    </span>
                                    <Chip tone={status.tone}>{status.label}</Chip>
                                </div>
                                <div className="mt-1.5 truncate text-[12px] text-[var(--ink-soft)]">
                                    {t.body}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Right — live WhatsApp preview */}
                <div className="lg:sticky lg:top-4 lg:self-start">
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        Aperçu
                    </div>
                    {selected ? (
                        <WhatsAppPreview template={selected} variables={draft.variables} />
                    ) : (
                        <div className="rounded-xl border border-dashed border-[var(--ink-200)] p-6 text-center text-[12px] text-[var(--ink-soft)]">
                            Aucun modèle sélectionné.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
