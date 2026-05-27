import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { OAuthButton } from "./oauth-button"

const meta = {
  title: "Primitives/OAuthButton",
  component: OAuthButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Third-party sign-in button. Ships Google only — Apple was scoped out (no backend provider wired in @convex-dev/auth).",
      },
    },
  },
  argTypes: {
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    label: { control: "text" },
  },
  args: { provider: "google" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof OAuthButton>

export default meta
type Story = StoryObj<typeof meta>

export const Google: Story = {}

export const Loading: Story = { args: { loading: true } }

export const Disabled: Story = { args: { disabled: true } }

export const CustomLabel: Story = {
  args: { label: "Connexion avec Google" },
}

export const ThreeStatesStacked: Story = {
  render: () => (
    <div className="space-y-3">
      <OAuthButton provider="google" />
      <OAuthButton provider="google" loading />
      <OAuthButton provider="google" disabled />
    </div>
  ),
}
