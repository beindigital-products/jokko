import { Icon } from "@/components/dashboard/primitives/Icon"
import { CwLabel, type WizardState } from "./_shared"
import { cwFmt } from "./wizard-data"

/**
 * StepAudience — Étape 3 (Audience). A radio list of contact segments (each with
 * count + auto-excluded total) and a breakdown card detailing why contacts are
 * excluded (opt-out / invalid / out-of-window). Controlled by the shell.
 */
export function StepAudience({ data, segId, setSegId }: WizardState) {
    const seg = data.segments.find((s) => s.id === segId) ?? data.segments[0]
    const optOut = Math.round(seg.excluded * 0.6)
    const invalid = Math.round(seg.excluded * 0.25)
    const window = seg.excluded - optOut - invalid

    return (
        <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-2">
                <CwLabel>Segment de contacts</CwLabel>
                {data.segments.map((s) => {
                    const on = s.id === segId
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setSegId(s.id)}
                            className="flex items-center gap-3 rounded-[10px] border px-3.5 py-[11px] text-left transition-colors"
                            style={{
                                cursor: "pointer",
                                borderColor: on ? "var(--accent)" : "var(--ink-200)",
                                background: on ? "rgba(105,56,239,0.05)" : "var(--paper-white)",
                            }}
                        >
                            {on ? (
                                <Icon name="circle-check" size={18} color="var(--accent)" />
                            ) : (
                                <span className="h-[18px] w-[18px] shrink-0 rounded-full border-[1.5px] border-[var(--ink-300)]" />
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="text-[13.5px] font-semibold tracking-[-0.005em] text-[var(--ink-900)]">
                                    {s.fr}
                                </div>
                                <div className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">{s.desc}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-[13px] font-medium tabular-nums text-[var(--ink-900)]">
                                    {cwFmt(s.total)}
                                </div>
                                <div className="mt-px font-mono text-[10.5px] tabular-nums text-[var(--ink-soft)]">
                                    −{cwFmt(s.excluded)} exclus
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-warm)] px-[15px] py-[13px]">
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                    Exclusions automatiques
                </div>
                <div className="mt-2.5 flex flex-col gap-[7px]">
                    {[
                        { l: "Désabonnés / opt-out marketing", n: optOut },
                        { l: "Numéros invalides ou en doublon", n: invalid },
                        { l: "Hors fenêtre / qualité basse", n: window },
                    ].map((e) => (
                        <div key={e.l} className="flex items-center justify-between text-[12.5px]">
                            <span className="text-[var(--ink-500)]">{e.l}</span>
                            <span className="font-mono text-[11.5px] tabular-nums text-[var(--ink-soft)]">
                                −{cwFmt(e.n)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
