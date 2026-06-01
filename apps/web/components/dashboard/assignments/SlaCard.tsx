import { SlaMetricTile } from "./SlaMetricTile"
import type { SlaMetric } from "./types"

interface SlaCardProps {
    slas: SlaMetric[]
    alert: string
}

/**
 * SlaCard — two SLA metric tiles (première réponse + résolution)
 * plus a warn alert banner below.
 */
export function SlaCard({ slas, alert }: SlaCardProps) {
    return (
        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-[22px] py-[18px]">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                SLA · délais de réponse
            </div>

            <div className="mt-[14px] grid grid-cols-2 gap-[14px]">
                {slas.map((s) => (
                    <SlaMetricTile key={s.label} metric={s} />
                ))}
            </div>

            {/* Alert banner */}
            <div
                className="mt-[14px] rounded-lg border px-[14px] py-2.5 text-[12px] tracking-[-0.005em] text-[var(--ink-700)]"
                style={{
                    background: "rgba(184,134,11,0.08)",
                    borderColor: "rgba(184,134,11,0.25)",
                }}
            >
                <b style={{ color: "var(--status-warn)" }}>Alerte</b>{" "}
                &middot; {alert}
            </div>
        </div>
    )
}
