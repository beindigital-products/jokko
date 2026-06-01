"use client"

import { Building2, Plus } from "lucide-react"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { PolesStrip } from "./PolesStrip"
import { MembersTable } from "./MembersTable"
import type { TeamData } from "./types"

/**
 * TeamScreen — v3 "Équipe" page. Composes the header + poles band
 * (PolesStrip) + members table (MembersTable). Recreates the
 * `Jokko Desktop.html` ScreenTeam design. Pure presentational.
 */
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
            <PolesStrip poles={data.poles} />
            <MembersTable members={data.members} />
        </div>
    )
}
