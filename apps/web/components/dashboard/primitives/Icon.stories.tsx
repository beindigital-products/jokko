import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Icon, ICON_PATHS, type IconName } from "./Icon"

const meta = {
    title: "Primitives/Icons",
    component: Icon,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

const ALL = Object.keys(ICON_PATHS) as IconName[]

/** Full catalog — line set, stroke 1.6, 24×24 grid. */
export const Catalog: Story = {
    args: { name: "inbox" },
    render: () => (
        <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
        >
            {ALL.map((name) => (
                <div
                    key={name}
                    className="flex flex-col items-center gap-2 rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-1.5 py-3.5"
                >
                    <span className="text-[var(--ink-700)]">
                        <Icon name={name} size={20} />
                    </span>
                    <span className="break-all text-center font-mono text-[9.5px] text-[var(--ink-soft)]">
                        {name}
                    </span>
                </div>
            ))}
        </div>
    ),
}

/** Sizes + colours. */
export const Sizes: Story = {
    args: { name: "bell" },
    render: () => (
        <div className="flex flex-wrap items-end gap-8">
            {[14, 16, 18, 20, 24, 32].map((s) => (
                <div key={s} className="flex flex-col items-center gap-2 text-[var(--ink-900)]">
                    <Icon name="bell" size={s} />
                    <span className="font-mono text-[10px] text-[var(--ink-soft)]">{s}px</span>
                </div>
            ))}
            <div className="flex flex-col items-center gap-2" style={{ color: "var(--accent)" }}>
                <Icon name="sparkle" size={24} />
                <span className="font-mono text-[10px] text-[var(--ink-soft)]">accent</span>
            </div>
            <div className="flex flex-col items-center gap-2" style={{ color: "var(--status-good)" }}>
                <Icon name="circle-check" size={24} />
                <span className="font-mono text-[10px] text-[var(--ink-soft)]">good</span>
            </div>
            <div className="flex flex-col items-center gap-2" style={{ color: "var(--status-danger)" }}>
                <Icon name="flame" size={24} />
                <span className="font-mono text-[10px] text-[var(--ink-soft)]">hot</span>
            </div>
        </div>
    ),
}
