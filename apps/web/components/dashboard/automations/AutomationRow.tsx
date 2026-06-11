import { MoreHorizontal, Sparkles, GitBranch, Play, Pause, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icon } from "../primitives/Icon"
import { AutomationToggle } from "./AutomationToggle"
import { AUTOMATIONS_COLS, type AutomationRow as AutomationRowData } from "./types"

export interface AutomationRowActions {
    onOpen?: (id: string) => void
    onToggle?: (id: string) => void
    onEditGuided?: (id: string) => void
    onEditDiagram?: (id: string) => void
    onDelete?: (id: string) => void
    /** When false, only the row-open is wired (no toggle / no menu). */
    canEdit?: boolean
}

/** A single flow row: name + trigger, on/off toggle, runs·conv, modified, menu. */
export function AutomationRow({
    automation: a,
    onOpen,
    onToggle,
    onEditGuided,
    onEditDiagram,
    onDelete,
    canEdit = true,
}: { automation: AutomationRowData } & AutomationRowActions) {
    return (
        <div
            role={onOpen ? "button" : undefined}
            tabIndex={onOpen ? 0 : undefined}
            onClick={onOpen ? () => onOpen(a.id) : undefined}
            onKeyDown={
                onOpen
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              onOpen(a.id)
                          }
                      }
                    : undefined
            }
            className={cn(
                "grid items-center gap-x-4 border-b border-[var(--ink-100)] px-8 transition-colors hover:bg-[var(--paper-warm)]/50",
                onOpen &&
                    "cursor-pointer focus:outline-none focus-visible:bg-[var(--paper-warm)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--accent)]",
            )}
            style={{ gridTemplateColumns: AUTOMATIONS_COLS, height: 68 }}
        >
            <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold tracking-tight text-[var(--ink-900)]">
                    {a.name}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-[var(--ink-soft)]">{a.description}</div>
            </div>

            <div className="flex items-center gap-2.5">
                <AutomationToggle on={a.active} onToggle={canEdit && onToggle ? () => onToggle(a.id) : undefined} />
                <span
                    className="text-[12.5px] font-medium"
                    style={{ color: a.active ? "var(--status-good)" : "var(--ink-soft)" }}
                >
                    {a.active ? "Actif" : "Inactif"}
                </span>
            </div>

            <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-[var(--status-warn-soft)]">
                    <Icon name="bolt" size={12} color="var(--status-warn)" strokeWidth={1.9} />
                </span>
                <span className="truncate text-[12.5px] text-[var(--ink-500)]">{a.trigger}</span>
            </div>

            <div className="text-right">
                <div
                    className="font-mono text-[13px] font-medium tabular-nums"
                    style={{ color: a.runs === "—" ? "var(--ink-300)" : "var(--ink-900)" }}
                >
                    {a.runs}
                </div>
                <div
                    className="mt-0.5 font-mono text-[11px] tabular-nums"
                    style={{ color: a.conv === "—" ? "var(--ink-300)" : "var(--status-good)" }}
                >
                    {a.conv === "—" ? "—" : `${a.conv} conv.`}
                </div>
            </div>

            <div className="text-[12px] text-[var(--ink-soft)]">{a.updated}</div>

            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                {canEdit ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-500)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                                aria-label="Actions"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[222px]">
                            <DropdownMenuItem className="gap-2.5 text-[13px]" onClick={() => onEditGuided?.(a.id)}>
                                <Sparkles className="h-3.5 w-3.5" />
                                Modifier · Assistant IA
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2.5 text-[13px]" onClick={() => onEditDiagram?.(a.id)}>
                                <GitBranch className="h-3.5 w-3.5" />
                                Modifier · Diagramme
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2.5 text-[13px]" onClick={() => onToggle?.(a.id)}>
                                {a.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                {a.active ? "Désactiver" : "Activer"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="gap-2.5 text-[13px] text-[var(--status-danger)] focus:text-[var(--status-danger)]"
                                onClick={() => onDelete?.(a.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </div>
        </div>
    )
}
