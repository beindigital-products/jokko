import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import type { ReactNode } from "react"

import { Switch } from "@/components/ui/switch"

import { Icon } from "./Icon"
import { Kbd } from "./Kbd"

const meta = {
    title: "Primitives/Inputs",
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

function Spec({ caption, children }: { caption: string; children: ReactNode }) {
    return (
        <div className="border border-[var(--ink-200)] rounded-xl p-[18px] bg-[var(--paper-white)]">
            <div className="flex flex-col gap-3">{children}</div>
            <div className="font-mono text-[11px] text-[var(--ink-soft)] mt-3.5">{caption}</div>
        </div>
    )
}

function FilledInput({ value, height = 38 }: { value: string; height?: number }) {
    return (
        <div
            className="flex items-center rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-[13px] text-[var(--ink-900)] font-medium"
            style={{ height }}
        >
            {value}
        </div>
    )
}

export const All: Story = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[760px]">
            <Spec caption="search · Kbd ⌘K">
                <div className="flex items-center gap-2 h-9 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-[13px]">
                    <Icon name="search" size={16} color="var(--ink-500)" />
                    <span className="flex-1 text-[var(--ink-500)] truncate">
                        Rechercher une conversation, un contact…
                    </span>
                    <Kbd>⌘K</Kbd>
                </div>
            </Spec>

            <Spec caption="input · filled · 38px">
                <FilledInput value="Ventes" />
            </Spec>

            <Spec caption="switch · on / off / small">
                <label className="flex items-center gap-2.5 text-[13px] text-[var(--ink-700)]">
                    <Switch defaultChecked />
                    <span>Notifications activées</span>
                </label>
                <label className="flex items-center gap-2.5 text-[13px] text-[var(--ink-700)]">
                    <Switch />
                    <span>Mode silencieux</span>
                </label>
                <label className="flex items-center gap-2.5 text-[12px] text-[var(--ink-700)]">
                    <Switch defaultChecked className="h-4 w-7" />
                    <span>Aperçu compact</span>
                </label>
            </Spec>

            <Spec caption="field · label + warn hint">
                <label className="text-[12px] text-[var(--ink-500)]">Nom du pôle</label>
                <FilledInput value="Support Abidjan" />
                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--status-warn)" }}>
                    <Icon name="lock" size={13} color="var(--status-warn)" />
                    <span>Réservé aux administrateurs</span>
                </div>
            </Spec>

            <Spec caption="kbd · keys">
                <div className="flex items-center gap-1.5">
                    <Kbd>⌘</Kbd>
                    <Kbd>K</Kbd>
                    <Kbd>Esc</Kbd>
                    <Kbd>↵</Kbd>
                    <Kbd>⇧</Kbd>
                </div>
            </Spec>

            <Spec caption="dropdown · select">
                <div className="flex items-center gap-2 h-9 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-[13px] text-[var(--ink-900)] font-medium">
                    <span className="flex-1 truncate">Round-robin par pôle</span>
                    <Icon name="chevron-down" size={16} color="var(--ink-500)" />
                </div>
            </Spec>
        </div>
    ),
}
