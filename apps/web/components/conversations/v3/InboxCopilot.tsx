"use client"

import { useMemo } from "react"
import { toast } from "sonner"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CopilotPanel, type CopilotAttribute } from "@/components/dashboard/inbox"
import {
    avatarColorFromString,
    initialsFromName,
} from "@/lib/dashboard/avatar-color"
import { formatListTime } from "@/lib/dashboard/format-time"

interface InboxCopilotProps {
    conversationId: string
    onClose?: () => void
}

/**
 * InboxCopilot — wired right column (v3 CopilotPanel). Pulls the rich
 * contact via contacts.get and presents structured attributes. The AI
 * "draft" block is a stub entry point (Q1=a) : the button is present and
 * wired to a placeholder until the assist action lands in a dedicated
 * phase.
 */
export function InboxCopilot({ conversationId, onClose }: InboxCopilotProps) {
    const conversation = useQuery(api.conversations.getById, {
        id: conversationId as Id<"conversations">,
    })
    const contactId = conversation?.contact?._id
    const contact = useQuery(
        api.contacts.get,
        contactId ? { id: contactId as Id<"contacts"> } : "skip",
    )

    const name = contact?.name || conversation?.contact?.name || conversation?.contact?.phoneNumber || "Contact"
    const phone = contact?.phone || conversation?.contact?.phoneNumber || ""

    const attributes = useMemo<CopilotAttribute[]>(() => {
        const out: CopilotAttribute[] = []
        if (contact?.country) out.push({ label: "Pays", value: contact.country })
        if (contact?.city) out.push({ label: "Ville", value: contact.city })
        if (contact?.email) out.push({ label: "Email", value: contact.email })
        if (contact?.company) out.push({ label: "Société", value: contact.company })
        if (contact?.jobTitle) out.push({ label: "Poste", value: contact.jobTitle })
        if (conversation?.assignedTo?.user?.name) {
            out.push({ label: "Assigné à", value: conversation.assignedTo.user.name })
        }
        if (conversation?.lastMessageAt) {
            out.push({ label: "Dernier échange", value: formatListTime(conversation.lastMessageAt) })
        }
        if (Array.isArray(contact?.tags) && contact.tags.length > 0) {
            out.push({
                label: "Tags",
                value: contact.tags.map((t) => t.name).join(", "),
            })
        }
        return out
    }, [contact, conversation])

    if (!conversation) {
        return (
            <aside className="h-full w-full overflow-y-auto border-l border-[var(--ink-200)] p-4">
                <div className="h-14 w-14 animate-pulse rounded-full bg-[var(--ink-100)]" />
            </aside>
        )
    }

    return (
        <CopilotPanel
            className="h-full w-full"
            contactName={name}
            initials={initialsFromName(contact?.name ?? conversation.contact?.name, phone)}
            color={avatarColorFromString(name)}
            phone={phone}
            attributes={attributes}
            onClose={onClose}
            onEmail={
                contact?.email
                    ? () => {
                          window.location.href = `mailto:${contact.email}`
                      }
                    : undefined
            }
            // AI assist entry point — stub for now (wired in a later phase).
            onGenerateDraft={() =>
                toast("Assistant IA — bientôt disponible", {
                    description: "La génération de brouillon arrive prochainement.",
                })
            }
        />
    )
}
