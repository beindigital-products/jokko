"use client"

import { Building2, MoreHorizontal, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { Avatar } from "../primitives/Avatar"
import { Chip } from "../primitives/Chip"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"

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

const STATUS: Record<MemberStatus, { label: string; color: string }> = {
    online: { label: "En ligne", color: "var(--status-good)" },
    busy: { label: "Occupé", color: "var(--status-warn)" },
    away: { label: "Absent", color: "var(--ink-soft)" },
    offline: { label: "Hors ligne", color: "var(--ink-400)" },
}

const COLS =
    "minmax(0,2fr) minmax(0,0.9fr) minmax(0,0.9fr) minmax(0,1.4fr) minmax(0,0.7fr) minmax(0,1fr) 32px"

function RolePill({ role }: { role: MemberRole }) {
    if (role === "OWNER") return <Chip tone="dark">Owner</Chip>
    if (role === "ADMIN") return <Chip tone="accent">Admin</Chip>
    return <Chip tone="neutral">Agent</Chip>
}

export function TeamScreen({ data }: { data: TeamData }) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Équipe · ${data.seats}`}
                title="Équipe"
                description="Membres, rôles et pôles. Round-robin d'assignation. Limite Pro : 10 sièges."
                actions={
                    <>
                        <HeaderButton icon={Building2}>Pôles</HeaderButton>
                        <HeaderButton>Invitations · 2</HeaderButton>
                        <HeaderButton icon={Plus} variant="primary">
                            Inviter un membre
                        </HeaderButton>
                    </>
                }
            />

            {/* Poles strip */}
            <div className="shrink-0 border-b border-[var(--ink-200)] px-8 py-6">
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    Pôles
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                    {data.poles.map((p) => (
                        <div
                            key={p.id}
                            className="flex min-w-[220px] items-center gap-3 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-4 py-3"
                        >
                            <span
                                className="h-9 w-1 shrink-0 rounded-sm"
                                style={{ background: p.color }}
                            />
                            <div className="flex-1">
                                <div className="text-[14px] font-semibold tracking-tight text-[var(--ink-900)]">
                                    {p.name}
                                </div>
                                <div className="mt-0.5 font-mono text-[11.5px] text-[var(--ink-soft)]">
                                    {p.members} membres · {p.conv} conv. ouvertes
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="flex min-w-[140px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--ink-300)] px-4 text-[13px] text-[var(--ink-soft)] hover:bg-[var(--paper-warm)]"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Nouveau pôle
                    </button>
                </div>
            </div>

            {/* Members table */}
            <div className="flex-1 overflow-y-auto">
                <div
                    className="grid items-center gap-x-5 border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-8 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]"
                    style={{ gridTemplateColumns: COLS, height: 38 }}
                >
                    <div>Membre</div>
                    <div>Rôle</div>
                    <div>Statut</div>
                    <div>Pôles</div>
                    <div className="text-right">Conv.</div>
                    <div>A rejoint</div>
                    <div />
                </div>

                {data.members.map((m) => {
                    const s = STATUS[m.status]
                    return (
                        <div
                            key={m.id}
                            className="grid items-center gap-x-5 border-b border-[var(--ink-100)] px-8 transition-colors hover:bg-[var(--paper-warm)]/50"
                            style={{ gridTemplateColumns: COLS, height: 60 }}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar
                                    initials={initialsFromName(m.name)}
                                    color={avatarColorFromString(m.name)}
                                    size="md"
                                    status={m.status === "online" ? "online" : undefined}
                                />
                                <div className="min-w-0">
                                    <div className="truncate text-[13.5px] font-medium tracking-tight text-[var(--ink-900)]">
                                        {m.name}
                                    </div>
                                    <div className="truncate text-[11.5px] text-[var(--ink-soft)]">
                                        {m.email}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <RolePill role={m.role} />
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: s.color }}>
                                <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: s.color }}
                                />
                                {s.label}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {m.poles.map((p) => (
                                    <Chip key={p} tone="neutral">
                                        {p}
                                    </Chip>
                                ))}
                            </div>
                            <div className="text-right text-[13px] font-medium tabular-nums text-[var(--ink-900)]">
                                {m.conv}
                            </div>
                            <div className="text-[11.5px] text-[var(--ink-soft)]">{m.joined}</div>
                            <button
                                type="button"
                                aria-label="Plus"
                                className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-400)]",
                                    "hover:bg-[var(--paper-warm)] hover:text-[var(--ink-700)]",
                                )}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
