import type { FallbackOption } from "./types"

interface FallbackToggleProps {
    option: FallbackOption
}

/**
 * FallbackToggle — a single on/off row with a small toggle track + label.
 * Visual-only (no click handler in Storybook fixtures).
 */
export function FallbackToggle({ option }: FallbackToggleProps) {
    return (
        <div className="flex items-center gap-2.5">
            {/* Mini toggle */}
            <div
                className="relative shrink-0"
                style={{
                    width: 28,
                    height: 16,
                    borderRadius: 8,
                    background: option.enabled ? "var(--accent)" : "var(--ink-300)",
                }}
            >
                <div
                    className="absolute"
                    style={{
                        top: 2,
                        left: option.enabled ? 14 : 2,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        background: "#fff",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                        transition: "left 0.15s",
                    }}
                />
            </div>
            <span className="text-[13px] tracking-[-0.005em] text-[var(--ink-900)]">
                {option.label}
            </span>
        </div>
    )
}
