import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Tabs, type TabItem } from "./Tabs"

const meta = {
    title: "Primitives/Tabs",
    component: Tabs,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const ITEMS: TabItem[] = [
    { label: "Tous", count: 142, active: true },
    { label: "Non assignés", count: 14 },
    { label: "Mentions", count: 3 },
    { label: "Résolus" },
]

export const Default: Story = {
    args: { items: ITEMS },
    render: (args) => (
        <div className="border border-[var(--ink-200)] rounded-xl p-[18px] bg-[var(--paper-white)] max-w-[560px]">
            <Tabs {...args} />
            <div className="font-mono text-[11px] text-[var(--ink-soft)] mt-3.5">
                tabs · underlined · count chips
            </div>
        </div>
    ),
}
