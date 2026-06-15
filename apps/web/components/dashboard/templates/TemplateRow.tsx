import { cn } from "@/lib/utils"
import { TemplateStatusPill } from "./TemplateStatusPill"
import { TEMPLATES_COLS, type TemplateRow as TemplateRowData } from "./types"

interface TemplateRowProps {
    template: TemplateRowData
    selected?: boolean
    onClick?: () => void
}

/** A single template row: name + preview snippet, category, lang, Meta status, stats. */
export function TemplateRow({ template: t, selected, onClick }: TemplateRowProps) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
            className={cn(
                "grid items-center gap-x-5 border-b border-[var(--ink-100)] transition-colors hover:bg-[var(--paper-warm)]/50",
                selected
                    ? "border-l-2 border-l-[var(--accent)] bg-[var(--paper-warm)]/60 pl-[22px]"
                    : "border-l-2 border-l-transparent pl-6",
            )}
            style={{ gridTemplateColumns: TEMPLATES_COLS, height: 64, paddingRight: 32 }}
        >
            <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium tracking-tight text-[var(--ink-900)]">
                    {t.name}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-[var(--ink-soft)]">{t.preview}</div>
            </div>
            <div className="truncate text-[12.5px] text-[var(--ink-500)]">{t.category}</div>
            <div className="font-mono text-[11.5px] uppercase text-[var(--ink-500)]">{t.lang}</div>
            <div>
                <TemplateStatusPill status={t.status} />
            </div>
            <div className="text-right text-[13px] font-medium tabular-nums text-[var(--ink-900)]">
                {t.sent}
            </div>
            <div className="text-right font-mono text-[12px] tabular-nums text-[var(--ink-500)]">
                {t.open}
            </div>
        </div>
    )
}
