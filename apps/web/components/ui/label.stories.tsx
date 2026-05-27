import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Label } from "./label"

const meta = {
  title: "Primitives/Label",
  component: Label,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Standard form label + v2 `eyebrow` variant (mono uppercase tracker). a11y rule : write source text in natural case, CSS handles the uppercase transform so screen readers pronounce words.",
      },
    },
  },
  argTypes: {
    variant: { control: "radio", options: ["default", "eyebrow"] },
  },
  args: { children: "Email" },
  tags: ["autodocs"],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { variant: "default", children: "E-mail professionnel" },
}

export const Eyebrow: Story = {
  args: { variant: "eyebrow", children: "Connexion · Espace équipe" },
}

export const BothSideBySide: Story = {
  render: () => (
    <div className="space-y-3">
      <Label>Default · E-mail professionnel</Label>
      <Label variant="eyebrow">Eyebrow · Mot de passe oublié</Label>
    </div>
  ),
}
