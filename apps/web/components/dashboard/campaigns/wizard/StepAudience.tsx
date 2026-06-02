import { Chip } from "@/components/dashboard/primitives/Chip"
import { Icon } from "@/components/dashboard/primitives/Icon"
import type { CampaignWizardData } from "./types"

/**
 * StepAudience — Étape 3 of the v3 campaign wizard. Pick who receives the
 * broadcast (everyone / a segment / a country) and refine with tags. An
 * estimate card shows the reachable count after opt-out exclusions.
 * Presentational: selection comes from the fixture draft.
 */
export function StepAudience({ data }: { data: CampaignWizardData }) {
    const { draft, audienceOptions, audiencePool } = data

    return (
        <div className="space-y-6 px-8 py-8">
            <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Étape 3 · Audience
                </div>
                <h2 className="mt-1 font-display text-[20px] tracking-[-0.01em] text-[var(--ink-900)]">
                    Définir l&apos;audience
                </h2>
                <p className="mt-1 text-[13px] text-[var(--ink-500)]">
                    Ciblez l&apos;ensemble de vos contacts ou affinez par segment et
                    pays. Les contacts opt-out sont exclus automatiquement.
                </p>
            </div>

            {/* Radio-cards — audience type */}
            <div className="flex flex-col gap-2">
                {audienceOptions.map((opt) => {
                    const isSel = opt.type === draft.audienceType
                    return (
                        <div
                            key={opt.type}
                            className="flex cursor-pointer items-start gap-3 rounded-xl border px-[14px] py-3 transition-colors"
                            style={{
                                background: isSel ? "rgba(105,56,239,0.05)" : "transparent",
                                borderColor: isSel ? "var(--accent)" : "var(--ink-200)",
                            }}
                        >
                            <span
                                className="mt-[1px] flex shrink-0 items-center justify-center"
                                style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    border: `1.5px solid ${isSel ? "var(--accent)" : "var(--ink-300)"}`,
                                    background: isSel ? "var(--accent)" : "transparent",
                                }}
                            >
                                {isSel && (
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 3,
                                            background: "#fff",
                                            display: "block",
                                        }}
                                    />
                                )}
                            </span>
                            <div className="flex-1">
                                <div className="text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink-900)]">
                                    {opt.label}
                                </div>
                                <div className="mt-0.5 text-[12px] text-[var(--ink-soft)]">
                                    {opt.sub}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Tag chips — shown when not targeting everyone */}
            {draft.audienceType !== "all" ? (
                <div>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                        Filtres
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {audiencePool.map((tag) => {
                            const on = draft.audienceTags.includes(tag)
                            return (
                                <Chip key={tag} tone={on ? "accent" : "neutral"}>
                                    {tag}
                                </Chip>
                            )
                        })}
                    </div>
                </div>
            ) : null}

            {/* Estimate card */}
            <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)] p-4">
                <div className="flex items-center gap-3">
                    <span
                        className="flex shrink-0 items-center justify-center rounded-lg"
                        style={{
                            width: 40,
                            height: 40,
                            background: "var(--accent-muted)",
                        }}
                    >
                        <Icon name="users" size={20} color="var(--accent)" />
                    </span>
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-[24px] tabular-nums tracking-[-0.01em] text-[var(--ink-900)]">
                                {draft.audienceCount.toLocaleString("fr-FR")}
                            </span>
                            <span className="text-[13px] text-[var(--ink-500)]">contacts</span>
                        </div>
                        <div className="mt-0.5 text-[12px] text-[var(--status-warn)]">
                            {draft.audienceExcluded.toLocaleString("fr-FR")} exclus (opt-out)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
