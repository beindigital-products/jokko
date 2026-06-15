import { UsageCard } from "../primitives/UsageCard"
import type { UsageCardTone } from "../primitives/UsageCard"
import type { BillingData } from "./types"

interface UsageStripProps {
    usage: BillingData["usage"]
}

/** Compute the tone for a usage bar given a 0-1 fraction. */
function toneFromFraction(fraction: number): UsageCardTone {
    if (fraction >= 0.9) return "danger"
    if (fraction >= 0.75) return "warn"
    return "accent"
}

/**
 * UsageStrip — 3-column grid of UsageCard primitives showing plan
 * consumption (conversations, contacts, seats). Maps to the "Usage grid"
 * section of ScreenBilling.
 */
export function UsageStrip({ usage }: UsageStripProps) {
    return (
        <div className="grid grid-cols-3 gap-4">
            {usage.map((u) => (
                <UsageCard
                    key={u.label}
                    label={u.label}
                    value={u.value}
                    total={u.total}
                    percent={Math.round(u.fraction * 100)}
                    tone={toneFromFraction(u.fraction)}
                    sub={`Ce mois : ${u.cost}`}
                />
            ))}
        </div>
    )
}
