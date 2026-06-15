// Shared building blocks for the campaign-wizard steps: the controlled props
// shape the shell passes down, plus the small label/input primitives the design
// uses (`CwLabel`, `CwInput`). Kept internal to the wizard folder.

import { cn } from "@/lib/utils"
import type {
    CampaignWizardData,
    SendMode,
    TemplateCategory,
    TemplateVar,
} from "./types"

/** Everything the shell computes once and shares with every step + the rail. */
export interface WizardState {
    data: CampaignWizardData
    /** Owner can pick any sending number; others are locked to the first. */
    role: "OWNER" | "ADMIN" | "AGENT"

    // ── draft values ──────────────────────────────────────────────
    name: string
    desc: string
    cat: TemplateCategory
    tplId: string
    segId: string
    vars: TemplateVar[]
    mode: SendMode
    date: string
    time: string
    numId: string

    // ── setters ───────────────────────────────────────────────────
    setName: (v: string) => void
    setDesc: (v: string) => void
    selectCat: (c: TemplateCategory) => void
    selectTpl: (id: string) => void
    setSegId: (id: string) => void
    setVar: (i: number, patch: Partial<TemplateVar>) => void
    setMode: (m: SendMode) => void
    setDate: (v: string) => void
    setTime: (v: string) => void
    setNumId: (id: string) => void

    // ── derived ───────────────────────────────────────────────────
    eligible: number
    perConv: number
    cost: number
    after: number
    ok: boolean
    dateShort: string
    dateLabel: string
}

/** Field label with an optional right-aligned hint. Mirrors `CwLabel`. */
export function CwLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
    return (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="whitespace-nowrap text-[12px] font-medium text-[var(--ink-700)]">{children}</span>
            {hint ? (
                <span className="min-w-0 flex-shrink truncate whitespace-nowrap text-[11px] text-[var(--ink-soft)]">
                    {hint}
                </span>
            ) : null}
        </div>
    )
}

/** Rounded text input. Mirrors `CwInput` (sans by default, mono variant). */
export function CwInput({
    value,
    onChange,
    placeholder,
    mono,
    type = "text",
}: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
    mono?: boolean
    type?: "text" | "date" | "time"
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
                "h-[38px] w-full rounded-[9px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 tracking-[-0.005em] text-[var(--ink-900)] outline-none transition-colors placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]",
                mono ? "font-mono text-[12.5px]" : "text-[13.5px]",
            )}
        />
    )
}
