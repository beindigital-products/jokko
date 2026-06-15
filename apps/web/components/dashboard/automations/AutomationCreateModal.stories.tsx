import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AutomationCreateModal } from "./AutomationCreateModal"

const meta = {
    title: "Screens/Automations/CreateModal",
    component: AutomationCreateModal,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 760, background: "var(--paper-warm)" }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AutomationCreateModal>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
    args: { open: true, onOpenChange: () => {} },
}

export const Creating: Story = {
    args: { open: true, creating: true, onOpenChange: () => {} },
}
