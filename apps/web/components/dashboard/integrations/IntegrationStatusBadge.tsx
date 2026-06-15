import { Chip } from "../primitives/Chip"
import { StatusDot } from "../primitives/StatusDot"
import type { IntegrationHealth } from "./types"

interface IntegrationStatusBadgeProps {
    on: boolean
    health: IntegrationHealth
}

/**
 * IntegrationStatusBadge — shows "Connecté" (good), "À vérifier" (warn),
 * or "Non connecté" (neutral outline) depending on connection state.
 */
export function IntegrationStatusBadge({ on, health }: IntegrationStatusBadgeProps) {
    if (!on) {
        return <Chip tone="neutral">Non connecté</Chip>
    }
    if (health === "good") {
        return (
            <Chip tone="good">
                <StatusDot tone="good" />
                Connecté
            </Chip>
        )
    }
    if (health === "warn") {
        return (
            <Chip tone="warn">
                <StatusDot tone="warn" />
                À vérifier
            </Chip>
        )
    }
    return <Chip tone="neutral">Non connecté</Chip>
}
