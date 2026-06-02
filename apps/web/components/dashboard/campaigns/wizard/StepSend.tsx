import { Icon, type IconName } from "@/components/dashboard/primitives/Icon"
import { CwInput, CwLabel, type WizardState } from "./_shared"
import type { SendMode } from "./types"

const MODES: { id: SendMode; icon: IconName; title: string; desc: string }[] = [
    { id: "now", icon: "bolt", title: "Envoyer maintenant", desc: "Mise en file immédiate" },
    { id: "scheduled", icon: "clock", title: "Planifier", desc: "Choisir date et heure" },
]

/**
 * StepSend — Étape 5 (Envoi). Sending-number cards (Owner-only choice), the
 * send-moment cards (now / scheduled), the native date+time inputs when
 * scheduled, and a 24h marketing-window warning. Controlled by the shell.
 */
export function StepSend({
    data,
    role,
    numId,
    setNumId,
    mode,
    setMode,
    date,
    setDate,
    time,
    setTime,
}: WizardState) {
    return (
        <div className="flex flex-col gap-[18px]">
            <div>
                <CwLabel>Numéro émetteur</CwLabel>
                <div className="grid grid-cols-2 gap-2">
                    {data.numbers.map((n) => {
                        const on = n.id === numId
                        const locked = role !== "OWNER" && n.id !== data.numbers[0].id
                        return (
                            <button
                                key={n.id}
                                type="button"
                                disabled={locked}
                                onClick={() => !locked && setNumId(n.id)}
                                className="rounded-[10px] border px-[13px] py-[11px] text-left transition-colors"
                                style={{
                                    cursor: locked ? "not-allowed" : "pointer",
                                    borderColor: on ? "var(--accent)" : "var(--ink-200)",
                                    background: on ? "rgba(105,56,239,0.05)" : "var(--paper-white)",
                                    opacity: locked ? 0.5 : 1,
                                }}
                            >
                                <div className="flex items-center gap-[7px]">
                                    <Icon name="whatsapp" size={14} color="var(--status-good)" />
                                    <span className="text-[13px] font-semibold text-[var(--ink-900)]">{n.label}</span>
                                </div>
                                <div className="mt-[5px] font-mono text-[11.5px] tabular-nums text-[var(--ink-500)]">
                                    {n.num}
                                </div>
                                <div className="mt-1 text-[11px] text-[var(--ink-soft)]">Qualité : {n.quality}</div>
                            </button>
                        )
                    })}
                </div>
                {role !== "OWNER" ? (
                    <div className="mt-[7px] flex items-center gap-[5px] text-[11px] text-[var(--status-warn)]">
                        <Icon name="lock" size={11} color="var(--status-warn)" />
                        Le choix du numéro est réservé aux Owners.
                    </div>
                ) : null}
            </div>

            <div>
                <CwLabel>Moment de diffusion</CwLabel>
                <div className="grid grid-cols-2 gap-2">
                    {MODES.map((m) => {
                        const on = mode === m.id
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setMode(m.id)}
                                className="rounded-[10px] border px-[13px] py-[11px] text-left transition-colors"
                                style={{
                                    cursor: "pointer",
                                    borderColor: on ? "var(--accent)" : "var(--ink-200)",
                                    background: on ? "rgba(105,56,239,0.05)" : "var(--paper-white)",
                                }}
                            >
                                <Icon name={m.icon} size={16} color={on ? "var(--accent)" : "var(--ink-500)"} />
                                <div className="mt-[7px] text-[13px] font-semibold text-[var(--ink-900)]">{m.title}</div>
                                <div className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">{m.desc}</div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {mode === "scheduled" ? (
                <div className="grid grid-cols-2 gap-2.5">
                    <div>
                        <CwLabel>Date</CwLabel>
                        <CwInput value={date} onChange={setDate} type="date" mono />
                    </div>
                    <div>
                        <CwLabel>Heure · Europe/Paris</CwLabel>
                        <CwInput value={time} onChange={setTime} type="time" mono />
                    </div>
                </div>
            ) : null}

            <div className="flex gap-[9px] rounded-[9px] border border-[var(--status-warn)]/25 bg-[var(--status-warn)]/[0.07] px-3.5 py-[11px] text-[12px] text-[var(--ink-700)]">
                <Icon name="clock" size={14} color="var(--status-warn)" />
                <div>
                    Fenêtre marketing 24h : chaque destinataire ne recevra qu&apos;un seul message facturé sur 24h, même
                    en cas de relance.
                </div>
            </div>
        </div>
    )
}
