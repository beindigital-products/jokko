import { cn } from "@/lib/utils"

/**
 * AutomationToggle — the design's on/off pill switch (34×20, sliding 16px knob).
 * Accent when on, ink-200 when off. Used in the list rows to flip a flow
 * active/inactive without leaving the page.
 */
export function AutomationToggle({
    on,
    onToggle,
    label,
    w = 34,
    h = 20,
}: {
    on: boolean
    onToggle?: () => void
    label?: string
    w?: number
    h?: number
}) {
    const knob = h - 4
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label ?? (on ? "Désactiver" : "Activer")}
            disabled={!onToggle}
            onClick={
                onToggle
                    ? (e) => {
                          e.stopPropagation()
                          onToggle()
                      }
                    : undefined
            }
            style={{ width: w, height: h, borderRadius: h }}
            className={cn(
                "relative shrink-0 transition-colors",
                on ? "bg-[var(--accent)]" : "bg-[var(--ink-200)]",
                onToggle ? "cursor-pointer" : "cursor-default",
            )}
        >
            <span
                className="absolute top-[2px] rounded-full bg-white shadow-[0_1px_2px_rgba(10,10,10,0.22)] transition-[left]"
                style={{ width: knob, height: knob, left: on ? w - h + 2 : 2 }}
            />
        </button>
    )
}
