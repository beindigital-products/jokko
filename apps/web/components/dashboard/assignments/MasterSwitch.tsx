import { Chip } from "../primitives/Chip"

interface MasterSwitchProps {
    enabled: boolean
    activeSinceLabel: string
}

/**
 * MasterSwitch — toggle pill + description for the global auto-assignment
 * feature. Shows "active since N days" chip when on.
 */
export function MasterSwitch({ enabled, activeSinceLabel }: MasterSwitchProps) {
    return (
        <div className="flex items-center gap-[18px] rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-[22px] py-[18px]">
            {/* Toggle visual */}
            <div
                className="relative shrink-0"
                style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: enabled ? "var(--accent)" : "var(--ink-300)",
                }}
            >
                <div
                    className="absolute"
                    style={{
                        top: 2,
                        left: enabled ? 22 : 2,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                        transition: "left 0.15s",
                    }}
                />
            </div>

            {/* Text */}
            <div className="flex-1">
                <div className="font-editorial text-[22px] leading-[1.1] tracking-[-0.01em] text-[var(--ink-900)]">
                    Auto-assignation activée
                </div>
                <div
                    className="mt-1 text-[13px] tracking-[-0.005em] text-[var(--ink-500)]"
                >
                    Les nouvelles conversations sont distribuées automatiquement selon les règles ci-dessous.
                </div>
            </div>

            {enabled ? (
                <Chip tone="good">● {activeSinceLabel}</Chip>
            ) : (
                <Chip tone="neutral">Inactif</Chip>
            )}
        </div>
    )
}
