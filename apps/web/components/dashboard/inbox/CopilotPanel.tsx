"use client"

import { useState } from "react"
import { Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

import { Avatar, type AvatarColor } from "../primitives/Avatar"

export interface CopilotAttribute {
    label: string
    value: React.ReactNode
}

interface CopilotPanelProps {
    contactName: string
    initials: string
    color?: AvatarColor
    phone?: string
    summary?: string
    draft?: string
    attributes?: CopilotAttribute[]
    onInsert?: () => void
    onRegenerate?: () => void
    onEmail?: () => void
    onCall?: () => void
}

/**
 * CopilotPanel — right column of the inbox view. Contact card +
 * Copilot/Résumé tabs + AI-proposed draft + structured attributes.
 */
export function CopilotPanel({
    contactName,
    initials,
    color = "violet",
    phone,
    summary,
    draft,
    attributes = [],
    onInsert,
    onRegenerate,
    onEmail,
    onCall,
}: CopilotPanelProps) {
    const [tab, setTab] = useState<"copilot" | "summary">("copilot")
    return (
        <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-[var(--ink-200)]">
            <div className="border-b border-[var(--ink-200)] px-4 pt-5 pb-3">
                <Avatar initials={initials} color={color} size="xl" />
                <div className="mt-2 text-[14px] font-semibold text-[var(--ink-900)]">
                    {contactName}
                </div>
                {phone ? (
                    <div className="font-mono text-[10.5px] text-[var(--ink-soft)]">
                        {phone}
                    </div>
                ) : null}
                <div className="mt-2 flex gap-1.5">
                    <button
                        type="button"
                        onClick={onEmail}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--ink-200)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--paper-warm)]"
                    >
                        <Mail className="h-3 w-3" /> Email
                    </button>
                    <button
                        type="button"
                        onClick={onCall}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--ink-200)] px-2 py-1 text-[11px] font-medium hover:bg-[var(--paper-warm)]"
                    >
                        <Phone className="h-3 w-3" /> Appeler
                    </button>
                </div>
            </div>

            <div className="border-b border-[var(--ink-200)] px-4 py-3">
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={() => setTab("copilot")}
                        className={cn(
                            "rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
                            tab === "copilot"
                                ? "bg-[var(--accent)] text-white"
                                : "text-[var(--ink-soft)]",
                        )}
                    >
                        Copilot
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("summary")}
                        className={cn(
                            "rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
                            tab === "summary"
                                ? "bg-[var(--accent)] text-white"
                                : "text-[var(--ink-soft)]",
                        )}
                    >
                        Résumé
                    </button>
                </div>
                {summary ? (
                    <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--ink-700)]">
                        {summary}
                    </p>
                ) : null}
            </div>

            {draft ? (
                <div className="border-b border-[var(--ink-200)] px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Brouillon proposé
                    </p>
                    <div className="mt-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] p-2.5 text-[11.5px] leading-relaxed">
                        {draft}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                        <button
                            type="button"
                            onClick={onInsert}
                            className="flex-1 rounded-md bg-[var(--accent)] py-1 text-[11px] font-semibold text-white hover:bg-[var(--accent-hover)]"
                        >
                            Insérer
                        </button>
                        <button
                            type="button"
                            onClick={onRegenerate}
                            className="flex-1 rounded-md border border-[var(--ink-200)] py-1 text-[11px] font-semibold hover:bg-[var(--paper-warm)]"
                        >
                            Régénérer
                        </button>
                    </div>
                </div>
            ) : null}

            {attributes.length > 0 ? (
                <div className="px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Attributs
                    </p>
                    <dl className="mt-2 space-y-1.5 text-[11.5px]">
                        {attributes.map((a) => (
                            <div key={a.label} className="flex justify-between gap-2">
                                <dt className="text-[var(--ink-soft)]">{a.label}</dt>
                                <dd className="text-right font-medium">{a.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ) : null}
        </aside>
    )
}
