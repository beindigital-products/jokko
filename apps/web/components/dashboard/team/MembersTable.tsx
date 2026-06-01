import { MemberRow } from "./MemberRow"
import { MEMBERS_COLS, type TeamMember } from "./types"

/** Members table — sticky-ish mono header + one MemberRow per member. */
export function MembersTable({ members }: { members: TeamMember[] }) {
    return (
        <div className="flex-1 overflow-y-auto">
            <div
                className="grid items-center gap-x-5 border-b border-[var(--ink-200)] bg-[var(--paper-warm)] px-8 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--ink-soft)]"
                style={{ gridTemplateColumns: MEMBERS_COLS, height: 38 }}
            >
                <div>Membre</div>
                <div>Rôle</div>
                <div>Statut</div>
                <div>Pôles</div>
                <div className="text-right">Conv.</div>
                <div>A rejoint</div>
                <div />
            </div>
            {members.map((m) => (
                <MemberRow key={m.id} member={m} />
            ))}
        </div>
    )
}
