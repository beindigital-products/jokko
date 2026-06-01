import { Chip } from "../primitives/Chip"
import type { MemberRole } from "./types"

/** Role badge for a team member (Owner / Admin / Agent). */
export function RolePill({ role }: { role: MemberRole }) {
    if (role === "OWNER") return <Chip tone="dark">Owner</Chip>
    if (role === "ADMIN") return <Chip tone="accent">Admin</Chip>
    return <Chip tone="neutral">Agent</Chip>
}
