import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Chip, type ChipTone } from "@/components/dashboard/primitives/Chip"
import { StatusDot, type StatusDotTone } from "@/components/dashboard/primitives/StatusDot"

/**
 * Primitives/Badges — reproduces the design doc's `.dpill` family. The app's
 * <Chip> maps 1:1 to the pill (mono · uppercase · tracked). Chip has no
 * built-in dot, so the "status pill with leading dot" pattern is composed in
 * the story by rendering a <StatusDot> before the label inside the Chip.
 */
const meta = {
    title: "Primitives/Badges",
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** A spec cell — white card, hairline border, rounded, demo row + mono caption. */
function Spec({ caption, children }: { caption: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-[18px]">
            <div className="flex flex-wrap items-center gap-2">{children}</div>
            <div className="mt-3.5 font-mono text-[11px] text-[var(--ink-soft)]">{caption}</div>
        </div>
    )
}

/** Class-name fragment styled for captions. */
function C({ children }: { children: React.ReactNode }) {
    return <b className="text-[var(--ink-700)]">{children}</b>
}

/**
 * Status pill = Chip with a leading StatusDot. Composition only — Chip's
 * source is untouched. The dot inherits a contrasting tone per pill state.
 */
function StatusPill({
    tone,
    dot,
    children,
}: {
    tone?: ChipTone
    dot: StatusDotTone
    children: React.ReactNode
}) {
    return (
        <Chip tone={tone}>
            <StatusDot tone={dot} />
            {children}
        </Chip>
    )
}

export const All: Story = {
    render: () => (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <Spec
                caption={
                    <>
                        <C>.dpill</C> + <C>StatusDot</C> · statut
                    </>
                }
            >
                <StatusPill tone="accent" dot="neutral">
                    En cours
                </StatusPill>
                <StatusPill tone="good" dot="good">
                    Terminée
                </StatusPill>
                <StatusPill tone="warn" dot="warn">
                    En pause
                </StatusPill>
                <StatusPill tone="danger" dot="danger">
                    SLA dépassé
                </StatusPill>
                <StatusPill tone="neutral" dot="neutral">
                    Planifiée
                </StatusPill>
            </Spec>

            <Spec
                caption={
                    <>
                        <C>.dpill</C> · étiquettes
                    </>
                }
            >
                <Chip tone="neutral">Dakar</Chip>
                <Chip tone="neutral">prospect</Chip>
                <Chip tone="neutral">Utility</Chip>
                <Chip tone="accent">Marketing</Chip>
                <Chip tone="dark">Owner</Chip>
            </Spec>

            <Spec
                caption={
                    <>
                        <C>.dpill--solid</C> · teintes pleines
                    </>
                }
            >
                <Chip tone="neutral">brouillon</Chip>
                <Chip tone="accent">accent</Chip>
                <Chip tone="good">good</Chip>
                <Chip tone="warn">warn</Chip>
                <Chip tone="danger">hot</Chip>
            </Spec>

            <Spec
                caption={
                    <>
                        en contexte · <C>StatusDot</C>
                    </>
                }
            >
                <StatusPill tone="good" dot="good">
                    Actif depuis 84 jours
                </StatusPill>
                <StatusPill tone="neutral" dot="neutral">
                    SLA 3m
                </StatusPill>
            </Spec>
        </div>
    ),
}
