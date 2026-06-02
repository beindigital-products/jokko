import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
    title: "Primitives/Cards",
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

export const All: Story = {
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[900px]">
            {/* KPI cell */}
            <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-[18px]">
                <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                    Conversations reçues
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display tabular-nums text-[30px] text-[var(--ink-900)] leading-none">
                        142
                    </span>
                    <span className="font-mono text-[13px]" style={{ color: "var(--status-good)" }}>
                        +22
                    </span>
                </div>
                <div className="mt-2 text-[12px] text-[var(--ink-500)]">vs hier 120</div>
            </div>

            {/* header + body */}
            <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] overflow-hidden">
                <div className="border-b border-[var(--ink-200)] p-[18px]">
                    <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
                        Équipe en activité
                    </div>
                    <div className="mt-1 font-display text-[18px] text-[var(--ink-900)]">
                        Qui prend la main
                    </div>
                </div>
                <div className="p-[18px] text-[13px] text-[var(--ink-700)]">
                    En-tête + corps avec séparateur.
                </div>
            </div>

            {/* tinted variant */}
            <div
                className="rounded-xl border border-[var(--ink-200)] p-[18px]"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(105,56,239,0.05), transparent 60%), var(--paper-white)",
                }}
            >
                <div className="font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                    Mise en route · 4 / 6
                </div>
                <div className="mt-1 font-display text-[18px] text-[var(--ink-900)]">
                    Encore deux étapes.
                </div>
            </div>
        </div>
    ),
}
