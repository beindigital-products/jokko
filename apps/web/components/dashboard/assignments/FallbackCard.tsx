import { FallbackToggle } from "./FallbackToggle"
import type { FallbackOption } from "./types"

interface FallbackCardProps {
    description: string
    options: FallbackOption[]
}

/**
 * FallbackCard — "Agent absent · fallback" panel. Describes the fallback
 * behaviour then lists 3 toggles for fine-grained control.
 */
export function FallbackCard({ description, options }: FallbackCardProps) {
    return (
        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-[22px] py-[18px]">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                Agent absent · fallback
            </div>

            <p className="mt-1.5 text-[13px] leading-[1.5] tracking-[-0.005em] text-[var(--ink-500)]">
                {description}
            </p>

            <div className="mt-3 flex flex-col gap-2">
                {options.map((o, i) => (
                    <FallbackToggle key={i} option={o} />
                ))}
            </div>
        </div>
    )
}
