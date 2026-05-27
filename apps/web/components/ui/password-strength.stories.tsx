import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { PasswordInput } from "./password-input"
import { PasswordStrength } from "./password-strength"
import { Label } from "./label"

const meta = {
  title: "Primitives/PasswordStrength",
  component: PasswordStrength,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "4-segment bar + mono level label (FAIBLE / MOYEN / FORT). Criteria checklist kept for a11y. FORT is reserved for full-pass (backend-accepting). Single source of truth in `@/lib/password-policy`.",
      },
    },
  },
  args: { password: "Abc123", showCriteria: true },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof PasswordStrength>

export default meta
type Story = StoryObj<typeof meta>

export const Weak: Story = {
  args: { password: "abc" },
}

export const Medium: Story = {
  args: { password: "Abc123" },
}

export const Strong: Story = {
  args: { password: "AbcdefghI1" },
}

export const WithoutCriteriaList: Story = {
  args: { password: "Abc123", showCriteria: false },
}

export const Interactive: Story = {
  render: () => {
    const [pw, setPw] = useState("")
    return (
      <div className="space-y-3">
        <Label variant="eyebrow" htmlFor="sb-ps-pw">
          Mot de passe
        </Label>
        <PasswordInput
          id="sb-ps-pw"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Tapez et regardez la barre"
        />
        <PasswordStrength password={pw} />
        {pw.length === 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
            Try : abc — Abc123 — Abcdefghij1
          </p>
        ) : null}
      </div>
    )
  },
}
