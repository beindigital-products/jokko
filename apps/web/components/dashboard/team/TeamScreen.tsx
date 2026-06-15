"use client"

import type { ReactNode } from "react"
import { Building2, Mail, Plus } from "lucide-react"

import { PageHeader } from "../shell/PageHeader"
import { HeaderButton } from "../shell/HeaderButton"
import { PolesStrip } from "./PolesStrip"
import { MembersTable } from "./MembersTable"
import type { Pole, TeamData, TeamMember } from "./types"

/**
 * TeamScreen — v3 "Équipe" page. Composes the header + poles band
 * (PolesStrip) + members table (MembersTable). Recreates the
 * `Jokko Desktop.html` ScreenTeam design (header actions = Pôles /
 * Invitations / Inviter; pole cards open the configure modal).
 *
 * Presentational by default (Storybook passes only `data`); the dashboard
 * page threads in real callbacks/slots to wire invite / poles / per-member
 * actions without forking the layout.
 */
export function TeamScreen({
    data,
    invitationsCount,
    onInvite,
    onShowInvitations,
    onNewPole,
    onEditPole,
    renderMemberMenu,
}: {
    data: TeamData
    invitationsCount?: number
    onInvite?: () => void
    onShowInvitations?: () => void
    onNewPole?: () => void
    onEditPole?: (pole: Pole) => void
    renderMemberMenu?: (member: TeamMember) => ReactNode
}) {
    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow={`Équipe · ${data.seats}`}
                title="Équipe"
                description="Membres, rôles et pôles. Round-robin d'assignation."
                actions={
                    <>
                        <HeaderButton icon={Building2} onClick={onNewPole}>
                            Pôles
                        </HeaderButton>
                        <HeaderButton icon={Mail} onClick={onShowInvitations}>
                            {invitationsCount
                                ? `Invitations · ${invitationsCount}`
                                : "Invitations"}
                        </HeaderButton>
                        <HeaderButton icon={Plus} variant="primary" onClick={onInvite}>
                            Inviter un membre
                        </HeaderButton>
                    </>
                }
            />
            <PolesStrip poles={data.poles} onNewPole={onNewPole} onEditPole={onEditPole} />
            <MembersTable members={data.members} renderMenu={renderMemberMenu} />
        </div>
    )
}
