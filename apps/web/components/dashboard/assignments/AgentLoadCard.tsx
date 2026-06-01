import { Users } from "lucide-react"
import { HeaderButton } from "../shell/HeaderButton"
import { AgentLoadRow } from "./AgentLoadRow"
import type { AgentLoad } from "./types"

interface AgentLoadCardProps {
    agents: AgentLoad[]
}

/**
 * AgentLoadCard — full-width card with header band + per-agent load rows.
 * Header has eyebrow + editorial subtitle + "Redistribuer en masse" action.
 */
export function AgentLoadCard({ agents }: AgentLoadCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]">
            {/* Card header */}
            <div
                className="flex items-center border-b border-[var(--ink-200)] px-[22px] py-4"
            >
                <div className="flex-1">
                    <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        Charge actuelle par agent
                    </div>
                    <div className="mt-1 font-editorial text-[20px] leading-tight tracking-[-0.01em] text-[var(--ink-900)]">
                        Conversations ouvertes par membre — temps réel
                    </div>
                </div>
                <HeaderButton icon={Users}>Redistribuer en masse</HeaderButton>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-2.5 px-[22px] py-[18px]">
                {agents.map((a) => (
                    <AgentLoadRow key={a.id} agent={a} />
                ))}
            </div>
        </div>
    )
}
