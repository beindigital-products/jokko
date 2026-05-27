import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { OnboardingProgress } from "./OnboardingProgress"
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps"

const meta = {
  title: "Onboarding/OnboardingProgress",
  component: OnboardingProgress,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "v2 stepper per design spec §5. Current step = violet squircle (rounded-md, mono number). Completed = violet circle + white check. Future = outlined circle + number. Click-back only on completed steps.",
      },
    },
  },
  argTypes: {
    currentStepKey: {
      control: "select",
      options: [
        "BUSINESS_INFO",
        "PLAN_SELECT",
        "WHATSAPP_CONNECT",
        "COMPLETED",
      ],
    },
  },
  args: {
    steps: ONBOARDING_STEPS,
    currentStepKey: "BUSINESS_INFO",
    onStepClick: () => {},
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof OnboardingProgress>

export default meta
type Story = StoryObj<typeof meta>

export const BusinessInfo: Story = {
  args: { currentStepKey: "BUSINESS_INFO" },
}

export const PlanSelect: Story = {
  args: { currentStepKey: "PLAN_SELECT" },
}

export const WhatsAppConnect: Story = {
  args: { currentStepKey: "WHATSAPP_CONNECT" },
}

export const Completed: Story = {
  args: { currentStepKey: "COMPLETED" },
}

export const AllStatesStacked: Story = {
  render: () => (
    <div className="space-y-6">
      {(["BUSINESS_INFO", "PLAN_SELECT", "WHATSAPP_CONNECT", "COMPLETED"] as const).map(
        (current) => (
          <div
            key={current}
            className="space-y-3 rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
              current = {current.replace(/_/g, " ").toLowerCase()}
            </p>
            <OnboardingProgress
              steps={ONBOARDING_STEPS}
              currentStepKey={current}
              onStepClick={() => {}}
            />
          </div>
        ),
      )}
    </div>
  ),
}
