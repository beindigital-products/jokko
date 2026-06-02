import type { StrategyOption } from "./types"

interface StrategyCardProps {
    strategies: StrategyOption[]
}

/** Radio-list of assignment strategies. Selected row is highlighted. */
export function StrategyCard({ strategies }: StrategyCardProps) {
    return (
        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-[22px] py-[18px]">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                Stratégie d&apos;assignation
            </div>

            <div className="mt-[14px] flex flex-col gap-2">
                {strategies.map((s) => (
                    <div
                        key={s.id}
                        className="flex cursor-pointer items-start gap-3 rounded-[10px] border px-[14px] py-3 transition-colors"
                        style={{
                            background: s.selected
                                ? "rgba(105,56,239,0.06)"
                                : "transparent",
                            borderColor: s.selected
                                ? "rgba(105,56,239,0.25)"
                                : "var(--ink-200)",
                        }}
                    >
                        {/* Radio dot */}
                        <span
                            className="mt-[1px] shrink-0 flex items-center justify-center"
                            style={{
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                                border: `1.5px solid ${s.selected ? "var(--accent)" : "var(--ink-300)"}`,
                                background: s.selected ? "var(--accent)" : "transparent",
                            }}
                        >
                            {s.selected && (
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
                                {s.label}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[var(--ink-soft)]">
                                {s.sub}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
