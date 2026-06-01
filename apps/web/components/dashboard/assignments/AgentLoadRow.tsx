import { Avatar } from "../primitives/Avatar"
import { Chip } from "../primitives/Chip"
import { StatusDot } from "../primitives/StatusDot"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"
import type { AgentLoad, AgentLoadState } from "./types"

/** Shared grid columns for the load table (header + rows stay aligned). */
export const AGENT_LOAD_COLS =
    "180px 84px minmax(0,1fr) 90px 88px"

const STATE_META: Record<
    AgentLoadState,
    { label: string; tone: "danger" | "accent" | "good" | "neutral"; dotTone?: "good" | "warn" | "danger" | "neutral"; barColor: string }
> = {
    over: { label: "Surchargée", tone: "danger", dotTone: "danger", barColor: "var(--status-danger)" },
    ok:   { label: "Active",     tone: "accent", dotTone: "good",   barColor: "var(--accent)" },
    low:  { label: "Dispo",      tone: "good",   dotTone: "good",   barColor: "var(--status-good)" },
    off:  { label: "Hors ligne", tone: "neutral",                   barColor: "var(--ink-300)" },
}

interface AgentLoadRowProps {
    agent: AgentLoad
}

/**
 * AgentLoadRow — one row in the agent load table.
 * Avatar + name | pole chip | load bar | numeric | status chip.
 */
export function AgentLoadRow({ agent }: AgentLoadRowProps) {
    const meta = STATE_META[agent.state]
    const pct = Math.min(1, agent.open / agent.cap) * 100

    return (
        <div
            className="grid items-center"
            style={{ gridTemplateColumns: AGENT_LOAD_COLS, gap: 14 }}
        >
            {/* Name + avatar */}
            <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                    initials={initialsFromName(agent.name)}
                    color={avatarColorFromString(agent.name)}
                    size="sm"
                    status={agent.state !== "off" ? "online" : undefined}
                />
                <span className="truncate text-[13px] font-medium tracking-[-0.005em] text-[var(--ink-900)]">
                    {agent.name}
                </span>
            </div>

            {/* Pole chip */}
            <div>
                <Chip tone="neutral">{agent.pole}</Chip>
            </div>

            {/* Progress bar */}
            <div
                className="overflow-hidden rounded"
                style={{ height: 8, background: "var(--ink-200)" }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: meta.barColor,
                        borderRadius: 4,
                    }}
                />
            </div>

            {/* Numeric count */}
            <div className="text-right font-mono text-[12px] tabular-nums text-[var(--ink-900)]">
                {agent.open} / {agent.cap}
            </div>

            {/* Status badge */}
            <div className="flex justify-end">
                {meta.dotTone ? (
                    <Chip tone={meta.tone as "good" | "warn" | "danger" | "accent" | "neutral" | "dark"}>
                        <StatusDot tone={meta.dotTone} />
                        {meta.label}
                    </Chip>
                ) : (
                    <Chip tone="neutral">{meta.label}</Chip>
                )}
            </div>
        </div>
    )
}
