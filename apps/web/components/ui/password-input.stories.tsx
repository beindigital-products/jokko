import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Lock } from "lucide-react"
import { PasswordInput } from "./password-input"
import { Label } from "./label"

const meta = {
  title: "Primitives/PasswordInput",
  component: PasswordInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Password field with show/hide toggle. Error state driven by the standard `aria-invalid` prop (no custom `error` prop). Pair with <Alert variant=\"error-cream\"> for the human-readable message.",
      },
    },
  },
  args: { placeholder: "••••••••••", defaultValue: "Hunter2Hunter!" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof PasswordInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "abc" },
}

export const WithLeftIcon: Story = {
  args: { leftIcon: <Lock className="h-4 w-4" /> },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "••••••••" },
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-1.5">
      <Label variant="eyebrow" htmlFor="sb-pi-1">
        Mot de passe
      </Label>
      <PasswordInput id="sb-pi-1" placeholder="10 caractères minimum" />
    </div>
  ),
}
