import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const TOKENS: { name: string; cssVar: string; hint: string; invert?: boolean }[] = [
  { name: "paper-white", cssVar: "--paper-white", hint: "#FFFFFF" },
  { name: "paper-warm", cssVar: "--paper-warm", hint: "≈ #FBF9F5" },
  { name: "ink-900", cssVar: "--ink-900", hint: "near-black", invert: true },
  { name: "ink-soft", cssVar: "--ink-soft", hint: "≈ #6E6E6E", invert: true },
  { name: "ink-200", cssVar: "--ink-200", hint: "border" },
  { name: "accent", cssVar: "--accent", hint: "#693BEF", invert: true },
  { name: "accent-hover", cssVar: "--accent-hover", hint: "darker", invert: true },
  { name: "accent-soft", cssVar: "--accent-soft", hint: "lilac" },
  { name: "accent-hot-pink", cssVar: "--accent-hot-pink", hint: "≈ #FF60B4", invert: true },
  { name: "status-good", cssVar: "--status-good", hint: "≈ #138A4E", invert: true },
  { name: "status-warn", cssVar: "--status-warn", hint: "≈ #E0A100", invert: true },
  { name: "status-danger", cssVar: "--status-danger", hint: "≈ #D93025", invert: true },
]

function Swatch({
  name,
  cssVar,
  hint,
  invert,
}: {
  name: string
  cssVar: string
  hint: string
  invert?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={`h-20 w-full rounded-lg border border-[var(--ink-200)] ${invert ? "text-white" : "text-[var(--ink-900)]"}`}
        style={{ background: `var(${cssVar})` }}
      />
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
        {name}
      </p>
      <p className="font-mono text-[10px] text-[var(--ink-soft)]">{hint}</p>
    </div>
  )
}

function ColorsPanel() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {TOKENS.map((t) => (
        <Swatch key={t.name} {...t} />
      ))}
    </div>
  )
}

function TypographyPanel() {
  return (
    <div className="space-y-5 rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
        .font-eyebrow · mono uppercase tracker
      </p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--ink-900)]">
        .font-display · Geist Sans bold
      </h2>
      <p className="font-editorial text-2xl text-[var(--ink-900)]">
        .font-editorial · Geist Sans italic (rare editorial moments)
      </p>
      <p className="text-base leading-relaxed text-[var(--ink-900)]">
        Body · Geist Sans regular — Le quotidien de l'inbox.
      </p>
      <p className="font-mono text-sm text-[var(--ink-soft)]">
        Geist Mono · code · ⌘K · 03 / 17
      </p>
    </div>
  )
}

// ─── Stories ────────────────────────────────────────────────────────────────

const meta = {
  title: "Tokens",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const Colors: Story = {
  render: () => <ColorsPanel />,
}

export const Typography: Story = {
  render: () => <TypographyPanel />,
}
