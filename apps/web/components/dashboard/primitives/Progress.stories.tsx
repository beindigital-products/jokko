import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ProgressBar } from "./ProgressBar"

const meta = {
    title: "Primitives/Progress",
    component: ProgressBar,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

const caption = "font-mono text-[11px] text-[var(--ink-soft)]"
const spec = "border border-[var(--ink-200)] rounded-xl p-[18px]"

export const Bars: Story = {
    args: { value: 0.68 },
    render: () => (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <div className={spec}>
                <div className="flex flex-col gap-4">
                    <div>
                        <ProgressBar value={0.68} tone="accent" />
                        <div className={`${caption} mt-2`}>thin · accent · 68%</div>
                    </div>
                    <div>
                        <ProgressBar value={0.99} tone="good" />
                        <div className={`${caption} mt-2`}>thin · good · 99%</div>
                    </div>
                    <div>
                        <ProgressBar value={0.3} tone="warn" />
                        <div className={`${caption} mt-2`}>thin · warn · 30%</div>
                    </div>
                </div>
            </div>

            <div className={spec}>
                <ProgressBar value={0.18} tone="accent" thick />
                <div className={`${caption} mt-2`}>thick (h6) · accent · 18%</div>
            </div>
        </div>
    ),
}
