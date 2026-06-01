"use client"

import { Check, RotateCcw } from "lucide-react"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { MasterSwitch } from "./MasterSwitch"
import { StrategyCard } from "./StrategyCard"
import { ChannelRoutingCard } from "./ChannelRoutingCard"
import { AgentLoadCard } from "./AgentLoadCard"
import { SlaCard } from "./SlaCard"
import { FallbackCard } from "./FallbackCard"
import type { AssignmentsData } from "./types"

interface AssignmentsScreenProps {
    data: AssignmentsData
}

/**
 * AssignmentsScreen — v3 "Assignations" page. Composes the master toggle,
 * assignment strategy, channel routing, agent load view, SLA tiles and
 * fallback options. Recreates ScreenAssignments from screens-extra.jsx.
 * Pure presentational.
 */
export function AssignmentsScreen({ data }: AssignmentsScreenProps) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow="Routage · automatique + manuel"
                title="Assignations"
                description="Règles de routage automatique, charge de travail par agent, SLAs et bascule manuelle."
                actions={
                    <>
                        <HeaderButton icon={RotateCcw}>Réinitialiser</HeaderButton>
                        <HeaderButton icon={Check} variant="primary">
                            Enregistrer
                        </HeaderButton>
                    </>
                }
            />

            <div className="flex-1 space-y-5 overflow-y-auto px-8 pb-8 pt-10">
                {/* Global auto-assignment toggle */}
                <MasterSwitch
                    enabled={data.autoEnabled}
                    activeSinceLabel={data.activeSinceLabel}
                />

                {/* Strategy + Channel routing — two columns */}
                <div className="grid grid-cols-2 gap-5">
                    <StrategyCard strategies={data.strategies} />
                    <ChannelRoutingCard channels={data.channels} />
                </div>

                {/* Agent load — full width */}
                <AgentLoadCard agents={data.agents} />

                {/* SLA + Fallback — 1.4fr / 1fr */}
                <div
                    className="grid gap-5"
                    style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)" }}
                >
                    <SlaCard slas={data.slas} alert={data.slaAlert} />
                    <FallbackCard
                        description={data.fallbackDesc}
                        options={data.fallbackOptions}
                    />
                </div>
            </div>
        </div>
    )
}
