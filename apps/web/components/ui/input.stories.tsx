import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "./input"
import { Label } from "./label"

const meta = {
  title: "Primitives/Input",
  component: Input,
  parameters: { layout: "centered" },
  args: { placeholder: "vous@entreprise.com" },
  tags: ["autodocs"],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Email: Story = {
  args: { type: "email", placeholder: "vous@entreprise.com" },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Désactivé" },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "wrong@email",
  },
  parameters: {
    docs: {
      description: {
        story: "aria-invalid swaps the border to status-danger and intensifies the focus ring.",
      },
    },
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="w-80 space-y-1.5">
      <Label htmlFor="story-input-1">E-mail professionnel</Label>
      <Input id="story-input-1" type="email" placeholder="vous@entreprise.com" />
    </div>
  ),
}

export const WithEyebrow: Story = {
  render: () => (
    <div className="w-80 space-y-1.5">
      <Label variant="eyebrow" htmlFor="story-input-2">
        Connexion · Espace équipe
      </Label>
      <Input id="story-input-2" type="email" placeholder="vous@entreprise.com" />
    </div>
  ),
}
