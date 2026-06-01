export type MemberRole = "OWNER" | "ADMIN" | "AGENT"
export type MemberStatus = "online" | "busy" | "away" | "offline"

export interface Pole {
    id: string
    name: string
    members: number
    conv: number
    color: string
}

export interface TeamMember {
    id: string
    name: string
    email: string
    role: MemberRole
    status: MemberStatus
    conv: number
    poles: string[]
    joined: string
}

export interface TeamData {
    seats: string
    poles: Pole[]
    members: TeamMember[]
}

/** Shared grid template for the members table header + rows. */
export const MEMBERS_COLS =
    "minmax(0,2fr) minmax(0,0.9fr) minmax(0,0.9fr) minmax(0,1.4fr) minmax(0,0.7fr) minmax(0,1fr) 32px"
