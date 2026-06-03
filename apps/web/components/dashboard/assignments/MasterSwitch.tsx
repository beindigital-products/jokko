import { Chip } from "../primitives/Chip"

interface MasterSwitchProps {
    enabled: boolean
    activeSinceLabel: string
    /** When provided the toggle becomes interactive (fires on click). */
    onToggle?: (next: boolean) => void
    /** Disables the toggle while a mutation is in flight. */
    pending?: boolean
}

/**
 * MasterSwitch — toggle pill + description for the global auto-assignment
 * feature. Static when `onToggle` is omitted (Storybook fixtures); a real
 * switch button when wired. Shows an "active" chip when on.
 */
export function MasterSwitch({ enabled, activeSinceLabel, onToggle, pending }: MasterSwitchProps) {
    const interactive = typeof onToggle === "function"

    const toggleVisual = (
        <>
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
        </>
    )

    const toggleStyle = {
        width: 44,
        height: 24,
        borderRadius: 12,
        background: enabled ? "var(--accent)" : "var(--ink-300)",
    } as const

    return (
        <div className="flex items-center gap-[18px] rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-[22px] py-[18px]">
            {/* Toggle */}
            {interactive ? (
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label="Auto-assignation"
                    disabled={pending}
                    onClick={() => onToggle?.(!enabled)}
                    className="relative shrink-0 disabled:opacity-60"
                    style={toggleStyle}
                >
                    {toggleVisual}
                </button>
            ) : (
                <div className="relative shrink-0" style={toggleStyle}>
                    {toggleVisual}
                </div>
            )}

            {/* Text */}
            <div className="flex-1">
                <div className="font-editorial text-[22px] leading-[1.1] tracking-[-0.01em] text-[var(--ink-900)]">
                    {enabled ? "Auto-assignation activée" : "Auto-assignation désactivée"}
                </div>
                <div className="mt-1 text-[13px] tracking-[-0.005em] text-[var(--ink-500)]">
                    {enabled
                        ? "Les nouvelles conversations sont distribuées automatiquement aux agents disponibles."
                        : "Les nouvelles conversations restent dans la file ci-dessous, à attribuer manuellement."}
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
