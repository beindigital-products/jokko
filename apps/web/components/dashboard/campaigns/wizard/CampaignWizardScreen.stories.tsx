import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { CampaignWizardScreen } from "./CampaignWizardScreen"
import { CAMPAIGN_WIZARD_DATA } from "./wizard-data"
import type { CampaignWizardData } from "./types"

/** Low wallet balance — forces the step-6 cost card into its red shortfall state. */
const LOW_BALANCE: CampaignWizardData = { ...CAMPAIGN_WIZARD_DATA, balance: 4.2 }

const meta = {
    title: "Flows/Campaign Wizard",
    component: CampaignWizardScreen,
    parameters: { layout: "fullscreen" },
    args: { open: true, onOpenChange: () => {} },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 900, background: "var(--paper-warm)" }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof CampaignWizardScreen>

export default meta
type Story = StoryObj<typeof meta>

/** Full interactive flow — start at step 1 and click through to the success screen. */
export const Default: Story = { args: { data: CAMPAIGN_WIZARD_DATA } }

export const Step2Template: Story = { args: { data: CAMPAIGN_WIZARD_DATA, initialStep: 2 } }
export const Step3Audience: Story = { args: { data: CAMPAIGN_WIZARD_DATA, initialStep: 3 } }
export const Step4Variables: Story = { args: { data: CAMPAIGN_WIZARD_DATA, initialStep: 4 } }
export const Step5Send: Story = { args: { data: CAMPAIGN_WIZARD_DATA, initialStep: 5 } }
export const Step6Review: Story = { args: { data: CAMPAIGN_WIZARD_DATA, initialStep: 6 } }

/** Agent role — sending-number choice is locked to the first number. */
export const StepSendAgent: Story = { args: { data: CAMPAIGN_WIZARD_DATA, initialStep: 5, role: "AGENT" } }

/** Insufficient wallet — step 6 shows the red "Crédit insuffisant" cost state and a disabled send CTA. */
export const CreditLow: Story = { args: { data: LOW_BALANCE, initialStep: 6 } }
