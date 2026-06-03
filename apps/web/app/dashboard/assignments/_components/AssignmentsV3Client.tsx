"use client"

import { useState } from "react"
import { Lock, Settings } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useCurrentOrg } from "@/hooks/use-current-org"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/dashboard/shell/PageHeader"
import { HeaderButton } from "@/components/dashboard/shell/HeaderButton"
import { Chip } from "@/components/dashboard/primitives/Chip"
import {
    AgentLoadCard,
    ChannelRoutingCard,
    FallbackCard,
    MasterSwitch,
    SlaCard,
    StrategyCard,
} from "@/components/dashboard/assignments"
import {
    mapAgentLoad,
    mapChannelRoutes,
    mapFallbackOptions,
    mapSlaMetrics,
    mapStrategies,
    type AgentsListItem,
    type ChannelListItem,
} from "@/lib/dashboard/assignments-data"
import { AssignmentQueue, type QueueAgent, type QueueConversation } from "./AssignmentQueue"
import { AssignmentSettingsDialog } from "./assignments-settings-dialog"

/**
 * AssignmentsV3Client — the production "Assignations" page in the v3 design.
 * Hybrid: keeps the operational assignment queue (functional) and adds the
 * auto-routing config. The three backed settings (auto-assign toggle, max
 * concurrent chats, exclude offline) persist via `updateAssignmentSettings`;
 * the strategy / channel routing / SLA / fallback cards are a read-only preview
 * (no fake controls) until those are stored + honored by the routing engine.
 */
export default function AssignmentsV3Client() {
    const { currentOrg } = useCurrentOrg()
    const orgId = currentOrg?._id as Id<"organizations"> | undefined

    const role = useQuery(api.users.currentUserRole)
    const stats = useQuery(api.assignments.getStats)
    const conversations = useQuery(api.assignments.getConversationsQueue)
    const agents = useQuery(api.assignments.getAgentsList)
    const settings = useQuery(api.assignments.getAssignmentSettings)
    const channels = useQuery(api.channels.list, orgId ? { organizationId: orgId } : "skip")

    const assign = useMutation(api.assignments.assign)
    const bulkAssign = useMutation(api.assignments.bulkAssign)
    const updateSettings = useMutation(api.assignments.updateAssignmentSettings)

    const [settingsOpen, setSettingsOpen] = useState(false)
    const [pendingAuto, setPendingAuto] = useState(false)

    const loading = role === undefined || stats === undefined

    if (loading) return <AssignmentsLoading />

    if (role === "AGENT") {
        return (
            <Shell>
                <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-xl border border-dashed border-[var(--ink-200)] bg-[var(--paper-white)] px-6 py-12 text-center">
                    <Lock className="h-6 w-6 text-[var(--ink-400)]" />
                    <p className="mt-3 font-editorial text-[20px] text-[var(--ink-900)]">Accès réservé</p>
                    <p className="mt-1 text-[13px] text-[var(--ink-500)]">
                        La configuration des assignations est réservée aux administrateurs.
                    </p>
                </div>
            </Shell>
        )
    }

    const autoEnabled = settings?.autoAssignEnabled ?? false

    const handleToggleAuto = async (next: boolean) => {
        setPendingAuto(true)
        try {
            await updateSettings({
                autoAssignEnabled: next,
                maxConcurrentChats: settings?.maxConcurrentChats ?? 5,
                excludeOfflineAgents: settings?.excludeOfflineAgents ?? true,
            })
            toast.success(next ? "Auto-assignation activée" : "Auto-assignation désactivée")
        } catch {
            toast.error("Impossible de mettre à jour le réglage")
        } finally {
            setPendingAuto(false)
        }
    }

    const agentLoad = mapAgentLoad((agents ?? []) as AgentsListItem[])
    const channelRoutes = mapChannelRoutes((channels ?? []) as ChannelListItem[])
    const slas = mapSlaMetrics(stats?.avgResponseTime)
    const strategies = mapStrategies()
    const fallbackOptions = mapFallbackOptions(settings ?? {})

    return (
        <Shell
            actions={
                <HeaderButton icon={Settings} variant="primary" onClick={() => setSettingsOpen(true)}>
                    Réglages
                </HeaderButton>
            }
        >
            {/* 1 · Auto-assignation (functional toggle) */}
            <MasterSwitch
                enabled={autoEnabled}
                activeSinceLabel="Actif"
                onToggle={handleToggleAuto}
                pending={pendingAuto}
            />

            {/* 2 · Operational queue (functional) */}
            <AssignmentQueue
                conversations={(conversations ?? []) as QueueConversation[]}
                agents={(agents ?? []) as QueueAgent[]}
                onAssign={(conversationId, memberId) =>
                    void assign({
                        conversationId: conversationId as Id<"conversations">,
                        memberId: memberId as Id<"users">,
                    }).catch(() => toast.error("Échec de l'attribution"))
                }
                onBulkAssign={(ids, memberId) =>
                    void bulkAssign({
                        conversationIds: ids as Id<"conversations">[],
                        memberId: memberId as Id<"users">,
                    }).catch(() => toast.error("Échec de l'attribution en lot"))
                }
            />

            {/* 3 · Agent load (real-time) */}
            <AgentLoadCard agents={agentLoad} />

            {/* 4 · Routing preview (read-only) */}
            <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Routage automatique · aperçu
                    </span>
                    <Chip tone="neutral">Lecture seule</Chip>
                </div>
                <div className="pointer-events-none select-none space-y-5 opacity-95">
                    <div className="grid gap-5 lg:grid-cols-2">
                        <StrategyCard strategies={strategies} />
                        {channelRoutes.length > 0 ? (
                            <ChannelRoutingCard channels={channelRoutes} />
                        ) : (
                            <SlaCard slas={slas} alert="Configurez vos numéros WhatsApp pour le routage par canal." />
                        )}
                    </div>
                    {channelRoutes.length > 0 && (
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                            <SlaCard
                                slas={slas}
                                alert="Les SLA seront bientôt configurables et suivis automatiquement."
                            />
                            <FallbackCard
                                description="Si l'agent assigné passe hors ligne, la conversation peut être redistribuée selon ces règles."
                                options={fallbackOptions}
                            />
                        </div>
                    )}
                    {channelRoutes.length === 0 && (
                        <FallbackCard
                            description="Si l'agent assigné passe hors ligne, la conversation peut être redistribuée selon ces règles."
                            options={fallbackOptions}
                        />
                    )}
                </div>
            </div>

            <AssignmentSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </Shell>
    )
}

/** Shared page chrome: v3 PageHeader + scroll area. */
function Shell({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow="Routage · automatique + manuel"
                title="Assignations"
                description="Règles de routage automatique, file d'attribution manuelle et charge de travail par agent."
                actions={actions}
            />
            <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-8 pt-6 sm:px-8 sm:pt-10">
                {children}
            </div>
        </div>
    )
}

function AssignmentsLoading() {
    return (
        <Shell>
            <Skeleton className="h-[88px] rounded-xl" />
            <Skeleton className="h-[360px] rounded-xl" />
            <Skeleton className="h-[220px] rounded-xl" />
            <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-[200px] rounded-xl" />
                <Skeleton className="h-[200px] rounded-xl" />
            </div>
        </Shell>
    )
}
