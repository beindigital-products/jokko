import { Icon } from "@/components/dashboard/primitives/Icon"
import type { WizardState } from "./_shared"
import { cwFmt } from "./wizard-data"
import { fcfa } from "@/lib/dashboard/overview-data"

/**
 * StepReview — Étape 6 (Récap). Read-back of every choice (name, category,
 * template, audience, number, schedule), a green compliance note, and the cost
 * card — which flips to a red "Crédit insuffisant" state when the wallet can't
 * cover the send. Controlled by the shell. Recreates the design's step 6.
 */
export function StepReview(state: WizardState) {
    const { data, role, name, cat, segId, numId, mode, time, eligible, perConv, cost, after, ok, dateLabel } = state
    const tpl = data.templates.find((t) => t.id === state.tplId) ?? data.templates[0]
    const seg = data.segments.find((s) => s.id === segId) ?? data.segments[0]
    const num = data.numbers.find((n) => n.id === numId) ?? data.numbers[0]
    const numberLocked = role !== "OWNER"

    const scheduleText =
        mode === "now" ? "Dès validation" : `${dateLabel} · ${time} · Europe/Paris`

    const rows: { k: string; v: string; lock?: boolean }[] = [
        { k: "Nom", v: name },
        { k: "Catégorie", v: cat },
        { k: "Modèle Meta", v: `${tpl.name} · ${tpl.lang} · approuvé` },
        {
            k: "Audience",
            v: `${seg.fr} · ${cwFmt(eligible)} éligibles · ${cwFmt(seg.excluded)} exclus`,
        },
        { k: "Numéro", v: `${num.label} · ${num.num}`, lock: numberLocked },
        { k: "Planification", v: scheduleText },
    ]

    return (
        <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-[11px]">
                {rows.map((f) => (
                    <div key={f.k} className="grid grid-cols-[140px_1fr] items-start gap-3.5">
                        <div className="pt-px text-[12px] text-[var(--ink-soft)]">{f.k}</div>
                        <div className="text-[13.5px] font-medium tracking-[-0.005em] text-[var(--ink-900)]">
                            {f.v}
                            {f.lock ? (
                                <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--status-warn)]">
                                    · verrouillé
                                </span>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2.5 rounded-[9px] border border-[var(--status-good)]/25 bg-[var(--status-good)]/[0.06] px-3.5 py-3 text-[12.5px] text-[var(--ink-700)]">
                <Icon name="shield" size={14} color="var(--status-good)" />
                <div>
                    <b className="text-[var(--status-good)]">Conformité OK</b> · {cwFmt(eligible)} contacts ont donné leur
                    consentement et sont éligibles à la catégorie {cat}.
                </div>
            </div>

            <div
                className="rounded-[10px] border bg-[var(--paper-warm)] px-4 py-3.5"
                style={{ borderColor: ok ? "var(--ink-200)" : "rgba(220,56,56,0.35)" }}
            >
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Coût estimé
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-[28px] font-medium tabular-nums tracking-[-0.01em] text-[var(--ink-900)]">
                        {fcfa(cost)}
                    </span>
                    <span className="text-[11px] text-[var(--ink-soft)]">
                        {cwFmt(eligible)} conv. × {fcfa(perConv)} (Meta {cat} {tpl.lang})
                    </span>
                </div>
                <div
                    className="mt-2 font-mono text-[11px] tabular-nums"
                    style={{ color: ok ? "var(--status-good)" : "var(--status-danger)" }}
                >
                    {ok
                        ? `Solde après : ${fcfa(after)} · OK`
                        : `Crédit insuffisant · manque ${fcfa(-after)}`}
                </div>
            </div>
        </div>
    )
}
