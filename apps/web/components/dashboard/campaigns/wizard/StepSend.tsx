import { Chip } from "@/components/dashboard/primitives/Chip"
import { Icon } from "@/components/dashboard/primitives/Icon"
import type { CampaignWizardData } from "./types"

/**
 * StepSend — Étape 5 of the v3 campaign wizard. Pick the WhatsApp number that
 * sends the broadcast and choose between immediate and scheduled delivery.
 * Presentational: selection comes from the fixture draft.
 */
export function StepSend({ data }: { data: CampaignWizardData }) {
    const { draft, sendingNumbers } = data

    return (
        <div className="space-y-6 px-8 py-8">
            <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Étape 5 · Envoi
                </div>
                <h2 className="mt-1 font-display text-[20px] tracking-[-0.01em] text-[var(--ink-900)]">
                    Numéro et planification
                </h2>
                <p className="mt-1 text-[13px] text-[var(--ink-500)]">
                    Choisissez le numéro expéditeur, puis envoyez immédiatement ou
                    planifiez la diffusion.
                </p>
            </div>

            {/* Sending number */}
            <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Numéro d&apos;envoi
                </div>
                <div className="flex flex-col gap-2">
                    {sendingNumbers.map((n) => {
                        const isSel = n.id === draft.sendingNumberId
                        return (
                            <div
                                key={n.id}
                                className="flex cursor-pointer items-center gap-3 rounded-xl border px-[14px] py-3 transition-colors"
                                style={{
                                    background: isSel ? "rgba(105,56,239,0.05)" : "transparent",
                                    borderColor: isSel ? "var(--accent)" : "var(--ink-200)",
                                }}
                            >
                                <span
                                    className="flex shrink-0 items-center justify-center"
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
                                    <div className="font-display text-[13.5px] tracking-[-0.005em] text-[var(--ink-900)]">
                                        {n.city}
                                    </div>
                                    <div className="mt-0.5 font-mono text-[11.5px] text-[var(--ink-soft)]">
                                        {n.number}
                                    </div>
                                </div>
                                <Chip tone="neutral">{n.pole}</Chip>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Schedule */}
            <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Planification
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {(
                        [
                            { value: "now", icon: "send", label: "Envoyer maintenant", sub: "Diffusion dès la validation" },
                            { value: "scheduled", icon: "clock", label: "Planifier", sub: "Choisir une date et une heure" },
                        ] as const
                    ).map((opt) => {
                        const isSel = draft.schedule === opt.value
                        return (
                            <div
                                key={opt.value}
                                className="flex cursor-pointer items-start gap-3 rounded-xl border px-[14px] py-3 transition-colors"
                                style={{
                                    background: isSel ? "rgba(105,56,239,0.05)" : "transparent",
                                    borderColor: isSel ? "var(--accent)" : "var(--ink-200)",
                                }}
                            >
                                <Icon
                                    name={opt.icon}
                                    size={18}
                                    color={isSel ? "var(--accent)" : "var(--ink-500)"}
                                />
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

                {draft.schedule === "scheduled" ? (
                    <div className="mt-2 flex max-w-sm items-center gap-2 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-2.5">
                        <Icon name="clock" size={16} color="var(--ink-500)" />
                        <span className="text-[13px] text-[var(--ink-900)]">
                            {draft.scheduleLabel}
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
