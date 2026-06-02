import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { MentionCard } from "./MentionCard"
import { MentionPicker } from "./MentionPicker"
import type { MentionMember } from "./MentionPicker"
import { MessageComposer } from "./MessageComposer"

const meta = {
    title: "Screens/Inbox/Mention",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

const MEMBERS: MentionMember[] = [
    { id: "m-ines", name: "Inès Caron", initials: "IC", color: "indigo", role: "AGENT", online: true },
    { id: "m-tom", name: "Tom Roussel", initials: "TR", color: "crimson", role: "ADMIN", roleTone: "accent", online: true },
    { id: "m-lucie", name: "Lucie Aubert", initials: "LA", color: "rose", role: "AGENT" },
    { id: "m-omar", name: "Omar Ba", initials: "OB", color: "emerald", role: "AGENT", online: true },
    { id: "m-sophie", name: "Sophie Bracquet", initials: "SB", color: "teal", role: "OWNER", roleTone: "dark" },
    { id: "m-mathieu", name: "Mathieu Khelifa", initials: "MK", color: "violet", role: "AGENT" },
    { id: "m-awa", name: "Awa Sow", initials: "AS", color: "amber", role: "AGENT", online: true },
]

export const Feed: Story = {
    name: "Card · feed équipe",
    render: () => (
        <div className="max-w-3xl space-y-3 bg-[var(--paper-white)] p-8">
            <MentionCard
                author="Tom R."
                initials="TR"
                color="crimson"
                action="vous a mentionnée sur"
                target="Mehdi Sané"
                message="@Inès tu peux vérifier le stock Tessier noir M ?"
                timestamp="il y a 8 min"
            />
            <MentionCard
                author="Lucie A."
                initials="LA"
                color="rose"
                action="vous a assigné"
                target="Coralie Vidal"
                message="Cliente VIP — à traiter ce matin"
                timestamp="il y a 32 min"
            />
            <MentionCard
                author="Omar B."
                initials="OB"
                color="emerald"
                action="a répondu à votre note"
                target="Naomi Diop"
                message="« Stock OK, on a 4 pièces »"
                timestamp="il y a 1h"
            />
        </div>
    ),
}

export const Picker: Story = {
    name: "Picker · @équipe popover",
    render: () => {
        const [query, setQuery] = useState("")
        const [active, setActive] = useState<string | undefined>(MEMBERS[0]?.id)
        const [picked, setPicked] = useState<string | null>(null)
        return (
            <div className="max-w-xl space-y-3 bg-[var(--paper-warm)]/40 p-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tape une lettre pour filtrer (ex: « in », « tom »)"
                    className="w-full rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 text-[12px] placeholder:text-[var(--ink-400)] focus:outline-none"
                />
                <MentionPicker
                    members={MEMBERS}
                    query={query}
                    activeId={active}
                    onSelect={(m) => setPicked(m.name)}
                    onHover={(id) => setActive(id)}
                />
                {picked ? (
                    <p className="text-[11px] text-[var(--ink-soft)]">
                        Inséré : <strong>@{picked}</strong>
                    </p>
                ) : null}
            </div>
        )
    },
}

export const PickerAboveComposer: Story = {
    name: "Picker · positionné au-dessus du composer",
    render: () => {
        const [active, setActive] = useState<string | undefined>(MEMBERS[0]?.id)
        return (
            <div className="relative max-w-2xl">
                <div className="absolute bottom-full left-5 z-10 mb-2">
                    <MentionPicker
                        members={MEMBERS}
                        query=""
                        activeId={active}
                        onHover={setActive}
                    />
                </div>
                <MessageComposer placeholder="@ pour mentionner un coéquipier…" />
            </div>
        )
    },
}
